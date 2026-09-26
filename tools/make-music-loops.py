#!/usr/bin/env python3
"""Turn Suno exports into the game's music files: beat-accurate loops + a short victory jingle.

    pip install numpy imageio-ffmpeg
    python3 tools/make-music-loops.py <dir with <city>-<take>.mp3 files> \
        '{"shanghai":"a","newyork":"b","paris":"a","scrap":"b","victory":"a"}'

For each city track:
  1. fit one beat grid (period + phase) to the whole song from its onset envelope;
  2. loop start S = the first beat after which the local groove sits on that grid for 16 s
     (skips a rubato / stop-time intro);
  3. loop end L = S + a whole number of 4-bar phrases, the latest one whose next 4 s sound like
     the loop start (band-spectrum correlation) and whose local groove is still on the grid;
  4. S and L are nudged by their local beat offsets, the file is cut to [S, L) and the first
     30 ms are cross-faded with the audio just after L, so the wrap is continuous;
  5. loudness is normalised to -14 LUFS (peaks <= -1 dBFS) and encoded to MP3 160 kb/s.
The seam is then re-measured on the decoded MP3 (beat offsets on both sides, in ms).
The AudioEngine plays these through an AudioBufferSourceNode, which loops sample-accurately.

victory: the first 6.4 s with a 1 s fade-out, same loudness target.
Output: public/music/<city>.mp3 and public/music/victory.mp3.
"""
import glob
import json
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
OUT = Path(__file__).resolve().parent.parent / 'public' / 'music'
BEATS_PER_BAR = {'shanghai': 4, 'newyork': 4, 'paris': 3, 'scrap': 4}
TARGET_LUFS = -14.0


