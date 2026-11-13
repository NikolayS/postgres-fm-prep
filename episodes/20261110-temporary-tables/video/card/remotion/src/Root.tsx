import React from 'react';
import {Composition} from 'remotion';
import {CardCrazy} from './Crazy';
import {CardCrazy2} from './Crazy2';
import {CardCrazy3} from './Crazy3';
import {CardCrazy4} from './Crazy4';
import {CardCrazy5} from './Crazy5';
import {CardCrazy6} from './Crazy6';
import {CardCrazy6a} from './Crazy6a';
import {CardCrazy8} from './Crazy8';
import {CardCrazy9} from './Crazy9';
import {C7_SECONDS, CardCrazy7} from './Crazy7';
import {FPS, H, W} from './common';

export const Root: React.FC = () => (
  <>
    <Composition id="CardCrazy" component={CardCrazy} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy9" component={CardCrazy9} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy8" component={CardCrazy8} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy7" component={CardCrazy7} durationInFrames={C7_SECONDS * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy6a" component={CardCrazy6a} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy6" component={CardCrazy6} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy5" component={CardCrazy5} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy4" component={CardCrazy4} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy3" component={CardCrazy3} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy2" component={CardCrazy2} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
  </>
);
