# Jenny Nails · foto e logo su Astro

## Problema individuato

Il footer dipendeva da `publicBranding()` durante `astro build`.
Se l'API era irraggiungibile dalla macchina GitHub o se il catalogo non
conteneva un URL nel formato atteso, veniva pubblicato un footer senza immagine.
La homepage utilizzava invece `GALLERIA[0]` e non il valore
`branding.hero_url` configurato nel backoffice.

## Fix

`src/scripts/jenny-public-branding.ts` legge, nel browser, l'endpoint pubblico
`PUBLIC_BOOKING_API/catalog` e applica le immagini **solo dopo il caricamento**:

- `branding.logo_url` → logo header;
- `branding.footer_url` (fallback `logo_url`) → foto footer;
- `branding.hero_url`, `hero_alt`, `hero_x`, `hero_y`, `hero_zoom` → fotografia principale.

Gli URL media sono limitati a `/api/jenny/public/media/<hash>.(jpg|png|webp)`
sull'origine dell'API configurata. Nessuna foto di clienti del gestionale
viene pubblicata su Astro.

Se la foto non è disponibile: testo Jenny nell'header/footer e galleria /
decorazione originale nell'hero. Non si mostra un'immagine rotta.

## Verifiche deploy

1. `node scripts/check-branding.mjs` deve passare.
2. `astro check` e `astro build` devono passare.
3. Verificare la pubblicazione sul ramo `deploy` del repository Jenny.
4. Confermare che Plesk abbia scaricato il nuovo ramo `deploy`.
5. Aprire `https://jenny.milloshi.it/` in finestra privata iOS/Android/desktop;
   verificare hero, logo e footer.
6. Nel browser Network, `GET https://api.pizzerialalanterna.it/api/jenny/public/catalog`
   deve restituire HTTP 200 e `branding.logo_url/footer_url/hero_url` valorizzati.
7. Aprire gli URL immagine restituiti e verificare HTTP 200 con `Content-Type: image/*`.
8. Se 403/CORS, verificare `JENNY_PUBLIC_ORIGINS` nel BE;
   se 404 su media, verificare `UPLOADS_JENNY_DIR` e persistenza dei file Plesk.
9. Se i campi nel catalogo sono null, ricaricare **le foto corrette** nel
   backoffice Jenny (senza inventare o sostituire l'immagine della persona).

L'aggiornamento delle foto dal backoffice non richiede più una nuova build Astro.
Le foto cliente WhatsApp restano esclusivamente nel backoffice autenticato ENEA.
