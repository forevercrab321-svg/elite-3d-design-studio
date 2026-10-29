// List the fun moments of a captured round (tools/shorts/moments.mjs → acts.json), win or lose:
// the player stunned, eaten, eating a rival, caught by a villain, a villain catching someone else,
// the shrink, near misses in the hunt. Each line gives frame numbers for the edit's BEATS file.
//   node tools/shorts/find-moments.mjs <capture dir>
import { readFileSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/claude-0/shorts/moments';
const { times, rt = [], log } = JSON.parse(readFileSync(`${dir}/acts.json`, 'utf8'));
const frameAt = (t) => {
  let i = times.findIndex((x) => x >= t - 1e-3);
  return i < 0 ? times.length - 1 : i;
};
// Frames around a moment: lead-in and tail in seconds of match time.
const span = (t, before, after) => [frameAt(t - before), frameAt(t + after)];
const kinds = [
  [(e) => e.ev === 'stun', 'BONK: dashed into something too big', 1.2, 1.5],
  [(e) => /ate You\b|^You was so small|— You is in there|rates You:/.test(e.feed ?? ''), 'EATEN by a rival', 3, 2],
  [(e) => /^You (ate|rates) /.test(e.feed ?? ''), 'ATE a rival', 2.5, 2],
  [(e) => /👻 You got/.test(e.feed ?? ''), 'CAUGHT by a villain (score reset)', 4, 2.5],
  [(e) => /👻 (?!You)/.test(e.feed ?? ''), 'villain catches someone else', 3, 2],
  [(e) => e.ev === 'scoresLocked', 'THE SHRINK: scores lock, villains rise', 1, 8],
  [(e) => e.ev === 'landmark' || e.ev === 'collapse', 'landmark / building down', 2, 2],
];
const out = [];
for (const e of log) {
  for (const [test, label, before, after] of kinds) {
    if (!test(e)) continue;
    const [a, b] = span(e.t, before, after);
    const real = rt.slice(a, b + 1).filter((r) => r === 1).length;
    out.push({ t: e.t, label, a, b, real: `${real}/${b - a + 1}`, mass: e.mass, text: e.feed ?? '' });
    break;
  }
}
// Near misses: real-time stretches in the chase that did not end in the player's catch.
const caughtAt = log.find((e) => /👻 You got/.test(e.feed ?? ''))?.t ?? Infinity;
let start = -1;
for (let i = 0; i <= times.length; i++) {
  const on = i < times.length && rt[i] === 1 && times[i] > 312;
  if (on && start < 0) start = i;
  if (!on && start >= 0) {
    const len = i - start;
    if (len > 60 && times[i - 1] < caughtAt - 1) out.push({ t: times[start], label: `NEAR MISS: villain within 10 m for ${(len / 30).toFixed(1)} s`, a: start, b: i - 1, real: `${len}/${len}`, mass: 120, text: '' });
    start = -1;
  }
}
out.sort((x, y) => x.t - y.t);
for (const m of out) console.log(`${m.t.toFixed(1).padStart(6)}s  frames ${String(m.a).padStart(5)}–${String(m.b).padEnd(5)} real ${m.real.padEnd(9)} ${m.label}${m.text ? ' · ' + m.text : ''}`);
console.log(`${times.length} frames, ends at ${times.at(-1)} s`);
