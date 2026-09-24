import type { ObjectTypeId } from '../config/objects';

/**
 * SCRAP CITY — Phase 1/2 layout data (metres; −Z is "downtown").
 *
 *   z = +36  ┌── dead-end wall ──┐
 *            │  ZONE A  alley    │  spawn z = 32, facing −Z: the alley frames the
 *            │  7 m wide         │  street cars, the parking lot, the crane and the
 *   z =   0  ┴──  alley mouth  ──┴  warehouse — the promises (§22).
 *   z = −12   ZONE B  street + café sidewalk (parked cars are class 5: impossible now)
 *   z = −40   ZONE C  parking lot (carts, motorcycles, cars)
 *   x < −36   ZONE D  construction site behind a hoarding line (pallets → machinery)
 *   x > +36   ZONE E  industrial yard (containers, trucks, storage tanks)
 *   z = −67…−97       warehouse — the MVP climax, visible from the first second, built from
 *                     class-7 parts: wall panels, gable panels, roof bays (collapse), sign
 *   z < −100          back lot: garages and tanks
 */

export const WORLD_BOUNDS = { minX: -80, maxX: 80, minZ: -126, maxZ: 36 } as const;

/** Warehouse footprint (centre and size), shared by the layout, the slab and the HUD. */
export const WAREHOUSE = { x: 0, z: -82, w: 48, d: 30, wallH: 11.5 } as const;
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
  { name: 'Ground_AccessRoad', surface: 'asphalt', x: 0, z: -47, w: 150, d: 9 },
  { name: 'Ground_YardSlab', surface: 'lot', x: 58, z: -60, w: 44, d: 92 },
  { name: 'Ground_BackLot', surface: 'lot', x: 0, z: -112, w: 150, d: 24 },
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
  // Street ends: blocks close the street (and the city north of z = −12) beyond the playable width.
  { name: 'Bldg_StreetEnd_West', x: -65.5, z: 12, w: 43, d: 48, h: 20, material: 'concrete' },
  { name: 'Bldg_StreetEnd_East', x: 65.5, z: 12, w: 43, d: 48, h: 17, material: 'darkBrick' },
  // Warehouse floor slab and dock apron: what remains after the climax.
  { name: 'Warehouse_Slab', x: WAREHOUSE.x, z: WAREHOUSE.z, w: WAREHOUSE.w + 0.8, d: WAREHOUSE.d + 0.8, h: 0.18, material: 'concrete', collide: false },
  { name: 'Warehouse_DockApron', x: 0, z: -66.2, w: 46, d: 1.8, h: 0.3, material: 'concrete', collide: false },
];

