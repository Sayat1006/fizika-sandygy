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


/** Тәжірибе конфигурациясына сәйкес 3D қондырғыны ортақ сахнаға орналастырады. */
export default function SceneHost({ def, sim }: { def: ExperimentDef; sim: Simulation }) {
  const find = (key: string) => def.params.find((p) => p.key === key);
  const angle = find('angle');
  const view = { spring: springView, surface: surfaceView(!!angle && angle.max > angle.min), archimedes: archimedesView, track: trackView }[def.scene];
  return (
    <LabStage view={view}>
      {def.scene === 'spring' && <SpringScene sim={sim as SpringSim} />}
      {def.scene === 'surface' && <SurfaceScene sim={sim as PullSim} angleDef={find('angle')} />}
      {def.scene === 'archimedes' && <ArchimedesScene sim={sim as BuoyancySim} />}
      {def.scene === 'track' && <TrackScene sim={sim as TrackSim} startDef={find('start')!} />}
    </LabStage>
  );
}
