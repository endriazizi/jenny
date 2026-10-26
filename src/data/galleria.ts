/**
 * Galleria dei lavori: metti le foto in src/assets/galleria/ (jpg, png o webp).
 * Astro le ridimensiona e converte in WebP alla build. Senza foto la sezione non compare.
 * Il testo alternativo si scrive in ALT, con il nome del file come chiave.
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/galleria/*.{jpg,jpeg,png,webp}', { eager: true });

/** Es. 'french-nude.jpg': 'French con base nude su unghie a mandorla' */
const ALT: Record<string, string> = {};

export const GALLERIA = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => {
    const file = path.split('/').pop()!;
    return { src: mod.default, alt: ALT[file] ?? 'Un lavoro di Jenny Nails Studio' };
  });