def load(path):
    raw = subprocess.run([FF, '-v', 'quiet', '-i', str(path), '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def lufs(x):
    err = subprocess.run([FF, '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                          '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'],
                         input=x.astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])


def normalise(x):
    x = x * 10 ** ((TARGET_LUFS - lufs(x)) / 20)
    peak = np.abs(x).max()
    return x * 0.89 / peak if peak > 0.89 else x


def encode(x, name, title):
    subprocess.run([FF, '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-codec:a', 'libmp3lame', '-b:a', '160k', '-metadata', f'title={title}',
                    '-metadata', 'artist=GROW EVERYTHING (Suno)', str(OUT / f'{name}.mp3')],
                   input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)


def band_spectrum(mono, hop=512, frame=2048):
    w = np.lib.stride_tricks.sliding_window_view(mono, frame)[::hop] * np.hanning(frame)
    s = np.log1p(np.abs(np.fft.rfft(w, axis=1))[:, :600])
    return s.reshape(len(s), 30, 20).mean(2)


def onset(mono, hop=256, frame=2048):
    w = np.lib.stride_tricks.sliding_window_view(mono, frame)[::hop] * np.hanning(frame)
    s = np.log1p(np.abs(np.fft.rfft(w, axis=1)))
    o = np.maximum(np.diff(s, axis=0), 0).sum(1)
    return np.maximum(o - np.convolve(o, np.ones(64) / 64, 'same'), 0), SR / hop


def comb(o, fps, times):
    return np.interp(times * fps, np.arange(len(o)), o).mean()


def beat_grid(o, fps, dur):
    n = int(60 * fps)
    ac = np.correlate(o[:n], o[:n], 'full')[n - 1:]
    lags = np.arange(len(ac)) / fps
    m = (lags > 0.3) & (lags < 0.75)
    p0 = lags[m][np.argmax(ac[m])]
    best = (-1, 0, 0)
    for p in np.arange(p0 - 0.006, p0 + 0.006, 0.00005):
        for ph in np.arange(0, p, 1 / fps):
            s = comb(o, fps, np.arange(ph, dur - 0.1, p))
            if s > best[0]:
                best = (s, p, ph)
    return best[1], best[2]


def local_offset(o, fps, p, ph, t0, t1):
    """How far (s) the groove in [t0, t1) sits from the grid; searched within a quarter beat."""
    beats = np.arange(ph, t1 + p, p)
    beats = beats[(beats >= t0) & (beats < t1)]
    return max(np.arange(-p / 4, p / 4, 0.001), key=lambda d: comb(o, fps, beats + d))


def make_loop(src, city):
    x = load(src)
    mono = x.mean(1)
    dur = len(mono) / SR
    o, ofps = onset(mono)
    p, ph = beat_grid(o, ofps, dur)
    start = next((b for b in np.arange(ph, 35, p)
                  if abs(local_offset(o, ofps, p, ph, b, b + 8)) < 0.02
                  and abs(local_offset(o, ofps, p, ph, b + 8, b + 16)) < 0.02), None)
    if start is None:
        raise SystemExit(f'{city}: no steady groove in the first 35 s, pick the other take')
    spec = band_spectrum(mono)
    fps = SR / 512
    win = int(4 * fps)
    head = spec[int(start * fps):int(start * fps) + win]
    head = (head - head.mean()) / head.std()
    level = spec.mean(1)
    phrase = BEATS_PER_BAR[city] * 4 * p
    cands = []
    for n in range(1, int(dur / phrase) + 1):
        end = start + n * phrase
        i = int(end * fps)
        if end - start < 40 or end > dur - 5 or level[i:i + win].mean() < np.median(level) - 0.15:
            continue
        if abs(local_offset(o, ofps, p, ph, end - 8, end)) >= 0.02:
            continue
        seg = spec[i:i + win]
        cands.append((((seg - seg.mean()) / (seg.std() + 1e-9) * head).mean(), end))
    if not cands:
        raise SystemExit(f'{city}: no loop point found, pick the other take')
    best = max(cands)[0]
    corr, end = max((c for c in cands if c[0] >= 0.9 * best), key=lambda c: c[1])
    end += local_offset(o, ofps, p, ph, end - 8, end) - local_offset(o, ofps, p, ph, start, start + 8)
    s, e, xf = int(round(start * SR)), int(round(end * SR)), int(0.03 * SR)
    fade = np.linspace(0, 1, xf)[:, None]
    y = x[s:e].copy()
    y[:xf] = x[s:s + xf] * np.sqrt(fade) + x[e:e + xf] * np.sqrt(1 - fade)
    return normalise(y), dict(bpm=round(60 / p, 2), start=round(start, 2), end=round(end, 2), match=round(float(corr), 3))


def seam_offsets(city, p):
    """Beat offsets (ms) in 8 s windows across the wrap of the encoded file: all ~0 = no stumble."""
    z = load(OUT / f'{city}.mp3').mean(1)
    m = np.concatenate([z[-16 * SR:], z[:16 * SR]])
    o, fps = onset(m)
    ph = max(np.arange(0, p, 0.001), key=lambda f: comb(o, fps, np.arange(f, 31.9, p)))
    return [round(local_offset(o, fps, p, ph, t, t + 8) * 1000) for t in (0, 8, 16, 24)]


def main():
    src_dir, picks = Path(sys.argv[1]), json.loads(sys.argv[2])
    for city, take in picks.items():
        src = sorted(glob.glob(str(src_dir / f'*{city}-{take}.mp3')))[0]
        if city == 'victory':
            y = load(src)[:int(6.4 * SR)].copy()
            y[-SR:] *= np.linspace(1, 0, SR)[:, None] ** 2
            y[:220] *= np.linspace(0, 1, 220)[:, None]
            encode(normalise(y), 'victory', 'Big Eater Champion')
            print('victory: 6.4 s')
            continue
        y, info = make_loop(src, city)
        encode(y, city, f'{city} ({take})')
        info['seam_ms'] = seam_offsets(city, 60 / info['bpm'])
        print(f"{city}-{take}: loop {len(y) / SR:.1f} s", info)


if __name__ == '__main__':
    main()
