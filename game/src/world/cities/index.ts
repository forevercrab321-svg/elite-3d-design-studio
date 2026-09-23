import type { CityDef } from '../city';
import { SCRAP_CITY } from './scrap';

/** Arena levels in campaign order; Scrap City (the story map) is also playable in the arena. */
export const CITIES: CityDef[] = [SCRAP_CITY];

export function cityById(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}
