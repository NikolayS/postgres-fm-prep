// Typing schedule for the UUID lines (card 01, typing version). Each hex group is one burst
// typed at CPS characters per second; the hyphen before a group is typed with it. A short
// pause separates groups. Shared by the component and the script that writes the bursts JSON.
export const CPS = 30;
export const GAP = 0.2; // pause between groups, s
export const LEAD = 0.35; // from the strip popping in to the first key, s
export type Burst = {start: number; end: number; chars: number; from: number}; // from: index of the first char
export const bursts = (id: string, lineAt: number): Burst[] => {
  const groups = id.split('-');
  const out: Burst[] = [];
  let t = lineAt + LEAD;
  let from = 0;
  groups.forEach((g, i) => {
    const chars = g.length + (i ? 1 : 0);
    const end = t + chars / CPS;
    out.push({start: t, end, chars, from});
    from += chars;
    t = end + GAP;
  });
  return out;
};
// Characters typed by time t (fractional chars are floored).
export const typedAt = (bs: Burst[], t: number) => {
  let n = 0;
  for (const b of bs) {
    if (t >= b.end) n = b.from + b.chars;
    else if (t > b.start) return b.from + Math.floor((t - b.start) * CPS);
    else return n;
  }
  return n;
};

// Text lines (band strips): one burst per sentence; a sentence break gets a longer pause.
export const SENT_GAP = 0.35;
export const textBursts = (text: string, at: number): Burst[] => {
  const parts = text.match(/[^.!?]+[.!?]*["”]?\s*/g) ?? [text];
  const out: Burst[] = [];
  let t = at, from = 0;
  for (const part of parts) {
    const chars = part.length;
    const end = t + chars / CPS;
    out.push({start: t, end, chars, from});
    from += chars;
    t = end + SENT_GAP;
  }
  return out;
};
