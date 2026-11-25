import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Dyn} from './Dyn';
import {END, FPS} from '../spec';

const Root: React.FC = () => (
  <>
    {(['bold', 'medium', 'restrained'] as const).map((v) => (
      <Composition key={v} id={`Dyn-${v}`} component={Dyn} defaultProps={{variant: v}} durationInFrames={END} fps={FPS} width={1920} height={1080} />
    ))}
  </>
);
registerRoot(Root);
