import type { ObjectTypeId } from '../config/objects';

/**
 * SCRAP CITY — Phase 1/2 layout data (metres; −Z is "downtown").
 *
 *   z = +36  ┌── dead-end wall ──┐
 *            │  ZONE A  alley    │  spawn z = 32, facing −Z: the alley frames the
 *            │  7 m wide         │  street cars, the parking lot, the crane and the
 *   z =   0  ┴──  alley mouth  ──┴  warehouse — the promises (§22).
 *   z = −12   ZONE B  street + café sidewalk (parked cars are class 5: impossible now)
 *   z = −40   ZONE C  parking lot
 *   z = −66…−98       warehouse (class 8) — the MVP climax, visible from the first second
 */

export const WORLD_BOUNDS = { minX: -44, maxX: 44, minZ: -100, maxZ: 36 } as const;
export const SPAWN = { x: 0, z: 32, heading: 0 } as const;

/** Sidewalks are raised above the road (visual only; gameplay collision stays 2D). */
export const CURB_HEIGHT = 0.12;

/** Visual ground height at a point: props and the player sit on the kerb-raised sidewalks. */
export function groundHeight(x: number, z: number): number {
  if (Math.abs(x) > 45) return 0;
  if ((z <= 0 && z >= -2.5) || (z <= -9.5 && z >= -12)) return CURB_HEIGHT;
  return 0;
}

export type Surface = 'asphalt' | 'sidewalk' | 'alley' | 'lot' | 'dirt';

/** Flat ground patches, drawn in order (later on top). */
export const GROUND: { name: string; surface: Surface; x: number; z: number; w: number; d: number }[] = [
  { name: 'Ground_Dirt', surface: 'dirt', x: 0, z: -32, w: 100, d: 144 },
  { name: 'Ground_Alley', surface: 'alley', x: 0, z: 18, w: 7, d: 36 },
  { name: 'Ground_Street', surface: 'asphalt', x: 0, z: -6, w: 90, d: 12 },
  { name: 'Ground_Sidewalk_North', surface: 'sidewalk', x: 0, z: -1.25, w: 90, d: 2.5 },
  { name: 'Ground_Sidewalk_South', surface: 'sidewalk', x: 0, z: -10.75, w: 90, d: 2.5 },
  { name: 'Ground_ParkingLot', surface: 'lot', x: 0, z: -26, w: 64, d: 28 },
  { name: 'Ground_WarehouseApron', surface: 'lot', x: 0, z: -58, w: 60, d: 12 },
];

/** Static architecture: solid, not yet destructible (buildings join the class system in Phase 4). */
export interface StaticBlock {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  material: 'brick' | 'plaster' | 'concrete' | 'steel' | 'darkBrick';
  collide?: boolean;
  y?: number;
}

export const STATIC_BLOCKS: StaticBlock[] = [
  { name: 'Bldg_Alley_West', x: -9.25, z: 18, w: 11.5, d: 36, h: 12, material: 'brick' },
  { name: 'Bldg_Alley_East', x: 9.25, z: 18, w: 11.5, d: 36, h: 9, material: 'plaster' },
  { name: 'Wall_Alley_DeadEnd', x: 0, z: 36.3, w: 7, d: 0.6, h: 4.5, material: 'darkBrick' },
  { name: 'Bldg_Alley_Back', x: 0, z: 40, w: 30, d: 7, h: 14, material: 'concrete' },
  { name: 'Bldg_Street_West', x: -30, z: 18, w: 30, d: 36, h: 16, material: 'concrete' },
  { name: 'Bldg_Street_East', x: 30, z: 18, w: 30, d: 36, h: 13, material: 'darkBrick' },
  // Facade detail in the alley: doors, AC units, a loading step. Doors are flush, so no collision.
  { name: 'Door_Alley_West_A', x: -3.47, z: 24, w: 0.08, d: 1.1, h: 2.2, material: 'steel', collide: false },
  { name: 'Door_Alley_West_B', x: -3.47, z: 7, w: 0.08, d: 1.1, h: 2.2, material: 'steel', collide: false },
  { name: 'Door_Alley_East_A', x: 3.47, z: 17, w: 0.08, d: 1.4, h: 2.4, material: 'steel', collide: false },
  { name: 'ACUnit_Alley_East_A', x: 3.15, z: 28, w: 0.7, d: 0.9, h: 0.6, material: 'steel', y: 3.1, collide: false },
  { name: 'ACUnit_Alley_West_A', x: -3.15, z: 13, w: 0.7, d: 0.9, h: 0.6, material: 'steel', y: 4.2, collide: false },
  { name: 'Step_Alley_East_A', x: 3.1, z: 17, w: 0.8, d: 1.8, h: 0.18, material: 'concrete' },
  // Downtown promise: a tower crane over the construction site (Phase 3 zone).
  { name: 'Crane_Mast', x: 5, z: -56, w: 1.6, d: 1.6, h: 38, material: 'steel' },
  { name: 'Crane_Jib', x: -4, z: -56, w: 36, d: 1.2, h: 1.2, material: 'steel', y: 38, collide: false },
  { name: 'Crane_Counterweight', x: 11, z: -56, w: 3, d: 2, h: 2, material: 'concrete', y: 36.5, collide: false },
];

