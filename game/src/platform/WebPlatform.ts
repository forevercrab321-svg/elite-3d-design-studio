/**
 * Our own website: no SDK, no ads. Everything is a no-op; rewarded ads are
 * unavailable (adsAvailable = false → hide revive / double-coin ad buttons).
 */
import {
  fallbackInviteUrl,
  roomFromLocation,
  type Platform,
  type PlatformName,
  type RewardedPlacement,
} from './Platform';

export class WebPlatform implements Platform {
  readonly name: PlatformName = 'web';
  readonly adsAvailable = false;
  onPause: (() => void) | null = null;
  onResume: (() => void) | null = null;

  init(): Promise<void> {
    return Promise.resolve();
  }
  loadingFinished(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}
  happy(): void {}
  rewarded(_placement: RewardedPlacement): Promise<boolean> {
    return Promise.resolve(false);
  }
  midroll(): Promise<void> {
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
}
