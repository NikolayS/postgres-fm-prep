import React from 'react';
import {Composition} from 'remotion';
import {OutroPrepared} from './OutroPrepared';
import {OutroForge} from './OutroForge';
import {OutroForge3} from './OutroForge3';

// Same format as the v1 logo.mp4: 1920x1080, 25 fps, 22.72 s (568 frames).
export const Root: React.FC = () => (
  <>
    <Composition id="OutroForge3" component={OutroForge3} durationInFrames={568} fps={25} width={1920} height={1080} />
    <Composition id="OutroForge" component={OutroForge} durationInFrames={568} fps={25} width={1920} height={1080} />
    <Composition id="OutroPrepared" component={OutroPrepared} durationInFrames={568} fps={25} width={1920} height={1080} />
  </>
);
