// Edit the narrated playtest short: real Paris round frames (tools/shorts/eiffel.mjs with an event
// log) cut into beats, each beat timed to its voice-over line (VoxCPM2, tools/shorts/voice.md),
// burned-in captions, music ducked under the voice, end card.
//   node tools/shorts/edit-playtest.mjs [framesDir] [voDir] [out.mp4]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const dir = process.argv[2] ?? '/tmp/claude-0/shorts/play5';
const vo = process.argv[3] ?? '/tmp/claude-0/vo';
const out = process.argv[4] ?? resolve(root, 'renders/marketing/short-playtest-paris.mp4');
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const font = '/usr/share/fonts/opentype/inter/Inter-Black.otf';

// Beats: [first frame, last frame, minimum seconds, caption]. Frame numbers come from the event
// log of this round (stun at 2.0 s, golden crates, building collapse at 199 s, tower from 236 s).
const defaultBeats = [
  [0, 58, 1.6, "I'm a toaster with eyes. Let's eat PARIS!"],
  [58, 80, 1.2, '…and I crashed. Great start.'],
  [80, 924, 2.2, 'Boxes, bags, bikes… EVERYTHING goes in!'],
  [924, 1360, 2.0, 'Golden crate! Bigger… BIGGER!'],
  [1360, 1400, 1.6, 'Did I just eat a whole BUILDING?!'],
  [1619, 1700, 2.2, 'The tower is open. Here we go!'],
  [1700, 1737, 2.4, "IT'S FALLING! IT'S FALLING!"],
  [1745, 1800, 2.2, 'I ATE THE EIFFEL TOWER! CHAMPION!'],
];
// BEATS=<json file> overrides the beats (same shape) for another round; MUSIC=<file> the music bed;
// FRAME_EXT=jpg for captures from tools/shorts/moments.mjs.
const beats = process.env.BEATS ? JSON.parse(readFileSync(process.env.BEATS, 'utf8')) : defaultBeats;
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const inputs = [];
const vparts = [];
const aparts = [];
const caps = [];
let t = 0;
// An optional fifth element lists frame ranges to drop inside the beat ([[from, to], …], inclusive),
// e.g. a stretch where the camera sat inside a rival.
beats.forEach(([a, b, min, text, cuts = []], i) => {
  const voFile = `${vo}/line-${i}.wav`;
  const voLen = dur(voFile);
  // Whole frames, so the captions (timed from these lengths) stay on the cut they belong to.
  const len = Math.round(Math.max(min, voLen + 0.25) * 30) / 30;
  const kept = cuts.reduce((n, [x, y]) => n - (Math.min(y, b - 1) - Math.max(x, a) + 1), b - a);
  const speed = kept / 30 / len;
  const drop = cuts.map(([x, y]) => `between(n,${x - a},${y - a})`).join('+');
  inputs.push('-framerate', '30', '-start_number', String(a), '-i', `${dir}/f%05d.${process.env.FRAME_EXT ?? 'png'}`);
  vparts.push(`[${i}:v]trim=end_frame=${b - a}${drop ? `,select='not(${drop})',setpts=N/30/TB` : ''},setpts=(PTS-STARTPTS)/${speed.toFixed(4)},fps=30,tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${Math.round(len * 30)},scale=1080:1920:flags=lanczos[v${i}]`);
  const capFile = `/tmp/claude-0/shorts/pcap-${i}.txt`;
  // Two lines when long: break after the first sentence mark so nothing runs off the 1080 px frame.
  writeFileSync(capFile, text.length > 20 ? text.replace(/([.!?…]+)\s+/, '$1\n') : text);
  // The last beat sits on the results card: caption goes above it.
  const y = i === beats.length - 1 ? (process.env.LAST_Y ?? 'h*0.20') : 'h*0.60';
  caps.push(`drawtext=fontfile=${font}:textfile=${capFile}:fontsize=60:line_spacing=12:text_align=C:fontcolor=white:borderw=8:bordercolor=black@0.9:x=(w-text_w)/2:y=${y}:enable='gte(t,${(t - 1 / 60).toFixed(4)})*lt(t,${(t + len - 1 / 60).toFixed(4)})'`);
  aparts.push({ file: voFile, at: t });
  t += len;
});
const n = beats.length;
const end = `/tmp/claude-0/shorts/pcap-end.txt`;
writeFileSync(end, 'Play free · grow-everything.vercel.app');
caps.push(`drawbox=x=0:y=ih*0.80:w=iw:h=ih*0.07:color=black@0.55:t=fill:enable='gte(t,${(t - 2.2).toFixed(2)})'`);
caps.push(`drawtext=fontfile=${font}:textfile=${end}:fontsize=44:fontcolor=white:x=(w-text_w)/2:y=h*0.82:enable='gte(t,${(t - 2.2).toFixed(2)})'`);
aparts.forEach((p) => inputs.push('-i', p.file));
inputs.push('-i', process.env.MUSIC ?? resolve(root, 'public/music/paris.mp3'));
const music = n + aparts.length;
const voMix = aparts.map((p, k) => `[${n + k}:a]adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)},volume=1.6[vo${k}]`);
const filter = [
  ...vparts,
  `${beats.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[vc]`,
  `[vc]${caps.join(',')}[v]`,
  ...voMix,
  `${aparts.map((_, k) => `[vo${k}]`).join('')}amix=inputs=${aparts.length}:normalize=0,acompressor=threshold=-16dB:ratio=4:makeup=3[voice]`,
  `[${music}:a]atrim=0:${t.toFixed(2)},volume=0.35,afade=t=out:st=${(t - 1).toFixed(2)}:d=1[bg]`,
  `[voice]asplit[v1][v2]`,
  `[bg][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=250[duck]`,
  `[duck][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=7[a]`,
].join(';');
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', t.toFixed(2), out]);
console.log('wrote', out, `${t.toFixed(1)}s`);
