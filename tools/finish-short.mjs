// Turns a capture-clip.mjs portrait clip into a YouTube Short: 1080×1920, hook caption at the start,
// end card with the play link, and the city's music track faded out at the end.
//   node tools/finish-short.mjs <name> <city> "<hook text>" [endText]
// Reads renders/marketing/<name>.mp4, writes renders/marketing/<name>-final.mp4. Needs ffmpeg (FFMPEG env or PATH).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [name, city, hook, end = 'Play free · grow-everything.vercel.app'] = process.argv.slice(2);
if (!name || !city || !hook) throw new Error('usage: finish-short.mjs <name> <city> "<hook>" [endText]');
const root = resolve(import.meta.dirname, '..');
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const src = resolve(root, 'renders/marketing', `${name}.mp4`);
const out = resolve(root, 'renders/marketing', `${name}-final.mp4`);
const music = resolve(root, 'public/music', `${city}.mp3`);
const font = '/usr/share/fonts/opentype/inter/Inter-Black.otf';

const dur = +execFileSync(ffmpeg.replace(/ffmpeg$/, 'ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString().trim();
// drawtext reads text from files so quotes and colons need no escaping.
const hookFile = resolve(root, 'renders/marketing', `.${name}-hook.txt`);
const endFile = resolve(root, 'renders/marketing', `.${name}-end.txt`);
writeFileSync(hookFile, hook);
writeFileSync(endFile, end);
const endAt = Math.max(0, dur - 2.5).toFixed(2);
const text = (file, y, size, enable) =>
  `drawtext=fontfile=${font}:textfile=${file}:fontsize=${size}:fontcolor=white:borderw=6:bordercolor=black@0.85:x=(w-text_w)/2:y=${y}:enable='${enable}'`;
const vf = [
  'scale=1080:1920:flags=lanczos',
  text(hookFile, 'h*0.26', 62, 'lt(t,2.8)'),
  `drawbox=x=0:y=ih*0.70:w=iw:h=ih*0.12:color=black@0.55:t=fill:enable='gte(t,${endAt})'`,
  text(endFile, 'h*0.745', 44, `gte(t,${endAt})`),
].join(',');
execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error', '-i', src, '-i', music,
  '-filter_complex', `[0:v]${vf}[v];[1:a]atrim=0:${dur},afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, dur - 1.5)}:d=1.5,volume=0.8[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out,
]);
console.log('wrote', out, `${dur.toFixed(1)}s`);
