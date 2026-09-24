/**
 * ARENA — competitive multiplayer balance (central config, like growth.ts).
 * Up to 4 machines grow in the same city. Bigger machines eat smaller ones; each machine has
 * 3 lives; the round ends on the timer, when one machine is left, or when the city's landmark
 * is torn down. Champion = most mass at the end (survivors rank above eliminated machines).
 */
export const arenaConfig = {
  maxPlayers: 4,
  roundSeconds: 300,
  countdownSeconds: 3,
  resultsSeconds: 12,
  lives: 3,
  /** Eat another machine when your diameter is at least this multiple of theirs. */
  eatRatio: 1.25,
  /** Overlap needed: centres closer than attacker radius × this. */
  eatReach: 0.95,
  /** Share of the victim's mass the attacker gains. */
  eatGain: 0.6,
  firstBloodBonus: 0.2,
  /** Victim keeps this share of mass (never below the start mass) and respawns after a delay. */
  respawnMassKeep: 0.45,
  /** Rewarded-ad revive (once per match) keeps this share of the mass instead. */
  reviveMassKeep: 0.75,
  /** Drop-in players who do not inherit a machine start at this share of the field's median mass. */
  dropInMassShare: 0.35,
  /** No drop-in during the last seconds of a round (join the next one instead). */
  dropInCutoffSeconds: 25,
  /** Hidden longer than this during a round = away: step out and rejoin on return (ms). */
  awayMs: 5000,
  respawnDelay: 3,
  invulnerableSeconds: 3,
  /** Chain absorbs within this window to build a combo (+10 % per step, capped). */
  comboWindow: 1.6,
  comboStep: 0.1,
  comboMax: 1.6,
  /** Golden crates: worth this share of the collector's current mass (minimum rewardMass). */
  goldCrateShare: 0.08,
  goldCrateCount: 12,
  /** The machine that recycles the last landmark part gains this share of its mass. */
  landmarkBonus: 0.25,
  /** Penalty: slamming a locked object while dashing stuns and sheds mass. */
  crashStunSeconds: 0.8,
  crashMassLoss: 0.03,
  /**
   * Refill (host): absorbed small and medium props (class ≤ refillMaxClass, not landmark parts,
   * not stacked) respawn at home after refillDelay + class × refillPerClass seconds, when no
   * machine is within refillClearance m — so a 5-minute round with 4 machines never runs dry
   * and a respawned machine always has something to rebuild with.
   */
  refillMaxClass: 5,
  refillDelay: 30,
  refillPerClass: 6,
  refillClearance: 12,
  refillCheckSeconds: 2,
  refillPerCheck: 16,
  /** AI rivals ignore prey worth less than this share of their own mass (no endless chases). */
  botPreyMinShare: 0.04,
  botHuntGiveUp: 6,
  /**
   * Catch-up: a machine behind the leader gains up to this much extra from objects
   * (scaled by how far behind it is), and eating the current leader pays a bounty.
   */
  catchUpMax: 0.6,
  leaderBounty: 0.25,
  /** Power-up crates (refill like other small props). */
  powerCount: 5,
  speedMul: 1.4,
  speedSeconds: 8,
  magnetMul: 1.8,
  magnetSeconds: 8,
  shieldSeconds: 6,
  /** Coins (local reward currency) by final rank 1..4, plus per kill. */
  coinsByRank: [100, 60, 35, 20],
  coinsPerKill: 15,
  /** Network cadence. */
  grantBatchMs: 90,
  matchBeaconMs: 1000,
} as const;
