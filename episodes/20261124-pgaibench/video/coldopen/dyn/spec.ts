// Episode 198 dynamic cold opens: one timeline, three effect levels (bold, medium, restrained).
// Shared by the Remotion picture (src/Dyn.tsx) and the sound mix (mix.ts). Frames at 25 fps.
// Lines start on beats of the ep 197 funk cue (128 BPM, beat = 0.46875 s = 11.72 frames, beat 0 at 0 s):
// L1 beat 1, L2 beat 13, L3 beat 18 (the groove drops in), L4 beat 30, L5 beat 39, button beat 47.
export type Variant = "bold" | "medium" | "restrained";
export const FPS = 25, HANDLE = 20; // L<i>.mp4 has 0.8 s (20 frames) of picture before and after the speech
export const S = [12, 152, 211, 352, 457]; // line starts (global frame)
export const SPEECH = [132, 46, 126, 96, 89]; // speech length (frames) = L<i>.src.mov
export const BTN = 551, END = 576; // button: the cue's closing brass hit; 1 s later the title card follows
export const FZ = 99; // L5 clip frame held on the button (both faces, eyes open; checked on the frame sheet)
export const BEAT = 0.46875;

// Word frames (global), from the Scribe word times in review/work/src.words.json
export const W = {
  perfectly: 12 + 90, right: 12 + 125, rightEnd: 12 + 129,
  agents: 152 + 36,
  five1: 211 + 3, five2: 211 + 21, cases: 211 + 36, fable: 211 + 48, restart: 211 + 105, serverEnd: 211 + 123,
  doNot: 352 + 19, yeah: 352 + 57, overconfident: 352 + 76,
  mistakes: 457 + 61, at: 457 + 73, scaleEnd: 457 + 86,
};
// The five RESTART stamps land on beats 18-22 (the 5th on "Fable"); "5/5" on "decided".
export const STAMPS = [0, 1, 2, 3, 4].map((k) => Math.round((18 + k) * BEAT * FPS) + (k === 0 ? 3 : 0));
export const FIVE_OF_FIVE = 211 + 60;
export const PRESS = 352 + 54; // the DO NOT RESTART button goes down just before Nik's "Yeah."

// Sound effects: [frame, file key, gain dB]. Files are peak-normalized to -6 dBFS by mix.ts first.
// Keys: G10 (card in), K (soft falling stroke), L (punch), whoosh, slam, impact, glitch (ep 197 fx.ts),
// down / up (power-down / power-up sweeps, made by mix.ts).
export type Sfx = [number, string, number];
const stamps = (g: number): Sfx[] => STAMPS.map((f) => [f, "L", g] as Sfx);
export const SFX: Record<Variant, Sfx[]> = {
  bold: [
    [0, "impact", -14], [0, "whoosh", -20],
    [W.perfectly, "G10", -20], [W.rightEnd + 2, "slam", -16], [W.rightEnd + 4, "K", -18],
    [147, "whoosh", -16], [W.agents + 1, "G10", -26], [206, "whoosh", -16],
    ...stamps(-19), [FIVE_OF_FIVE, "slam", -20],
    [W.restart, "glitch", -26], [W.serverEnd - 2, "glitch", -20], [W.serverEnd + 1, "down", -14], [348, "up", -16],
    [W.doNot, "G10", -20], [PRESS, "slam", -15], [PRESS, "impact", -20],
    [409, "whoosh", -24], [451, "whoosh", -16],
    [W.mistakes, "L", -20], [W.at - 2, "K", -18], [BTN, "impact", -12],
  ],
  medium: [
    [W.perfectly, "G10", -20], [W.rightEnd + 2, "slam", -19],
    [147, "whoosh", -18], [W.agents + 1, "G10", -28],
    ...stamps(-21), [FIVE_OF_FIVE, "slam", -22],
    [W.serverEnd - 1, "glitch", -22], [W.serverEnd + 3, "down", -18],
    [W.doNot, "G10", -20], [PRESS, "slam", -18],
    [451, "whoosh", -18],
    [W.mistakes, "L", -22], [W.at - 2, "K", -20], [BTN, "impact", -16],
  ],
  restrained: [
    [W.perfectly, "G10", -21], [W.rightEnd + 3, "K", -20],
    ...stamps(-24), [FIVE_OF_FIVE, "G10", -24],
    [W.doNot, "G10", -21], [PRESS, "L", -22],
    [W.mistakes, "K", -21],
  ],
};
