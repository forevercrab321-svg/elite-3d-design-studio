/**
 * OBJECT_TYPES — every gameplay object is defined here (design §09, §32, §59).
 * Gameplay code reads these fields; it never special-cases an individual object.
 *
 * size: [width (local X), height, depth (local Z)] in metres, real-world dimensions.
 * rewardMass: kg added to the player on absorption (game mass, tuned for pacing).
 */
export type Shape =
  | 'scrap'
  | 'box'
  | 'cylinder'
  | 'bottle'
  | 'cone'
  | 'bag'
  | 'chair'
  | 'table'
  | 'bike'
  | 'dumpster'
  | 'vending'
  | 'car'
  | 'truck'
  | 'warehouse';

export type DestructionType = 'collect' | 'crush' | 'push' | 'break' | 'rip' | 'collapse';

export interface ObjectType {
  label: string;
  objectClass: number;
  size: [number, number, number];
  shape: Shape;
  /** Per-instance colour variants (greybox paint). */
  colors: number[];
  rewardMass: number;
  destructionType: DestructionType;
  /** Override of the class threshold, only when an object is unusually heavy or light for its class. */
  requiredPower?: number;
}

export const OBJECT_TYPES = {
  SCRAP: { label: 'Metal scrap', objectClass: 0, size: [0.09, 0.04, 0.07], shape: 'scrap', colors: [0x8d8f91, 0x9a8a74, 0x6f7a80, 0xa0673f], rewardMass: 0.14, destructionType: 'collect' },
  CAN: { label: 'Can', objectClass: 1, size: [0.066, 0.12, 0.066], shape: 'cylinder', colors: [0xb8402f, 0x3f6fa8, 0xc9b458, 0x5c8a4f], rewardMass: 0.28, destructionType: 'collect' },
  BOTTLE: { label: 'Bottle', objectClass: 1, size: [0.075, 0.26, 0.075], shape: 'bottle', colors: [0x2f6b4a, 0x6b4a2f, 0x9fb7bd], rewardMass: 0.36, destructionType: 'collect' },
  BRICK: { label: 'Brick', objectClass: 1, size: [0.215, 0.065, 0.1025], shape: 'box', colors: [0x9c4f3a, 0x8a4633, 0xa35a42], rewardMass: 0.48, destructionType: 'collect' },
  CARDBOARD_SMALL: { label: 'Small box', objectClass: 1, size: [0.3, 0.22, 0.25], shape: 'box', colors: [0xb08a5a, 0xa27d4f], rewardMass: 0.65, destructionType: 'collect' },
  CARDBOARD_BOX: { label: 'Cardboard box', objectClass: 2, size: [0.55, 0.42, 0.45], shape: 'box', colors: [0xa47f50, 0xb89262], rewardMass: 2.4, destructionType: 'collect' },
  TRASH_BAG: { label: 'Trash bag', objectClass: 2, size: [0.55, 0.6, 0.5], shape: 'bag', colors: [0x2b2d30, 0x3b3f33, 0x2d3440], rewardMass: 2.8, destructionType: 'collect' },
  TRAFFIC_CONE: { label: 'Traffic cone', objectClass: 2, size: [0.36, 0.7, 0.36], shape: 'cone', colors: [0xd9622b], rewardMass: 2.2, destructionType: 'collect' },
  CHAIR: { label: 'Chair', objectClass: 3, size: [0.48, 0.85, 0.5], shape: 'chair', colors: [0x6d5a45, 0x4b5b63], rewardMass: 12.5, destructionType: 'collect' },
  CAFE_TABLE: { label: 'Café table', objectClass: 3, size: [0.75, 0.75, 0.75], shape: 'table', colors: [0x5a5f63], rewardMass: 15, destructionType: 'collect' },
  TRASH_CAN: { label: 'Trash can', objectClass: 3, size: [0.6, 0.95, 0.6], shape: 'cylinder', colors: [0x3f5a45, 0x4a4f55], rewardMass: 19.5, destructionType: 'collect' },
  BICYCLE: { label: 'Bicycle', objectClass: 3, size: [0.55, 1.05, 1.75], shape: 'bike', colors: [0x2f5d8a, 0x8a2f2f, 0x3d3d3d], rewardMass: 21, destructionType: 'collect' },
  DUMPSTER: { label: 'Dumpster', objectClass: 4, size: [1.9, 1.3, 1.1], shape: 'dumpster', colors: [0x2f5a3d, 0x3a4c6b], rewardMass: 140, destructionType: 'crush' },
  VENDING_MACHINE: { label: 'Vending machine', objectClass: 4, size: [0.9, 1.85, 0.8], shape: 'vending', colors: [0xa33a35, 0x2f5f8f], rewardMass: 110, destructionType: 'crush' },
  CAR_COMPACT: { label: 'Compact car', objectClass: 5, size: [1.75, 1.45, 3.9], shape: 'car', colors: [0x8a969e, 0x9b2a24, 0x284d78, 0xe3e1da, 0x4a4f54, 0x3f5b45], rewardMass: 520, destructionType: 'crush' },
  DELIVERY_TRUCK: { label: 'Delivery truck', objectClass: 6, size: [2.3, 3.2, 7.2], shape: 'truck', colors: [0xe4e1d8, 0x5d6a4a], rewardMass: 1800, destructionType: 'break' },
  WAREHOUSE: { label: 'Warehouse', objectClass: 8, size: [48, 16, 30], shape: 'warehouse', colors: [0xb4bcc2], rewardMass: 40000, destructionType: 'collapse' },
} satisfies Record<string, ObjectType>;

export type ObjectTypeId = keyof typeof OBJECT_TYPES;
