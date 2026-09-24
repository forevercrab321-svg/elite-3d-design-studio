import qrcode from 'qrcode-generator';
import { L, lang } from '../i18n';

/**
 * One-tap sharing. What each app actually allows from a web page:
 *  - System share sheet (phones): the real one-tap path to WeChat, Douyin/TikTok, Xiaohongshu,
 *    Instagram… whatever is installed, with the link already filled in.
 *  - WeChat / Xiaohongshu / Douyin / TikTok / Instagram have no web "share this link" URL: we
 *    copy the invite text, then open the app (phones) or its website (desktop) so the player
 *    only has to paste. WeChat on desktop gets a QR code to scan with the phone instead.
 *  - WhatsApp / X / Telegram / Facebook / LINE take the text or link in their share URL.
 */
export type ShareChannel = 'system' | 'wechat' | 'xhs' | 'douyin' | 'tiktok' | 'instagram' | 'whatsapp' | 'x' | 'telegram' | 'facebook' | 'line' | 'copy';

export interface ChannelDef {
  id: ShareChannel;
  label: string;
  color: string;
  icon: string;
  /** App URL scheme opened on phones (after copying), when the app has no share URL. */
  app?: string;
  /** Website opened on desktop (after copying). */
  web?: string;
  /** Share URL with the text/link prefilled. */
  intent?: (url: string, text: string) => string;
}

const enc = encodeURIComponent;

export function channels(): ChannelDef[] {
  const zh = lang === 'zh';
  const cn: ChannelDef[] = [
    { id: 'wechat', label: L('微信', 'WeChat'), color: '#07c160', icon: '💬', app: 'weixin://' },
    { id: 'xhs', label: L('小红书', 'Xiaohongshu'), color: '#ff2442', icon: '📕', app: 'xhsdiscover://', web: 'https://www.xiaohongshu.com/' },
    { id: 'douyin', label: L('抖音', 'Douyin'), color: '#161823', icon: '🎵', app: 'snssdk1128://', web: 'https://www.douyin.com/' },
  ];
  const intl: ChannelDef[] = [
    { id: 'tiktok', label: 'TikTok', color: '#010101', icon: '🎵', app: 'snssdk1233://', web: 'https://www.tiktok.com/' },
    { id: 'instagram', label: 'Instagram', color: '#d62976', icon: '📸', app: 'instagram://app', web: 'https://www.instagram.com/' },
    { id: 'whatsapp', label: 'WhatsApp', color: '#25d366', icon: '🟢', intent: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
    { id: 'x', label: 'X', color: '#000000', icon: '𝕏', intent: (u, t) => `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
    { id: 'telegram', label: 'Telegram', color: '#229ed9', icon: '✈️', intent: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
    { id: 'facebook', label: 'Facebook', color: '#1877f2', icon: 'f', intent: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
    { id: 'line', label: 'LINE', color: '#06c755', icon: '💚', intent: (u, t) => `https://social-plugins.line.me/lineit/share?url=${enc(u)}&text=${enc(t)}` },
  ];
  // Chinese players see the Chinese apps first; everyone sees all of them.
  return zh ? [...cn, ...intl] : [intl[0], intl[1], ...cn, ...intl.slice(2)];
}

export const isPhone = (): boolean => matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API refused (iframe / old browser): the textarea fallback.
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Open a URL or app scheme without navigating the game away. */
export function openOut(url: string): void {
  if (/^https?:/.test(url)) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  // App schemes (phones): hand the URL to the OS; if the app is missing nothing happens and the
  // copied text is still on the clipboard.
  try {
    window.location.href = url;
  } catch {
    /* blocked in this frame */
  }
}

/** SVG QR code for a URL (WeChat on desktop: scan with the phone). */
export function qrSvg(url: string): string {
  const q = qrcode(0, 'M');
  q.addData(url);
  q.make();
  return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
}
