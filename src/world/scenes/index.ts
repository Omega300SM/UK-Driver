import type { BuiltScene } from './carPark';
import { buildCarPark } from './carPark';
import { buildTown } from './town';
import { CAR_PARK } from './carParkLayout';
import { TOWN } from './townLayout';
import type { SceneLayout } from '../layout';

export type SceneId = 'carPark' | 'town';

export const LAYOUTS: Record<SceneId, SceneLayout> = { carPark: CAR_PARK, town: TOWN };

export function buildScene(id: SceneId): BuiltScene {
  return id === 'town' ? buildTown() : buildCarPark();
}
