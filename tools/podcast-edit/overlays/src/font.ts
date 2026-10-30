import {continueRender, delayRender, staticFile} from 'remotion';

// Inter (OFL) static weights from public/fonts; loaded once per render process.
const WEIGHTS: Array<[string, string, string]> = [
  ['Inter', '400', 'Inter-Regular.ttf'],
  ['Inter', '500', 'Inter-Medium.ttf'],
  ['Inter', '600', 'Inter-SemiBold.ttf'],
  ['Inter', '700', 'Inter-Bold.ttf'],
  ['JetBrains Mono', '400', 'JetBrainsMono-Regular.ttf'],
  ['JetBrains Mono', '500', 'JetBrainsMono-Medium.ttf'],
];
let loaded = false;
export const font = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('load Inter');
  Promise.all(
    WEIGHTS.map(([family, weight, file]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {weight}).load().then((f) => document.fonts.add(f)),
    ),
  ).finally(() => continueRender(handle));
};
