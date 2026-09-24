import { SIZE_CLASSES } from '../config/classes';
import { growthConfig } from '../config/growth';

/** Pure growth maths. Power = collector diameter in metres. */
const { startMass, startDiameter, sizeExponent } = growthConfig;

export function diameterForMass(mass: number): number {
  return startDiameter * Math.pow(mass / startMass, sizeExponent);
}

export function massForDiameter(diameter: number): number {
  return startMass * Math.pow(diameter / startDiameter, 1 / sizeExponent);
}

export function classForPower(power: number): number {
  let id = 0;
  for (const c of SIZE_CLASSES) if (power >= c.requiredPower) id = c.id;
  return id;
}

export function tierForClass(cls: number): number {
  let tier = 1;
  for (const t of growthConfig.tiers) if (cls >= t.unlockClass) tier = t.tier;
  return tier;
}

export interface Progress {
  nextClass: number | null;
  nextMass: number | null;
  fraction: number; // 0..1 toward the next class unlock
}

export function progressToNextClass(mass: number): Progress {
  const cls = classForPower(diameterForMass(mass));
  const next = SIZE_CLASSES[cls + 1];
  if (!next) return { nextClass: null, nextMass: null, fraction: 1 };
  const from = massForDiameter(Math.max(SIZE_CLASSES[cls].requiredPower, growthConfig.startDiameter));
  const to = massForDiameter(next.requiredPower);
  const fraction = Math.min(1, Math.max(0, (mass - from) / (to - from)));
  return { nextClass: next.id, nextMass: to, fraction };
}
