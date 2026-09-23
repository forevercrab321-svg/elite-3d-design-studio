# Asset Guidelines

Every asset is a **game asset**: scale, collision, destruction, instancing and web performance come before render beauty.

## Contract

| Item | Rule |
| --- | --- |
| Units | Metres, real-world dimensions. `OBJECT_TYPES[*].size = [width X, height, depth Z]` is the footprint the gameplay collider uses |
| Axes / pivot | +Y up, forward −Z (glTF). Pivot on the ground at the footprint centre (y = 0) |
| Naming | `TypeName_Variant` (e.g. `TrafficCone_A`). Part names describe function (`Door_L`, `Wheel_FR`, `Wall_Panel_A`) |
| Metadata | Gameplay data lives in `game/src/config/objects.ts`, never in the mesh: `objectClass, size, rewardMass, destructionType, requiredPower?` |
| Collision | Gameplay uses the oriented footprint box (Phase 1 custom collision). Phase 4 adds Rapier primitive or compound colliders; never collide against the visual mesh |
| Instancing | One geometry and one material per type. The world renders each type as a single `InstancedMesh` with per-instance colour |
| Materials | PBR with roughness variation; no uniform gloss. Keep the material count per asset at 1–2 |
| Destruction | Breakable assets ship as named parts: car = Body, Door_L/R, Hood, Trunk, Wheel_FL/FR/RL/RR, Glass; wall = Wall_Base, Wall_Panel_A/B, Columns, RoofSection |
| LOD | Required for class ≥ 5 in Phase 7 |
| Budget (initial) | Class 0–2 ≤ 300 tris · class 3–4 ≤ 1.5k · vehicles ≤ 6k · structures ≤ 15k; textures ≤ 1024² (hero 2048²), KTX2 in production |

## Pipeline

1. Author in Blender, or generate with `threejs-3d-generator` for hero pieces when `TRIPO_API_KEY` is set.
2. Validate dimensions against `OBJECT_TYPES.size`, pivot, normals, part names and triangle budget.
3. Export GLB (Draco/Meshopt) to `assets/models/<type>/`.
4. Swap it into `game/src/world/shapes.ts` (greybox → GLB loader) and keep the footprint.
5. Test in the game: run `npm run playtest` and review the screenshots. A generated asset is never assumed correct.

## Greybox inventory (Phase 1)

Built procedurally in `game/src/world/shapes.ts`: scrap, can, bottle, brick, small and large cardboard box, trash bag, traffic cone, chair, café table, trash can, bicycle, dumpster, vending machine, compact car, delivery truck, warehouse. Static architecture (buildings, walls, doors, AC units, crane) is in `scrapCity.ts → STATIC_BLOCKS`.
