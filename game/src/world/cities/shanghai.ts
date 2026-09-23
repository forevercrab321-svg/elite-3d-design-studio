import * as THREE from 'three';
import type { Palette } from '../../art/environment';
import type { Placement } from '../scrapCity';
import { makeCity } from './cityKit';

/** Humid late afternoon over the Huangpu: soft warm sun, milky haze, a light cloud deck. */
const SHANGHAI_HAZE: Palette = {
  sunDirection: new THREE.Vector3(0.5, 0.42, -0.62).normalize(),
  sunColor: new THREE.Color(0xfff0dc),
  sunIntensity: 3.1,
  sky: { top: new THREE.Color(0x5f88b8), mid: new THREE.Color(0xa9c1d6), horizon: new THREE.Color(0xe6dccb), ground: new THREE.Color(0x5a5650), sun: new THREE.Color(0xfff4e0) },
  clouds: 0.08,
  fog: new THREE.Color(0xcfd2cc),
  fogNear: 90,
  fogFar: 480,
  hemiSky: new THREE.Color(0xc9d3dc),
  hemiGround: new THREE.Color(0x6e665c),
  hemiIntensity: 0.85,
  envIntensity: 1.05,
};

/**
 * Oriental Pearl Tower (1:5): three columns with raking legs → lower sphere → shaft with the
 * small pearls → upper sphere → space module and mast. Pull a column and the tower above
 * collapses toward it.
 */
function pearlTower(): Placement[] {
  const out: Placement[] = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
    out.push({ type: 'PEARL_LEG', x: Math.cos(a) * 4.5, z: Math.sin(a) * 4.5, yaw: Math.atan2(Math.cos(a), Math.sin(a)), tag: `pl${i}` });
  }
  out.push({ type: 'PEARL_SPHERE_LOW', x: 0, z: 0, y: 15.1, tag: 'ps0', supports: ['pl0', 'pl1', 'pl2'] });
  out.push({ type: 'PEARL_SHAFT', x: 0, z: 0, y: 25.1, tag: 'psh', supports: ['ps0'] });
  out.push({ type: 'PEARL_SPHERE_UP', x: 0, z: 0, y: 51.1, tag: 'ps1', supports: ['psh'] });
  out.push({ type: 'PEARL_TOP', x: 0, z: 0, y: 59.1, supports: ['ps1'] });
  return out;
}

export const SHANGHAI = makeCity({
  id: 'shanghai',
  name: 'Shanghai',
  nameZh: '上海',
  tagline: 'Shikumen lanes around the Pearl',
  level: 1,
  palette: SHANGHAI_HAZE,
  seed: 1021,
  climaxName: 'the Oriental Pearl Tower',
  climaxNameZh: '东方明珠',
  landmark: pearlTower,
  houses: ['B_SHIKUMEN', 'B_SHIKUMEN', 'B_SHIKUMEN'],
  blocks: ['B_SH_MID'],
  cars: ['TAXI_SH', 'TAXI_SH', 'CAR_COMPACT', 'CAR_COMPACT', 'VAN', 'SCOOTER'],
  bigVehicles: ['BUS_SH', 'DELIVERY_TRUCK'],
  furniture: ['SCOOTER', 'SCOOTER', 'BICYCLE', 'BICYCLE', 'TRASH_CAN', 'VENDING_MACHINE', 'BENCH', 'UTILITY_BOX'],
  perimeter: { materials: ['concrete', 'plaster', 'darkBrick'], h: [22, 48] },
  // Pudong across the river: the supertall trio.
  skyline: {
    n: 70,
    h: [40, 130],
    heroes: [
      { x: 260, z: -40, w: 44, h: 330, taper: 0.55, kind: 'twist' },
      { x: 300, z: 30, w: 40, h: 250, kind: 'opener' },
      { x: 250, z: 70, w: 34, h: 215, kind: 'pagoda' },
      { x: 330, z: -120, w: 30, h: 160, taper: 0.9 },
      { x: 240, z: 160, w: 30, h: 140, taper: 0.9 },
    ],
  },
  centreLine: 'yellow',
  parkGround: 'sidewalk',
  treeCrown: 0.9,
  waterfront: 'east',
  lanterns: true,
  // The Bund along the river: Customs House clock tower and the Peace Hotel face Zhongshan Road.
  extras: [
    { type: 'CUSTOMS_HOUSE', x: 75.4, z: -30, yaw: Math.PI / 2 },
    { type: 'PEACE_HOTEL', x: 74.4, z: 30, yaw: Math.PI / 2 },
  ],
});