export interface Placement {
  type: ObjectTypeId;
  x: number;
  z: number;
  yaw?: number;
}

export interface Cluster {
  type: ObjectTypeId;
  x: number;
  z: number;
  radius: number;
  count: number;
}

const Q = Math.PI / 2;

/** Hand-placed objects: milestones, landmarks and anything whose position is a design decision. */
export const PLACEMENTS: Placement[] = [
  // Alley — the dumpster towers over the tier-1 collector; it is the 60-second milestone.
  { type: 'DUMPSTER', x: -2.55, z: 13.5, yaw: Q },
  { type: 'TRASH_CAN', x: 2.95, z: 20.5 },
  { type: 'TRASH_CAN', x: 2.95, z: 21.3 },
  { type: 'TRASH_CAN', x: -3.0, z: 4.5 },
  { type: 'TRASH_CAN', x: 3.0, z: 2.0 },
  { type: 'CHAIR', x: 2.8, z: 26, yaw: -Q },
  { type: 'CHAIR', x: -2.9, z: 9, yaw: Q },
  { type: 'BICYCLE', x: 3.05, z: 11, yaw: 0 },
  { type: 'CARDBOARD_BOX', x: -3.0, z: 23.2 },
  { type: 'CARDBOARD_BOX', x: -2.95, z: 22.6, yaw: 0.4 },
  { type: 'CARDBOARD_BOX', x: 2.9, z: 15.2 },
  { type: 'TRASH_BAG', x: 2.9, z: 19.4 },
  { type: 'TRASH_BAG', x: 2.75, z: 18.8 },
  { type: 'TRASH_BAG', x: -2.9, z: 15.6 },
  { type: 'TRASH_BAG', x: -2.85, z: 11.2 },
  { type: 'TRAFFIC_CONE', x: 1.2, z: 17 },
  { type: 'TRAFFIC_CONE', x: -1.0, z: 6.5 },
  // Alley mouth / north sidewalk: café and street furniture (class 3–4).
  { type: 'VENDING_MACHINE', x: -5.2, z: -0.5 },
  { type: 'DUMPSTER', x: -12.5, z: -0.7 },
  { type: 'CAFE_TABLE', x: 6, z: -1.3 },
  { type: 'CAFE_TABLE', x: 9, z: -1.3 },
  { type: 'CAFE_TABLE', x: 12, z: -1.3 },
  { type: 'CHAIR', x: 5.3, z: -1.3, yaw: Q },
  { type: 'CHAIR', x: 6.7, z: -1.3, yaw: -Q },
  { type: 'CHAIR', x: 8.3, z: -1.3, yaw: Q },
  { type: 'CHAIR', x: 9.7, z: -1.3, yaw: -Q },
  { type: 'CHAIR', x: 11.3, z: -1.3, yaw: Q },
  { type: 'CHAIR', x: 12.7, z: -1.3, yaw: -Q },
  { type: 'BICYCLE', x: -8, z: -1.2, yaw: Q },
  { type: 'BICYCLE', x: -9, z: -1.2, yaw: Q },
  { type: 'TRASH_CAN', x: 4.3, z: -0.6 },
  { type: 'TRASH_CAN', x: -14.5, z: -0.6 },
  // Bike rack, second café and south-sidewalk bins: the class-3 mass that carries the player to class 4.
  ...[16, 17, 18, 19].map((x): Placement => ({ type: 'BICYCLE', x, z: -1.2, yaw: Q })),
  { type: 'CAFE_TABLE', x: -26, z: -1.3 },
  { type: 'CAFE_TABLE', x: -29.5, z: -1.3 },
  ...[-26.7, -25.3, -30.2, -28.8].map((x, i): Placement => ({ type: 'CHAIR', x, z: -1.3, yaw: i % 2 ? -Q : Q })),
  ...[-22, -9, 5, 18, 27].map((x): Placement => ({ type: 'TRASH_CAN', x, z: -10.6 })),
  { type: 'TRASH_CAN', x: 21, z: -0.6 },
  { type: 'TRASH_CAN', x: -20, z: -0.6 },
  // Alley-mouth spill: class-3 mass right where the player exits the alley, so the class-3
  // unlock pays off immediately instead of sending the player on a long empty drive.
  { type: 'TRASH_CAN', x: -1.8, z: -3.4, yaw: 1.2 },
  { type: 'TRASH_CAN', x: 1.4, z: -4.0 },
  { type: 'CHAIR', x: -3.6, z: -4.4, yaw: 0.6 },
  { type: 'CHAIR', x: 3.4, z: -3.2, yaw: -0.9 },
  { type: 'BICYCLE', x: -7.5, z: -5.2, yaw: 1.3 },
  { type: 'TRASH_CAN', x: 2.6, z: 6.5 },
  { type: 'CHAIR', x: -2.7, z: 18.5, yaw: Q },
  // Street: parked cars and a delivery truck — visibly impossible at the start.
  { type: 'CAR_COMPACT', x: 1.5, z: -8.3, yaw: Q },
  { type: 'CAR_COMPACT', x: -6, z: -8.3, yaw: Q },
  { type: 'CAR_COMPACT', x: 9, z: -8.3, yaw: Q },
  { type: 'DELIVERY_TRUCK', x: -17, z: -4.2, yaw: Q },
  { type: 'TRAFFIC_CONE', x: -12, z: -3.4 },
  { type: 'TRAFFIC_CONE', x: -21.5, z: -3.4 },
  { type: 'TRAFFIC_CONE', x: -12, z: -5 },
  // Parking lot.
  ...[-15, -9, -3, 3, 9, 15].map((x, i): Placement => ({ type: 'CAR_COMPACT', x, z: i % 2 ? -21 : -30, yaw: 0 })),
  { type: 'CAR_COMPACT', x: -21, z: -21, yaw: 0 },
  { type: 'CAR_COMPACT', x: 21, z: -30, yaw: 0 },
  // The climax: visible down the alley from the first frame.
  { type: 'WAREHOUSE', x: 0, z: -82 },
];

