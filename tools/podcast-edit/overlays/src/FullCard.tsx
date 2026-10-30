import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {font} from './font';

export type FullCardProps = {
  image?: string; // file in public/ (our own published chart), fitted into the card
  imageWidth?: number;
  imageHeight?: number;
  chip?: string; // source label top-left
  prefix?: string; // e.g. "Editor's note:"
  text?: string; // one or two lines, wrapped
  durationSec: number;
};

// Full-screen card: dims the talk, shows an optional image and a note line.
export const FullCard: React.FC<FullCardProps> = ({image, imageWidth, imageHeight, chip, prefix, text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const pop = spring({frame, fps, config: {damping: 14, stiffness: 160, mass: 0.6}});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const noteIn = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const hasImg = Boolean(image && imageWidth && imageHeight);
  const box = {w: 1760, h: hasImg ? 830 : 0};
  const fit = hasImg ? Math.min(box.w / (imageWidth as number), box.h / (imageHeight as number)) : 0;
  const iw = hasImg ? (imageWidth as number) * fit : 0;
  const ih = hasImg ? (imageHeight as number) * fit : 0;

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <AbsoluteFill style={{background: 'rgba(8,8,10,0.78)', opacity: pop}} />
      <div style={{position: 'absolute', left: 80, top: hasImg ? 60 : 380, width: 1760, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: `scale(${0.94 + 0.06 * pop})`, opacity: pop}}>
        {hasImg ? (
          <div style={{position: 'relative', width: iw, height: ih, borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile(image as string)} style={{width: iw, height: ih, display: 'block'}} />
            {chip ? <div style={{position: 'absolute', left: 20, top: 16, padding: '6px 14px', background: '#111', color: '#fff', fontSize: 26, fontWeight: 600, borderRadius: 6}}>{chip}</div> : null}
          </div>
        ) : null}
        {text ? (
          <div style={{opacity: noteIn, background: '#111', color: '#fff', fontSize: hasImg ? 36 : 46, fontWeight: 600, lineHeight: 1.3, padding: '18px 32px', borderRadius: 10, maxWidth: 1700, textAlign: 'center'}}>
            {prefix ? <span style={{color: '#FFD23F', marginRight: 14}}>{prefix}</span> : null}
            {text}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
