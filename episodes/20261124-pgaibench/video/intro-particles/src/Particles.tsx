import React, {useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {buildSystem, drawFrame, H, makeBuffers, OPTS, W} from './particles-engine';
import {holdStart, scenes, stateAt, VARIANTS} from './plans';
import {CardFull, useMono} from './CardStill';
import {useFonts} from './common';

// Ep 198 particle intro. Every frame is drawn by particles-engine.ts (pure function of the
// frame time; fixed seeds) into a plain 2D canvas: no WebGL, nothing random per render.
// Inputs are raw RGBA files (exact bytes, no browser colour management): the cold open's last
// frame (co), the body's first frame after the compose crossfade (body), the card layers as
// they land (A1/B1) and as they dissolve (F). During the sharp hold the card is drawn as DOM
// (CardFull) so its texts can change on the beats; its first state equals the landed layers and
// its last state equals F, so the switches between canvas and DOM do not show.
const NAMES = (set1: string) => ['co', 'body', ...[set1, 'F'].flatMap((s) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `${s}-${i}`))];
type Ready = {sys: ReturnType<typeof buildSystem>[]; buf: ReturnType<typeof makeBuffers>; img: ImageData};
const cache: Record<string, Promise<Ready>> = {};
const load = (id: 'A' | 'B') =>
  (cache[id] ??= (async () => {
    const im: Record<string, Uint8ClampedArray> = {};
    await Promise.all(NAMES(VARIANTS[id].set1).map(async (n) => { im[n] = new Uint8ClampedArray(await (await fetch(staticFile(`pi/${n}.rgba`))).arrayBuffer()); }));
    const v = VARIANTS[id], sc = scenes(im, v.set1);
    return {sys: [buildSystem(sc.co, sc.card1, v.phases[0]), buildSystem(sc.cardF, sc.body, v.phases[1])], buf: makeBuffers(), img: new ImageData(W, H)};
  })());

export const Particles: React.FC<{variant: 'A' | 'B'}> = ({variant}) => {
  const frame = useCurrentFrame();
  const [ready, setReady] = useState<Ready | null>(null);
  const [h] = useState(() => delayRender('particles ' + variant, {timeoutInMilliseconds: 120000}));
  if (!ready) load(variant).then((r) => { setReady(r); continueRender(h); });
  useFonts();
  useMono();
  const v = VARIANTS[variant];
  const t = frame / OPTS.fps;
  // the sharp hold: the card itself (DOM, same components as the PNG layers), texts change here
  if (t >= holdStart(v) && t < v.phases[1].dep0) return <CardFull st={stateAt(v, t)} />;
  return (
    <canvas width={W} height={H} style={{width: W, height: H, display: 'block'}}
      ref={(c) => {
        if (!c || !ready) return;
        const s = t < v.phases[0].to ? ready.sys[0] : ready.sys[1];
        drawFrame(s, t, ready.buf, ready.img.data, OPTS);
        c.getContext('2d')!.putImageData(ready.img, 0, 0);
      }} />
  );
};
