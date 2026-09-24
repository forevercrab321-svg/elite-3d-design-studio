/**
 * CrazyGames HTML5 SDK v3 adapter.
 *
 * Docs (official):
 *   https://docs.crazygames.com/sdk/intro/          — script URL, SDK.init(), SDK.environment
 *   https://docs.crazygames.com/sdk/video-ads/      — ad.requestAd('midgame'|'rewarded', {adStarted, adFinished, adError})
 *   https://docs.crazygames.com/sdk/game/           — gameplayStart/Stop, loadingStart/Stop, happytime,
 *                                                    inviteLink / getInviteParam / showInviteButton, settings.muteAudio
 *   https://docs.crazygames.com/requirements/ads/   — mute audio + pause while an ad plays
 * (docs.crazygames.com was not reachable from the build sandbox; the API was
 *  cross-checked against the docs' search snippets and the typed
 *  @adlad/plugin-crazygames v1.1.0 wrapper, which loads the same v3 script.)
 *
 * Rules implemented here:
 *  - Mute/pause only when the ad actually STARTS (adStarted), resume on adFinished OR adError.
 *  - Reward only on adFinished for 'rewarded'; adError ⇒ no reward.
 *  - SDK.environment 'disabled' (non-CrazyGames domain) ⇒ every call throws, so we go no-op.
 *    'local' (localhost) ⇒ demo ads, useful for testing with ?platform=crazygames.
 *  - settings.muteAudio (platform-wide mute) is forwarded as a pause/resume-free
 *    `muteAudio` getter + listener — see `onMuteSettingChange`.
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

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
/** Safety net: if the SDK never calls back, give control back to the game. */
const AD_SAFETY_TIMEOUT_MS = 120_000;

type CgEnvironment = 'crazygames' | 'local' | 'disabled';
type CgAdType = 'midgame' | 'rewarded';

interface CgAdError {
  code?: string;
  message?: string;
}

interface CgAdCallbacks {
  adStarted(): void;
  adFinished(): void;
  adError(error: CgAdError | string): void;
}

interface CgSdk {
  init(): Promise<void>;
  environment?: CgEnvironment;
  ad: {
    requestAd(type: CgAdType, callbacks: CgAdCallbacks): unknown;
  };
  game: {
    gameplayStart(): unknown;
    gameplayStop(): unknown;
    loadingStart(): unknown;
    loadingStop(): unknown;
    happytime(): unknown;
    inviteLink(params: Record<string, string>): unknown;
    getInviteParam?(key: string): string | null;
    showInviteButton?(params: Record<string, string>): unknown;
    hideInviteButton?(): unknown;
    settings?: { muteAudio?: boolean; disableChat?: boolean };
    addSettingsChangeListener?(listener: (settings: { muteAudio?: boolean }) => void): void;
  };
  /** SDK v3 user module (docs.crazygames.com/sdk/user/); getUser() resolves null for guests. */
  user?: {
    getUser?(): Promise<{ username?: string } | null>;
  };
}

interface CgWindow {
  CrazyGames?: { SDK?: CgSdk };
}

export class CrazyGamesPlatform implements Platform {
  readonly name: PlatformName = 'crazygames';
  onPause: (() => void) | null = null;
  onResume: (() => void) | null = null;
  /** Called with true/false when the CrazyGames site-wide mute setting changes (honour it over in-game settings). */
  onMuteSettingChange: ((muted: boolean) => void) | null = null;

  private sdk: CgSdk | null = null;
  private ready = false;
  private inGameplay = false;
  private adBusy = false;
  private lastMidrollAt = Date.now();
  private loadingStopped = false;

  get adsAvailable(): boolean {
    return this.ready;
  }

  /** CrazyGames site-wide "mute audio" setting; takes priority over in-game audio settings. */
  get muteAudio(): boolean {
    return !!this.sdk?.game.settings?.muteAudio;
  }

  async init(): Promise<void> {
    const loaded = await loadScript(SDK_URL, 6000);
    if (!loaded) return;
    const sdk = (window as unknown as CgWindow).CrazyGames?.SDK;
    if (!sdk) return;
    const ok = await withTimeout(
      sdk.init().then(() => true),
      6000,
      false,
    );
    if (!ok) return;
    if (sdk.environment === 'disabled') return;
    this.sdk = sdk;
    this.ready = true;
    safeCall(() => sdk.game.loadingStart());
    try {
      sdk.game.addSettingsChangeListener?.((s) => {
        this.onMuteSettingChange?.(!!s?.muteAudio);
      });
    } catch {
      /* ignore */
    }
  }

