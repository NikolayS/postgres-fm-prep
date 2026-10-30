import React from 'react';
import {Composition} from 'remotion';
import {CardDial, CardNeon, CardShades} from './Cards';
import {FPS, H, W} from './common';

// Opening title cards, 13 s each (the compose title-card length).
export const Root: React.FC = () => (
  <>
    <Composition id="CardShades" component={CardShades} durationInFrames={13 * FPS + 10} fps={FPS} width={W} height={H} />
    <Composition id="CardNeon" component={CardNeon} durationInFrames={13 * FPS + 10} fps={FPS} width={W} height={H} />
    <Composition id="CardDial" component={CardDial} durationInFrames={13 * FPS + 10} fps={FPS} width={W} height={H} />
  </>
);
