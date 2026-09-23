/**
 * Poki SDK v2 adapter.
 *
 * Docs (official):
 *   https://sdk.poki.com/html5                 — script URL, init, gameLoadingFinished, gameplayStart/Stop,
 *                                                commercialBreak, rewardedBreak, shareableURL / getURLParam
 *   https://sdk.poki.com/sdk-documentation     — general rules
 *   https://developers.poki.com/guide/sdk-overview — SDK overview & events
 * (sdk.poki.com / developers.poki.com were not reachable from the build
 *  sandbox; the API was cross-checked against the docs' search snippets and the
 *  typed @poki/sdk v0.0.5 wrapper, whose README points at the same v2 script.)
 *
 * Rules implemented here:
 *  - init() may reject when an ad blocker is active: keep playing, ads unavailable.
 *  - gameLoadingFinished() once, when loading is complete.
 *  - gameplayStart()/gameplayStop() are forwarded (deduplicated). Breaks are
 *    requested outside gameplay: we stop gameplay before a break and restart
 *    it afterwards if the game was playing.
 *  - commercialBreak(): Poki decides whether an ad actually plays; we add a
 *    90 s client-side minimum gap. rewardedBreak() resets that timer (Poki
 *    does the same server-side).
 *  - Pause/mute in the onStart callback (ad actually started), resume after the
 *    promise settles. rewardedBreak() resolves true only if the reward is earned.
 */
import { loadScript, safeCall, withTimeout } from './loadScript';
import {
  INVITE_PARAM,
  MIDROLL_MIN_GAP_MS,
  fallbackInviteUrl,
  roomFromLocation,
  type Platform,
  type PlatformName,
  type RewardedPlacement,
} from './Platform';

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
/** Safety net if a break promise never settles. */
const AD_SAFETY_TIMEOUT_MS = 120_000;

interface PokiRewardedParams {
  onStart?: () => void;
  size?: 'small' | 'medium' | 'large';
}

interface PokiSdk {
  init(options?: { debug?: boolean }): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(onStartOrArgs?: (() => void) | PokiRewardedParams): Promise<boolean>;
  shareableURL?(params?: Record<string, string>): Promise<string>;
  getURLParam?(key: string): string;
  openExternalLink?(url: string): void;
}

interface PokiWindow {
  PokiSDK?: PokiSdk;
}

export class PokiPlatform implements Platform {
  readonly name: PlatformName = 'poki';
  onPause: (() => void) | null = null;
  onResume: (() => void) | null = null;

  private sdk: PokiSdk | null = null;
  private ready = false;
  private inGameplay = false;
  private adBusy = false;
  private loadingDone = false;
  private lastMidrollAt = Date.now();
  private readonly shareCache = new Map<string, string>();

  get adsAvailable(): boolean {
    return this.ready;
  }

  async init(): Promise<void> {
    const loaded = await loadScript(SDK_URL, 6000);
    if (!loaded) return;
    const sdk = (window as unknown as PokiWindow).PokiSDK;
    if (!sdk) return;
    // SDK object exists → lifecycle events work even if init rejects (ad blocker).
    this.sdk = sdk;
    const ok = await withTimeout(
      sdk.init().then(() => true),
      6000,
      false,
    );
    this.ready = ok;
  }

  loadingFinished(): void {
    if (!this.sdk || this.loadingDone) return;
    this.loadingDone = true;
    const sdk = this.sdk;
    safeCall(() => sdk.gameLoadingFinished());
  }

  gameplayStart(): void {
    if (this.inGameplay) return;
    this.inGameplay = true;
    const sdk = this.sdk;
    if (sdk && !this.adBusy) safeCall(() => sdk.gameplayStart());
  }

  gameplayStop(): void {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    const sdk = this.sdk;
    if (sdk && !this.adBusy) safeCall(() => sdk.gameplayStop());
  }

  happy(): void {
    /* no Poki equivalent */
  }

  async rewarded(_placement: RewardedPlacement): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk || !this.ready) return false;
    const earned = await this.runBreak((onStart) => sdk.rewardedBreak({ onStart, size: 'medium' }));
    this.lastMidrollAt = Date.now();
    return earned === true;
  }

  async midroll(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk || !this.ready) return;
    if (Date.now() - this.lastMidrollAt < MIDROLL_MIN_GAP_MS) return;
    this.lastMidrollAt = Date.now();
    await this.runBreak((onStart) => sdk.commercialBreak(onStart).then(() => true));
  }

  inviteLink(room: string): string | null {
    // shareableURL() is async on Poki: return a cached result if we have one,
    // otherwise kick off the request and let the caller fall back to location.href.
    const cached = this.shareCache.get(room);
    if (cached) return cached;
    void this.inviteLinkAsync(room);
    return null;
  }

  async inviteLinkAsync(room: string): Promise<string> {
    const cached = this.shareCache.get(room);
    if (cached) return cached;
    const sdk = this.sdk;
    if (sdk?.shareableURL) {
      try {
        const url = await withTimeout(sdk.shareableURL({ [INVITE_PARAM]: room }), 3000, '');
        if (typeof url === 'string' && url.length > 0) {
          this.shareCache.set(room, url);
          return url;
        }
      } catch {
        /* fall through */
      }
    }
    return fallbackInviteUrl(room);
  }

  invitedRoom(): string | null {
    const sdk = this.sdk;
    if (sdk?.getURLParam) {
      try {
        const v = sdk.getURLParam(INVITE_PARAM);
        if (v) return v;
      } catch {
        /* ignore */
      }
    }
    return roomFromLocation();
  }

  /** Poki forbids raw external links; route any outbound link through this. */
  openExternalLink(url: string): void {
    const sdk = this.sdk;
    if (sdk?.openExternalLink) safeCall(() => sdk.openExternalLink!(url));
  }

  private async runBreak(start: (onStart: () => void) => Promise<boolean>): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk || this.adBusy) return false;
    this.adBusy = true;
    if (this.inGameplay) safeCall(() => sdk.gameplayStop());
    let paused = false;
    const onStart = (): void => {
      if (paused) return;
      paused = true;
      try {
        this.onPause?.();
      } catch {
        /* ignore */
      }
    };
    let result = false;
    try {
      result = await withTimeout(start(onStart), AD_SAFETY_TIMEOUT_MS, false);
    } catch {
      result = false;
    }
    this.adBusy = false;
    if (paused) {
      try {
        this.onResume?.();
      } catch {
        /* ignore */
      }
    }
    if (this.inGameplay) safeCall(() => sdk.gameplayStart());
    return result;
  }
}
