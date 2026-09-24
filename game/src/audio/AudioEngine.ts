import type { GameEvent } from '../game/Game';

/**
 * Procedural audio (design §45–46), WebAudio only — no sample files. Everything scales with
 * size: small pickups tick, big ones thud and crunch, collapses rumble, and the motor drone
 * drops in pitch as the machine grows. Music is a quiet step sequencer that gains layers per
 * tier (pulse → kick → bass → industrial percussion). Starts on the first user gesture;
 * `M` toggles mute. Presentation only: the simulation never waits on audio.
 */
import { THEMES, type MusicTheme } from './themes';
import type { HornSound } from '../config/cosmetics';
import { loadSettings } from '../settings';

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
  /** City theme (null = the original industrial loop) and an optional file track override. */
  private theme: MusicTheme | null = null;
  private themeId = '';
  private track: HTMLAudioElement | null = null;
  private trackNode: MediaElementAudioSourceNode | null = null;
  private trackLive = false;
  private tension = 1;
  /** Player volume settings (0–1), applied on top of the mix levels. */
  private vol = loadSettings();
  /** Held by platform ads: silent until released, independent of the player's mute. */
  private adHold = false;

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
    this.master.gain.value = this.muted || this.adHold ? 0 : 0.8;
    this.sfx = ctx.createGain();
    this.music = ctx.createGain();
    this.music.gain.value = 0.22 * this.vol.music;
    this.sfx.gain.value = this.vol.sfx;
    this.sfx.connect(this.master);
    this.music.connect(this.master);
    this.master.connect(comp).connect(ctx.destination);
    // One second of white noise, reused by every noisy voice.
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.startMotor();
    if (this.themeId) this.loadTrack(this.themeId);
    this.nextStepTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  /** Switch the BGM to a city's theme. A file at music/<id>.mp3 (e.g. a Suno export) wins if present. */
  setTheme(id: string): void {
    if (id === this.themeId) return;
    this.themeId = id;
    this.theme = THEMES[id] ?? null;
    this.step = 0;
    this.tension = 1;
    if (this.ctx) this.loadTrack(id);
  }

  /** Last stretch of a round: the loop speeds up a little. */
  setTension(on: boolean): void {
    this.tension = on ? 1.1 : 1;
    if (this.track) this.track.playbackRate = this.tension;
  }

  private loadTrack(id: string): void {
    this.track?.pause();
    this.trackNode?.disconnect();
    this.track = null;
    this.trackNode = null;
    this.trackLive = false;
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    el.addEventListener('canplaythrough', () => {
      if (this.track !== el || !this.ctx) return;
      this.trackNode = this.ctx.createMediaElementSource(el);
      this.trackNode.connect(this.music);
      this.trackLive = true; // the sequencer stays quiet while a real track plays
      void el.play().catch(() => (this.trackLive = false));
    }, { once: true });
    el.addEventListener('error', () => (this.trackLive = false), { once: true });
    el.src = `${base}music/${id}.mp3`;
    this.track = el;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyMaster();
  }

  /** Ads (portal SDKs) must play over silence: hold the mix at zero until released. */
  setAdHold(on: boolean): void {
    this.adHold = on;
    this.applyMaster();
    if (this.track) {
      if (on) this.track.pause();
      else if (this.trackLive) void this.track.play().catch(() => undefined);
    }
  }

  setVolumes(music: number, sfx: number): void {
    this.vol = { music, sfx };
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(0.22 * music, this.ctx.currentTime, 0.05);
    this.sfx.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
  }

  private applyMaster(): void {
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted || this.adHold ? 0 : 0.8, this.ctx.currentTime, 0.05);
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
      case 'beep':
        this.beep(e.high ? 1320 : 660, e.high ? 0.5 : 0.18);
        break;
      case 'eaten':
        this.sweep(420, 70, 0.9);
        this.rumble(1.2, 0.8);
        break;
      case 'landmark':
        this.rumble(4, 1.2);
        this.chime([0, -5, -12], 0.4);
        break;
      case 'boing':
        this.boing();
        break;
      case 'burp':
        this.burp();
        break;
      case 'pop':
        this.popSound();
        break;
      case 'horn':
        this.horn(e.horn ?? 'clown');
        break;
    }
  }

  /** Cartoon spring: a sine that wobbles down in pitch. */
  private boing(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.45);
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 22;
    depth.gain.value = 60;
    lfo.connect(depth).connect(osc.frequency);
    const g = ctx.createGain();
    osc.connect(g).connect(this.sfx);
    this.env(g, t, 0.28, 0.005, 0.45);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.5);
    lfo.stop(t + 0.5);
  }

  /** A satisfied burp: low buzzy saw with a rattling amplitude and falling pitch. */
  private burp(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.25;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.55);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 420;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 31;
    depth.gain.value = 0.18;
    lfo.connect(depth).connect(g.gain);
    osc.connect(f).connect(g).connect(this.sfx);
    this.env(g, t, 0.35, 0.03, 0.55);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.65);
    lfo.stop(t + 0.65);
  }

  /** Bubble-gum pop. */
  private popSound(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    const g = ctx.createGain();
    osc.connect(g).connect(this.sfx);
    this.env(g, t, 0.4, 0.002, 0.1);
    osc.start(t);
    osc.stop(t + 0.15);
    const v = this.noiseVoice('bandpass', 2500, 1.5, 0.08);
    this.env(v.gain, t, 0.15, 0.002, 0.06);
  }

  /** Horn by cosmetic id; the default clown horn is two detuned squares, "honk-honk". */
  private horn(kind: HornSound): void {
    if (kind === 'duck') return this.duck();
    if (kind === 'bike') return this.bell();
    if (kind === 'trombone') return this.trombone();
    if (kind === 'air') return this.airHorn();
    const ctx = this.ctx!;
    for (const k of [0, 0.22]) {
      const t = ctx.currentTime + k;
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1800;
      for (const hz of [370, 466]) {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(hz, t);
        o.frequency.linearRampToValueAtTime(hz * 0.94, t + 0.16);
        o.connect(f);
        o.start(t);
        o.stop(t + 0.2);
      }
      f.connect(g).connect(this.sfx);
      this.env(g, t, 0.12, 0.01, 0.17);
    }
  }

  /** One pitched voice through a lowpass, with a pitch path of [time offset, Hz] points. */
  private voice(type: OscillatorType, path: [number, number][], dur: number, peak: number, cutoff: number, at = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = type;
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    o.frequency.setValueAtTime(path[0][1], t);
    for (const [dt, hz] of path.slice(1)) o.frequency.linearRampToValueAtTime(hz, t + dt);
    o.connect(f).connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.env(g, t, peak, 0.01, dur);
  }

  /** Rubber duck: a nasal squeak that bends up then down, twice. */
  private duck(): void {
    for (const k of [0, 0.2]) this.voice('sawtooth', [[0, 900], [0.05, 1250], [0.14, 820]], 0.15, 0.1, 2600, k);
  }

  /** Bicycle bell: two bright inharmonic sines, "ring-ring". */
  private bell(): void {
    for (const k of [0, 0.16]) for (const hz of [2350, 3480, 5100]) this.voice('sine', [[0, hz]], 0.5, hz > 3000 ? 0.04 : 0.08, 8000, k);
  }

  /** Sad trombone: "wah wah wah waaah", falling. */
  private trombone(): void {
    const notes: [number, number, number][] = [[0, 294, 0.28], [0.32, 277, 0.28], [0.64, 262, 0.28], [0.96, 247, 0.9]];
    for (const [at, hz, dur] of notes) this.voice('sawtooth', dur > 0.5 ? [[0, hz], [0.2, hz * 1.02], [0.4, hz * 0.98], [0.6, hz * 1.02], [0.85, hz * 0.97]] : [[0, hz]], dur, 0.1, 900, at);
  }

  /** Stadium air horn: loud detuned saws, one long blast. */
  private airHorn(): void {
    for (const hz of [466, 470, 587]) this.voice('sawtooth', [[0, hz * 0.97], [0.05, hz]], 0.7, 0.06, 2400);
  }

  private beep(freq: number, dur: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    osc.connect(g).connect(this.sfx);
    this.env(g, t, 0.08, 0.004, dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Falling pitch: the "you got eaten" drop. */
  private sweep(from: number, to: number, dur: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    osc.connect(f).connect(g).connect(this.sfx);
    this.env(g, t, 0.12, 0.01, dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
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
    const stepDur = 60 / ((this.theme?.bpm ?? 104) * this.tension) / 4;
    while (this.nextStepTime < ctx.currentTime + 0.12) {
      if (!this.trackLive) {
        if (this.theme) this.playThemeStep(this.theme, this.step % this.theme.steps, this.nextStepTime);
        else this.playStep(this.step % 16, this.nextStepTime);
      }
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

  /** One step of a city theme: lead from tier 1, drums from tier 2, bass from 3, accents from 4. */
  private playThemeStep(th: MusicTheme, i: number, t: number): void {
    const ctx = this.ctx!;
    const out = this.music;
    const note = (semi: number) => th.root * Math.pow(2, semi / 12);
    const voice = (freq: number, wave: OscillatorType, level: number, decay: number, opts: { pluck?: boolean; tremolo?: boolean; detune?: number; drop?: number } = {}) => {
      const oscs: OscillatorNode[] = [];
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(opts.pluck ? 4200 : 2400, t);
      if (opts.pluck) f.frequency.exponentialRampToValueAtTime(700, t + decay);
      for (const d of opts.detune ? [-opts.detune, opts.detune] : [0]) {
        const o = ctx.createOscillator();
        o.type = wave;
        o.frequency.setValueAtTime(freq, t);
        if (opts.drop) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opts.drop), t + decay);
        o.detune.value = d;
        o.connect(f);
        oscs.push(o);
      }
      f.connect(g).connect(out);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + (opts.pluck ? 0.004 : 0.02));
      if (opts.tremolo) {
        // Pipa-style tremolo: fast amplitude flutter over the decay.
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = 18;
        depth.gain.value = level * 0.5;
        lfo.connect(depth).connect(g.gain);
        lfo.start(t);
        lfo.stop(t + decay + 0.05);
      }
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      for (const o of oscs) {
        o.start(t);
        o.stop(t + decay + 0.05);
      }
    };
    const noise = (hp: number, level: number, dur: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp;
      const g = ctx.createGain();
      src.connect(f).connect(g).connect(out);
      g.gain.setValueAtTime(level, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.02);
    };
    const lead = th.lead.pattern[i];
    if (lead !== null && lead !== undefined) voice(note(lead), th.lead.wave, th.lead.level, th.lead.decay, th.lead);
    if (th.hat.includes(i)) noise(7500, 0.12, 0.05);
    if (this.tier >= 2 && th.kick.includes(i)) voice(120, 'sine', 0.8, 0.28, { drop: 0.3 });
    if (this.tier >= 2 && th.snare.includes(i)) noise(1800, 0.35, 0.14);
    const bass = th.bass.pattern[i];
    if (this.tier >= 3 && bass !== null && bass !== undefined) voice(note(bass), th.bass.wave, th.bass.level, 0.3);
    if (this.tier >= 4 && th.accent?.steps.includes(i)) for (const c of th.accent.chord) voice(note(c), th.accent.wave, th.accent.level, th.accent.decay);
  }
}
