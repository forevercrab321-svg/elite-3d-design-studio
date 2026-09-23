/**
 * Machine types the player picks in the lobby. Multipliers apply on top of growth.ts
 * (movement) and collection settings; the look selects paint and bolt-on parts on the
 * shared collector chassis (entities/PlayerModel.ts).
 */
export type VehicleLook = 'collector' | 'dozer' | 'racer' | 'magnet';

export interface VehicleDef {
  id: VehicleLook;
  name: string;
  nameZh: string;
  blurb: string;
  blurbZh: string;
  speed: number;
  accel: number;
  turn: number;
  reach: number;
  pull: number;
  dashCooldown: number;
  /** Eat threshold multiplier (below 1 = can eat rivals closer to its own size). */
  eatRatio: number;
  shell: number;
  accent: number;
}

export const VEHICLES: Record<VehicleLook, VehicleDef> = {
  collector: { id: 'collector', name: 'Collector', nameZh: '回收者', blurb: 'Balanced all-rounder', blurbZh: '各项均衡的全能型', speed: 1, accel: 1, turn: 1, reach: 1, pull: 1, dashCooldown: 1, eatRatio: 1, shell: 0xe8781a, accent: 0xffb347 },
  dozer: { id: 'dozer', name: 'Dozer', nameZh: '推土机', blurb: 'Slow, wide blade, eats rivals closer to its size', blurbZh: '慢但铲子宽，能吞比自己小不多的对手', speed: 0.86, accel: 0.8, turn: 0.85, reach: 1.25, pull: 1.1, dashCooldown: 1.2, eatRatio: 0.92, shell: 0xd9a21b, accent: 0xffd35a },
  racer: { id: 'racer', name: 'Racer', nameZh: '疾风', blurb: 'Fast and nimble, short reach, quick dash', blurbZh: '又快又灵活，吸取范围短，冲刺冷却快', speed: 1.22, accel: 1.3, turn: 1.25, reach: 0.82, pull: 0.95, dashCooldown: 0.65, eatRatio: 1.04, shell: 0xc4302b, accent: 0xff6b5a },
  magnet: { id: 'magnet', name: 'Magnet', nameZh: '磁吸车', blurb: 'Long-range pull, average speed', blurbZh: '远距离吸取，速度一般', speed: 0.95, accel: 0.95, turn: 1, reach: 1.6, pull: 1.35, dashCooldown: 1.1, eatRatio: 1.02, shell: 0x2f6fb8, accent: 0x7fc4ff },
};

export const VEHICLE_ORDER: VehicleLook[] = ['collector', 'dozer', 'racer', 'magnet'];

/** Player slot colours (chips, rings, name tags), in slot order. */
export const SLOT_COLORS = [0xffb347, 0x5ec8ff, 0xff6b8a, 0x8be07a] as const;