  async playerName(): Promise<string | null> {
    const get = this.sdk?.user?.getUser;
    if (!get || !this.sdk?.user) return null;
    const user = this.sdk.user;
    const u = await withTimeout(
      Promise.resolve()
        .then(() => get.call(user))
        .catch(() => null),
      2000,
      null,
    );
    return typeof u?.username === 'string' && u.username ? u.username : null;
  }

  loadingFinished(): void {
    if (!this.sdk || this.loadingStopped) return;
    this.loadingStopped = true;
    const sdk = this.sdk;
    safeCall(() => sdk.game.loadingStop());
  }

  gameplayStart(): void {
    if (this.inGameplay) return;
    this.inGameplay = true;
    const sdk = this.sdk;
    if (sdk && !this.adBusy) safeCall(() => sdk.game.gameplayStart());
  }

  gameplayStop(): void {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    const sdk = this.sdk;
    if (sdk && !this.adBusy) safeCall(() => sdk.game.gameplayStop());
  }

  happy(): void {
    const sdk = this.sdk;
    if (sdk) safeCall(() => sdk.game.happytime());
  }

  async rewarded(_placement: RewardedPlacement): Promise<boolean> {
    const ok = await this.showAd('rewarded');
    if (ok) this.lastMidrollAt = Date.now();
    return ok;
  }

  async midroll(): Promise<void> {
    if (Date.now() - this.lastMidrollAt < MIDROLL_MIN_GAP_MS) return;
    this.lastMidrollAt = Date.now();
    await this.showAd('midgame');
  }

  inviteLink(room: string): string | null {
    const sdk = this.sdk;
    if (!sdk) return null;
    try {
      const r = sdk.game.inviteLink({ [INVITE_PARAM]: room });
      return typeof r === 'string' && r.length > 0 ? r : null;
    } catch {
      return null;
    }
  }

  async inviteLinkAsync(room: string): Promise<string> {
    const sdk = this.sdk;
    if (sdk) {
      try {
        const r = await withTimeout(
          Promise.resolve(sdk.game.inviteLink({ [INVITE_PARAM]: room })),
          3000,
          null,
        );
        if (typeof r === 'string' && r.length > 0) return r;
      } catch {
        /* fall through */
      }
    }
    return fallbackInviteUrl(room);
  }

  invitedRoom(): string | null {
    const sdk = this.sdk;
    if (sdk?.game.getInviteParam) {
      try {
        const v = sdk.game.getInviteParam(INVITE_PARAM);
        if (v) return v;
      } catch {
        /* ignore */
      }
    }
    return roomFromLocation();
  }

  /** CrazyGames' own "Invite" button in the site UI (instant multiplayer). */
  showInviteButton(room: string): void {
    const sdk = this.sdk;
    if (sdk?.game.showInviteButton) safeCall(() => sdk.game.showInviteButton!({ [INVITE_PARAM]: room }));
  }

  hideInviteButton(): void {
    const sdk = this.sdk;
    if (sdk?.game.hideInviteButton) safeCall(() => sdk.game.hideInviteButton!());
  }

  private showAd(type: CgAdType): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk || !this.ready || this.adBusy) return Promise.resolve(false);
    this.adBusy = true;
    const wasPlaying = this.inGameplay;
    if (wasPlaying) safeCall(() => sdk.game.gameplayStop());

    return new Promise<boolean>((resolve) => {
      let paused = false;
      let done = false;
      const finish = (earned: boolean): void => {
        if (done) return;
        done = true;
        window.clearTimeout(safety);
        this.adBusy = false;
        if (paused) {
          paused = false;
          try {
            this.onResume?.();
          } catch {
            /* game handler error must not break the ad flow */
          }
        }
        if (this.inGameplay) safeCall(() => sdk.game.gameplayStart());
        resolve(earned);
      };
      const safety = window.setTimeout(() => finish(false), AD_SAFETY_TIMEOUT_MS);
      try {
        sdk.ad.requestAd(type, {
          adStarted: () => {
            if (done || paused) return;
            paused = true;
            try {
              this.onPause?.();
            } catch {
              /* ignore */
            }
          },
          adFinished: () => finish(true),
          adError: () => finish(false),
        });
      } catch {
        finish(false);
      }
    });
  }
}
