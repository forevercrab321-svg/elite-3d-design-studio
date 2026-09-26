# City music tracks

The arena plays `<city>.mp3` from this folder instead of the built-in procedural theme for that
city, and `victory.mp3` instead of the synth fanfare when the local player finishes first.

| File | City | Source (Suno, generated 2026-09-26 on the owner's paid plan) | Loop |
| --- | --- | --- | --- |
| `shanghai.mp3` | 上海 | shanghai take a, 120 BPM | 112.0 s |
| `newyork.mp3` | 纽约 | newyork take b, 116 BPM | 82.8 s |
| `paris.mp3` | 巴黎 | paris take a, 139 BPM, 3/4 | 93.2 s |
| `scrap.mp3` | 废料城 | scrap take b, 126 BPM | 45.7 s |
| `victory.mp3` | 第 1 名 | "Big Eater Champion" (victory take a), first 6.4 s + 1 s fade | — |

Every city file is an exact loop: it is cut in whole 4-bar phrases on the song's beat grid and
cross-faded at the wrap, so it must be played looped from an AudioBuffer (the AudioEngine does).
Files are normalised to about −14 LUFS; the mix trims them to the procedural level.

To replace a track, keep the Suno exports named `<city>-<take>.mp3` and rerun:

    python3 tools/make-music-loops.py <folder> '{"shanghai":"a","newyork":"b","paris":"a","scrap":"b","victory":"a"}'

Prompts: `docs/music/suno-prompts.md`. Only commit tracks you hold the rights to use commercially
(Suno: a paid plan at the time of generation; keep the generation-record screenshots).
