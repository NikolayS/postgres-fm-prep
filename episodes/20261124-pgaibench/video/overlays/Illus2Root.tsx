import {Composition} from 'remotion';
import * as R from './Rows198';

// Compositions for illus-2's storyboard rows (scripts/items-illus2.ts). l9split198 and
// l5queue198 are registered in Root.tsx.
const FPS = 25;
const meta = ({props}: {props: {durationSec?: number}}) => ({durationInFrames: Math.round((props.durationSec ?? 5) * FPS)});
const C: [string, React.FC<any>][] = [
  ['r01clusters', R.R01Clusters], ['r02ddl', R.R02Ddl], ['r04bench', R.R04Bench], ['r05baseline', R.R05Baseline],
  ['r09restart', R.R09Restart], ['r10runs', R.R10Runs], ['r11locks', R.R11Locks], ['r12esc', R.R12Esc],
  ['r13safety', R.R13Safety], ['r13axes14', R.R13Axes14], ['r14sound', R.R14Sound], ['r17dblab', R.R17Dblab],
  ['r20replicas', R.R20Replicas], ['r30real', R.R30Real], ['r35agree', R.R35Agree], ['r36analyze', R.R36Analyze],
  ['l9setup198', R.L9Setup198],
];
export const Illus2Compositions: React.FC = () => (
  <>
    {C.map(([id, comp]) => <Composition key={id} id={id} component={comp} fps={FPS} width={1920} height={1080} durationInFrames={5 * FPS} calculateMetadata={meta} defaultProps={{durationSec: 5, beats: {}} as any} />)}
  </>
);
