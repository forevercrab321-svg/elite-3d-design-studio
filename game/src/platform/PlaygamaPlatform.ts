/**
 * Playgama Bridge adapter (build with `node tools/build-portal.mjs playgama`).
 *
 * API source: the official @playgama/bridge 2.3.1 npm package (github.com/Playgama/bridge), its
 * README and type definitions (wiki.playgama.com and bridge.playgama.com are blocked from the
 * build sandbox):
 *   <script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"> → window.bridge
 *   bridge.initialize() — reads playgama-bridge-config.json next to index.html
 *   bridge.platform.sendMessage('game_ready' | 'gameplay_started' | 'gameplay_stopped')
 *   bridge.advertisement.showInterstitial() / showRewarded() with
 *     'interstitial_state_changed' (loading | opened | closed | failed) and
 *     'rewarded_state_changed' (loading | opened | rewarded | closed | failed)
 *   bridge.platform 'pause_state_changed' / 'audio_state_changed'
 *
 * Rules implemented here:
 *  - game_ready once loading is done (it removes Playgama's loading screen).
 *  - Pause and mute on 'opened', resume on 'closed' or 'failed'.
 *  - Reward only on 'rewarded'.
 *  - Every wait is bounded, so a blocked or silent SDK never freezes the game.
 */
import { loadScript, withTimeout } from './loadScript';
import {
  MIDROLL_MIN_GAP_MS,
  fallbackInviteUrl,
  roomFromLocation,
  type Platform,
  type PlatformName,
  type RewardedPlacement,
} from './Platform';

const SDK_URL = 'https://bridge.playgama.com/v2/stable/playgama-bridge.js';
/** An ad call that never reports 'opened' is treated as "no ad". */
const AD_START_TIMEOUT_MS = 8_000;
/** Safety net if an opened ad never reports 'closed'. */
const AD_SAFETY_TIMEOUT_MS = 120_000;

type Listener = (state: unknown) => void;

interface PgEmitter {
  on?(event: string, fn: Listener): void;
  off?(event: string, fn?: Listener): void;
}

interface PgBridge {
  initialize(options?: Record<string, unknown>): Promise<void>;
  platform?: PgEmitter & {
    sendMessage?(message: string): Promise<unknown> | unknown;
  };
  advertisement?: PgEmitter & {
    isInterstitialSupported?: boolean;
    isRewardedSupported?: boolean;
    showInterstitial?(placement?: string | null): void;
    showRewarded?(placement?: string | null): void;
  };
}

export class PlaygamaPlatform implements Platform {
  readonly name: PlatformName = 'playgama';
  onPause: (() => void) | null = null;
  onResume: (() => void) | null = null;

  private bridge: PgBridge | null = null;
  private ready = false;
  private adBusy = false;
  private paused = false;
  private inGameplay = false;
  private loadingSent = false;
  private lastMidrollAt = Date.now();

  get adsAvailable(): boolean {
    return this.ready && !!this.bridge?.advertisement?.isRewardedSupported;
  }

  async init(): Promise<void> {
    if (!(await loadScript(SDK_URL, 6000))) return;
    const bridge = (window as unknown as { bridge?: PgBridge }).bridge;
    if (!bridge?.initialize) return;
    const ok = await withTimeout(
      Promise.resolve()
        .then(() => bridge.initialize())
        .then(() => true),
      8000,
      false,
    );
    if (!ok) return;
    this.bridge = bridge;
    this.ready = true;
    // The portal pauses or mutes the game (tab hidden, its own UI): same hooks as an ad.
    try {
      bridge.platform?.on?.('pause_state_changed', (s) => (s ? this.pause() : this.resume()));
      bridge.platform?.on?.('audio_state_changed', (on) => (on ? this.resume() : this.pause()));
    } catch {
      /* ignore */
    }
  }

  private send(message: string): void {
    try {
      void Promise.resolve(this.bridge?.platform?.sendMessage?.(message)).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  private pause(): void {
    if (this.paused) return;
    this.paused = true;
    try {
      this.onPause?.();
    } catch {
      /* ignore */
    }
  }

  private resume(): void {
    if (!this.paused) return;
    this.paused = false;
    try {
      this.onResume?.();
    } catch {
      /* ignore */
    }
  }

  /** Show one ad and resolve when it is over; true only for an earned reward. */
  private runAd(kind: 'interstitial' | 'rewarded'): Promise<boolean> {
    const ads = this.bridge?.advertisement;
    const show = kind === 'rewarded' ? ads?.showRewarded : ads?.showInterstitial;
    const supported = kind === 'rewarded' ? ads?.isRewardedSupported : ads?.isInterstitialSupported;
    if (!ads || !show || !supported || !this.ready || this.adBusy) return Promise.resolve(false);
    this.adBusy = true;
    const event = `${kind}_state_changed`;
    const wasPlaying = this.inGameplay;
    if (wasPlaying) this.gameplayStop();
    return new Promise<boolean>((resolve) => {
      let earned = false;
      let opened = false;
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        clearTimeout(startTimer);
        clearTimeout(safetyTimer);
        try {
          ads.off?.(event, onState);
        } catch {
          /* ignore */
        }
        this.resume();
        this.adBusy = false;
        if (wasPlaying) this.gameplayStart();
        resolve(earned);
      };
      const onState: Listener = (state) => {
        if (state === 'opened') {
          opened = true;
          this.pause();
        } else if (state === 'rewarded') earned = true;
        else if (state === 'closed' || state === 'failed') finish();
      };
      const startTimer = setTimeout(() => {
        if (!opened) finish();
      }, AD_START_TIMEOUT_MS);
      const safetyTimer = setTimeout(finish, AD_SAFETY_TIMEOUT_MS);
      try {
        ads.on?.(event, onState);
        show.call(ads);
      } catch {
        finish();
      }
    });
  }

  loadingFinished(): void {
    if (this.loadingSent) return;
    this.loadingSent = true;
    this.send('game_ready');
  }

  gameplayStart(): void {
    if (this.inGameplay) return;
    this.inGameplay = true;
    this.send('gameplay_started');
  }

  gameplayStop(): void {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    this.send('gameplay_stopped');
  }

  happy(): void {
    /* no Playgama equivalent */
  }

  rewarded(_placement: RewardedPlacement): Promise<boolean> {
    return this.runAd('rewarded').then((earned) => {
      this.lastMidrollAt = Date.now();
      return earned;
    });
  }

  async midroll(): Promise<void> {
    if (Date.now() - this.lastMidrollAt < MIDROLL_MIN_GAP_MS) return;
    this.lastMidrollAt = Date.now();
    await this.runAd('interstitial');
  }

  inviteLink(_room: string): string | null {
    return null;
  }

  inviteLinkAsync(room: string): Promise<string> {
    return Promise.resolve(fallbackInviteUrl(room));
  }

  invitedRoom(): string | null {
    return roomFromLocation();
  }

  playerName(): Promise<string | null> {
    return Promise.resolve(null);
  }
}
