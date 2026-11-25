import React, {useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {buildSystem, drawFrame, H, makeBuffers, OPTS, W} from './particles-engine';
import {NAMES, P1, P2, scenes3} from './plans3';
import {GROUPS, Show198, type Grp} from './Show198';
import {camera, drawFx, type Samples} from './Fx';
import {EX_F, SW_F} from './show-timeline';
import {FPS} from './beats';
import {useFonts} from './common';
import {useMono} from './CardStill';

// Ep 198 intro A v3. Frames 0..SW_F-1: particles (cold open -> the show's first frame, landing
// on the hits); SW_F..EX_F-1: the show itself (DOM); EX_F..end: particles (the show's last
// frame -> the body). FX overlay and camera on top of all three. Inputs are raw RGBA (pi3/).
type Ready = {sys: ReturnType<typeof buildSystem>[]; buf: ReturnType<typeof makeBuffers>; img: ImageData; S: Samples};
let cache: Promise<Ready> | null = null;
const load = () =>
  (cache ??= (async () => {
    const im: Record<string, Uint8ClampedArray> = {};
    await Promise.all(NAMES.map(async (n) => { im[n] = new Uint8ClampedArray(await (await fetch(staticFile(`pi3/${n}.rgba`))).arrayBuffer()); }));
    const S = (await (await fetch(staticFile('pi3/fx-samples.json'))).json()) as Samples;
    const sc = scenes3(im);
    return {sys: [buildSystem(sc.co, sc.show0, P1), buildSystem(sc.ex, sc.body, P2)], buf: makeBuffers(true), img: new ImageData(W, H), S};
  })());

export const IntroA3: React.FC<{fx?: boolean}> = ({fx = true}) => {
  const f = useCurrentFrame();
  const [ready, setReady] = useState<Ready | null>(null);
  const [h] = useState(() => delayRender('intro3', {timeoutInMilliseconds: 180000}));
  if (!ready) load().then((r) => { setReady(r); continueRender(h); });
  useFonts();
  useMono();
  const t = f / FPS;
  const cam = fx ? camera(f) : {transform: undefined, bright: 1};
  const inShow = f >= SW_F && f < EX_F;
  return (
    <AbsoluteFill style={{background: '#0a0310', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: cam.transform, filter: cam.bright !== 1 ? `brightness(${cam.bright.toFixed(3)})` : undefined}}>
        {inShow ? <Show198 f={f} /> : (
          <canvas width={W} height={H} style={{position: 'absolute', inset: 0}}
            ref={(c) => {
              if (!c || !ready) return;
              drawFrame(f < SW_F ? ready.sys[0] : ready.sys[1], t, ready.buf, ready.img.data, OPTS);
              c.getContext('2d')!.putImageData(ready.img, 0, 0);
            }} />
        )}
        {fx && (
          <canvas width={W} height={H} style={{position: 'absolute', inset: 0}}
            ref={(c) => { if (c && ready) drawFx(c.getContext('2d')!, t, ready.S); }} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// inputs for the particles: frames 0..7 = the show's layers at SW_F (transparent), 8 = the whole
// show at SW_F, 9 = the whole show at EX_F
export const ShowLayers: React.FC = () => {
  const i = useCurrentFrame();
  useFonts();
  useMono();
  if (i < GROUPS.length) return <Show198 f={SW_F} only={GROUPS[i] as Grp} />;
  return <Show198 f={i === GROUPS.length ? SW_F : EX_F} />;
};
// the show alone, every frame (for the FX colour samples and for review)
export const ShowPlain: React.FC = () => {
  const f = useCurrentFrame();
  useFonts();
  useMono();
  return <Show198 f={Math.max(f, SW_F)} />;
};
