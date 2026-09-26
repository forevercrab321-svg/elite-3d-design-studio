/**
 * City music themes for the step sequencer (procedural BGM, no audio files needed).
 * A theme is a loop of `steps` sixteenth-notes at `bpm`; layers switch on with the local
 * machine's tier, so the score grows with the player. Patterns are semitones above the
 * theme root (null = rest). If `music/<city>.mp3` exists next to the page (e.g. a Suno
 * export, see docs/music/suno-prompts.md), the AudioEngine plays that file instead.
 *
 * Style (Creative Director, 2026-09-26): the game is cute, so the music is too — bright major
 * keys, ~120 BPM, a two-bar "call and answer" hook that repeats until it sticks (earworm),
 * toy-like timbres (plucked triangle / sine = toy piano, marimba, music box), a springy "boing"
 * bass and a high bell counter-line that joins as the machine grows.
 */
export interface MusicTheme {
  id: string;
  bpm: number;
  /** Steps per loop: 32 = two 4/4 bars of sixteenths, 24 = two 3/4 bars. */
  steps: number;
  /** Root frequency (Hz) the patterns are relative to. */
  root: number;
  lead: { pattern: (number | null)[]; wave: OscillatorType; level: number; decay: number; pluck?: boolean; tremolo?: boolean; detune?: number };
  /** `boing`: each bass note bends down a little (springy, cartoon bass). */
  bass: { pattern: (number | null)[]; wave: OscillatorType; level: number; boing?: boolean };
  kick: number[];
  /** Clap / snare hits (from tier 2). */
  snare: number[];
  hat: number[];
  /** High music-box counter-line (from tier 2): semitones, usually an octave above the lead. */
  bell?: { pattern: (number | null)[]; level: number };
  /** Optional colour hit (gong, brass stab, accordion chord) on these steps from tier 4. */
  accent?: { steps: number[]; chord: number[]; wave: OscillatorType; level: number; decay: number };
}

const n = null;

export const THEMES: Record<string, MusicTheme> = {
  // Shanghai — "Bund Big Eater": C-major pentatonic toy-guzheng hook, call (bar 1) / answer (bar 2).
  shanghai: {
    id: 'shanghai',
    bpm: 120,
    steps: 32,
    root: 261.63, // C4
    lead: {
      pattern: [12, n, 12, n, 9, n, 7, n, 9, n, 12, n, 14, n, n, n, 12, n, 12, n, 9, n, 7, n, 4, n, 2, n, 0, n, n, n],
      wave: 'triangle', level: 0.15, decay: 0.32, pluck: true,
    },
    bass: { pattern: [-12, n, n, n, -5, n, n, n, -12, n, n, n, -5, n, -3, n, -15, n, n, n, -8, n, n, n, -10, n, n, n, -5, n, -3, n], wave: 'sine', level: 0.3, boing: true },
    kick: [0, 8, 16, 24],
    snare: [4, 12, 20, 28],
    hat: [2, 6, 10, 14, 18, 22, 26, 30],
    bell: { pattern: [n, n, n, n, n, n, 19, n, n, n, n, n, n, n, 24, n, n, n, n, n, n, n, 16, n, n, n, n, n, n, n, 12, n], level: 0.07 },
    accent: { steps: [0], chord: [-24, -17, -12], wave: 'sine', level: 0.1, decay: 1.6 },
  },
  // New York — "Honk Honk Taxi": F-major toy-piano "honk honk" motif over a bouncy walking boing bass.
  newyork: {
    id: 'newyork',
    bpm: 116,
    steps: 32,
    root: 349.23, // F4
    lead: {
      pattern: [0, 0, n, n, -3, n, 0, n, n, n, 2, n, 0, n, n, n, 0, 0, n, n, -3, n, -5, n, -7, n, -5, n, -3, n, n, n],
      wave: 'square', level: 0.06, decay: 0.16, pluck: true,
    },
    bass: { pattern: [-24, n, -20, n, -17, n, -15, n, -24, n, -20, n, -17, n, -15, n, -19, n, -15, n, -12, n, -15, n, -17, n, -19, n, -20, n, -22, n], wave: 'triangle', level: 0.34, boing: true },
    kick: [0, 10, 16, 26],
    snare: [4, 12, 20, 28],
    hat: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    bell: { pattern: [n, n, n, n, n, n, n, n, 12, n, 14, n, 12, n, n, n, n, n, n, n, n, n, n, n, 7, n, 9, n, 12, n, n, n], level: 0.06 },
    accent: { steps: [6, 22], chord: [4, 7, 12], wave: 'sawtooth', level: 0.05, decay: 0.14 },
  },
  // Paris — "Tea Time Waltz": C-major music-box accordion waltz (3/4), two bars of call/answer.
  paris: {
    id: 'paris',
    bpm: 138,
    steps: 24,
    root: 261.63, // C4
    lead: {
      pattern: [7, n, n, 9, 7, n, 4, n, n, n, n, n, 5, n, n, 7, 5, n, 2, n, n, n, n, n],
      wave: 'sawtooth', level: 0.06, decay: 0.28, detune: 10,
    },
    bass: { pattern: [-12, n, n, n, n, n, -5, n, n, n, n, n, -17, n, n, n, n, n, -10, n, n, n, n, n], wave: 'sine', level: 0.32, boing: true },
    kick: [0, 12],
    snare: [],
    hat: [4, 8, 16, 20],
    bell: { pattern: [n, n, n, n, n, n, n, n, 19, n, 16, n, n, n, n, n, n, n, n, n, 17, n, 14, n], level: 0.06 },
    accent: { steps: [4, 8, 16, 20], chord: [0, 4, 7], wave: 'sawtooth', level: 0.035, decay: 0.18 },
  },
  // Scrap City (bonus) — "Beep Boop Junkyard": G-major robot bleeps, square toy synth, clanky claps.
  scrap: {
    id: 'scrap',
    bpm: 124,
    steps: 32,
    root: 392.0, // G4
    lead: {
      pattern: [0, n, 4, n, 7, n, 4, n, 0, n, n, n, 12, n, n, n, 0, n, 4, n, 7, n, 9, n, 7, n, 4, n, 2, n, n, n],
      wave: 'square', level: 0.055, decay: 0.12, pluck: true,
    },
    bass: { pattern: [-24, n, n, n, -24, n, -12, n, -19, n, n, n, -19, n, -7, n, -20, n, n, n, -20, n, -8, n, -17, n, n, n, -17, n, -5, n], wave: 'triangle', level: 0.32, boing: true },
    kick: [0, 8, 16, 24],
    snare: [4, 12, 20, 28],
    hat: [2, 6, 10, 14, 18, 22, 26, 30],
    bell: { pattern: [n, n, n, n, n, n, n, n, n, n, 19, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, 24, n, 19, n, n, n], level: 0.06 },
    accent: { steps: [14, 30], chord: [12, 16, 19], wave: 'square', level: 0.035, decay: 0.1 },
  },
};
