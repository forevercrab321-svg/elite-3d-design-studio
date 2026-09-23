import type { GameEvent } from '../game/Game';

/**
 * Procedural audio (design §45–46), WebAudio only — no sample files. Everything scales with
 * size: small pickups tick, big ones thud and crunch, collapses rumble, and the motor drone
 * drops in pitch as the machine grows. Music is a quiet step sequencer that gains layers per
 * tier (pulse → kick → bass → industrial percussion). Starts on the first user gesture;
 * `M` toggles mute. Presentation only: the simulation never waits on audio.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noise!: AudioBuffer;
  private motor: { osc: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private tier = 1;
  private step = 0;
  private nextStepTime = 0;
  private timer: number | null = null;
  private muted = false;
  private lastTick = 0;

  constructor() {
    const start = () => this.start();
    addEventListener('keydown', start, { once: true });
    addEventListener('pointerdown', start, { once: true });
    addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.setMuted(!this.muted);
    });
  }

  private start(): void {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.sfx = ctx.createGain();
    this.music = ctx.createGain();
    this.music.gain.value = 0.22;
    this.sfx.connect(this.master);
    this.music.connect(this.master);
    this.master.connect(comp).connect(ctx.destination);
    // One second of white noise, reused by every noisy voice.
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.startMotor();
    this.nextStepTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  dispose(): void {
    if (this.timer !== null) clearInterval(this.timer);
    void this.ctx?.close();
  }

  // ── Motor drone ─────────────────────────────────────────────────────────────
  private startMotor(): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain).connect(this.sfx);
    osc.start();
    sub.start();
    this.motor = { osc, sub, filter, gain };
  }

  /** Per frame: speed01 = speed / top speed, diameter in metres. */
  update(speed01: number, diameter: number, tier: number): void {
    this.tier = tier;
    if (!this.ctx || !this.motor) return;
    const t = this.ctx.currentTime;
    // Small machine whines (~180 Hz), city-scale machine growls (~35 Hz).
    const base = 190 / Math.pow(Math.max(0.35, diameter) / 0.35, 0.5);
    const f = Math.max(28, base * (0.8 + 0.5 * speed01));
    this.motor.osc.frequency.setTargetAtTime(f, t, 0.08);
    this.motor.sub.frequency.setTargetAtTime(f / 2, t, 0.08);
    this.motor.filter.frequency.setTargetAtTime(250 + 900 * speed01, t, 0.1);
    this.motor.gain.gain.setTargetAtTime(0.03 + 0.07 * speed01 * Math.min(1, 0.4 + diameter * 0.2), t, 0.12);
  }

  // ── Event sounds ────────────────────────────────────────────────────────────
  handle(e: GameEvent): void {
    if (!this.ctx) return;
    switch (e.kind) {
      case 'absorb':
        if (e.cls <= 2) this.tick(e.size);
        else this.thud(e.cls, e.size);
        break;
      case 'crunch':
        this.crunch(e.cls, e.size);
        break;
      case 'collapse':
        this.rumble(1.6, 0.9);
        break;
      case 'bump':
        this.thump(70, 0.25);
        break;
      case 'dash':
        this.whoosh();
        break;
      case 'unlock':
        this.chime([0, 7], 0.18);
        break;
      case 'tier':
        this.chime([0, 4, 7, 12], 0.35);
        this.rumble(0.8, 0.4);
        break;
      case 'win':
        this.chime([0, 4, 7, 12, 16, 19], 0.5);
        this.rumble(2.5, 1);
        break;
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private noiseVoice(type: BiquadFilterType, freq: number, q: number, dur: number): { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    src.connect(filter).connect(gain).connect(this.sfx);
    src.start(ctx.currentTime, Math.random() * 0.5);
    src.stop(ctx.currentTime + dur + 0.05);
    return { src, filter, gain };
  }

  /** Light mechanical tick for small pickups (rate-limited so bursts do not buzz). */
  private tick(size: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    if (t - this.lastTick < 0.035) return;
    this.lastTick = t;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + Math.random() * 900 - size * 800, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.06);
    const g = ctx.createGain();
    osc.connect(g).connect(this.sfx);
    this.env(g, t, 0.08, 0.003, 0.07);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private thump(freq: number, level: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.25);
    const g = ctx.createGain();
    osc.connect(g).connect(this.sfx);
    this.env(g, t, level, 0.005, 0.3);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** Mass arriving in the hopper: a low body thud that deepens with class. */
  private thud(cls: number, size: number): void {
    this.thump(Math.max(30, 140 - cls * 14 - size * 4), Math.min(0.5, 0.15 + cls * 0.05));
    const v = this.noiseVoice('lowpass', 600 - cls * 50, 0.7, 0.25);
    this.env(v.gain, this.ctx!.currentTime, 0.12 + cls * 0.02, 0.005, 0.2);
  }

  /** Metal crushed / structure torn: bandpassed noise crackle + low body. */
  private crunch(cls: number, size: number): void {
    const t = this.ctx!.currentTime;
    const dur = 0.25 + cls * 0.06;
    const v = this.noiseVoice('bandpass', 1800 - cls * 150, 1.2, dur);
    v.filter.frequency.exponentialRampToValueAtTime(300, t + dur);
    this.env(v.gain, t, Math.min(0.7, 0.2 + cls * 0.06), 0.004, dur);
    this.thump(Math.max(28, 90 - size * 3), Math.min(0.6, 0.2 + cls * 0.05));
  }

  private rumble(dur: number, level: number): void {
    const t = this.ctx!.currentTime;
    const v = this.noiseVoice('lowpass', 160, 0.8, dur);
    v.gain.gain.setValueAtTime(0.0001, t);
    v.gain.gain.exponentialRampToValueAtTime(level, t + 0.08);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private whoosh(): void {
    const t = this.ctx!.currentTime;
    const v = this.noiseVoice('bandpass', 400, 0.9, 0.35);
    v.filter.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    this.env(v.gain, t, 0.12, 0.05, 0.28);
  }

  /** Short synth chord/arpeggio (semitones above A3) for unlocks, tiers and the win. */
  private chime(semis: number[], level: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    semis.forEach((s, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 220 * Math.pow(2, s / 12);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      const g = ctx.createGain();
      osc.connect(f).connect(g).connect(this.sfx);
      const st = t + i * 0.07;
      this.env(g, st, level * 0.25, 0.01, 0.6);
      osc.start(st);
      osc.stop(st + 0.7);
    });
  }

  // ── Music: 16-step sequencer, 104 BPM, layers unlock per tier ───────────────
  private schedule(): void {
    const ctx = this.ctx!;
    const stepDur = 60 / 104 / 4;
    while (this.nextStepTime < ctx.currentTime + 0.12) {
      this.playStep(this.step % 16, this.nextStepTime);
      this.step++;
      this.nextStepTime += stepDur;
    }
  }

  private playStep(i: number, t: number): void {
    const ctx = this.ctx!;
    const out = this.music;
    const hit = (freq: number, dur: number, level: number, type: OscillatorType = 'sine', drop = 0.5) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * drop), t + dur);
      const g = ctx.createGain();
      osc.connect(g).connect(out);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    const hat = (level: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 7000;
      const g = ctx.createGain();
      src.connect(f).connect(g).connect(out);
      g.gain.setValueAtTime(level, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.start(t, Math.random() * 0.5);
      src.stop(t + 0.06);
    };
    // Tier 1: soft pulse and hats.
    if (i % 4 === 2) hat(0.15);
    if (i % 8 === 0) hit(440, 0.12, 0.1, 'triangle', 1);
    // Tier 2: kick.
    if (this.tier >= 2 && i % 4 === 0) hit(120, 0.28, 0.9, 'sine', 0.3);
    // Tier 3: bass line (A minor riff).
    const bass = [55, 0, 55, 0, 65.4, 0, 55, 0, 49, 0, 49, 0, 73.4, 0, 65.4, 0];
    if (this.tier >= 3 && bass[i]) hit(bass[i], 0.2, 0.35, 'sawtooth', 0.98);
    // Tier 4: industrial clank on the backbeat.
    if (this.tier >= 4 && (i === 4 || i === 12)) {
      hit(310, 0.18, 0.25, 'square', 0.4);
      hat(0.4);
    }
  }
}
