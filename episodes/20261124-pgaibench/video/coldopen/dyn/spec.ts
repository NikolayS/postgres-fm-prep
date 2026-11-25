// Episode 198 dynamic cold opens: one timeline, three effect levels (bold, medium, restrained).
// Shared by the Remotion picture (src/Big.tsx, src/Dyn.tsx) and the sound mix (mix.ts). Frames at 25 fps.
// Line starts were set on a 128 BPM grid (beat = 0.46875 s): L1 beat 1, L2 beat 13, L3 beat 18 (the groove
// drops in). L3 starts with "in one task," (1.40 s = 35 frames, the scope of the 5 of 5: task C18), so
// everything after it is 35 frames later than in the first build.
export type Variant = "bold" | "medium" | "restrained";
export const FPS = 25, HANDLE = 20; // L<i>.mp4 has 0.8 s (20 frames) of picture before and after the speech
export const D3 = 35; // "in one task," in front of "five out of five" (L3 speech segment 1, 1093.70-1095.10)
export const S = [12, 152, 211, 352 + D3, 457 + D3]; // line starts (global frame)
export const SPEECH = [132, 46, 126 + D3, 96, 89]; // speech length (frames) = L<i>.src.mov
export const BTN = 551 + D3, END = BTN + 25; // button: the cue's closing brass hit; 1 s later the title card follows
export const FZ = 99; // L5 clip frame held on the button (both faces, eyes open; checked on the frame sheet)
export const BEAT = 0.46875;

// Word frames (global), from the Scribe word times in review/work/src.words.json
const F5 = S[2] + D3; // "five" segment start (source 1095.60)
export const W = {
  perfectly: 12 + 90, right: 12 + 125, rightEnd: 12 + 129,
  agents: 152 + 36,
  task: S[2] + 23, five1: F5 + 3, five2: F5 + 21, cases: F5 + 36, fable: F5 + 48, restart: F5 + 105, serverEnd: F5 + 123,
  doNot: S[3] + 19, yeah: S[3] + 57, overconfident: S[3] + 76,
  mistakes: S[4] + 61, at: S[4] + 73, scaleEnd: S[4] + 86,
};
// The five RESTART stamps: the 1st on "five", one per beat, the 5th on "Fable"; "5/5" on "decided".
export const STAMPS = [0, 1, 2, 3, 4].map((k) => Math.round((18 + k) * BEAT * FPS) + (k === 0 ? 3 : 0) + D3);
export const FIVE_OF_FIVE = F5 + 60;
export const PRESS = S[3] + 54; // the DO NOT RESTART button goes down just before Nik's "Yeah."
export const OFF = S[2] + SPEECH[2]; // reboot starts after "server"

// Sound effects: [frame, file key, gain dB]. Files are peak-normalized to -6 dBFS by mix.ts first.
// Keys: G10 (card in, and the "ONE TASK (C18)" scope tag), U2 (typing), K (soft falling stroke), L (punch), whoosh, slam, impact, glitch (ep 197 fx.ts),
// down / up (power-down / power-up sweeps, made by mix.ts).
export type Sfx = [number, string, number, number?]; // optional 4th: play only this many seconds
const stamps = (g: number): Sfx[] => STAMPS.map((f) => [f, "L", g] as Sfx);
export const SFX: Record<Variant, Sfx[]> = {
  bold: [
    [0, "impact", -14], [0, "whoosh", -20],
    [W.perfectly - 2, "slam", -19], [W.perfectly, "G10", -22], [W.rightEnd + 2, "slam", -16], [W.rightEnd + 4, "K", -18],
    [147, "whoosh", -16], [W.agents + 1, "G10", -26], [206, "whoosh", -16],
    [W.task, "G10", -22], ...stamps(-19), [FIVE_OF_FIVE, "slam", -20],
    [W.restart, "glitch", -26], [W.serverEnd - 2, "glitch", -20], [W.serverEnd + 1, "down", -14], [OFF + 3, "U2", -22, 0.3], [S[3] - 3, "up", -18],
    [W.doNot, "G10", -20], [PRESS, "slam", -15], [PRESS, "impact", -20],
    [W.yeah, "whoosh", -24], [S[4] - 6, "whoosh", -16],
    [W.mistakes, "L", -20], [W.at - 2, "K", -18], [BTN, "impact", -12],
  ],
  medium: [
    [W.perfectly, "G10", -20], [W.rightEnd + 2, "slam", -19],
    [147, "whoosh", -18], [W.agents + 1, "G10", -28],
    [W.task, "G10", -22], ...stamps(-21), [FIVE_OF_FIVE, "slam", -22],
    [W.serverEnd - 1, "glitch", -22], [W.serverEnd + 1, "down", -18], [OFF + 3, "U2", -24, 0.3], [S[3] - 3, "up", -21],
    [W.doNot, "G10", -20], [PRESS, "slam", -18],
    [S[4] - 6, "whoosh", -18],
    [W.mistakes, "L", -22], [W.at - 2, "K", -20], [BTN, "impact", -16],
  ],
  restrained: [
    [W.perfectly, "G10", -21], [W.rightEnd + 3, "K", -20],
    [W.task, "G10", -23], ...stamps(-24), [FIVE_OF_FIVE, "G10", -24],
    [W.doNot, "G10", -21], [PRESS, "L", -22],
    [W.mistakes, "K", -21],
  ],
};
