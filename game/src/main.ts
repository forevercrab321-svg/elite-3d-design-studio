import * as THREE from 'three';
import { loadHdriEnvironment } from './art/environment';
import { MaterialLibrary } from './art/materials';
import type { Quality } from './art/postfx';
import { buildTextureKit } from './art/textures';
import { Input } from './core/Input';
import { runStory } from './story';
import { runArena } from './arena/arenaMain';

/**
 * GROW EVERYTHING — entry point.
 *   ?mode=story|arena  (default arena; ?test=1 defaults to story for the story playtests; #story also works)
 *   ?net=local&room=X  arena over BroadcastChannel between tabs (tests); on claude.ai the room capability is used
 *   ?test=1          no RAF loop; the playtest harness advances time through window.__GROW__ / __ARENA__
 *   ?seed=N          deterministic layout / effects seed
 *   ?quality=high|medium|low   render tier (default: high on desktop, medium on touch devices);
 *                    also #high / #medium / #low where the query string is unavailable (hosted page)
 *   ?tonemap=agx|aces|neutral  tone mapping curve for look development (default agx)
 */
const params = new URLSearchParams(location.search);
const testMode = params.has('test');
const seed = Number(params.get('seed') ?? 1337);
const touch = matchMedia('(pointer: coarse)').matches;
const hashQuality = ['high', 'medium', 'low'].includes(location.hash.slice(1)) ? (location.hash.slice(1) as Quality) : null;
const quality = (params.get('quality') as Quality | null) ?? hashQuality ?? (touch ? 'medium' : 'high');

const renderer = new THREE.WebGLRenderer({ antialias: quality === 'low', preserveDrawingBuffer: testMode, powerPreference: 'high-performance' });
// Retina at 2× under an MSAA HalfFloat chain + GTAO + bloom exhausts integrated GPUs (black
// frames, GPU resets). Cap the render scale; the live loop lowers it further if frames drop.
const maxPixelRatio = touch ? 1.25 : quality === 'high' ? 1.5 : quality === 'medium' ? 1.25 : 1;
renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const TONEMAPS = { agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping } as const;
renderer.toneMapping = TONEMAPS[(params.get('tonemap') as keyof typeof TONEMAPS) ?? 'agx'] ?? THREE.AgXToneMapping;
renderer.toneMappingExposure = Number(params.get('exposure') ?? 1.0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.info.autoReset = false; // count every pass of a frame (composer renders the scene more than once)
document.body.appendChild(renderer.domElement);

const kit = buildTextureKit(quality === 'low' ? 256 : 512, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
const lib = new MaterialLibrary(kit);
const input = new Input(renderer.domElement);
// Real photographed HDRI for image-based lighting; each mode falls back to a sky bake.
const hdri = await loadHdriEnvironment(renderer, `${import.meta.env.BASE_URL}hdri/pedestrian_overpass_1k.hdr`).catch((e) => {
  console.warn('HDRI unavailable, using sky bake', e);
  return null;
});
const ctx = { renderer, lib, input, quality, testMode, seed, params, hdri };
const mode = params.get('mode') ?? (location.hash === '#story' ? 'story' : testMode ? 'story' : 'arena');
if (mode === 'story') runStory(ctx);
else await runArena(ctx);
