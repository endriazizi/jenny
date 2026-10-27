/*
 * Service worker del sito Jenny Nails Studio.
 * Mette in cache solo file statici (CSS, JS, font, icone). Pagine e API passano sempre dalla rete:
 * orari e prenotazioni non vengono mai mostrati da una copia vecchia.
 */
const CACHE = 'jenny-static-v1';
const STATIC = /^\/(_astro\/|icons\/|favicon\.svg$|og\.png$)/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jenny-static-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const OFFLINE = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sei offline · Jenny Nails Studio</title>
<body style="font-family:system-ui,sans-serif;background:#FCF8F5;color:#2D2226;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">
<div><h1 style="font-weight:500">Sei offline</h1><p>Controlla la connessione e riprova. Per prenotare puoi anche chiamarci.</p>
<p><button onclick="location.reload()" style="font:inherit;padding:12px 24px;border-radius:999px;border:0;background:#8E4A5E;color:#fff">Riprova</button></p></div></body></html>`;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
    return;
  }
  if (!STATIC.test(url.pathname)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }),
  );
});
