/**
 * GROW EVERYTHING — central balance configuration.
 * Every tunable gameplay number lives in game/src/config/. Do not bury balance values elsewhere.
 *
 * Model: player POWER is the collector's diameter in metres. Mass drives diameter by a
 * cube-root law (volume-honest), so doubling size costs 8× mass and growth reads as physical.
 */
export const growthConfig = {
  startMass: 5, // kg
  startDiameter: 0.35, // m — tier 1 fits between two bricks
  sizeExponent: 1 / 3,
  /** Rendered size eases toward the target so every pickup is a visible swell, not a pop. */
  visualGrowthRate: 6,
  /** Tier = character evolution. A tier is reached when its size class unlocks. */
  tiers: [
    { tier: 1, name: 'Scrap Collector', unlockClass: 0 },
    { tier: 2, name: 'Intake Chassis', unlockClass: 2 },
    { tier: 3, name: 'Reinforced Hauler', unlockClass: 5 },
    { tier: 4, name: 'Industrial Recycler', unlockClass: 7 },
    { tier: 5, name: 'City Recycler', unlockClass: 9 },
  ],
} as const;

export const movementConfig = {
  baseTopSpeed: 3.4, // m/s at start diameter
  topSpeedExponent: 0.45, // top speed ∝ (d/d0)^0.45: faster in m/s, slower in body lengths
  accelSeconds: 0.16, // time to top speed at start mass
  accelMassDrag: 0.35, // accel time grows with ln(mass ratio): heavier = slower to spin up
  baseTurnRate: 11, // rad/s
  turnMassDrag: 0.3, // turning gets heavier with ln(mass ratio)
  lateralGrip: 16, // how fast sideways slide is killed
  dash: { speedMultiplier: 2.1, duration: 0.28, cooldown: 1.1 },
} as const;

export const collectionConfig = {
  /** Magnet reach beyond the body edge, as a fraction of diameter, plus a flat minimum (m). */
  reachFactor: 0.6,
  reachFlat: 0.3,
  pullAcceleration: 30, // m/s² at 1 m diameter, scales with size
  absorbDistanceFactor: 0.42, // absorbed once within this × diameter of the intake
  maxPullSeconds: 0.9, // safety: never let a pulled object orbit forever
  /** Objects needing up to this much more power than the player has can be shoved. */
  pushPowerRatio: 0.72,
  bumpToastCooldown: 1.6,
} as const;

export const cameraConfig = {
  distanceBase: 1.25,
  distancePerMetre: 4.2,
  heightBase: 0.5,
  heightPerMetre: 2.0,
  lookHeightPerMetre: 0.55,
  lookAheadPerMetre: 0.9,
  fovBase: 56,
  fovPerMetre: 1.6,
  fovMax: 64,
  followSharpness: 6,
  mouseYawPerPixel: 0.005,
  mousePitchPerPixel: 0.003,
  autoAlignDelay: 1.2, // s without mouse input before the camera swings behind the player
  autoAlignRate: 1.8,
} as const;

export const feelConfig = {
  pickupTrauma: 0.04, // barely perceptible; small pickups must not shake the screen
  largePickupTrauma: 0.35, // for objects of class ≥ 3
  tierUpTrauma: 0.3,
  bumpTrauma: 0.12,
  traumaDecay: 1.4,
  maxShakeOffset: 0.06, // × camera distance
} as const;
