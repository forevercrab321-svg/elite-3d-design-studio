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
  | 'cart'
  | 'pallet'
  | 'palletStack'
  | 'motorcycle'
  | 'utility'
  | 'barrier'
  | 'hoarding'
  | 'van'
  | 'generator'
  | 'pipes'
  | 'scaffold'
  | 'container'
  | 'cabin'
  | 'tipper'
  | 'excavator'
  | 'rack'
  | 'tank'
  | 'garages'
  | 'whFront'
  | 'whBack'
  | 'whEnd'
  | 'whRoof'
  | 'whRoofEnd'
  | 'whSign';

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
  /** Part of the climax structure: absorbing every such object wins the run. */
  climax?: boolean;
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
  CAR_COMPACT: { label: 'Compact car', objectClass: 5, size: [1.75, 1.45, 3.9], shape: 'car', colors: [0x8a969e, 0x9b2a24, 0x284d78, 0xe3e1da, 0x4a4f54, 0x3f5b45], rewardMass: 380, destructionType: 'crush' },
  DELIVERY_TRUCK: { label: 'Delivery truck', objectClass: 6, size: [2.3, 3.2, 7.2], shape: 'truck', colors: [0xe4e1d8, 0x5d6a4a], rewardMass: 1200, destructionType: 'break' },
  // ── Class 3–4 transition: the street, lot and site entrance carry the player to vehicles.
  SHOPPING_CART: { label: 'Shopping cart', objectClass: 3, size: [0.6, 1.0, 0.95], shape: 'cart', colors: [0xb9bec2], rewardMass: 16, destructionType: 'collect' },
  PALLET: { label: 'Pallet', objectClass: 3, size: [1.2, 0.144, 1.0], shape: 'pallet', colors: [0xf0dfc2, 0xe2cca6], rewardMass: 14, destructionType: 'collect' },
  PALLET_STACK: { label: 'Pallet stack', objectClass: 4, size: [1.2, 0.9, 1.0], shape: 'palletStack', colors: [0xf0dfc2, 0xd9c29c], rewardMass: 70, destructionType: 'break' },
  MOTORCYCLE: { label: 'Motorcycle', objectClass: 4, size: [0.8, 1.15, 2.1], shape: 'motorcycle', colors: [0x9b2a24, 0x1f2a36, 0xd9d4c7, 0x2f4f3a], rewardMass: 75, destructionType: 'crush' },
  UTILITY_BOX: { label: 'Utility cabinet', objectClass: 4, size: [1.2, 1.4, 0.5], shape: 'utility', colors: [0x6e7a6a, 0x8a8f86], rewardMass: 60, destructionType: 'crush' },
  JERSEY_BARRIER: { label: 'Concrete barrier', objectClass: 4, size: [0.6, 0.81, 3.0], shape: 'barrier', colors: [0xc9c4ba, 0xb8b2a6], rewardMass: 85, destructionType: 'break' },
  HOARDING: { label: 'Site hoarding', objectClass: 4, size: [2.4, 2.4, 0.3], shape: 'hoarding', colors: [0x2f5b46, 0x3a4f6a], rewardMass: 35, destructionType: 'break' },
  // ── Class 5: vehicles and site machinery.
  VAN: { label: 'Panel van', objectClass: 5, size: [2.0, 2.45, 5.3], shape: 'van', colors: [0xe6e3dc, 0x2f4d6e, 0x8a2f2a, 0x5a5f63], rewardMass: 480, destructionType: 'crush' },
  GENERATOR: { label: 'Site generator', objectClass: 5, size: [1.3, 1.7, 3.2], shape: 'generator', colors: [0xd9a21b, 0x3f6a4a], rewardMass: 300, destructionType: 'break' },
  PIPE_STACK: { label: 'Pipe stack', objectClass: 5, size: [2.6, 1.35, 6.0], shape: 'pipes', colors: [0x6c7278, 0x8a5a3a], rewardMass: 270, destructionType: 'break' },
  SCAFFOLD: { label: 'Scaffold tower', objectClass: 5, size: [2.6, 6.2, 1.3], shape: 'scaffold', colors: [0x9aa1a6], rewardMass: 320, destructionType: 'rip' },
  // ── Class 6: trucks, containers, cabins — the industrial yard.
  CONTAINER: { label: 'Shipping container', objectClass: 6, size: [2.44, 2.59, 6.06], shape: 'container', colors: [0x9b3a2a, 0x2f5b7a, 0x3f6a4a, 0xb5782a, 0x6a6f74], rewardMass: 1100, destructionType: 'crush' },
  SITE_CABIN: { label: 'Site cabin', objectClass: 6, size: [2.6, 2.75, 7.2], shape: 'cabin', colors: [0xd8d3c6, 0x3d6a8a], rewardMass: 1100, destructionType: 'crush' },
  TIPPER_TRUCK: { label: 'Tipper truck', objectClass: 6, size: [2.5, 3.3, 8.2], shape: 'tipper', colors: [0xd9a21b, 0xc9c4ba, 0x8a2f2a], rewardMass: 1700, destructionType: 'break' },
  EXCAVATOR: { label: 'Excavator', objectClass: 6, size: [3.0, 3.3, 9.6], shape: 'excavator', colors: [0xe0a51c], rewardMass: 2400, destructionType: 'break' },
  PALLET_RACK: { label: 'Pallet rack', objectClass: 6, size: [2.7, 5.4, 1.2], shape: 'rack', colors: [0x2f5a8a], rewardMass: 1100, destructionType: 'collapse' },
  // ── Class 7: structures. The warehouse is a kit of class-7 parts. The front wall and sign
  // come off first (8 m machine); gables, back wall and roof bays need 9.6 m (~103 t of the 125 t available below it), so the
  // tanks and garages have to be eaten in between. A roof bay collapses when a wall under it goes.
  FUEL_TANK: { label: 'Storage tank', objectClass: 7, size: [7, 9, 7], shape: 'tank', colors: [0xd9d6cf, 0xb4bcc2], rewardMass: 5000, destructionType: 'crush' },
  GARAGE_ROW: { label: 'Garage row', objectClass: 7, size: [16, 2.8, 6.4], shape: 'garages', colors: [0xb07560, 0xc2b8a4], rewardMass: 4500, destructionType: 'collapse' },
  WH_PANEL_FRONT: { climax: true, label: 'Warehouse wall', objectClass: 7, size: [12, 11.5, 0.8], shape: 'whFront', colors: [0xb4bcc2], rewardMass: 3600, destructionType: 'rip' },
  WH_PANEL_BACK: { climax: true, requiredPower: 9.6, label: 'Warehouse wall', objectClass: 7, size: [12, 11.5, 0.8], shape: 'whBack', colors: [0xb4bcc2], rewardMass: 3600, destructionType: 'rip' },
  WH_PANEL_END: { climax: true, requiredPower: 9.6, label: 'Warehouse gable', objectClass: 7, size: [10, 11.5, 0.8], shape: 'whEnd', colors: [0xb4bcc2], rewardMass: 3000, destructionType: 'rip' },
  WH_ROOF_END: { climax: true, requiredPower: 9.6, label: 'Warehouse roof', objectClass: 7, size: [12, 4.6, 31.2], shape: 'whRoofEnd', colors: [0xb4bcc2], rewardMass: 6500, destructionType: 'collapse' },
  WH_ROOF: { climax: true, requiredPower: 9.6, label: 'Warehouse roof', objectClass: 7, size: [12, 4.6, 31.2], shape: 'whRoof', colors: [0xb4bcc2], rewardMass: 6000, destructionType: 'collapse' },
  WH_SIGN: { climax: true, label: 'Warehouse sign', objectClass: 6, size: [18, 2.4, 0.5], shape: 'whSign', colors: [0xe9e4d8], rewardMass: 900, destructionType: 'rip' },
} satisfies Record<string, ObjectType>;

export type ObjectTypeId = keyof typeof OBJECT_TYPES;
