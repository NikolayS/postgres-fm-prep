// Spec for the facing rule: hosts face each other, never out of the picture.
// Run: bun test tests/facing.test.ts
import { describe, expect, test } from "bun:test";
import { estimateFacing, facingVerdict, hostOrder, proposeOrder, type FacingRecord } from "../qa/facing";

// Episode 198: Nik sits at the right edge of his own frame and looks to screen-left;
// Kirk leans and looks to screen-right.
const record: FacingRecord = {
  hosts: {
    nik: { facing: "left", evidence: ["facing/nik-0600.png", "facing/nik-1800.png", "facing/nik-3000.png"] },
    kirk: { facing: "right", evidence: ["facing/kirk-0600.png", "facing/kirk-1800.png", "facing/kirk-3000.png"] },
  },
};
const place = (nikX: number, kirkX: number) => ({
  place: {
    nik: { x: nikX, y: 222, w: 800, h: 450 },
    kirk: { x: kirkX, y: 222, w: 800, h: 450 },
    robot: { x: 1656, y: 880, w: 240, h: 135, small: true },
  },
});

describe("facing: hosts face inward", () => {
  test("hostOrder sorts host tiles by x and leaves out small tiles", () => {
    expect(hostOrder(place(120, 1000))).toEqual(["nik", "kirk"]);
    expect(hostOrder(place(1000, 120))).toEqual(["kirk", "nik"]);
  });

  test("episode 198 with Nik on the left fails: he looks out of the picture", () => {
    const v = facingVerdict(place(120, 1000), record);
    expect(v.pass).toBe(false);
    expect(v.problems.join("\n")).toContain("nik");
  });

  test("episode 198 with Kirk left and Nik right passes", () => {
    const v = facingVerdict(place(1000, 120), record);
    expect(v.pass).toBe(true);
    expect(v.problems).toEqual([]);
  });

  test("no record fails, and a host without a facing value or evidence fails", () => {
    expect(facingVerdict(place(1000, 120), undefined).pass).toBe(false);
    const noKirk: FacingRecord = { hosts: { nik: record.hosts.nik } };
    expect(facingVerdict(place(1000, 120), noKirk).problems.join("\n")).toContain("kirk");
    const noEvidence: FacingRecord = { hosts: { ...record.hosts, kirk: { facing: "right", evidence: [] } } };
    expect(facingVerdict(place(1000, 120), noEvidence).pass).toBe(false);
  });

  test("a host facing the camera straight (neutral) may sit on either edge", () => {
    const r: FacingRecord = { hosts: { nik: { facing: "neutral", evidence: ["a.png"] }, kirk: { facing: "right", evidence: ["b.png"] } } };
    expect(facingVerdict(place(1000, 120), r).pass).toBe(true);
    expect(facingVerdict(place(120, 1000), { hosts: { ...r.hosts, kirk: { facing: "neutral", evidence: ["b.png"] } } }).pass).toBe(true);
  });

  test("with three hosts the middle one may face either way; edges must face inward", () => {
    const three = { place: { nik: { x: 24, w: 600 }, michael: { x: 660, w: 600 }, kirk: { x: 1296, w: 600 } } };
    const r: FacingRecord = { hosts: {
      nik: { facing: "right", evidence: ["n.png"] }, michael: { facing: "left", evidence: ["m.png"] }, kirk: { facing: "left", evidence: ["k.png"] } } };
    expect(facingVerdict(three, r).pass).toBe(true);
    expect(facingVerdict(three, { hosts: { ...r.hosts, kirk: { facing: "right", evidence: ["k.png"] } } }).pass).toBe(false);
  });

  test("a written override from the host passes, and says so", () => {
    const r: FacingRecord = { ...record, override: { by: "Nik", reason: "keep the brand order for this episode" } };
    const v = facingVerdict(place(120, 1000), r);
    expect(v.pass).toBe(true);
    expect(v.note).toContain("override by Nik");
    expect(facingVerdict(place(120, 1000), { ...record, override: { by: "", reason: "" } }).pass).toBe(false);
  });

  test("proposeOrder puts right-facing hosts left, neutral in the middle, left-facing right", () => {
    expect(proposeOrder(record)).toEqual(["kirk", "nik"]);
    expect(proposeOrder({ hosts: {
      a: { facing: "left", evidence: ["x"] }, b: { facing: "neutral", evidence: ["x"] }, c: { facing: "right", evidence: ["x"] } } })).toEqual(["c", "b", "a"]);
  });

  test("estimateFacing reads the head turn (nose line vs face-box center) first: episode 198 frames", () => {
    // measured on 12 source frames per host (faces.swift "nose"): Kirk turns to screen-right, Nik to screen-left
    const kirk = [0.062, 0.114, 0.064, 0.118, 0.114, 0.179, 0.139, 0.075, 0.071, 0.116, 0.148, -0.022].map((nose) => ({ box: [250, 80, 140, 160], nose }));
    const nik = [-0.023, 0.029, -0.08, 0.002, -0.052, -0.059, -0.019, -0.037, -0.056, -0.056, -0.057, -0.065].map((nose) => ({ box: [250, 80, 140, 160], nose }));
    expect(estimateFacing(kirk, 640)).toMatchObject({ facing: "right", by: "head turn" });
    expect(estimateFacing(nik, 640)).toMatchObject({ facing: "left", by: "head turn" });
    expect(estimateFacing([0.01, -0.02, 0.0].map((nose) => ({ box: [250, 80, 140, 160], nose })), 640).facing).toBe("neutral");
  });

  test("estimateFacing falls back to the face position in its tile: off-center to the right means facing left", () => {
    // tile 640 wide; faces at x 380-520 (center 450, +0.20 of width): sits right, looks left
    expect(estimateFacing([{ box: [380, 80, 140, 160] }, { box: [390, 90, 140, 150] }, { box: [370, 85, 150, 160] }], 640).facing).toBe("left");
    expect(estimateFacing([{ box: [130, 80, 140, 160] }, { box: [120, 80, 140, 160] }], 640).facing).toBe("right");
    expect(estimateFacing([{ box: [250, 80, 140, 160] }], 640).facing).toBe("neutral");
    expect(estimateFacing([], 640).facing).toBe("unknown");
  });
});
