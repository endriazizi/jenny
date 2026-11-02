/**
 * «Da dove arrivano»: da quale canale arriva chi apre /prenota/.
 *
 * - `?r=<codice>`: codice opaco dei link per canale creati nel backoffice (go.milloshi.it/j/…).
 *   Dal codice non si capisce il canale: lo sa solo il server.
 * - Senza codice: `?src=` / `?utm_source=`, il sito di provenienza (instagram.com, google.*…) o
 *   i codici `igshid`/`fbclid`/`gclid`. Chi arriva dalle altre pagine di questo sito conta come «Sito».
 * - Dopo la lettura i parametri vengono tolti dalla barra: la cliente vede solo /prenota/.
 * - Niente cookie e niente memoria sul telefono: la fonte resta solo in questa pagina aperta,
 *   poi viene inviata con la richiesta di appuntamento (campo `traffic`).
 */

export type TrafficHint = 'instagram' | 'tiktok' | 'whatsapp' | 'google' | 'facebook' | 'sito' | 'qr' | 'email';

export interface Traffic {
  ref?: string;
  hint?: TrafficHint;
  campaign?: string;
  /** Id casuale di questa visita: collega l'apertura alla richiesta di appuntamento. */
  visit: string;
}

export const STRIP_PARAMS = [
  'r', 'src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
  'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'igshid', 'ttclid',
];

const REF_RE = /^[A-Za-z0-9]{8,16}$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function newVisitId(): string {
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => ALPHABET[b % 62]).join('');
}

/** utm_source / src liberi ("ig", "IG_story", "tt") → canale noto. */
export function normalizeHint(raw: unknown): TrafficHint | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (/^(ig|insta)/.test(s) || s.includes('instagram')) return 'instagram';
  if (/^tt$/.test(s) || s.includes('tiktok')) return 'tiktok';
  if (/^wa$/.test(s) || s.includes('whatsapp')) return 'whatsapp';
  if (/^(g|gmb|gbp)$/.test(s) || s.includes('google') || s.includes('maps')) return 'google';
  if (/^(fb|meta)/.test(s) || s.includes('facebook') || s.includes('messenger')) return 'facebook';
  if (s.includes('qr') || s.includes('biglietto') || s.includes('vetrina') || s.includes('flyer')) return 'qr';
  if (s.includes('mail') || s.includes('newsletter')) return 'email';
  if (s === 'sito' || s === 'web' || s.includes('website')) return 'sito';
  return null;
}

/** Canale dal sito che ha mandato la cliente (document.referrer). */
export function hintFromReferrer(referrer: string, ownHost: string): TrafficHint | null {
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  if (host === ownHost) return 'sito';
  if (host.includes('instagram.')) return 'instagram';
  if (host.includes('tiktok.')) return 'tiktok';
  if (host.includes('whatsapp.') || host === 'wa.me') return 'whatsapp';
  if (/(^|\.)google\.[a-z.]+$/.test(host) || host === 'g.page' || host.endsWith('.g.page')) return 'google';
  if (host.includes('facebook.') || host === 'fb.me' || host === 'l.facebook.com' || host.endsWith('.fb.com')) return 'facebook';
  return null;
}

function cleanCampaign(v: string | null): string | undefined {
  const s = String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/\s+/g, '-').slice(0, 80);
  return s || undefined;
}

/** Logica pura: cosa ricordare e l'indirizzo pulito (null se non cambia). */
export function readTraffic(href: string, referrer: string, visit = newVisitId()): { traffic: Traffic | null; cleanUrl: string | null } {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { traffic: null, cleanUrl: null };
  }
  const p = url.searchParams;
  const ref = (p.get('r') || '').trim();
  let traffic: Traffic | null = null;
  if (REF_RE.test(ref)) {
    traffic = { ref, visit };
  } else {
    const hint =
      normalizeHint(p.get('src')) ||
      normalizeHint(p.get('utm_source')) ||
      hintFromReferrer(referrer, url.hostname.toLowerCase()) ||
      (p.has('igshid') ? 'instagram' : null) ||
      (p.has('ttclid') ? 'tiktok' : null) ||
      (p.has('gclid') || p.has('gbraid') || p.has('wbraid') ? 'google' : null) ||
      (p.has('fbclid') ? 'facebook' : null);
    if (hint) traffic = { hint, campaign: cleanCampaign(p.get('utm_campaign')), visit };
  }
  let changed = false;
  for (const k of STRIP_PARAMS) {
    if (p.has(k)) {
      p.delete(k);
      changed = true;
    }
  }
  const qs = p.toString();
  return { traffic, cleanUrl: changed ? `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}` : null };
}

/**
 * All'apertura di /prenota/: legge la fonte, pulisce la barra e segnala l'apertura al server
 * (senza aspettare la risposta e senza mai bloccare la pagina).
 */
export function captureTraffic(apiBase: string): Traffic | null {
  if (typeof window === 'undefined') return null;
  const { traffic, cleanUrl } = readTraffic(window.location.href, document.referrer || '');
  if (cleanUrl) {
    try {
      window.history.replaceState(window.history.state, '', cleanUrl);
    } catch {
      /* ignora */
    }
  }
  if (traffic && apiBase) {
    let referrer = '';
    try {
      referrer = document.referrer ? new URL(document.referrer).origin : '';
    } catch {
      referrer = '';
    }
    fetch(apiBase + '/traffic/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...traffic, referrer }),
      credentials: 'omit',
      keepalive: true,
    }).catch(() => undefined);
  }
  return traffic;
}
