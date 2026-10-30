import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

type Rect = {x: number; y: number; width: number; height: number};
export type ShotCardProps = {
  src: string; // file in public/, captured by scripts/capture.ts
  imageWidth: number; // natural pixel size of the capture
  imageHeight: number;
  viewportWidth: number; // CSS viewport width used at capture time
  rect: Rect; // target line or paragraph, CSS px
  column?: Rect; // content column (whole lines live inside it), CSS px; x/width are used
  chip: string; // source URL shown top-left ("connection to reality")
  zoom: number; // push-in scale cap
  note?: string; // optional strip under the image (Editor's note), shown after the sweep
  notePrefix?: string;
  durationSec?: number;
};

// Full-screen "real screenshot" card: wide page first, then an eased push-in that
// frames the content column (no line cut at the sides) with the target block at the
// top, then a highlighter sweep across the target. Talk continues underneath.
export const ShotCard: React.FC<ShotCardProps> = ({src, imageWidth, imageHeight, viewportWidth, rect, column, chip, zoom, note, notePrefix}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();

  const inset = note ? {w: 1760, h: 860, x: 80, y: 40} : {w: 1760, h: 990, x: 80, y: 45};
  const noteIn = interpolate(frame, [2.6 * fps, 2.9 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const k = inset.w / imageWidth; // image px -> card px
  const css = (imageWidth / viewportWidth) * k; // CSS px -> card px
  const r = {x: rect.x * css, y: rect.y * css, w: rect.width * css, h: rect.height * css};
  const col = column ? {x: column.x * css, w: column.width * css} : {x: r.x, w: r.w};
  const pad = 28; // side padding inside the card
  const topPad = 104; // target block starts below the URL chip

  // Final framing: the column fits the card width, the target block starts near the top.
  const s1 = Math.min(zoom, (inset.w - 2 * pad) / col.w);
  const tx1 = inset.w / 2 - (col.x + col.w / 2) * s1;
  const ty1 = Math.min(0, -(r.y - topPad) * s1);
  // Keep the page bottom from showing an empty gap.
  const tyMin = inset.h - imageHeight * k * s1;
  const ty1c = Math.max(ty1, Math.min(0, tyMin));

  const fadeIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const opacity = Math.min(fadeIn, fadeOut);

  const pushStart = 0.8 * fps;
  const pushEnd = 1.8 * fps;
  const ease = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.inOut(Easing.cubic)};
  const s = interpolate(frame, [pushStart, pushEnd], [1, s1], ease);
  const tx = interpolate(frame, [pushStart, pushEnd], [0, tx1], ease);
  const ty = interpolate(frame, [pushStart, pushEnd], [0, ty1c], ease);

  const sweepStart = 2.0 * fps;
  const sweep = interpolate(frame, [sweepStart, sweepStart + 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  return (
    <AbsoluteFill style={{opacity, fontFamily: 'Inter, sans-serif'}}>
      <AbsoluteFill style={{background: 'rgba(8,8,10,0.92)'}} />
      <div
        style={{
          position: 'absolute',
          left: inset.x,
          top: inset.y,
          width: inset.w,
          height: inset.h,
          overflow: 'hidden',
          borderRadius: 14,
          background: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: inset.w,
            height: imageHeight * k,
            transform: `translate(${tx}px, ${ty}px) scale(${s})`,
            transformOrigin: '0 0',
          }}
        >
          <Img src={staticFile(src)} style={{width: inset.w, height: imageHeight * k, display: 'block'}} />
          <div
            style={{
              position: 'absolute',
              left: r.x - 6,
              top: r.y - 3,
              width: (r.w + 12) * sweep,
              height: r.h + 6,
              background: 'rgba(255, 214, 0, 0.45)',
              borderRadius: 3,
              mixBlendMode: 'multiply',
            }}
          />
        </div>
        {/* Soft edges top and bottom so a partial line reads as a fade, not a cut. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 96, background: 'linear-gradient(to top, rgba(255,255,255,0), #fff 70%)', opacity: interpolate(frame, [pushStart, pushEnd], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: inset.x + 24,
          top: inset.y + 20,
          padding: '8px 16px',
          background: '#111',
          color: '#fff',
          fontSize: 28,
          fontWeight: 600,
          borderRadius: 6,
          letterSpacing: 0.2,
        }}
      >
        {chip}
      </div>
      {note ? (
        <div style={{position: 'absolute', left: 80, top: inset.y + inset.h + 22, width: 1760, display: 'flex', justifyContent: 'center', opacity: noteIn}}>
          <div style={{background: '#111', color: '#fff', fontSize: 34, fontWeight: 600, lineHeight: 1.3, padding: '14px 28px', borderRadius: 10, maxWidth: 1700, textAlign: 'center'}}>
            {notePrefix ? <span style={{color: '#FFD23F', marginRight: 14}}>{notePrefix}</span> : null}
            {note}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
