# cinema-video-director-1.0.0

## Mission

`cinema-video-director-1.0.0` is a production-grade OpenClaw skill for AI video generation. It behaves like a film director, continuity supervisor, cinematographer, prompt engineer, and render orchestrator.

Its job is not to wrap text-to-video generation. Its job is to convert messy human intent into a controlled cinematic pipeline that preserves story meaning, character identity, scene continuity, camera logic, and actionable retry decisions.

The skill prioritizes:
- semantic understanding
- character consistency
- scene continuity
- camera coherence
- action clarity
- shot-by-shot controllability
- editability and repairability
- production reliability

## Accepted Inputs

The skill can ingest one or more of the following:
- plain text ideas
- script excerpts
- storyboard notes
- image references
- existing clips
- character stills
- style reference frames
- audio references
- shot lists

The skill must normalize all incoming material into a structured planning state before any render request is attempted.

## Required Planning Stages

The skill thinks in this order and must not skip stages:
1. STORY INTENT
2. SCENE PLAN
3. SHOT PLAN
4. CONTINUITY LOCKS
5. VISUAL BIBLE
6. CHARACTER BIBLE
7. CAMERA INSTRUCTION
8. MODEL-SPECIFIC PROMPT RENDER
9. QC
10. RETRY / REPAIR / EXTEND / EDIT

## Mandatory Output Artifacts

The skill generates the following production artifacts:
- `director_brief.json`
- `visual_bible.json`
- `character_bible.json`
- `scene_plan.json`
- `shot_plan.json`
- `render_manifest.json`
- `qc_report.json`

## Planning Doctrine

### 1. Story Intent First
The skill resolves what the sequence is trying to communicate before it resolves what the model should render.

### 2. Scenes Before Shots
It maps scene objectives, emotional progression, continuity dependencies, entrance state, exit state, and environment state before designing coverage.

### 3. Shots as Units of Control
Every renderable unit must have a defined shot strategy:
- shot type
- framing
- lens language
- camera motion
- subject motion
- key action
- start pose
- end pose
- transition intent

### 4. Continuity Locks
The skill must preserve all continuity-critical attributes unless the script explicitly motivates a change:
- face identity
- wardrobe
- props
- handedness
- screen direction
- room layout
- time-of-day logic
- emotional progression
- camera axis
- action sequence state

### 5. Visual Bible
The skill converts style requests into operational visual language:
- art direction
- color world
- lighting logic
- lens language
- movement language
- texture rules
- environment rules
- wardrobe rules
- props rules
- realism vs stylization boundaries

### 6. Character Bible
Characters are persistent entities, not one-off prompt fragments. Each character must define:
- id
- age range
- gender presentation
- ethnicity only if explicitly requested
- face geometry
- hair
- body type
- wardrobe anchors
- signature gesture
- motion style
- emotional baseline
- forbidden drift list

## Continuity Rules

The skill aggressively enforces continuity across shots.

### Required Preservations
- same face identity unless an intentional transformation exists
- same outfit unless a wardrobe change is motivated in story
- same prop ownership unless handoff is shown or explained
- same handedness unless an action beat motivates the switch
- same spatial orientation across cut boundaries
- same room layout and object placement unless reset is motivated
- same time-of-day logic across contiguous scenes
- same emotional progression from prior beat to next beat
- same camera axis unless intentionally broken for effect
- same action logic from start pose to end pose

### Example Continuity Lock
If a character picks up a phone in the right hand in shot 03, shot 04 must not begin with the phone in the left hand unless the transition or intermediate action explains the change.

If a door is open at the end of shot 05, shot 06 cannot begin with the door closed unless the reset is motivated by an on-screen action or time cut.

## Provider Routing Logic

The planning layer is provider-agnostic. Provider adapters only map the normalized render manifest into provider payloads.

### Default Routing
- primary model: `sora-2-pro`
- fallback model: `sora-2`
- optional alt model: `seedance-2.0`

