import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {font} from './font';
import {cardSvg, PANEL} from './card-svg';
import type {Card} from '../../cards/card';

// Chart-first data card (composition "chartcard"). Props = one <episode>/cards/<id>.card.json
// plus durationSec. The picture is cardSvg(), the same SVG the contact sheet and the cheat
// sheet show. Placement "center": the hosts move to the right-hand column; the panel is frame
// x 40-1600, y 250-890 and a short shadow to y 900, so nothing is in the bottom 180 px. scripts/render-all.ts runs the
// provenance gate (cards/) before it renders a card.
export const ChartCard: React.FC<Card & {durationSec: number}> = (p) => {
  font();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const k = spring({frame: frame - 0.15 * fps, fps, config: {damping: 16, stiffness: 160, mass: 0.7}});
  const fadeOut = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  // The chart and heroes are uncovered from left to right after the headline is up.
  const reveal = interpolate(frame, [0.6 * fps, 1.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const top = 150;
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, opacity: k, transform: `scale(${0.97 + 0.03 * k})`, borderRadius: 20, boxShadow: '0 2px 8px rgba(61,15,69,0.25)', overflow: 'hidden'}}>
        <div dangerouslySetInnerHTML={{__html: cardSvg(p)}} />
        <div style={{position: 'absolute', top, height: PANEL.h - top, right: 0, width: `${(1 - reveal) * 100}%`, background: '#fdfdfe'}} />
      </div>
    </AbsoluteFill>
  );
};
