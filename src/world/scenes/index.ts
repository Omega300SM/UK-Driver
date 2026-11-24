import type { BuiltScene } from './carPark';
import { buildCarPark } from './carPark';
import { buildTown } from './town';
import { buildMillTown } from './millTown';
import { MILL_TOWN } from './millTownLayout';
import { CAR_PARK } from './carParkLayout';
import { TOWN } from './townLayout';
import type { SceneLayout } from '../layout';

export type SceneId = 'carPark' | 'town' | 'millTown';

export const LAYOUTS: Record<SceneId, SceneLayout> = { carPark: CAR_PARK, town: TOWN, millTown: MILL_TOWN };

export function buildScene(id: SceneId): BuiltScene {
  return id === 'town' ? buildTown() : id === 'millTown' ? buildMillTown() : buildCarPark();
}
