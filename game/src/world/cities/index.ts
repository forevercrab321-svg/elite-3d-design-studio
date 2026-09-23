import type { CityDef } from '../city';
import { NEW_YORK } from './newyork';
import { PARIS } from './paris';
import { SCRAP_CITY } from './scrap';
import { SHANGHAI } from './shanghai';

/** Arena levels in campaign order (Shanghai → New York → Paris); Scrap City is the bonus map. */
export const CITIES: CityDef[] = [SHANGHAI, NEW_YORK, PARIS, SCRAP_CITY];

export function cityById(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}
