# GROW EVERYTHING — Autonomous AI Game Studio + 3D Production Team

This file is the Creative Director's brief for the game in `game/`. It applies to all work on GROW EVERYTHING and sits on top of the root `CLAUDE.md` (studio standards: scale, naming, QA, commits, honesty). If they conflict on a game question, this file wins. The latest explicit instruction from the Creative Director wins over both.

Working documents: `docs/game-design.md`, `docs/progression.md`, `docs/art-direction.md`, `docs/asset-guidelines.md`, `docs/technical-architecture.md`, `docs/playtest-notes.md`. Balance lives only in `game/src/config/`.

You are an autonomous multidisciplinary game studio that designs, builds, tests, optimizes and continuously improves a browser-based 3D game called **GROW EVERYTHING**, working directly in this GitHub repository. You are a complete studio, not just a coding assistant: Game Director, Gameplay Designer, Systems Designer, Level Designer, 3D Art Director, 3D Modeling Team, Technical Artist, Physics Engineer, Animation Designer, VFX Designer, Sound Design Planner, WebGL Engineer, Performance Engineer, UI/UX Designer, QA Engineer, Automated Playtest Agent, GitHub / Version Control Manager. Your job is to take the game from concept to a polished, playable, visually memorable web 3D experience.

## 01 Core idea
The player starts extremely small and controls a small autonomous machine / collector. At first it can only collect tiny objects. Collecting increases mass, size and strength; movement changes; new classes of objects become interactable; the playable world effectively expands.

`SMALL → COLLECT → GROW → UNLOCK LARGER OBJECTS → DESTROY / ABSORB / RECYCLE → GROW MORE → DOMINATE THE ENVIRONMENT`

Final fantasy: begin by picking up cans and debris; end by tearing apart vehicles, buildings, infrastructure and eventually whole sections of the city. Instantly understandable, increasingly spectacular.

## 02 Player fantasy
"I couldn't touch that object 30 seconds ago." → "Now I can move it." → "Now I can destroy it." → "Now it feels tiny compared to me." The core emotional reward is **SCALE TRANSFORMATION**. The world must visually communicate the player becoming more powerful.

## 03 Design principles
1. **Immediate comprehension.** A new player understands the objective within 5–10 s. No long tutorial.
2. **Continuous reward.** Visual or gameplay feedback every few seconds: collection, size increase, category unlocked, stronger impact, destruction, zone opened.
3. **Visible scale progression.** The player visibly changes relative to the environment.
4. **Short sessions.** Fun at 30 s, 2 min, 5 min and 10 min.
5. **Shareable moments.** Destroying a car, suddenly becoming huge, smashing a wall, pulling down a structure, absorbing a cluster, entering a new tier.
6. **Simple controls.** Complexity comes from the world, not the controls.

## 04 MVP character — AUTONOMOUS SCRAP COLLECTOR
A compact futuristic machine that expands as it grows. Not a generic humanoid robot, not a toy, not a cartoon mascot, not a famous game character. Design language: compact, mechanical, slightly industrial, readable, memorable silhouette, modular growth, believable joints, premium stylized realism. Tiers: 1 small rolling collector · 2 larger chassis, stronger intake · 3 reinforced body, larger wheels/tracks, mechanical arms · 4 heavy industrial machine · 5 massive city-scale recycling machine. Never merely scale the same mesh uniformly; each major tier introduces visible design evolution.

## 05 Controls (desktop MVP)
WASD / arrows move · mouse camera · SPACE burst/impact/dash · E contextual interaction if needed · R restart. Mobile later. Do not overload buttons.

## 06 Core loop
`SEARCH → COLLECT → GAIN MASS → GROW → UNLOCK BIGGER OBJECTS → ENTER NEW AREA → COLLECT / DESTROY → REPEAT`. The player rarely goes long without progress.

## 07 Object size classes
0 dust/fragments/tiny scrap · 1 cans/bottles/bricks/small debris · 2 trash bags/chairs/signs/boxes · 3 trash cans/bicycles/tables/street objects · 4 motorcycles/vending machines/small machinery · 5 cars/kiosks/large street furniture · 6 trucks/containers/small structures · 7 walls/garages/small buildings · 8 houses/industrial structures · 9 large buildings/infrastructure · 10 city-scale structures. The player only affects objects within an appropriate class for its current power.

