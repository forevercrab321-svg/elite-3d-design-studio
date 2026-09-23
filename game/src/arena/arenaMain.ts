import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';
import { bakeSkyEnvironment } from '../art/environment';
import { RenderPipeline } from '../art/postfx';
import { installRenderGuards, type AppContext } from '../app';
import { FIXED_DT } from '../game/Game';
import { LocalNet, RoomNet, SoloNet, type Net } from '../net/Net';
import { CITIES, cityById } from '../world/cities';
import type { CityDef } from '../world/city';
import { ArenaGame } from './ArenaGame';
import { ArenaSession, type MatchState } from './ArenaSession';
import { ArenaUi } from './ArenaUi';
import { award } from './progress';

/**
 * Arena mode entry: pick the transport (claude.ai room → online with friends; ?net=local →
 * tabs of this browser; otherwise solo vs AI), run the lobby, and drive whichever ArenaGame the
 * session starts. While in the lobby, the selected city is shown as a slow flyover.
 */
export async function runArena(ctx: AppContext): Promise<void> {
  const { renderer, lib, input, quality, testMode, params } = ctx;
  const nickname = params.get('name') ?? `Player ${Math.floor(Math.random() * 900 + 100)}`;
  let net: Net | null = null;
  if (params.get('net') === 'local') net = new LocalNet(params.get('room') ?? 'dev', nickname);
  else if (params.get('net') !== 'solo') net = await RoomNet.connect();
  const modeLabel = !net ? '单人' : net.kind === 'room' ? '在线房间' : net.kind === 'local' ? '本地多开' : '单人';
  net ??= new SoloNet(nickname);

  let game: ArenaGame | null = null;
  let preview: ArenaGame | null = null;
  let pipeline: RenderPipeline | null = null;
  let shownResultsEp = -1;
  const audio = testMode ? null : new AudioEngine();

  const envFor = (scene: THREE.Scene, city: CityDef) => {
    scene.environment = ctx.hdri?.texture ?? bakeSkyEnvironment(renderer, city.palette);
    scene.environmentRotation.y = ctx.hdri?.rotationFor(city.palette.sunDirection) ?? 0;
    scene.environmentIntensity = city.palette.envIntensity;
  };
  const usePipeline = (g: ArenaGame) => {
    pipeline?.dispose();
    pipeline = new RenderPipeline(renderer, g.scene, g.camera, quality);
    resize();
  };
  const buildPreview = (cityId: string) => {
    const city = cityById(cityId) ?? CITIES[0];
    if (preview?.city === city) return;
    preview?.dispose();
    preview = new ArenaGame(input, lib, city, 7, null, [], () => false);
    preview.hud.dispose();
    envFor(preview.scene, city);
    usePipeline(preview);
  };

  const session: ArenaSession = new ArenaSession(
    net,
    {
      startGame(state: MatchState, localId: string | null): ArenaGame {
        const city = cityById(state.city) ?? CITIES[0];
        preview?.dispose();
        preview = null;
        game?.dispose();
        const g = new ArenaGame(input, lib, city, state.seed, localId, state.roster, (): boolean => session.isHost());
        game = g;
        g.onEvent = (e) => audio?.handle(e);
        envFor(g.scene, city);
        usePipeline(g);
        ui.resetRound();
        ui.hideResults();
        ui.renderLobby();
        return g;
      },
      endGame() {
        game?.dispose();
        game = null;
        ui.hideResults();
        ui.resetRound();
        buildPreview(session.city);
        ui.renderLobby();
      },
      changed() {
        lobbyDirty = true;
      },
    },
    nickname,
  );
  const ui = new ArenaUi(session, modeLabel);
  ui.onStory = () => {
    location.hash = 'story';
    location.reload();
  };
  let lobbyDirty = true;
  let lobbySig = '';
  buildPreview(session.city);

  function resize(): void {
    renderer.setSize(innerWidth, innerHeight);
    pipeline?.setSize(innerWidth, innerHeight);
    const cam = (game ?? preview)?.camera;
    if (cam) {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
    }
  }
  addEventListener('resize', resize);
  renderer.domElement.addEventListener('click', () => {
    if (game?.local?.eliminated || (game && !game.local)) game.nextSpectate();
  });

  let flyT = 0;
  function tick(dt: number): void {
    session.update(dt);
    if (game) {
      game.step(dt);
      ui.renderRound(game);
      if (session.match.ph === 'results' && shownResultsEp !== session.match.ep) {
        shownResultsEp = session.match.ep;
        const standings = session.match.standings ?? game.standings();
        const me = standings.find((s) => s.id === session.selfId());
        const earned = me && !testMode ? award(me.rank, me.kills, game.city.level) : { coins: 0, unlocked: null };
        ui.showResults(standings, session.selfId(), earned);
      }
    } else if (preview) {
      // Lobby flyover around the city centre.
      flyT += dt * 0.05;
      const b = preview.city.bounds;
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;
      const r = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.55;
      preview.camera.position.set(cx + Math.cos(flyT) * r, 55, cz + Math.sin(flyT) * r);
      preview.camera.lookAt(cx, 0, cz);
      if (session.city !== preview.city.id) buildPreview(session.city);
    }
    // Lobby re-renders only when something it shows changed (presence updates arrive at 30 Hz).
    if (lobbyDirty && session.match.ph === 'lobby') {
      lobbyDirty = false;
      const sig = JSON.stringify([session.lobbyPlayers(), session.hostId(), session.city, session.bots, session.net.peers().length, session.vehicle, session.ready, session.canStart()]);
      if (sig !== lobbySig) {
        lobbySig = sig;
        ui.renderLobby();
      }
    }
  }

  function render(): void {
    const g = game ?? preview;
    if (!g || !pipeline) return;
    renderer.info.reset();
    const focus = g.cameraTarget();
    pipeline.setAoScale(0.6 + (focus?.diameter ?? 2) * 0.9);
    pipeline.output?.setTime(g.time);
    g.sky.userData.uniforms.uTime.value = g.time;
    g.world.dressing.update(g.time, g.rig.distance * 0.85);
    g.camera.updateMatrixWorld();
    g.world.cull(g.camera);
    pipeline.render();
  }

  resize();
  if (!testMode) {
    const adapt = installRenderGuards(renderer, () => pipeline!, resize);
    let last = performance.now();
    let acc = 0;
    renderer.setAnimationLoop((now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= FIXED_DT) {
        tick(FIXED_DT);
        acc -= FIXED_DT;
      }
      const me = game?.local;
      if (me) audio?.update(Math.min(1, Math.abs(me.speed) / game!.topSpeed(me)), me.diameter, me.tier);
      render();
      adapt(dt);
    });
  } else render();

  // Test hooks (deterministic stepping in test mode; the transport stays asynchronous).
  (window as unknown as Record<string, unknown>).__ARENA__ = {
    ready: true,
    session,
    game: () => game,
    preview: () => preview,
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, objects: (game ?? preview)?.world.objects.length ?? 0 }),
    step: (seconds: number) => {
      for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) tick(FIXED_DT);
      return summary();
    },
    render: () => render(),
    summary: () => summary(),
    /** Let every local machine be driven by the AI (automated playtests). */
    autopilot: (on: boolean) => {
      autopilot = on;
    },
  };
  let autopilot = false;
  // Autopilot: the local machine uses the AI rival's brain through the same intents path.
  const botBrain = new (await import('./ArenaBot')).ArenaBot(1234);
  const readInput = input.read.bind(input);
  input.read = () => {
    const g = game;
    if (!autopilot || !g?.local || !g.local.alive) return readInput();
    const i = botBrain.intents(g, g.local);
    const sy = Math.sin(g.rig.yaw);
    const cy = Math.cos(g.rig.yaw);
    // Invert the camera mapping so the game turns these back into the bot's world direction.
    return { forward: -sy * i.dx - cy * i.dz, right: cy * i.dx - sy * i.dz, dash: i.dash, restart: false };
  };

  function summary() {
    const g = game;
    return {
      phase: session.match.ph,
      ep: session.match.ep,
      host: session.hostId(),
      me: session.selfId(),
      isHost: session.isHost(),
      city: session.match.city,
      peers: session.net.peers().length,
      lobby: session.lobbyPlayers().map((p) => ({ id: p.id, name: p.name, vehicle: p.vehicle, ready: p.ready })),
      t: g?.matchTime ?? 0,
      climaxLeft: g?.climaxLeft() ?? null,
      grants: g?.grants.size ?? 0,
      actors: g?.actors.map((a) => ({ id: a.id, name: a.name, kind: a.kind, owned: a.owned, mass: Math.round(a.mass), d: +a.diameter.toFixed(2), x: +a.x.toFixed(1), z: +a.z.toFixed(1), lives: a.lives, alive: a.alive, out: a.eliminated, kills: a.kills, objects: a.objects })) ?? [],
      standings: session.match.standings ?? null,
    };
  }
}
