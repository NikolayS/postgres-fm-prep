import React from 'react';
import {Composition} from 'remotion';
import {CardCrazy} from './Crazy';
import {FPS, H, W} from './common';

export const Root: React.FC = () => (
  <Composition id="CardCrazy" component={CardCrazy} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
);
