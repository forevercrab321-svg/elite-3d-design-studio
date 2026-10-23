// Turn the NAME=ID lines printed by roblox/upload-assets.sh into roblox/src/shared/AssetIds.luau.
// Usage: node tools/roblox-assetids.mjs < ids.txt
import { readFileSync, writeFileSync } from 'node:fs';

const ids = {};
for (const line of readFileSync(0, 'utf8').split(/\r?\n/)) {
  const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(\d+)$/);
  if (m) ids[m[1]] = m[2];
}
const names = Object.keys(ids).sort();
const out = [
  '--!strict',
  "-- Roblox asset ids of the web game's uploaded models (roblox/upload-assets.sh prints NAME=ID lines;",
  '-- tools/roblox-assetids.mjs turns them into this file). A missing name falls back to primitives.',
  'return {',
  ...names.map((n) => `\t${n} = ${ids[n]},`),
  '} :: { [string]: number }',
  '',
];
writeFileSync(new URL('../roblox/src/shared/AssetIds.luau', import.meta.url), out.join('\n'));
console.log(names.length, 'asset ids');
