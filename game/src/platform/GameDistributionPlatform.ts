/**
 * GameDistribution HTML5 SDK adapter (build with `node tools/build-portal.mjs gamedistribution`,
 * VITE_GD_GAME_ID=<game UUID from the GD developer portal>).
 *
 * Docs (official GD wiki, read 2026-09-24):
 *   https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation — window.GD_OPTIONS =
 *     { gameId, onEvent } set BEFORE https://html5.api.gamedistribution.com/main.min.js loads;
 *     gdsdk.showAd() behind a click; pre-roll + mid-rolls; pause AND mute on SDK_GAME_PAUSE.
 *   https://github.com/GameDistribution/GD-HTML5/wiki/Rewarded-Ads — preloadAd('rewarded'),
 *     showAd('rewarded'); reward only on SDK_REWARDED_WATCH_COMPLETE; enable the rewarded flag
 *     for the game in the GD developer panel.
 *
 * Rules implemented here:
 *  - SDK_GAME_PAUSE = an ad is about to play (mute + pause), SDK_GAME_START = resume (it also
 *    fires at start-up; ignored unless we paused).
 *  - SDK_REWARDED_WATCH_COMPLETE is the only reward signal.
 *  - GD requires a pre-roll and mid-rolls, and ads only on user input outside gameplay: the
 *    pre-roll plays on the first lobby Start click (userBreak), and a round end (midroll) only
 *    marks a break as due — it plays on the next Start click. GD's SDK enforces its own interval.
 *  - Every wait is bounded, so a blocked or silent SDK never freezes the game.
 */
import { loadScript, withTimeout } from './loadScript';
import {
  fallbackInviteUrl,
  roomFromLocation,
  type Platform,
  type PlatformName,
  type RewardedPlacement,
} from './Platform';

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js';
const GAME_ID = (import.meta.env.VITE_GD_GAME_ID as string | undefined) ?? '';
/** Safety net: if showAd() never settles, give control back to the game. */
const AD_SAFETY_TIMEOUT_MS = 60_000;

interface GdEvent {
  name?: string;
  message?: string;
}

interface GdSdk {
  showAd(type?: 'interstitial' | 'rewarded'): Promise<unknown> | unknown;
  preloadAd?(type: 'rewarded'): Promise<unknown> | unknown;
}

interface GdWindow {
  GD_OPTIONS?: { gameId: string; onEvent: (e: GdEvent) => void };
  gdsdk?: GdSdk;
}

export class GameDistributionPlatform implements Platform {
  readonly name: PlatformName = 'gamedistribution';
  onPause: (() => void) | null = null;
  onResume: (() => void) | null = null;

  private sdk: GdSdk | null = null;
  private ready = false;
  private adBusy = false;
  private paused = false;
  private rewardEarned = false;
  /** Pre-roll owed at start-up, mid-roll owed after each round; paid on the next Start click. */
  private breakDue = true;

  get adsAvailable(): boolean {
    return this.ready;
  }

  async init(): Promise<void> {
    if (!GAME_ID) return; // no id → ads can't serve; behave like our own site
    const w = window as unknown as GdWindow;
    let sdkReady: (() => void) | null = null;
    const readyP = new Promise<boolean>((r) => (sdkReady = () => r(true)));
    w.GD_OPTIONS = { gameId: GAME_ID, onEvent: (e) => this.onEvent(e, () => sdkReady?.()) };
    if (!(await loadScript(SDK_URL, 6000))) return;
    await withTimeout(readyP, 6000, false);
    if (!w.gdsdk) return;
    this.sdk = w.gdsdk;
    this.ready = true;
    try {
      void Promise.resolve(this.sdk.preloadAd?.('rewarded')).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  private onEvent(e: GdEvent, sdkReady: () => void): void {
    switch (e?.name) {
      case 'SDK_READY':
        sdkReady();
        break;
      case 'SDK_GAME_PAUSE':
        if (!this.paused) {
          this.paused = true;
          try {
            this.onPause?.();
          } catch {
            /* ignore */
          }
        }
        break;
      case 'SDK_REWARDED_WATCH_COMPLETE':
        this.rewardEarned = true;
        break;
      case 'SDK_GAME_START':
        this.resumeIfPaused();
        break;
      default:
        break;
    }
  }

  private resumeIfPaused(): void {
    if (!this.paused) return;
    this.paused = false;
    try {
      this.onResume?.();
    } catch {
      /* ignore */
    }
  }

  /** Show an ad; showAd() settles when the ad process is done (rejects: no ad / error). */
  private async runAd(type: 'interstitial' | 'rewarded'): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk || !this.ready || this.adBusy) return false;
    this.adBusy = true;
    this.rewardEarned = false;
    try {
      await withTimeout(
        Promise.resolve()
          .then(() => sdk.showAd(type))
          .catch(() => undefined),
        AD_SAFETY_TIMEOUT_MS,
        undefined,
      );
    } catch {
      /* ignore */
    }
    this.resumeIfPaused();
    this.adBusy = false;
    if (type === 'rewarded') {
      try {
        void Promise.resolve(sdk.preloadAd?.('rewarded')).catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
    return type === 'rewarded' && this.rewardEarned;
  }

  /** Called from the lobby Start click: plays the pre-roll / the mid-roll owed since the last round. */
  async userBreak(): Promise<void> {
    if (!this.breakDue || !this.ready) return;
    this.breakDue = false;
    await this.runAd('interstitial');
  }

  loadingFinished(): void {
    /* GD has no loading events; the pre-roll waits for the player's first Start click */
  }

  gameplayStart(): void {
    /* GD has no gameplay events */
  }

  gameplayStop(): void {
    /* GD has no gameplay events */
  }

  happy(): void {
    /* no GD equivalent */
  }

  rewarded(_placement: RewardedPlacement): Promise<boolean> {
    return this.runAd('rewarded');
  }

  midroll(): Promise<void> {
    this.breakDue = true;
    return Promise.resolve();
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
