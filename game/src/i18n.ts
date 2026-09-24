/**
 * Two languages: 简体中文 and English. Portals (CrazyGames, Poki) are English-first, Chinese
 * players get Chinese. Picked from ?lang=, then the saved setting, then the browser language.
 * Use L('中文', 'English') at every user-facing string; switching language reloads the page.
 */
export type Lang = 'zh' | 'en';

function detect(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'zh' || q === 'en') return q;
  try {
    const saved = localStorage.getItem('grow-lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* storage blocked */
  }
  return (navigator.languages ?? [navigator.language]).some((l) => l?.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
}

export const lang: Lang = detect();

export function L(zh: string, en: string): string {
  return lang === 'zh' ? zh : en;
}

export function setLang(l: Lang): void {
  try {
    localStorage.setItem('grow-lang', l);
  } catch {
    /* storage blocked */
  }
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  location.href = url.toString();
}
