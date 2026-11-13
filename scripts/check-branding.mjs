import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const home = read('src/pages/index.astro');
const header = read('src/components/Header.astro');
const footer = read('src/components/Footer.astro');
const runtime = read('src/scripts/jenny-public-branding.ts');
const backend = read('src/data/booking.ts');

assert.match(home, /data-jenny-hero-image/, 'Missing public hero image target');
assert.match(home, /data-jenny-hero-fallback/, 'Missing safe hero fallback');
assert.match(header, /data-jenny-header-image/, 'Missing Jenny header logo target');
assert.match(header, /data-jenny-header-fallback/, 'Missing text fallback for header');
assert.match(footer, /data-jenny-footer-image/, 'Missing Jenny footer photo target');
assert.match(footer, /updateJennyBranding\(\)/, 'Runtime branding should run on static Astro pages');
assert.match(runtime, /branding|hero_url|footer_url|logo_url/, 'Branding must use settings from public catalog');
assert.match(runtime, /pending\.onload/, 'Never reveal images until loaded');
assert.match(runtime, /savedBranding\(\)/, 'Branding should survive temporary catalog outages');
assert.match(home, /hero-placeholder/, 'Hero should not flash an unrelated static photo');
assert.doesNotMatch(home, /BOOKING_API \+ '\/catalog'/, 'Hero must not fetch catalog a second time');
assert.match(runtime, /MEDIA_PATH/, 'Do not display untrusted image URLs');
assert.match(backend, /PUBLIC_BOOKING_API/, 'Honor configured public API origin');
console.log('Jenny public branding: header, hero, footer, fallback and runtime checks PASS');
