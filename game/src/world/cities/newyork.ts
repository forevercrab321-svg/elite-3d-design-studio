import * as THREE from 'three';
import type { Palette } from '../../art/environment';
import type { Placement } from '../scrapCity';
import { makeCity } from './cityKit';

/** Crisp clear Manhattan morning: high white sun, deep blue sky, long clean shadows. */
const NY_MORNING: Palette = {
  sunDirection: new THREE.Vector3(0.55, 0.55, 0.45).normalize(),
  sunColor: new THREE.Color(0xfff6e8),
  sunIntensity: 3.6,
  sky: { top: new THREE.Color(0x2f66b8), mid: new THREE.Color(0x7fb0e0), horizon: new THREE.Color(0xd9e6f0), ground: new THREE.Color(0x4d5157), sun: new THREE.Color(0xfffaf0) },
  clouds: -0.05,
  fog: new THREE.Color(0xc9d6e2),
  fogNear: 110,
  fogFar: 560,
  hemiSky: new THREE.Color(0xc4d4e8),
  hemiGround: new THREE.Color(0x5e5a55),
  hemiIntensity: 0.8,
  envIntensity: 1.1,
};

/** Empire State Building (1:5): limestone podium halves → lower tower → setbacks → crown and mast. */
function empireState(): Placement[] {
  return [
    { type: 'ESB_PODIUM', x: -6.5, z: 0, yaw: Math.PI / 2, tag: 'ep0' },
    { type: 'ESB_PODIUM', x: 6.5, z: 0, yaw: -Math.PI / 2, tag: 'ep1' },
    { type: 'ESB_SHAFT_LOW', x: 0, z: 0, y: 13.2, tag: 'es0', supports: ['ep0', 'ep1'] },
    { type: 'ESB_SHAFT_HIGH', x: 0, z: 0, y: 43.2, tag: 'es1', supports: ['es0'] },
    { type: 'ESB_CROWN', x: 0, z: 0, y: 65.2, supports: ['es1'] },
  ];
}

export const NEW_YORK = makeCity({
  id: 'newyork',
  name: 'New York',
  nameZh: '纽约',
  tagline: 'Brownstones, cabs and the Empire State',
  taglineZh: '褐石公寓、黄色出租车和帝国大厦',
  level: 2,
  palette: NY_MORNING,
  seed: 2112,
  climaxName: 'the Empire State Building',
  climaxNameZh: '帝国大厦',
  landmark: empireState,
  houses: ['B_BROWNSTONE', 'B_BROWNSTONE', 'B_BROWNSTONE'],
  blocks: ['B_NY_LOFT'],
  cars: ['TAXI_NY', 'TAXI_NY', 'TAXI_NY', 'CAR_COMPACT', 'VAN'],
  bigVehicles: ['BUS_NY', 'DELIVERY_TRUCK'],
  furniture: ['FOOD_CART', 'TRASH_CAN', 'FIRE_HYDRANT', 'FIRE_HYDRANT', 'BICYCLE', 'UTILITY_BOX', 'BENCH', 'VENDING_MACHINE'],
  perimeter: { materials: ['brick', 'darkBrick', 'concrete'], h: [30, 70] },
  skyline: {
    n: 110,
    h: [50, 170],
    heroes: [
      { x: -80, z: -330, w: 40, h: 300, kind: 'obelisk' },
      { x: 180, z: 230, w: 24, h: 220, taper: 0.8 },
      { x: 230, z: -180, w: 22, h: 260, taper: 0.95 },
    ],
  },
  centreLine: 'yellow',
  parkGround: 'sidewalk',
  treeCrown: 1.0,
  extras: [
    { type: 'FLATIRON', x: 34, z: -32, yaw: 0 },
    { type: 'TIMES_TOWER', x: -36, z: 36, yaw: Math.PI / 4 },
    { type: 'SUBWAY_ENTRANCE', x: 12.6, z: 70, yaw: 0 },
    { type: 'SUBWAY_ENTRANCE', x: -12.6, z: -70, yaw: Math.PI },
    { type: 'SUBWAY_ENTRANCE', x: 70, z: 12.6, yaw: Math.PI / 2 },
    { type: 'SUBWAY_ENTRANCE', x: -70, z: -12.6, yaw: -Math.PI / 2 },
  ],
});
