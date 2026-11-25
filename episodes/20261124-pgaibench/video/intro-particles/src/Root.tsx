import React from 'react';
import {Composition} from 'remotion';
import {CardLayers, LAYER_ORDER} from './CardStill';
import {FPS, H, W} from './common';
import {Particles} from './Particles';
import {A, B} from './plans';
import {IntroA3, ShowLayers, ShowPlain} from './Intro3';
import {GROUPS} from './Show198';
import {LEN_F} from './show-timeline';

// IntroA3: ep 198 intro A v3 (the full show + particles). ShowLayers / ShowPlain: its inputs.
// CardLayers, IntroA, IntroB: the calm v2 (kept for reference).
export const Root: React.FC = () => (
  <>
    <Composition id="IntroA3" component={IntroA3} defaultProps={{fx: true}} durationInFrames={LEN_F} fps={FPS} width={W} height={H} />
    <Composition id="ShowLayers" component={ShowLayers} durationInFrames={GROUPS.length + 2} fps={FPS} width={W} height={H} />
    <Composition id="ShowPlain" component={ShowPlain} durationInFrames={LEN_F} fps={FPS} width={W} height={H} />
    <Composition id="CardLayers" component={CardLayers} defaultProps={{set: 'A1'}} durationInFrames={LAYER_ORDER.length + 2} fps={FPS} width={W} height={H} />
    <Composition id="IntroA" component={Particles} defaultProps={{variant: 'A' as const}} durationInFrames={Math.round(A.len * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="IntroB" component={Particles} defaultProps={{variant: 'B' as const}} durationInFrames={Math.round(B.len * FPS)} fps={FPS} width={W} height={H} />
  </>
);
