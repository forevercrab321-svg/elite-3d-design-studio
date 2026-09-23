/**
 * Inject a third-party SDK <script> tag and wait for it, with a hard timeout.
 *
 * Portal SDKs are frequently blocked by ad blockers / privacy extensions; the
 * game must never hang on them. Resolves `true` when the script loaded,
 * `false` on error or timeout. Never rejects.
 */
export function loadScript(src: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    try {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.addEventListener('load', () => finish(true), { once: true });
      el.addEventListener('error', () => finish(false), { once: true });
      (document.head ?? document.documentElement).appendChild(el);
    } catch {
      finish(false);
    }
  });
}

/** Race a promise against a timeout; resolves `fallback` on timeout or rejection. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, ms);
    p.then(
      (v) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(v);
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** Call an SDK method that may return void or a Promise, swallowing sync throws and async rejections. */
export function safeCall(fn: () => unknown): void {
  try {
    const r = fn();
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      (r as Promise<unknown>).then(undefined, () => undefined);
    }
  } catch {
    /* SDK disabled / not ready — ignore */
  }
}
