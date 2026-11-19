import type { ExperimentDef } from '../data/types';
import type { BuoyancySim } from '../engines/simulation/buoyancy';
import type { PullSim } from '../engines/simulation/pull';
import type { SpringSim } from '../engines/simulation/spring';
import type { TrackSim } from '../engines/simulation/track';
import type { Simulation } from '../engines/simulation/types';
import LabStage from './LabStage';
import ArchimedesScene, { archimedesView } from './scenes/ArchimedesScene';
import SpringScene, { springView } from './scenes/SpringScene';
import SurfaceScene, { surfaceView } from './scenes/SurfaceScene';
import TrackScene, { trackView } from './scenes/TrackScene';
import PendulumScene, { pendulumView } from './scenes/PendulumScene';
import LeverScene, { leverView } from './scenes/LeverScene';
import CircuitScene, { circuitView } from './scenes/CircuitScene';
import LensScene, { lensView } from './scenes/LensScene';
import RefractionScene, { refractionView } from './scenes/RefractionScene';
import type { PendulumSim } from '../engines/simulation/pendulum';
import type { LeverSim } from '../engines/simulation/lever';
import type { CircuitSim } from '../engines/simulation/circuit';
import type { LensSim } from '../engines/simulation/lens';
import type { RefractionSim } from '../engines/simulation/refraction';


/** Тәжірибе конфигурациясына сәйкес 3D қондырғыны ортақ сахнаға орналастырады. */
export default function SceneHost({ def, sim }: { def: ExperimentDef; sim: Simulation }) {
  const find = (key: string) => def.params.find((p) => p.key === key);
  const angle = find('angle');
  const view = { spring: springView, surface: surfaceView(!!angle && angle.max > angle.min), archimedes: archimedesView, track: trackView, pendulum: pendulumView, lever: leverView, circuit: circuitView, lens: lensView, refraction: refractionView }[def.scene];
  return (
    <LabStage view={view}>
      {def.scene === 'spring' && <SpringScene sim={sim as SpringSim} />}
      {def.scene === 'surface' && <SurfaceScene sim={sim as PullSim} angleDef={find('angle')} />}
      {def.scene === 'archimedes' && <ArchimedesScene sim={sim as BuoyancySim} />}
      {def.scene === 'track' && <TrackScene sim={sim as TrackSim} startDef={find('start')!} />}
      {def.scene === 'pendulum' && <PendulumScene sim={sim as PendulumSim} />}
      {def.scene === 'lever' && <LeverScene sim={sim as LeverSim} />}
      {def.scene === 'circuit' && <CircuitScene sim={sim as CircuitSim} />}
      {def.scene === 'lens' && <LensScene sim={sim as LensSim} />}
      {def.scene === 'refraction' && <RefractionScene sim={sim as RefractionSim} />}
    </LabStage>
  );
}
