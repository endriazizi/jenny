import { BOOKING_API } from '../data/booking';

/**
 * Static Astro releases must never permanently erase the studio photo if
 * the Jenny API was temporarily unavailable during `astro build`.
 * Fetch runtime public data only (no login, cookies or client PII).
 */
const MEDIA_PATH = /^\/api\/jenny\/public\/media\/[a-f0-9]{24}\.(?:jpg|png|webp)$/;
type PublicBrand = {
  logo_url?: unknown;
  footer_url?: unknown;
  hero_url?: unknown;
  hero_alt?: unknown;
  hero_x?: unknown;
  hero_y?: unknown;
  hero_zoom?: unknown;
};
function mediaUrl(path: unknown): string | null {
  if (typeof path !== 'string') return null;
  const pathname = path.trim();
  if (!MEDIA_PATH.test(pathname)) return null;
  return new URL(pathname, new URL(BOOKING_API).origin).href;
}
function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}
function revealAfterLoad(image: HTMLImageElement, src: string, reveal: () => void): void {
  image.onload = () => {
    image.hidden = false;
    reveal();
  };
  image.onerror = () => { image.removeAttribute('src'); image.hidden = true; };
  image.src = src;
  if (image.complete && image.naturalWidth > 0) image.onload?.(new Event('load'));
}
let inFlight: Promise<PublicBrand | null> | null = null;
async function currentBranding(): Promise<PublicBrand | null> {
  if (!inFlight) inFlight = (async () => {
    try {
      const response = await fetch(BOOKING_API + '/catalog', {
        cache: 'no-store',
        credentials: 'omit',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      const payload: {branding?: PublicBrand} = await response.json();
      return payload?.branding && typeof payload.branding === 'object' ? payload.branding : null;
    } catch { return null; }
  })();
  return inFlight;
}
export async function updateJennyBranding(): Promise<void> {
  const brand = await currentBranding();
  if (!brand) return;
  const footerSrc = mediaUrl(brand.footer_url) || mediaUrl(brand.logo_url);
  const footerLink = document.querySelector<HTMLElement>('[data-jenny-footer-photo]');
  const footerImage = document.querySelector<HTMLImageElement>('[data-jenny-footer-image]');
  if (footerSrc && footerLink && footerImage) {
    revealAfterLoad(footerImage, footerSrc, () => {
      footerLink.hidden = false;
      footerLink.closest('.footer-identity')?.classList.remove('footer-identity--text');
    });
  }
  const heroSrc = mediaUrl(brand.hero_url);
  const heroImage = document.querySelector<HTMLImageElement>('[data-jenny-hero-image]');
  const heroFallback = document.querySelector<HTMLElement>('[data-jenny-hero-fallback]');
  if (heroSrc && heroImage) {
    heroImage.alt = typeof brand.hero_alt === 'string' && brand.hero_alt.trim()
      ? brand.hero_alt.trim().slice(0, 180)
      : 'Jenny Nails Studio';
    const x = clamp(brand.hero_x, 50, 0, 100);
    const y = clamp(brand.hero_y, 38, 0, 100);
    const zoom = clamp(brand.hero_zoom, 100, 100, 200);
    heroImage.style.objectPosition = x + '% ' + y + '%';
    heroImage.style.transform = 'scale(' + zoom / 100 + ')';
    revealAfterLoad(heroImage, heroSrc, () => {
      if (heroFallback) heroFallback.hidden = true;
    });
  }
}