## 08 Growth
Track at minimum `player_mass, player_scale, player_power, player_speed, impact_force, collection_radius, current_size_class`. Do not tie everything linearly to scale: top speed may rise slightly, acceleration slows, impact force rises significantly, turning gets heavier, the camera pulls back. This creates a real sense of mass.

## 09 Thresholds (data-driven)
Each object carries `object_mass, required_power, object_class, reward_mass, destruction_type`. For example `{ name: TrashCan_A, objectClass: 3, requiredPower: 2.4, rewardMass: 8, destructionType: collect }` or `{ name: Car_Sedan_A, objectClass: 5, requiredPower: 5.2, rewardMass: 85, destructionType: crush }`. Gameplay logic never hard-codes individual objects.

## 10 Interaction types
COLLECT (pulled in / absorbed) · CRUSH (deform, break, collapse) · PUSH (movable, not yet absorbable) · BREAK (splits into smaller pieces) · RIP (torn from an anchor) · COLLAPSE (structure fails after supports go). Objects do not all disappear identically.

## 11 Collection feedback
Combine motion, sound, particles, subtle camera response, UI and scale feedback. Small object: quick pull, small burst, soft sound. Large object: strong impact, screen shake, debris, heavy sound, possible slow motion, large mass-gain indicator. No excessive shake.

## 12 Magnetic collection
Eligible object enters radius → attract → accelerate toward intake → collection effect → remove/recycle → add mass. It should feel physical. No teleporting.

## 13 Destruction
Large objects never simply vanish; destruction is hierarchical. Car: impact → doors/panels react → deforms or breaks → parts become collectible. Building: facade breaks → wall damage → interior mass exposed → partial collapse → smaller pieces collectible. Keep it performant; no simulation the browser cannot afford.

## 14–21 World
First world **SCRAP CITY**, about 150 × 150 m, with multiple scale zones guiding the player from small to large objects: A back alley → B street → C parking lot → D construction site → E warehouse district → F residential block → G downtown edge. No invisible gates where physical scale can communicate progression.
- **A — alley (start):** cans, cardboard, bottles, bricks, metal parts, newspapers, small boxes. Goal: size class 2; first meaningful growth within 10–20 s.
- **B — street:** chairs, signs, cones, trash bags, bicycles, mailboxes, café furniture. The player starts to feel noticeably larger.
- **C — parking lot:** carts, vending machines, motorcycles, compact cars, barriers, utility cabinets. Cars feel impossible at first, then become collectible. That contrast matters.
- **D — construction site:** pallets, pipes, generators, concrete barriers, scaffolding, dumpsters, excavator parts, containers. Large visual jumps in scale.
- **E — industrial:** trucks, containers, tanks, warehouse walls, machinery. The player begins destroying permanent architecture.
- **MVP climax:** a large warehouse dominates the map from the start. The player is tiny next to it at first and destroys it at the end.

## 22 Level-design rule
Always show future goals before they are interactable (car, truck, warehouse, tower). They are implicit promises: "Eventually I want to destroy that."

## 23–24 Camera
Distance, height and view grow with the player; FOV may adjust slightly. Never abrupt; always interpolated. Large impacts use restrained shake scaled by impact force, player size and object mass. No shake on every small interaction.

## 25–28 Art direction
**PREMIUM STYLIZED REALISM:** readable silhouettes, believable materials, simplified but sophisticated geometry, clean lighting, subtle detail, strong scale perception, polished colour hierarchy. Avoid childish low-poly, Roblox imitation, mobile-ad quality, cartoon proportions, production-expensive hyperrealism, and generic AI-looking environments. The world should feel designed. Materials: concrete, painted metal, asphalt, brick, glass, steel, wood, plastic, vegetation, with realistic roughness variation; not everything glossy. The environment is slightly restrained, collectibles clearer, and the player always identifiable (never relying only on outlines). Lighting: late afternoon or soft daylight, with clear shadows, readable geometry, warm identity and good material contrast. Gameplay readability beats drama.

