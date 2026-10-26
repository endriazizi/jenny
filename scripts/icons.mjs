// Rigenera src/data/icons.ts dalle icone Lucide (lucide-static, licenza ISC).
// Uso: npm i -D lucide-static && node scripts/icons.mjs
// Per aggiungere un'icona: mettila in NAMES e rilancia lo script.
import fs from 'node:fs';
import path from 'node:path';

const NAMES = [
  'phone', 'message-circle', 'instagram', 'sparkles', 'hand', 'gem', 'palette', 'brush',
  'calendar-heart', 'clock', 'map-pin', 'mail', 'chevron-right', 'menu', 'x', 'heart',
  'shield-check', 'droplets', 'flower-2', 'info', 'navigation',
];
const dir = path.resolve('node_modules/lucide-static/icons');
const out = {};
for (const name of NAMES) {
  const svg = fs.readFileSync(path.join(dir, `${name}.svg`), 'utf8');
  out[name] = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .split('\n').map((l) => l.trim()).filter(Boolean).join('');
}
const body = Object.entries(out).map(([k, v]) => `  '${k}': '${v}',`).join('\n');
fs.writeFileSync('src/data/icons.ts', `/**
 * Icone del sito: Lucide (https://lucide.dev), licenza ISC.
 * Generato da scripts/icons.mjs: solo il contenuto interno degli SVG, nessuna dipendenza a runtime.
 */
export const ICONS = {
${body}
} as const;

export type IconName = keyof typeof ICONS;
`);
console.log(`icons.ts: ${NAMES.length} icone`);
