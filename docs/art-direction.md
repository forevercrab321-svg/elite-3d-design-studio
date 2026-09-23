# Art Direction

**Premium stylized realism.** Readable silhouettes, believable materials, simplified but sophisticated geometry, clean late-afternoon light, strong scale perception. Not low-poly-cute, not Roblox, not mobile-ad, not hyperreal.

## Current greybox decisions (Phase 1)

| Topic | Decision | Why |
| --- | --- | --- |
| Light | Warm low sun from the south-west (`0xffd9ad`, 2.9) plus a strong sky fill (1.9); ACES tone mapping; soft shadows following the player | Clear shadows, readable geometry. The alley is narrow, so the fill keeps the shaded side readable (§28: readability > drama) |
| Player identity | Mid-grey metal body, **safety-orange painted top and fenders**, glowing amber intake ring and sensor eye | First review: an all-graphite body read as a black blob on asphalt. Orange on top carries recognition from the chase camera |
| Environment palette | Restrained: brick `0x8a5543`, plaster, concrete, asphalt `0x4a4c4f` | The environment recedes |
| Collectible vs locked | Absorbable objects show full colour; locked ones are desaturated 45% and darkened 8% | Tells the player what they can take without outlines. The first pass (55%/20%) made cars read black and was too strong |
| Feedback colour | Amber `0xffa640` for pulse rings, dash sparks and HUD accents | One accent colour ties player, UI and feedback together |
| Pulse ring | Thin additive ring, quadratic fade | The first pass was a heavy opaque disc |
| Windows | Blue-grey glass with slight emissive | The first pass read as black holes |
| HUD | System font, bottom-left panel, banner top-centre, nothing in the centre | No external font dependency |

## Promises (always visible from spawn)

The warehouse (z −82) and the tower crane (x 5, z −56) are placed in the alley's sight line. Parked cars sit at the alley mouth.

## Phase 5 art-pass targets

- Replace the shape greybox with authored GLB assets that keep pivots, footprints and part names (`asset-guidelines.md`).
- Collector: production mesh per tier following the `PlayerModel.ts` part names (Body, Intake_Ring, Wheel_L/R, Fender_*, Hopper, Arm_*).
- Trash bags currently read as black balls. They need a knotted, creased silhouette.
- Add material variation (roughness maps, grime, decals). Everything is currently flat colour.
