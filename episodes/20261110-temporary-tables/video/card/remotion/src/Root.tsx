import React from 'react';
import {Composition} from 'remotion';
import {CardCrazy} from './Crazy';
import {CardCrazy2} from './Crazy2';
import {CardCrazy3} from './Crazy3';
import {CardCrazy4} from './Crazy4';
import {CardCrazy5} from './Crazy5';
import {CardCrazy6} from './Crazy6';
import {FPS, H, W} from './common';

export const Root: React.FC = () => (
  <>
    <Composition id="CardCrazy" component={CardCrazy} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy6" component={CardCrazy6} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy5" component={CardCrazy5} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy4" component={CardCrazy4} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy3" component={CardCrazy3} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
    <Composition id="CardCrazy2" component={CardCrazy2} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
  </>
);
