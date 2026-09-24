/**
 * Player-name hygiene for public rooms. Portals require it for multiplayer games with typed
 * names (Poki: strict profanity filtering; CrazyGames/kids' audiences likewise), and every name a
 * player sees passes through here: our own nickname, and every peer name in the lobby/roster.
 *
 * Deliberately conservative: a flagged name is replaced by a neutral one, never shown "starred".
 * Stems are matched after normalising case, look-alike digits and separators ("f.u_c k" → "fuck");
 * short stems that occur inside innocent words ("ass" in "class") only match as a whole word.
 */

/** Matched anywhere inside the squashed name. */
const STEMS = [
  'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'bastard',
  'nigg', 'fag', 'retard', 'rapist', 'nazi', 'hitler', 'porn', 'penis', 'vagina', 'boob',
  'wank', 'twat', 'jizz', 'kys', 'killyourself', 'motherf',
  // zh
  '操你', '草你', '肏', '傻逼', '傻b', '煞笔', '沙比', '妈的', '你妈', '尼玛', '他妈', '去死', '鸡巴', '屌', '婊', '贱人',
  '强奸', '日你', '智障', '脑残',
];

/** Only when the whole word (or the whole name) is this. */
const WORDS = ['ass', 'arse', 'sex', 'cum', 'cock', 'rape', 'tit', 'tits', 'hoe', 'nig', 'sb', 'cnm', 'nmsl', 'tmd', 'wtf', 'stfu'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

const MAX_LEN = 16;

function squash(s: string): string {
  return s
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c)
    .replace(/[\s._\-*+~'"`|/\\,:;()[\]{}<>^#%&=?]+/g, '');
}

/** True when the name contains blocked language. */
export function isOffensiveName(raw: string): boolean {
  const flat = squash(raw);
  if (STEMS.some((s) => flat.includes(s))) return true;
  const words = raw
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c)
    .split(/[^a-z一-鿿]+/)
    .filter(Boolean);
  return words.some((w) => WORDS.includes(w)) || WORDS.includes(flat);
}

/**
 * A displayable name: control/zero-width characters removed, whitespace collapsed, at most
 * 16 characters; `fallback` when empty or offensive.
 */
export function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const s = raw
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const clipped = Array.from(s).slice(0, MAX_LEN).join('');
  if (!clipped || isOffensiveName(clipped)) return fallback;
  return clipped;
}
