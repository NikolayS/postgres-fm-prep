import {Composition} from 'remotion';
import {ShotCard} from './ShotCard';
import {NumberPop} from './NumberPop';
import {Band} from './Band';
import {FullCard} from './FullCard';
import {IntroCard} from './IntroCard';
import {HackingInsert} from './HackingInsert';

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
      defaultProps={{kind: 'lower' as const, name: 'Kirk Wolak', sub: 'co-host of the Postgres hacking sessions', durationSec: 5}}
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
  </>
);
