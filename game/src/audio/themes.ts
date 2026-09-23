/**
 * City music themes for the step sequencer (procedural BGM, no audio files needed).
 * A theme is a loop of `steps` sixteenth-notes at `bpm`; layers switch on with the local
 * machine's tier, so the score grows with the player. Patterns are semitones above the
 * theme root (null = rest). If `music/<city>.mp3` exists next to the page (e.g. a Suno
 * export, see docs/music/suno-prompts.md), the AudioEngine plays that file instead.
 */
export interface MusicTheme {
  id: string;
  bpm: number;
  /** Steps per loop: 16 = one 4/4 bar of sixteenths, 12 = one 3/4 bar. */
  steps: number;
  /** Root frequency (Hz) the patterns are relative to. */
  root: number;
  lead: { pattern: (number | null)[]; wave: OscillatorType; level: number; decay: number; pluck?: boolean; tremolo?: boolean; detune?: number };
  bass: { pattern: (number | null)[]; wave: OscillatorType; level: number };
  kick: number[];
  snare: number[];
  hat: number[];
  /** Optional colour hit (gong, brass stab, accordion chord) on these steps from tier 3. */
  accent?: { steps: number[]; chord: number[]; wave: OscillatorType; level: number; decay: number };
}

const n = null;

export const THEMES: Record<string, MusicTheme> = {
  // Shanghai: A-minor pentatonic "guzheng" plucks with pipa-style tremolo, a gong on the bar.
  shanghai: {
    id: 'shanghai',
    bpm: 100,
    steps: 16,
    root: 220,
    lead: { pattern: [12, n, 10, 7, n, 5, 7, n, 3, n, 5, n, 7, 10, n, n], wave: 'triangle', level: 0.16, decay: 0.45, pluck: true, tremolo: true },
    bass: { pattern: [-12, n, n, n, -9, n, n, n, -14, n, n, n, -7, n, -9, n], wave: 'sine', level: 0.3 },
    kick: [0, 8],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    accent: { steps: [0], chord: [-24, -17, -12], wave: 'sine', level: 0.12, decay: 2.2 },
  },
  // New York: swung boom-bap with a walking bass and muted brass stabs.
  newyork: {
    id: 'newyork',
    bpm: 92,
    steps: 16,
    root: 196,
    lead: { pattern: [n, n, 7, n, n, 10, n, 12, n, n, 15, n, 12, n, 10, n], wave: 'square', level: 0.08, decay: 0.18, detune: 8 },
    bass: { pattern: [-12, n, -8, n, -5, n, -3, n, -2, n, -3, n, -5, n, -7, n], wave: 'triangle', level: 0.38 },
    kick: [0, 7, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    accent: { steps: [6, 14], chord: [3, 7, 10], wave: 'sawtooth', level: 0.07, decay: 0.16 },
  },
  // Paris: bal-musette waltz (3/4) with a detuned "accordion" melody and oom-pah-pah.
  paris: {
    id: 'paris',
    bpm: 132,
    steps: 12,
    root: 261.6,
    lead: { pattern: [7, n, 8, 7, 5, n, 4, n, 5, 7, n, n], wave: 'sawtooth', level: 0.07, decay: 0.3, detune: 12 },
    bass: { pattern: [-12, n, n, n, n, n, -17, n, n, n, n, n], wave: 'sine', level: 0.34 },
    kick: [0, 6],
    snare: [],
    hat: [4, 8, 10],
    accent: { steps: [4, 8], chord: [0, 4, 7], wave: 'sawtooth', level: 0.045, decay: 0.2 },
  },
};
