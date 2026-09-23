/**
 * Cosmetic catalog (design rule: sell looks and laughs, never power). Skins recolour the
 * machine's shell and intake glow; horns change the sound everyone hears on `H`.
 * Hats sit on the roof. Prices are in coins earned from matches; gift items (`gift`) are
 * never sold — they unlock by inviting friends (share a link, then actually play together).
 * `sku` matches `public.products.sku` for the
 * paid-currency path later (see docs/business/platform-strategy.md).
 */
/** How a gift item unlocks: sharing an invite, or finishing a match with 1 / 3 human friends. */
export type GiftRule = 'share' | 'friend1' | 'friend3';

export interface SkinDef {
  id: string;
  name: string;
  nameZh: string;
  price: number;
  gift?: GiftRule;
  /** null = keep the vehicle's own colour. */
  shell: number | null;
  glow?: number;
  metalness?: number;
  roughness?: number;
}

export type HornSound = 'clown' | 'trombone' | 'duck' | 'air' | 'bike';

export interface HornDef {
  id: HornSound;
  name: string;
  nameZh: string;
  price: number;
  gift?: GiftRule;
}

export type HatId = 'none' | 'party' | 'cone' | 'chef' | 'propeller' | 'crown';

export interface HatDef {
  id: HatId;
  name: string;
  nameZh: string;
  price: number;
  gift?: GiftRule;
  icon: string;
}

export const SKINS: SkinDef[] = [
  { id: 'stock', name: 'Factory', nameZh: '出厂色', price: 0, shell: null },
  // Friend gifts (fixed looks, never for sale).
  { id: 'buddy', name: 'Best Buddies', nameZh: '好友限定', price: 0, gift: 'friend1', shell: 0xff7eb6, glow: 0x5ef2e0, roughness: 0.3 },
  { id: 'taxi', name: 'NYC Taxi', nameZh: '纽约出租车', price: 150, shell: 0xf5c518, glow: 0xffe066 },
  { id: 'panda', name: 'Panda', nameZh: '熊猫', price: 250, shell: 0xf4f1ea, glow: 0x9be15d, roughness: 0.55 },
  { id: 'baguette', name: 'Baguette', nameZh: '法棍', price: 250, shell: 0xc98a3d, glow: 0xffd28a, roughness: 0.7, metalness: 0 },
  { id: 'neon', name: 'Neon', nameZh: '霓虹', price: 400, shell: 0x19122e, glow: 0xff3bd4, roughness: 0.25 },
  { id: 'jade', name: 'Jade', nameZh: '翡翠', price: 400, shell: 0x1f8a70, glow: 0x7fffd4, roughness: 0.2 },
  { id: 'chrome', name: 'Chrome', nameZh: '镀铬', price: 600, shell: 0xd8dde3, glow: 0x7fc4ff, metalness: 1, roughness: 0.12 },
  { id: 'gold', name: '24K Gold', nameZh: '24K 金', price: 1000, shell: 0xd4a53a, glow: 0xfff1a8, metalness: 1, roughness: 0.18 },
];

export const HORNS: HornDef[] = [
  { id: 'clown', name: 'Clown', nameZh: '小丑喇叭', price: 0 },
  { id: 'duck', name: 'Rubber Duck', nameZh: '橡皮鸭', price: 100 },
  { id: 'bike', name: 'Bike Bell', nameZh: '自行车铃', price: 100 },
  { id: 'trombone', name: 'Sad Trombone', nameZh: '悲伤长号', price: 200 },
  { id: 'air', name: 'Air Horn', nameZh: '汽笛', price: 300 },
];

export const HATS: HatDef[] = [
  { id: 'none', name: 'No hat', nameZh: '不戴帽子', price: 0, icon: '🚫' },
  { id: 'party', name: 'Party Hat', nameZh: '派对帽', price: 0, gift: 'share', icon: '🎉' },
  { id: 'crown', name: 'Squad Crown', nameZh: '四人团皇冠', price: 0, gift: 'friend3', icon: '👑' },
  { id: 'cone', name: 'Traffic Cone', nameZh: '雪糕筒', price: 150, icon: '🚧' },
  { id: 'chef', name: 'Chef Hat', nameZh: '厨师帽', price: 250, icon: '👨‍🍳' },
  { id: 'propeller', name: 'Propeller Cap', nameZh: '竹蜻蜓帽', price: 350, icon: '🚁' },
];

/** Gift rules in plain words (shop labels). */
export const GIFT_LABEL: Record<GiftRule, [zh: string, en: string]> = {
  share: ['🎁 分享邀请链接即送', '🎁 Free: share your invite link'],
  friend1: ['🎁 和 1 位好友打完一局即送', '🎁 Free: finish a match with a friend'],
  friend3: ['🎁 4 位好友同房打完一局即送', '🎁 Free: finish a match as a squad of 4'],
};

export const hatById = (id: string | undefined): HatDef => HATS.find((h) => h.id === id) ?? HATS[0];
export const skinById = (id: string | undefined): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const hornById = (id: string | undefined): HornDef => HORNS.find((h) => h.id === id) ?? HORNS[0];
