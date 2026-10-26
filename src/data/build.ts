/**
 * Versione della build, calcolata al momento di `astro build` (come "Build" di enea-fe).
 *  - Su GitHub Actions: AAAA.MM.GG-<commit>  (es. 2026.10.21-afcbcd8)
 *  - In locale:         AAAA.MM.GG-dev
 * Usata nel footer, nel meta "version", in /version.json e come ?v= anti-cache
 * per i file statici che non hanno un hash nel nome (favicon, immagini di /img).
 */
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
// Data in ora italiana, così una build notturna porta la data del giorno giusto.
const it = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
const day = `${it.getFullYear()}.${pad(it.getMonth() + 1)}.${pad(it.getDate())}`;

export const BUILD_SHA = (process.env.GITHUB_SHA || '').slice(0, 7) || null;
// Data + commit (non il numero di build): se codice e menu non cambiano, la build oraria
// produce file identici e non viene ripubblicata.
export const BUILD_VERSION = `${day}-${BUILD_SHA || 'dev'}`;
export const BUILD_TIME = now.toISOString();

/** Aggiunge ?v=<build> a un percorso statico locale (non a URL esterni o già versionati). */
export function withVersion(src: string): string {
  if (!src.startsWith('/') || src.includes('?')) return src;
  return `${src}?v=${encodeURIComponent(BUILD_VERSION)}`;
}
