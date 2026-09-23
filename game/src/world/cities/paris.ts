import * as THREE from 'three';
import type { Palette } from '../../art/environment';
import type { Placement } from '../scrapCity';
import { makeCity } from './cityKit';

/** Paris at golden sunset: low amber sun, lilac sky, warm stone. */
const PARIS_SUNSET: Palette = {
  sunDirection: new THREE.Vector3(-0.7, 0.25, -0.5).normalize(),
  sunColor: new THREE.Color(0xffb97a),
  sunIntensity: 3.0,
  sky: { top: new THREE.Color(0x46609a), mid: new THREE.Color(0xb3a6c0), horizon: new THREE.Color(0xf6c49a), ground: new THREE.Color(0x5d5249), sun: new THREE.Color(0xffe2b8) },
  clouds: 0.02,
  fog: new THREE.Color(0xe0c8b0),
  fogNear: 90,
  fogFar: 500,
  hemiSky: new THREE.Color(0xcdc4d6),
  hemiGround: new THREE.Color(0x7a6450),
  hemiIntensity: 1.0,
  envIntensity: 1.05,
};

/** Eiffel Tower (1:5): four lattice legs → first floor → second stage → upper tower → summit. */
function eiffel(): Placement[] {
  const out: Placement[] = [];
  const legs = [[1, 1], [-1, -1], [1, -1], [-1, 1]] as const;
  legs.forEach(([sx, sz], i) => {
    const yaw = Math.atan2((sz - sx) / 2, -(sx + sz) / 2);
    out.push({ type: 'EIFFEL_LEG', x: sx * 9.5, z: sz * 9.5, yaw, tag: `el${i}` });
  });
  out.push({ type: 'EIFFEL_DECK', x: 0, z: 0, y: 12.1, tag: 'ed', supports: ['el0', 'el1', 'el2', 'el3'] });
  out.push({ type: 'EIFFEL_MID', x: 0, z: 0, y: 14.3, tag: 'em', supports: ['ed'] });
  out.push({ type: 'EIFFEL_UPPER', x: 0, z: 0, y: 26.3, tag: 'eu', supports: ['em'] });
  out.push({ type: 'EIFFEL_TOP', x: 0, z: 0, y: 56.3, supports: ['eu'] });
  return out;
}

export const PARIS = makeCity({
  id: 'paris',
  name: 'Paris',
  nameZh: '巴黎',
  tagline: 'Haussmann boulevards under the Eiffel Tower',
  level: 3,
  palette: PARIS_SUNSET,
  seed: 3141,
  climaxName: 'the Eiffel Tower',
  climaxNameZh: '埃菲尔铁塔',
  landmark: eiffel,
  houses: ['B_PARIS_CAFE', 'B_PARIS_CAFE'],
  blocks: ['B_HAUSSMANN', 'B_HAUSSMANN'],
  cars: ['CAR_COMPACT', 'CAR_COMPACT', 'CAR_COMPACT', 'TAXI_PA', 'VAN', 'SCOOTER'],
  bigVehicles: ['BUS_PA', 'DELIVERY_TRUCK'],
  furniture: ['KIOSK', 'CAFE_TABLE', 'CAFE_TABLE', 'CHAIR', 'BICYCLE', 'BENCH', 'MORRIS_COLUMN', 'SCOOTER'],
  perimeter: { materials: ['plaster', 'plaster', 'concrete'], h: [20, 26] },
  skyline: {
    n: 60,
    h: [18, 30],
    heroes: [
      { x: -210, z: 260, w: 32, h: 140, taper: 0.95 },
      { x: 330, z: -170, w: 56, h: 56, kind: 'arch' },
      { x: 370, z: -230, w: 30, h: 170, taper: 0.9 },
      { x: 390, z: -120, w: 26, h: 130, taper: 0.9 },
    ],
  },
  centreLine: 'white',
  parkGround: 'gravel',
  treeCrown: 1.3,
  // The Arc de Triomphe straddles the west boulevard (drive through the arch); Métro entrances.
  extras: [
    { type: 'ARC_PIER', x: -76, z: -6, yaw: Math.PI / 2, tag: 'arcA' },
    { type: 'ARC_PIER', x: -76, z: 6, yaw: Math.PI / 2, tag: 'arcB' },
    { type: 'ARC_ATTIC', x: -76, z: 0, y: 13.5, yaw: Math.PI / 2, supports: ['arcA', 'arcB'] },
    { type: 'METRO_ENTRANCE', x: 12.6, z: 62, yaw: 0 },
    { type: 'METRO_ENTRANCE', x: -12.6, z: -62, yaw: Math.PI },
  ],
});
