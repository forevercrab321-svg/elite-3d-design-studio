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

## Procedural production kit (Phase 5, current)

Gameplay objects are built in `game/src/world/props.ts`. Each type is authored at its `OBJECT_TYPES.size` with the pivot at the ground centre and forward = −Z, then split into **material roles** (`game/src/art/materials.ts`). One `InstancedMesh` renders each (type, role) pair.

| Rule | Why |
| --- | --- |
| Paint-like roles (`paint`, `carPaint`, `plastic`, `glossyPlastic`, `cardboard`, `propBrick`, `glassTint`, `aluminium`, `fabric`, `corrugated`) take per-instance colour | Colour variants plus the locked/absorbable read. Glass, rubber and lamps are never tinted |
| `darkTrim` and `rubber` fold into `tread` with UVs pinned to a flat lug texel; `chrome` folds into `steel`; head, tail and indicator lamps fold into `lamps` (vertex-coloured emissive) | Draw calls. Each role costs one call per render pass (main, shadow, GTAO) |
| Details sit **on the bevel skin**: extruded bodies grow ~0.9 × bevel beyond their profile | Lights, grilles and panel lines placed on the profile end up buried (this was found and fixed in review) |
| Textured roles get metre-scale box-projected UVs automatically (`art/uv.ts`) | True-scale brick courses, corrugation and cardboard fibre on any size |
| Small debris (classes 0–1) is budgeted to tens–hundreds of triangles and casts no shadow map | Hundreds of instances. GTAO grounds them |

Triangles per instance: scrap ~120, brick 12, can ~100, bottle ~160, cardboard ~70, trash bag ~490, cone ~500, chair ~430, trash can ~940, bicycle ~3.4k, dumpster ~1.3k, vending ~1.4k, compact car ~5k, delivery truck ~4.5k, warehouse ~2.1k.

Static architecture (`game/src/world/architecture.ts`) merges everything per material. Untextured metals share one vertex-coloured material (colour × baked ground AO). Facades are authored per visible face: window reveals, sills, lintels, frames, storefronts, awnings, cornices, downpipes, AC units and service doors.

When `TRIPO_API_KEY` is available, the planned upgrade is Tripo hero models for the collector tiers, the car family and the warehouse. They would be validated against these footprints and part names and swapped into `props.ts` (see the pipeline above).