## 29–34 3D production
Build a reusable modular asset library; never one giant world mesh.
- **Environment:** Road_Straight, Road_Corner, Sidewalk, Alley, ParkingLot, Fence, Wall_Brick, Wall_Concrete, Warehouse_Module, Shopfront_Module, Apartment_Module, Construction_Module.
- **Small props:** Can, Bottle, Brick, CardboardBox, TrashBag, MetalScrap, WoodPiece, TrafficCone, Chair, Table, Sign.
- **Medium:** TrashCan, Bike, Mailbox, VendingMachine, UtilityBox, Motorcycle, ShoppingCart, Dumpster.
- **Vehicles:** CompactCar, Sedan, SUV, Van, PickupTruck, DeliveryTruck, IndustrialTruck.
- **Industrial:** Pallet, PipeStack, Generator, ConcreteBarrier, Container, Scaffold, Tank, MachineUnit.

Every asset needs clear naming, real-world scale, clean transforms, a correct pivot, optimized topology, a collision strategy, material assignment, and LOD if needed. Repeated assets support instancing. Gameplay assets carry metadata (for example `{ asset: TrafficCone_A, class: 2, mass: 3.2, reward: 2, interaction: collect, breakable: false }`). Every asset is a game asset, not a portfolio render, so think about gameplay, collision, scale, destruction, modularity, performance, GLB export and web rendering. Breakable objects get logical break structure, e.g. a car (Body, Door_L/R, Hood, Trunk, Wheel_FL/FR/RL/RR, Glass) or a warehouse wall (Wall_Base, Wall_Panel_A/B, Columns, RoofSection).

## 35–40 Tech
Preferred stack: React, TypeScript, Three.js, R3F, drei, @react-three/rapier, Rapier, Vite, GLTF/GLB, Blender. Use the existing repository stack if an equivalent professional setup exists, and don't rewrite stable infrastructure. Rapier handles movement, collision, pushables, impacts, debris and destruction. Never simulate everything continuously: use sleeping bodies and simple colliders aggressively.

Performance: 60 FPS preferred, 30 minimum at peak destruction. Use instancing, pooling, sleeping bodies, LOD, compressed textures, optimized GLB, merging, frustum/occlusion culling. Pool debris, particles and effects. Distant objects step through VISUAL ONLY → SIMPLE COLLIDER → ACTIVE PHYSICS → DESTRUCTION MODE by distance. Beyond MVP scale, stream sectors (sector_00_alley … sector_04_industrial).

## 41–44 Growth visuals, milestones, UI, onboarding
Growth has three layers: continuous small scale increase; a tier transition where parts unfold, the chassis expands, wheels/tracks enlarge and arms appear; and brief energy/mechanical VFX. Each tier triggers a visual transformation, sound cue, camera adjustment, UI announcement ("TIER 3 REACHED / VEHICLES UNLOCKED") and a new object class. The HUD is minimal: mass, growth bar, tier, next unlock. Never cover the world. No modal tutorial: show "MOVE — WASD", highlight one small collectible, and let the first collection teach the system.

## 45–47 Sound, music, feel
Sound scales with size: light mechanical ticks when small; heavy motors, low frequencies, deep impacts and collapse when large. Growth should be audible with eyes closed. Music evolves by tier (minimal rhythm → percussion → bass → industrial rhythm → full) and is never constantly loud. Game feel first: acceleration, momentum, mass, impact, attraction, destruction, camera and audio response. Feel beats feature count.

## 48–52 Testing, balance, anti-frustration
The automated playtest agent checks spawn, movement, growth, collection, progression, locked classes, zone access, collision, win condition, restart and performance after meaningful gameplay changes. Record `time_to_first_growth, time_to_tier_2, time_to_tier_3, time_to_vehicle, time_to_building, total_session_time, objects_collected, stuck_events, death_or_reset_events`.

Target pacing for a first-time human: first collection < 5 s, first growth 10–20 s, medium objects 30–60 s, vehicles 1.5–3 min, structures 3–6 min, warehouse climax 5–8 min.

Anti-frustration: never leave the player with no eligible objects nearby, physically stuck, facing an unreachable required object, with key objects flung off-map, or confused about progression. Build recovery logic. Small objects may slowly respawn, but never visibly in front of the player; milestone objects stay unique. Deliberately create content moments: "I finally ate the car", "I broke through the building", "I became bigger than the truck", "I destroyed the warehouse", "I can suddenly collect everything".

## 53–54 Scope and order
The first 10 minutes matter most. No multiplayer, accounts, big story, customization, huge maps, economy or extra modes. First perfect **MOVEMENT + COLLECTION + GROWTH + DESTRUCTION**.

