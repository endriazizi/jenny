const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture({ offline = false } = {}) {
  const listeners = {}, calls = [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    self: { location: { origin: 'https://jenny.milloshi.it' }, addEventListener: (type, fn) => { listeners[type] = fn; } },
    URL, Response,
    fetch: async (request, options) => { calls.push({ request, options }); if (offline) throw Error('offline'); return new Response('fresh page'); },
    caches: { open: async () => ({ match: async () => new Response('cached asset') }) },
  });
  async function request(pathname, mode = 'navigate', method = 'GET') {
    let response;
    listeners.fetch({ request: { url: 'https://jenny.milloshi.it' + pathname, mode, method }, respondWith: value => { response = value; } });
    return response || null;
  }
  return { request, calls };
}

test('both review navigation paths bypass stale HTTP HTML, including query strings', async () => {
  const f = fixture();
  for (const url of ['/lascia-una-recensione/', '/recensione/', '/recensione?version=2']) {
    assert.equal(await (await f.request(url)).text(), 'fresh page');
    assert.equal(f.calls.at(-1).options.cache, 'no-store');
  }
});
test('other pages retain their navigation behavior and hashed assets retain their cache', async () => {
  const f = fixture();
  await f.request('/prenota/');
  assert.equal(f.calls[0].options, undefined);
  assert.equal(await (await f.request('/_astro/asset.hash.js', 'cors')).text(), 'cached asset');
  assert.equal(f.calls.length, 1);
});
test('review pages keep the offline fallback and API writes are not intercepted', async () => {
  const f = fixture({ offline: true });
  assert.match(await (await f.request('/recensione/')).text(), /Sei offline/);
  assert.equal(await f.request('/api/jenny/public/reviews/public', 'cors', 'POST'), null);
  assert.equal(f.calls.length, 1);
});