export interface Placement {
  type: ObjectTypeId;
  x: number;
  z: number;
  yaw?: number;
  /** Height of the object's base (stacked containers, roof bays, the warehouse sign). */
  y?: number;
  /** Name other placements can reference as a support. */
  tag?: string;
  /** Objects holding this one up: when all are gone it falls; 'collapse' objects stay locked until then. */
  supports?: string[];
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
  // ── Phase 3: class 3–4 transition in the street and lot ─────────────────────
  ...[-30, -29.2, -28.4, -27.6].map((x): Placement => ({ type: 'SHOPPING_CART', x, z: -36.5, yaw: 0 })),
  { type: 'SHOPPING_CART', x: -22, z: -26, yaw: 0.8 },
  { type: 'SHOPPING_CART', x: 12, z: -34, yaw: -0.4 },
  { type: 'SHOPPING_CART', x: 26, z: -24, yaw: 2.1 },
  ...[22, 23.2, 24.4, 25.6, 26.8, 28].map((x, i): Placement => ({ type: 'MOTORCYCLE', x, z: -14.5, yaw: i % 2 ? 0.08 : -0.06 })),
  { type: 'UTILITY_BOX', x: -34, z: -1.1 },
  { type: 'UTILITY_BOX', x: 36, z: -1.1 },
  { type: 'UTILITY_BOX', x: -13, z: -11.4, yaw: Math.PI },
  { type: 'UTILITY_BOX', x: 13, z: -11.4, yaw: Math.PI },
  { type: 'UTILITY_BOX', x: 33, z: -38 },
  { type: 'VAN', x: -27, z: -30, yaw: 0 },
  { type: 'VAN', x: 27, z: -21, yaw: 0 },
  { type: 'VAN', x: 30, z: -8.3, yaw: Q },
  // More parked cars in the lot bays: vehicles are the first "I can eat THAT" moment, so make it a feast.
  ...[-18, -6, 6, 18].map((x): Placement => ({ type: 'CAR_COMPACT', x, z: -21, yaw: Math.PI })),
  ...[-21, -9, 3, 15].map((x): Placement => ({ type: 'CAR_COMPACT', x, z: -30, yaw: 0 })),
  { type: 'VAN', x: -24, z: -38, yaw: Q },
  { type: 'VAN', x: 24, z: -38, yaw: -Q },
  { type: 'VAN', x: 60, z: -14.5, yaw: Q },
  // Hoarding line between the lot and the construction site (class 4: smash through it).
  ...Array.from({ length: 20 }, (_, i): Placement => ({ type: 'HOARDING', x: -35.5, z: -14 - 1.2 - i * 2.4, yaw: -Q })),
  // ── Zone D — construction site ──────────────────────────────────────────────
  { type: 'SITE_CABIN', x: -73, z: -21, yaw: 0, tag: 'cab1' },
  { type: 'SITE_CABIN', x: -73, z: -21, yaw: 0, y: 2.75, supports: ['cab1'] },
  { type: 'SITE_CABIN', x: -73, z: -30.5, yaw: 0 },
  { type: 'EXCAVATOR', x: -56, z: -50, yaw: 0.7 },
  { type: 'TIPPER_TRUCK', x: -66, z: -61, yaw: Q },
  { type: 'GENERATOR', x: -44, z: -19, yaw: 0 },
  { type: 'GENERATOR', x: -49, z: -37, yaw: 0.3 },
  { type: 'GENERATOR', x: -67, z: -42, yaw: -Q },
  { type: 'PIPE_STACK', x: -60, z: -22, yaw: 0 },
  { type: 'PIPE_STACK', x: -60, z: -31, yaw: 0 },
  { type: 'PIPE_STACK', x: -44, z: -60, yaw: Q },
  ...[-48, -45, -42].map((x): Placement => ({ type: 'SCAFFOLD', x, z: -44, yaw: 0 })),
  { type: 'SCAFFOLD', x: -70, z: -52, yaw: Q },
  { type: 'CONTAINER', x: -77, z: -40, yaw: 0 },
  { type: 'CONTAINER', x: -77, z: -48, yaw: 0 },
  { type: 'DUMPSTER', x: -40, z: -30, yaw: Q },
  { type: 'DUMPSTER', x: -52, z: -63, yaw: 0 },
  ...[-19, -23, -27].map((z): Placement => ({ type: 'PALLET_STACK', x: -52, z, yaw: 0.05 })),
  ...[-40, -42.5].map((x): Placement => ({ type: 'PALLET_STACK', x, z: -52, yaw: -0.1 })),
  ...[-38.5, -38.5, -38.5].map((x, i): Placement => ({ type: 'PALLET_STACK', x, z: -56 - i * 1.4, yaw: 0 })),
  ...[-20, -26, -32, -38].map((z): Placement => ({ type: 'JERSEY_BARRIER', x: -64.5, z, yaw: 0 })),
  // Band between the lot and the warehouse apron: barriers, a van and a generator by the crane.
  ...[-24, -18, 18, 24].map((x): Placement => ({ type: 'JERSEY_BARRIER', x, z: -42.5, yaw: Q })),
  ...[-6, -3, 3, 6].map((x): Placement => ({ type: 'JERSEY_BARRIER', x, z: -51.5, yaw: Q })),
  { type: 'GENERATOR', x: 9, z: -58, yaw: Q },
  { type: 'VAN', x: -14, z: -47, yaw: Q },
  { type: 'PALLET_STACK', x: 2, z: -60 },
  { type: 'PALLET_STACK', x: -1.5, z: -61, yaw: 0.2 },
  // ── Zone E — industrial yard ────────────────────────────────────────────────
  ...[-22, -29, -36].map((z, i): Placement => ({ type: 'CONTAINER', x: 50, z, yaw: 0, tag: `ya${i}` })),
  { type: 'CONTAINER', x: 50, z: -29, yaw: 0, y: 2.59, supports: ['ya1'] },
  ...[-22, -29, -36, -43].map((z, i): Placement => ({ type: 'CONTAINER', x: 56, z, yaw: 0, tag: `yb${i}` })),
  { type: 'CONTAINER', x: 56, z: -22, yaw: 0, y: 2.59, supports: ['yb0'] },
  { type: 'CONTAINER', x: 56, z: -36, yaw: 0, y: 2.59, supports: ['yb2'] },
  ...[62, 68, 74].map((x): Placement => ({ type: 'CONTAINER', x, z: -54, yaw: Q })),
  { type: 'CONTAINER', x: 70, z: -30, yaw: 0.05 },
  ...[-22, -29, -36, -43].map((z, i): Placement => ({ type: 'CONTAINER', x: 62, z, yaw: 0, tag: `yc${i}` })),
  { type: 'CONTAINER', x: 62, z: -29, yaw: 0, y: 2.59, supports: ['yc1'] },
  { type: 'CONTAINER', x: 62, z: -43, yaw: 0, y: 2.59, supports: ['yc3'] },
  ...[-104, -111].map((z): Placement => ({ type: 'CONTAINER', x: 8, z, yaw: Q })),
  { type: 'TIPPER_TRUCK', x: -12, z: -108, yaw: Q },
  { type: 'SITE_CABIN', x: -60, z: -80, yaw: 0 },
  ...[-62, -70, -78].map((z): Placement => ({ type: 'CONTAINER', x: 50, z, yaw: 0.02 })),
  { type: 'CONTAINER', x: -40, z: -96, yaw: Q },
  { type: 'EXCAVATOR', x: 44, z: -112, yaw: -2.2 },
  { type: 'SITE_CABIN', x: 74, z: -18, yaw: Q },
  { type: 'VAN', x: 42, z: -24, yaw: 0.1 },
  { type: 'VAN', x: 42, z: -33, yaw: -0.1 },
  { type: 'TIPPER_TRUCK', x: 44, z: -72, yaw: 0 },
  { type: 'TIPPER_TRUCK', x: 68, z: -84, yaw: Q },
  { type: 'DELIVERY_TRUCK', x: 58, z: -70, yaw: -Q },
  ...[-62, -68].map((z): Placement => ({ type: 'PIPE_STACK', x: 74, z, yaw: 0 })),
  ...[-66, -70, -74].map((z): Placement => ({ type: 'PALLET_STACK', x: 38.5, z })),
  ...[-90, -96, -102].map((z): Placement => ({ type: 'JERSEY_BARRIER', x: 38, z, yaw: 0 })),
  // Storage tanks and garages: class-7 structures that warm the player up for the warehouse.
  { type: 'FUEL_TANK', x: 52, z: -106 },
  { type: 'FUEL_TANK', x: 64, z: -106 },
  { type: 'FUEL_TANK', x: 70, z: -96 },
  { type: 'FUEL_TANK', x: -66, z: -100 },
  { type: 'GARAGE_ROW', x: -44, z: -118, yaw: Math.PI },
  { type: 'GARAGE_ROW', x: -24, z: -118, yaw: Math.PI },
  { type: 'GARAGE_ROW', x: 24, z: -118, yaw: Math.PI },
  // ── The climax: the warehouse, visible down the alley from the first frame ────
  ...warehouseParts(),
];

