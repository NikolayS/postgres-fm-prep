import React from 'react';
import {Composition} from 'remotion';
import {Card198} from './Card198';
import {FPS, H, W} from './common';

// Card198: the ep 198 card (14 s, final hit on beat 24; compose --card 13).
export const Root: React.FC = () => (
  <>
    <Composition id="Card198" component={Card198} durationInFrames={14 * FPS} fps={FPS} width={W} height={H} />
  </>
);
