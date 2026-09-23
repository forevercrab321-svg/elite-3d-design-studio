import { GOLDEN_HOUR } from '../../art/environment';
import { buildCity } from '../architecture';
import type { CityDef } from '../city';
import { CLUSTERS, CURB_HEIGHT, PLACEMENTS, SPAWN, STATIC_BLOCKS, WORLD_BOUNDS, groundHeight } from '../scrapCity';

const TREES: [number, number][] = [
  [-30, -11.2], [-18, -11.2], [-6, -11.2], [6, -11.2], [18, -11.2], [30, -11.2],
  [-30, -38.5], [-20, -38.5], [-10, -38.5], [10, -38.5], [20, -38.5], [30, -38.5],
  [-34, -18], [-34, -28], [34, -18], [34, -28],
];

/** Scrap City: the story-mode map (alley → street → lot → site → yard → warehouse). */
export const SCRAP_CITY: CityDef = {
  id: 'scrap',
  name: 'Scrap City',
  nameZh: '废料城',
  tagline: 'The alley where it all starts',
  level: 0,
  palette: GOLDEN_HOUR,
  bounds: WORLD_BOUNDS,
  staticBlocks: STATIC_BLOCKS,
  placements: PLACEMENTS,
  clusters: CLUSTERS,
  groundHeight,
  spawn: SPAWN,
  spawns: [
    { x: 0, z: 32, heading: 0 },
    { x: -40, z: -30, heading: -Math.PI / 2 },
    { x: 40, z: -30, heading: Math.PI / 2 },
    { x: 0, z: -118, heading: Math.PI },
  ],
  build: (lib) => buildCity(lib),
  dressing: { trees: TREES.map(([x, z]) => ({ x, z, y: z > -12.1 && z < -9.4 ? CURB_HEIGHT : 0 })), scrapAlley: true },
  climaxName: 'the warehouse',
  climaxNameZh: '仓库',
};
