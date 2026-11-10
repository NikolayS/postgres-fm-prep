import React from 'react';
import {Composition} from 'remotion';
import {Outro} from './Outro';
import {Outro3} from './Outro3';

// Same format as the v1 logo.mp4: 1920x1080, 25 fps, 22.72 s (568 frames).
export const Root: React.FC = () => (
  <>
    <Composition id="Outro" component={Outro} durationInFrames={568} fps={25} width={1920} height={1080} />
    <Composition id="Outro3" component={Outro3} durationInFrames={568} fps={25} width={1920} height={1080} />
  </>
);
