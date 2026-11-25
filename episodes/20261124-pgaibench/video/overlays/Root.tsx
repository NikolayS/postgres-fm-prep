import {Composition} from 'remotion';
import {ShotCard} from './ShotCard';
import {NumberPop} from './NumberPop';
import {Band} from './Band';
import {FullCard} from './FullCard';
import {IntroCard} from './IntroCard';
import {HackingInsert} from './HackingInsert';
import {CenterChart} from './CenterChart';
import {ChartCard} from './ChartCard';
import {Band198, ShotCard198} from './Ep198';
import {Aaa198, Motif198, Dots198, Board198} from './Ep198v2';
import {L9Split198, L5Queue198} from './Flagship198';
import {BioBlock, HackBlock, CompareBlock, SimpleBlock, TrapBlock, DuelBlock, ScaleBlock} from './Blocks';

const FPS = 25;
const W = 1920;
const H = 1080;

// Every composition takes `durationSec` in its props; scripts/render-all.ts passes
// the per-overlay props and the duration is derived here.
const meta = ({props}: {props: {durationSec?: number}}) => ({durationInFrames: Math.round((props.durationSec ?? 5) * FPS)});

// Overlays are rendered with a transparent background (ProRes 4444) and
// composited onto the talk by the packager; see scripts/render-all.ts.
export const Root = () => (
  <>
    <Composition
      id="shot"
      component={ShotCard}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={5 * FPS}
      calculateMetadata={meta}
      defaultProps={{
        src: 'pgdump18-statistics.png',
        imageWidth: 2560,
        imageHeight: 1440,
        viewportWidth: 1280,
        rect: {x: 84, y: 230.39, width: 160, height: 22},
        chip: 'postgresql.org/docs/18/app-pgdump.html',
        zoom: 2.4,
        durationSec: 5.5,
      }}
    />
    <Composition
      id="number"
      component={NumberPop}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={4 * FPS}
      calculateMetadata={meta}
      defaultProps={{
        title: 'Covering-index query, buffer accesses',
        before: 3301,
        after: 34,
        beforeLabel: 'right after pg_restore',
        afterLabel: 'after VACUUM',
        footnote: 'PG 18.6, small test fixture (DBLab Forge). Buffers, not latency.',
        durationSec: 4,
      }}
    />
    <Composition
      id="band"
      component={Band}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={4 * FPS}
      calculateMetadata={meta}
      // No `sub` here: Remotion merges defaultProps into --props, so a default sub would leak into every strip.
      defaultProps={{kind: 'strip' as const, text: 'VACUUM ANALYZE after restore', durationSec: 5}}
    />
    <Composition
      id="full"
      component={FullCard}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={5 * FPS}
      calculateMetadata={meta}
      defaultProps={{prefix: "Editor's note:", text: '28 selected docs pages: 8 mention ANALYZE, 3 mention VACUUM.', durationSec: 5}}
    />
    <Composition
      id="intro"
      component={IntroCard}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={7 * FPS}
      calculateMetadata={meta}
      defaultProps={{name: 'Kirk Wolak', company: 'KiraSoft', photo: 'face-kirk.png', side: 'left' as const, facts: ['Co-host, Hacking Postgres series', 'GSoC mentor'], durationSec: 7}}
    />
    <Composition
      id="hacking"
      component={HackingInsert}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={7 * FPS}
      calculateMetadata={meta}
      defaultProps={{title: 'Hacking Postgres', sub: 'since Jan 2023', thumbs: ['thumbs/-UaAXJSTj6c.jpg'], shipped: [{cover: 'thumbs/WLoMpg8A4WU.jpg', session: 'Jan 2023', release: 'PostgreSQL 17'}], chip: 'youtube.com/@PostgresTV', durationSec: 7}}
    />
    <Composition
      id="center"
      component={CenterChart}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={12 * FPS}
      calculateMetadata={meta}
      defaultProps={{kind: 'bars' as const, title: 'Buffer accesses', bars: [{value: 3301, label: 'Restore only'}, {value: 3301, label: 'ANALYZE only'}, {value: 34, label: 'VACUUM ANALYZE'}], unit: 'buffers', durationSec: 12}}
    />
    <Composition id="chartcard" component={ChartCard as any} fps={FPS} width={W} height={H} durationInFrames={12 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 12} as any} />
    <Composition id="bio" component={BioBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="hack2" component={HackBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="compare" component={CompareBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="simple" component={SimpleBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="trap" component={TrapBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="duel" component={DuelBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="scale" component={ScaleBlock as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 10} as any} />
    <Composition id="band198" component={Band198 as any} fps={FPS} width={W} height={H} durationInFrames={7 * FPS} calculateMetadata={meta} defaultProps={{lines: ['Told not to restart: restarted in 5 of 5 runs'], durationSec: 7} as any} />
    <Composition id="aaa198" component={Aaa198 as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{part: 1, b: {analyst: 2, actor: 4, cr: 3, det: 5}, durationSec: 10} as any} />
    <Composition id="motif198" component={Motif198 as any} fps={FPS} width={W} height={H} durationInFrames={8 * FPS} calculateMetadata={meta} defaultProps={{text: 'x', lit: 'actor-prod', durationSec: 8} as any} />
    <Composition id="dots198" component={Dots198 as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{b: {gate: 2, auditor: 4, stamp: 5, no: 6, left: 6.5, hero: 8}, durationSec: 10} as any} />
    <Composition id="board198" component={Board198 as any} fps={FPS} width={W} height={H} durationInFrames={10 * FPS} calculateMetadata={meta} defaultProps={{b: {tie: 3, fable: 5, harm: 6}, durationSec: 10} as any} />
    <Composition id="shot198" component={ShotCard198 as any} fps={FPS} width={W} height={H} durationInFrames={12 * FPS} calculateMetadata={meta} defaultProps={{shot: {src: 'ep198/fig-track1.png', w: 902, h: 480, url: 'postgres.ai/blog/20261123-pgaibench'}, durationSec: 12} as any} />
    <Composition id="l9split198" component={L9Split198 as any} fps={FPS} width={W} height={H} durationInFrames={29 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 29, beats: {idx: {at: 6.1}, noone: {at: 19.1}, drop: {at: 21.14}, crash: {at: 22.86}, x18: {at: 24.5}}} as any} />
    <Composition id="l5queue198" component={L5Queue198 as any} fps={FPS} width={W} height={H} durationInFrames={17 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 17, beats: {green: {at: 3.06}, go: {at: 6.46}}} as any} />
  </>
);
