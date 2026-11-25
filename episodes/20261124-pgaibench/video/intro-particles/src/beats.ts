// Music hit frames of the shades intro cue (a-shades-long2-pad.wav starts at intro t = 0):
// the 116 BPM grid 0.486 + k * 60/116 s snapped to the loudest frame within +-2 (as Card198 does).
export const FPS = 25, BEAT = 60 / 116;
export const ONF = [13,26,38,51,64,77,90,103,116,129,142,155,168,181,194,207,220,233,245,258,271,284,297,310,323,336,349,362,375,388,401,413,426,439,452,465,478,491,504,516,529,542,555,568];
// time (s) of beat position k (fractional k: linear between hits)
export const kt = (k: number) => {
  if (k <= 0) return ONF[0] / FPS + k * BEAT;
  const i = Math.min(Math.floor(k), ONF.length - 2), u = k - i;
  return (ONF[i] + (ONF[i + 1] - ONF[i]) * u) / FPS;
};
// beat position of time t
export const tk = (t: number) => {
  const f = t * FPS;
  if (f < ONF[0]) return (t - ONF[0] / FPS) / BEAT;
  for (let i = 0; i < ONF.length - 1; i++) if (f < ONF[i + 1]) return i + (f - ONF[i]) / (ONF[i + 1] - ONF[i]);
  return ONF.length - 1 + (t - ONF[ONF.length - 1] / FPS) / BEAT;
};
