// Sound exporter: renders the web game's own procedural sound effects (audio/AudioEngine.ts) with
// an OfflineAudioContext, one fresh engine per sound, and packs them into one mono "sprite" with
// the offset/length of each, so Roblox needs a single audio upload (Sound.PlaybackRegion).
const SR = 44100;
const RENDER_SECONDS = 4.5;
class OfflineCtx extends OfflineAudioContext {
  constructor() {
    super(2, SR * RENDER_SECONDS, SR);
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
}
(window as unknown as { AudioContext: unknown }).AudioContext = OfflineCtx;

const SOUNDS: [string, Record<string, unknown>][] = [
  ['absorb_tick', { kind: 'absorb', cls: 1, mass: 0.3, size: 0.1, destruction: 'collect' }],
  ['absorb_small', { kind: 'absorb', cls: 2, mass: 2, size: 0.5, destruction: 'collect' }],
  ['absorb_3', { kind: 'absorb', cls: 3, mass: 15, size: 0.9, destruction: 'collect' }],
  ['absorb_4', { kind: 'absorb', cls: 4, mass: 120, size: 1.8, destruction: 'crush' }],
  ['absorb_5', { kind: 'absorb', cls: 5, mass: 380, size: 4, destruction: 'crush' }],
  ['absorb_7', { kind: 'absorb', cls: 7, mass: 3600, size: 12, destruction: 'rip' }],
  ['absorb_9', { kind: 'absorb', cls: 9, mass: 30000, size: 30, destruction: 'collapse' }],
  ['crunch_4', { kind: 'crunch', cls: 4, size: 1.8 }],
  ['crunch_6', { kind: 'crunch', cls: 6, size: 7 }],
  ['crunch_8', { kind: 'crunch', cls: 8, size: 16 }],
  ['collapse', { kind: 'collapse', size: 10 }],
  ['dash', { kind: 'dash' }],
  ['dashReady', { kind: 'dashReady' }],
  ['stun', { kind: 'stun', size: 1 }],
  ['bump', { kind: 'bump', size: 1 }],
  ['unlock', { kind: 'unlock', cls: 2 }],
  ['tier', { kind: 'tier', tier: 2 }],
  ['win', { kind: 'win' }],
  ['beep_low', { kind: 'beep', high: false }],
  ['beep_high', { kind: 'beep', high: true }],
  ['eaten', { kind: 'eaten' }],
  ['landmark', { kind: 'landmark' }],
  ['boing', { kind: 'boing' }],
  ['burp', { kind: 'burp' }],
  ['pop', { kind: 'pop' }],
  ['horn', { kind: 'horn', horn: 'clown' }],
];

async function render(ev: Record<string, unknown>): Promise<Float32Array> {
  const { AudioEngine } = await import('../../game/src/audio/AudioEngine');
  const e = new AudioEngine() as unknown as Record<string, any>;
  e.start();
  window.clearInterval(e.timer);
  if (e.music) e.music.gain.value = 0;
  if (e.motor) e.motor.gain.gain.value = 0;
  // Pickup ticks rate-limit against the last one (t = 0 here): start from a clean history.
  e.lastTick = -1;
  e.lastStreak = -10;
  e.handle(ev);
  const buf: AudioBuffer = await e.ctx.startRendering();
  const l = buf.getChannelData(0), r = buf.getChannelData(1);
  const mono = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) mono[i] = (l[i] + r[i]) / 2;
  // Trim trailing silence (keep 60 ms of tail).
  let end = mono.length;
  while (end > 0 && Math.abs(mono[end - 1]) < 1e-4) end--;
  return mono.slice(0, Math.min(mono.length, end + Math.round(SR * 0.06)));
}

async function run() {
  const gap = Math.round(SR * 0.25);
  const parts: Float32Array[] = [];
  const index: Record<string, [number, number]> = {};
  let pos = 0;
  for (const [name, ev] of SOUNDS) {
    const s = await render(ev);
    index[name] = [+(pos / SR).toFixed(4), +(s.length / SR).toFixed(4)];
    parts.push(s, new Float32Array(gap));
    pos += s.length + gap;
  }
  const all = new Float32Array(pos);
  let o = 0;
  for (const p of parts) {
    all.set(p, o);
    o += p.length;
  }
  // 16-bit PCM WAV.
  const data = new DataView(new ArrayBuffer(44 + all.length * 2));
  const str = (off: number, s: string) => [...s].forEach((c, i) => data.setUint8(off + i, c.charCodeAt(0)));
  str(0, 'RIFF'); data.setUint32(4, 36 + all.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true); data.setUint32(24, SR, true);
  data.setUint32(28, SR * 2, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true); str(36, 'data'); data.setUint32(40, all.length * 2, true);
  let peak = 0;
  for (const v of all) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 0.95 / peak : 1;
  for (let i = 0; i < all.length; i++) data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, all[i] * gain)) * 32767, true);
  const bytes = new Uint8Array(data.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  (window as unknown as { __EXPORT__: unknown }).__EXPORT__ = { index, wav: btoa(bin), seconds: pos / SR };
}
run().catch((e) => ((window as unknown as { __EXPORT_ERROR__: string }).__EXPORT_ERROR__ = String(e?.stack ?? e)));
