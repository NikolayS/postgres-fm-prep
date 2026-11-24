import React from 'react';
import {Composition} from 'remotion';
import {Outro198} from './Outro198';

// Same format as the v1 logo.mp4: 1920x1080, 25 fps, 22.72 s (568 frames).
export const Root: React.FC = () => (
  <>
    <Composition id="Outro198" component={Outro198} durationInFrames={568} fps={25} width={1920} height={1080} />
  </>
);