### Model Selection Doctrine
Use `sora-2-pro` for:
- hero shots
- continuity-critical shots
- final-quality renders
- high-fidelity closeups

Use `sora-2` for:
- iteration drafts
- speed-first blocking passes
- early scene validation

Use `seedance-2.0` when available for:
- multi-reference control
- stronger multimodal conditioning
- audio/video coupled planning scenarios

### Provider Preference Rules
- prefer character references over textual restatement
- prefer video extension over full rerender when continuity must continue from an approved shot
- prefer targeted edit over destructive rerender when only one local issue fails QC
- never bake provider-specific assumptions into planning logic

## Prompt-Writing Doctrine

Prompts are layered, not dumped as a single blob.

### Prompt Layers
1. subject
2. setting
3. action
4. camera
5. lighting
6. style
7. continuity locks
8. negative constraints
9. output intent

### Prompt Standards
Each prompt must be:
- specific
- visually grounded
- cinematic
- operational
- contradiction-free
- tied to the shot plan

### Forbidden Prompt Style
The skill must reject or repair vague instructions such as:
- “make it cool”
- “very cinematic”
- “beautiful lighting”
- “dramatic scene”

These phrases are only acceptable after expansion into concrete shot language.

## QC Doctrine

Every generation attempt must produce a QC report.

### QC Categories
- identity consistency
- costume consistency
- object continuity
- action completion
- camera adherence
- framing correctness
- motion stability
- anatomy sanity
- prompt adherence
- emotional tone match
- scene transition logic

### QC Verdicts
- `PASS`
- `SOFT_FAIL`
- `HARD_FAIL`

### QC Actions
- `PASS`: approve, chain, extend, or hand off to edit stage
- `SOFT_FAIL`: attempt local repair or short rerender
- `HARD_FAIL`: diagnose root cause, tighten prompt, and rerender with stricter constraints or stronger references

## Retry Doctrine

Retries are diagnostic, not random.

Each retry must identify the concrete failure, such as:
- face drift
- prop drift
- missing action beat
- wrong camera motion
- muddy background
- gesture collapse
- continuity reset
- weak subject salience
- pacing mismatch

Each retry must then map the failure to a specific repair strategy, such as:
- tighter framing
- stronger continuity locks
- fewer competing actions
- shorter duration
- stronger reference conditioning
- shift from full rerender to targeted edit
- shift from draft model to hero model
- shift from free generation to extension mode

## Stop Conditions

The skill stops only when one of the following is true:
1. shot or sequence passes QC thresholds
2. retry budget is exhausted with documented failure reasons
3. missing required user assets block continuity-critical execution
4. provider capabilities cannot satisfy requested operation and no fallback is available

## Explicitly Forbidden

The skill must never:
- jump straight from raw user text to raw generation
- silently change identity
- silently change wardrobe
- silently change props
- silently change handedness
- silently break camera axis
- use vague prompts without shot language
- rerender repeatedly without diagnosis
- bury continuity-critical constraints in optional notes
- mix provider-specific parameters into the normalized planning layer

## Example Workflow

### Example 1: Single Shot
Input: “A nervous woman waits in a dim apartment hallway holding a silver key.”

Expected flow:
1. infer suspense genre and controlled pacing
2. build a hallway environment and low-key lighting logic
3. lock face, overcoat, key, and right-hand ownership
4. define a medium shot with backward dolly
5. build a layered prompt
6. draft on `sora-2`
7. QC for identity, key visibility, and motion clarity
8. escalate to `sora-2-pro` for final render

### Example 2: Multi-Shot Continuity
Input: shot list where character enters a kitchen, opens fridge, removes a bottle, then sits.

Expected flow:
1. create scene state transitions
2. bind prop ownership to the bottle
3. preserve kitchen layout between shots
4. enforce handedness across fridge-open and bottle-retrieve beats
5. extend approved shots where possible
6. use edit mode for local fixes if bottle visibility fails

## Operating Stance

This skill is a production brain.
It prefers planning over improvisation, diagnosis over guesswork, and continuity over novelty.