/** The warehouse as a kit: 4 front + 4 back wall panels, 6 gable panels, 4 roof bays, 1 sign. */
function warehouseParts(): Placement[] {
  const { x: cx, z: cz, w, d, wallH } = WAREHOUSE;
  const out: Placement[] = [];
  const bays = [-18, -6, 6, 18];
  bays.forEach((bx, i) => {
    out.push({ type: 'WH_PANEL_FRONT', x: cx + bx, z: cz + d / 2 - 0.4, yaw: 0, tag: `whF${i}` });
    out.push({ type: 'WH_PANEL_BACK', x: cx + bx, z: cz - d / 2 + 0.4, yaw: Math.PI, tag: `whB${i}` });
    const end = i === 0 || i === 3;
    out.push({ type: end ? 'WH_ROOF_END' : 'WH_ROOF', x: cx + bx, z: cz, y: wallH, yaw: i === 0 ? Math.PI : 0, supports: [`whF${i}`, `whB${i}`] });
  });
  for (const s of [-1, 1]) for (const dz of [-10, 0, 10]) out.push({ type: 'WH_PANEL_END', x: cx + s * (w / 2 - 0.4), z: cz + dz, yaw: s * Q });
  out.push({ type: 'WH_SIGN', x: cx, z: cz + d / 2 + 0.3, y: 6.6, yaw: 0, supports: ['whF1', 'whF2'] });
  // Interior mass exposed once the walls come off.
  for (const [x, z] of [[-12, -77], [12, -77], [-4, -88], [4, -88]]) out.push({ type: 'PALLET_RACK', x: cx + x, z, yaw: 0 });
  return out;
}

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
  // Lot, site and yard: loose material between the set pieces.
  { type: 'PALLET', x: -26, z: -17, radius: 2.5, count: 5 },
  { type: 'PALLET', x: -46, z: -26, radius: 3, count: 6 },
  { type: 'BRICK', x: -50, z: -32, radius: 3, count: 14 },
  { type: 'TRAFFIC_CONE', x: -45, z: -46, radius: 4, count: 6 },
  { type: 'CARDBOARD_BOX', x: -40, z: -40, radius: 3, count: 5 },
  { type: 'SCRAP', x: -56, z: -40, radius: 6, count: 16 },
  { type: 'PALLET_STACK', x: 46, z: -48, radius: 3, count: 3 },
  { type: 'PALLET', x: 62, z: -40, radius: 4, count: 6 },
  { type: 'SCRAP', x: 60, z: -64, radius: 8, count: 16 },
  { type: 'TRAFFIC_CONE', x: 20, z: -46, radius: 6, count: 5 },
];