/** Seeded scatter for small debris: dense near spawn, a breadcrumb trail down the alley. */
export const CLUSTERS: Cluster[] = [
  { type: 'CAN', x: 0, z: 30.6, radius: 0.35, count: 3 },
  { type: 'SCRAP', x: 0.3, z: 29.5, radius: 0.6, count: 8 },
  { type: 'SCRAP', x: -1.4, z: 31.5, radius: 0.7, count: 7 },
  { type: 'BRICK', x: 2.1, z: 30.4, radius: 0.5, count: 6 },
  { type: 'CAN', x: -1.8, z: 28.5, radius: 0.8, count: 5 },
  { type: 'BOTTLE', x: 2.3, z: 29.3, radius: 0.5, count: 3 },
  { type: 'SCRAP', x: 1.4, z: 27, radius: 0.9, count: 8 },
  { type: 'CARDBOARD_SMALL', x: -2.4, z: 26.3, radius: 0.6, count: 3 },
  { type: 'BRICK', x: -0.6, z: 25.5, radius: 0.8, count: 6 },
  { type: 'CAN', x: 1.2, z: 24, radius: 1.2, count: 6 },
  { type: 'SCRAP', x: -1.2, z: 22.5, radius: 1.2, count: 8 },
  { type: 'BOTTLE', x: 1.6, z: 21.5, radius: 0.8, count: 3 },
  { type: 'BRICK', x: 0.4, z: 19.5, radius: 1, count: 5 },
  { type: 'CARDBOARD_SMALL', x: 2.3, z: 22.5, radius: 0.6, count: 3 },
  { type: 'SCRAP', x: 0.8, z: 16, radius: 1.3, count: 8 },
  { type: 'CAN', x: -0.8, z: 12, radius: 1.3, count: 6 },
  { type: 'BRICK', x: 1.5, z: 8.5, radius: 1, count: 6 },
  { type: 'SCRAP', x: -0.5, z: 5, radius: 1.5, count: 8 },
  { type: 'BOTTLE', x: 0.8, z: 2.5, radius: 1.2, count: 4 },
  { type: 'CARDBOARD_BOX', x: 1.7, z: 9.5, radius: 0.8, count: 2 },
  { type: 'TRASH_BAG', x: -1.8, z: 2.5, radius: 0.8, count: 2 },
  // Street and sidewalks: enough mid-size mass to carry the player to the dumpster.
  { type: 'SCRAP', x: -3, z: -5, radius: 3, count: 12 },
  { type: 'CAN', x: 4, z: -3, radius: 2.5, count: 8 },
  { type: 'CARDBOARD_BOX', x: 15, z: -1.4, radius: 1.2, count: 4 },
  { type: 'TRASH_BAG', x: -2.8, z: -1.2, radius: 0.8, count: 3 },
  { type: 'TRASH_BAG', x: 16, z: -10.5, radius: 1.5, count: 4 },
  { type: 'TRAFFIC_CONE', x: 4, z: -5.5, radius: 2, count: 4 },
  { type: 'CARDBOARD_BOX', x: -10, z: -10.8, radius: 2, count: 4 },
  { type: 'SCRAP', x: 10, z: -16, radius: 5, count: 14 },
  { type: 'BRICK', x: -8, z: -16, radius: 3, count: 10 },
  { type: 'TRAFFIC_CONE', x: 0, z: -15, radius: 3, count: 5 },
  { type: 'CARDBOARD_BOX', x: 24, z: -10.6, radius: 1.5, count: 4 },
  { type: 'TRASH_BAG', x: -24, z: -10.6, radius: 1.5, count: 4 },
];
