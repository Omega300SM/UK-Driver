import type { BuiltScene } from './carPark';
import { buildCarPark } from './carPark';
import { buildTown } from './town';
import { buildMillTown } from './millTown';
import { buildDevon } from './devon';
import { DEVON } from './devonLayout';
import { MILL_TOWN } from './millTownLayout';
import { CAR_PARK } from './carParkLayout';
import { TOWN } from './townLayout';
import type { SceneLayout } from '../layout';

export type SceneId = 'carPark' | 'town' | 'millTown' | 'devon';

export const LAYOUTS: Record<SceneId, SceneLayout> = { carPark: CAR_PARK, town: TOWN, millTown: MILL_TOWN, devon: DEVON };

export function buildScene(id: SceneId): BuiltScene {
  return id === 'town' ? buildTown() : id === 'millTown' ? buildMillTown() : id === 'devon' ? buildDevon() : buildCarPark();
}
