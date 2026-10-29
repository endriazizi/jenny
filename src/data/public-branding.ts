import { BOOKING_API } from './booking';

/** Branding pubblico stabilizzato alla build: evita wordmark → foto via JS (flicker).
 * Nuove immagini caricate dalla PWA richiedono una nuova build per aggiornare il sito statico. */
type Brand = { logo?: string; footer?: string };
let cache: Promise<Brand> | undefined;
const MEDIA = /^\/api\/jenny\/public\/media\/[a-f0-9]{24}\.(?:jpg|png|webp)$/;
export function publicBranding(): Promise<Brand> {
  if (!cache) cache = (async () => {
    try {
      const response = await fetch(BOOKING_API + '/catalog', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return {};
      const payload = await response.json();
      const origin = new URL(BOOKING_API).origin;
      const valid = (path: unknown) => typeof path === 'string' && MEDIA.test(path) ? origin + path : undefined;
      return { logo: valid(payload?.branding?.logo_url), footer: valid(payload?.branding?.footer_url) };
    } catch { return {}; }
  })();
  return cache;
}
