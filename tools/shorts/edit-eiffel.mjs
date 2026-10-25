// Edit the Eiffel short from tools/shorts/eiffel.mjs frames: hero open (real time) → growth (2×)
// → attack → fall → champion card, with captions, the Paris theme and an end card.
//   node tools/shorts/edit-eiffel.mjs [framesDir] [out.mp4]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const dir = process.argv[2] ?? '/tmp/claude-0/shorts/eiffel5';
const out = process.argv[3] ?? resolve(root, 'renders/marketing/short3-eiffel.mp4');
const { acts } = JSON.parse(readFileSync(`${dir}/acts.json`, 'utf8'));
const font = '/usr/share/fonts/opentype/inter/Inter-Black.otf';
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
// [first frame, frame count, speed]
const segs = [
  [acts.open, acts.growth - acts.open, 1],
  [acts.growth, acts.attack - acts.growth, 2],
  [acts.attack, acts.fall - acts.attack, 1],
  [acts.fall, acts.collapse - acts.fall, 0.7],
  [acts.collapse + 8, 40, 1], // champion card
];
const inputs = [];
const parts = [];
let t = 0;
const marks = [];
segs.forEach(([start, count, speed], i) => {
  inputs.push('-framerate', '30', '-start_number', String(start), '-i', `${dir}/f%05d.png`);
  parts.push(`[${i}:v]trim=end_frame=${count},setpts=(PTS-STARTPTS)/${speed},fps=30,scale=1080:1920:flags=lanczos[s${i}]`);
  marks.push(t);
  t += count / 30 / speed;
});
const total = t;
const downAt = marks[2] + (marks[3] - marks[2]) * +(process.env.DOWN_AT ?? 0.55);
const txt = (name, s) => { const f = `/tmp/claude-0/shorts/cap-${name}.txt`; writeFileSync(f, s); return f; };
const draw = (file, y, size, from, to) =>
  `drawtext=fontfile=${font}:textfile=${file}:fontsize=${size}:fontcolor=white:borderw=7:bordercolor=black@0.9:x=(w-text_w)/2:y=${y}:enable='between(t,${from.toFixed(2)},${to.toFixed(2)})'`;
const caps = [
  draw(txt('hook1', 'Can this tiny car'), 'h*0.58', 78, 0, marks[1]),
  draw(txt('hook2', 'eat THE EIFFEL TOWER?'), 'h*0.58+100', 78, 0, marks[1]),
  draw(txt('grow', 'eat… grow… eat…'), 'h*0.30', 70, marks[1], marks[2]),
  // The tower visibly starts to fall about halfway through the attack segment.
  draw(txt('attack', 'now it weighs 300 TONNES'), 'h*0.30', 66, marks[2], downAt),
  draw(txt('down', 'TOWER DOWN'), 'h*0.30', 110, downAt, marks[4]),
  draw(txt('end', 'Play free · grow-everything.vercel.app'), 'h*0.86', 44, marks[4], total + 1),
].join(',');
const filter = `${parts.join(';')};${segs.map((_, i) => `[s${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[v0];[v0]${caps}[v];` +
  `[${segs.length}:a]atrim=0:${total.toFixed(2)},afade=t=in:d=0.3,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,volume=0.85[a]`;
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...inputs, '-i', resolve(root, 'public/music/paris.mp3'), '-filter_complex', filter,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out]);
console.log('wrote', out, `${total.toFixed(1)}s`, marks.map((m) => m.toFixed(1)).join(' '));