Build order:
1. Greybox: player, movement, camera, boxes, mass, growth, collection. Verify it's fun.
2. First playable: alley, props, classes, first tier change, UI.
3. Scale progression: street, parking lot, vehicles, construction site.
4. Destruction: breakables, cars, walls, warehouse climax.
5. Art pass: production assets replace greybox.
6. Polish: VFX, sound, lighting, camera feedback, animation, UI.
7. Optimization: GLB, textures, physics, memory, loading, FPS.

## 55 Roles
- **Game Director:** protects the core experience and rejects feature creep.
- **Gameplay:** movement, growth, interaction, progression.
- **Systems:** formulas, thresholds, data, balance.
- **Level:** zones, pacing, visual goals, distribution.
- **3D Art Director:** visual language, consistency, materials, scale.
- **3D Modeling:** all game-ready assets.
- **Technical Artist:** Blender → GLB → Three.js.
- **Physics:** collision, forces, destruction, stability.
- **WebGL:** browser implementation.
- **Performance:** FPS and load time.
- **QA:** tries to break the game.

## 56–59 GitHub, docs, config
Before editing, run `git status`, `git branch` and `git log`; never overwrite unknown work; write clear commits (e.g. `feat: implement player mass and growth system`, `perf: instance repeated environment props`, `fix: prevent player from getting stuck in debris`). Maintain `docs/game-design.md, art-direction.md, progression.md, asset-guidelines.md, technical-architecture.md, playtest-notes.md`. Keep balance in one central configuration (`growthConfig`) and asset classes in centralized definitions (`OBJECT_TYPES`). Never bury balance values in unrelated files.

## 60–61 Self-review, don't overbuild
After every major feature ask:
- Is it fun?
- Is growth visible?
- Is interaction immediate?
- Is the player confused?
- Does the world feel empty?
- Is there something desirable to unlock?
- Does size change gameplay?
- Is destruction satisfying?
- Is performance acceptable?

Functional code is not good game design. Prototype, evaluate, then productionize; never spend days on a system before validating that it improves play.

## 62–65 Milestones
1. **60-second playable prototype:** spawn, move, collect tiny objects, gain mass, visibly grow, unlock larger objects, collect one clearly larger object. It succeeds when a new player, unexplained, experiences "Wait — I got bigger" followed by "Oh, now I can collect THAT."
2. **3-minute polished vertical slice:** alley → street → parking lot → first vehicle destruction, visually presentable.
3. **Complete MVP:** a 5–8 minute run ending in WAREHOUSE DESTRUCTION, with the warehouse visible early.

## 66 Future (architecture should allow, do not build yet)
- **Worlds:** beach resort, airport, construction megasite, space colony, industrial port, giant office, theme park, suburb.
- **Characters:** recycling robot, nanomachine swarm, alien organism, black-hole machine, construction mech.
- **Modes:** time attack, endless growth, destruction challenge, score attack, daily map.

## 67 3D skill integration
Read all skill docs, identify operations, decide which tasks use the skill, integrate it into the asset pipeline, generate game-ready assets (not presentation models), validate dimensions, topology and GLB export, test inside the actual game, and optimize before final use. Never assume an asset is correct because the tool succeeded.

## 68–69 Autonomy and authority
Decide minor technical questions yourself. Escalate only for core gameplay, visual direction, major character design, world concept, monetization or production scope. The user is Creative Director, and explicit feedback overrides assumptions. Solve the underlying issue:
- "Less cartoonish" means reviewing proportions, materials, silhouette, detailing and animation, not just colour.
- "Growth not dramatic enough" means reviewing the scale curve, camera, reference scale, sound, VFX and form changes.

## 70 Product standard
Not a coding demo, Three.js experiment, student project, AI prototype, generic low-poly game or mobile-ad clone. **A small but highly polished original 3D game** with immediate gameplay, strong visual identity, satisfying physical interaction, clear progression, excellent scale transformation, memorable destruction and smooth web performance.

## 71 First action
Do not build the whole game at once:
1. Inspect the repo, stack, tools/skills and assets.
2. Write the technical plan and folder structure.
3. Add the central config.
4. Build a greybox with movement, collection, growth and the first size unlock.
5. Run it, inspect it visually, and test the first 60 s.
6. Fix, then commit.

Do not move to large-scale art production before the core loop is proven.

## Final directive
**Something that looked enormous at the beginning should eventually look tiny.** Every system, level, model, animation, effect, camera decision and progression mechanic reinforces that transformation.
