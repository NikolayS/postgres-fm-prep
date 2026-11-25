// Spec for compose.ts --fade-in: the title card fades in from black by default; --fade-in 0 turns
// that off (picture and sound) for an intro that is joined to a cold open with a crossfade.
// Episode 198: a particle intro whose first frame continues the cold open; a fade from black
// would show as a dark dip and a hole in the sound at the join.
// Run: bun test tests/compose-fade.test.ts
import { describe, expect, test } from "bun:test";
import { fadeFilters } from "../compose";

describe("fadeFilters", () => {
  test("default: 1 s picture fade from black and 0.5 s sound fade-in with a card", () => {
    const f = fadeFilters({ card: 13, fadeIn: 1, fadeOut: 2, total: 100, withOutro: true });
    expect(f.vf).toEqual(["fade=t=in:st=0:d=1", "fade=t=out:st=98.000:d=2"]);
    expect(f.af).toBe(",afade=t=in:d=0.5,afade=t=out:st=98.000:d=2");
  });
  test("--fade-in 0: no fade from black, picture or sound; the fade to black at the end stays", () => {
    const f = fadeFilters({ card: 15.68, fadeIn: 0, fadeOut: 2, total: 100, withOutro: true });
    expect(f.vf).toEqual(["fade=t=out:st=98.000:d=2"]);
    expect(f.af).toBe(",afade=t=out:st=98.000:d=2");
  });
  test("no card (a cut from the middle): no fade-in at all", () => {
    const f = fadeFilters({ card: 0, fadeIn: 1, fadeOut: 2, total: 50, withOutro: false });
    expect(f.vf).toEqual([]);
    expect(f.af).toBe("");
  });
  test("a negative or non-numeric fade-in is an error", () => {
    expect(() => fadeFilters({ card: 13, fadeIn: -1, fadeOut: 2, total: 100, withOutro: true })).toThrow();
    expect(() => fadeFilters({ card: 13, fadeIn: Number("x"), fadeOut: 2, total: 100, withOutro: true })).toThrow();
  });
});

// --intro-lufs L: the intro bed's own target level; default is --music-lufs (episode 198 particle intro).
import { introGain } from "../compose";
describe("introGain", () => {
  test("default: the bed is set to the music level", () => {
    expect(introGain({ musicLufs: -20.5, measured: -14 })).toBeCloseTo(-6.5, 6);
  });
  test("--intro-lufs sets its own level", () => {
    expect(introGain({ musicLufs: -20.5, introLufs: -18.5, measured: -14 })).toBeCloseTo(-4.5, 6);
  });
  test("a non-numeric --intro-lufs is an error", () => {
    expect(() => introGain({ musicLufs: -20.5, introLufs: Number("loud"), measured: -14 })).toThrow();
  });
});
