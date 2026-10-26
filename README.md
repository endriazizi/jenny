# Jenny Nails Studio — sito web

Sito vetrina di **Jenny Nails Studio**, salone di manicure. Fatto con [Astro](https://astro.build): HTML statico, veloce, senza cookie.
Stessa impostazione di `enea-sito` (La Lanterna) e del sito di Le Case di Emily: dati in un solo file, deploy su Plesk tramite ramo `deploy`.

- **Pagine**: Home · Trattamenti · Contatti e orari · Privacy · Cookie policy · 404
- **Prenotazione**: WhatsApp con messaggio già scritto (trattamento, giorno, momento, nome) o telefono. Il sito non salva dati.
- **SEO**: title e description per pagina, canonical, Open Graph (`public/og.png`), sitemap, robots, JSON-LD `NailSalon`, `FAQPage`, `BreadcrumbList`
- **Telefono**: barra in basso Chiama / WhatsApp / Trattamenti / Dove siamo, con safe area iPhone

```bash
npm install
npm run dev                          # sito con i dati veri (quelli mancanti restano nascosti)
PUBLIC_ANTEPRIMA=1 npm run dev       # anteprima grafica con contatti di esempio, non indicizzabile
npm run build && node scripts/check-data.mjs
```

## Dove si cambiano i contenuti

| Cosa | File |
|---|---|
| Nome, indirizzo, telefono, WhatsApp, email, Instagram, orari, titolare, P.IVA | `src/data/site.ts` |
| Trattamenti, descrizioni, prezzi e durata | `src/data/trattamenti.ts` |
| Domande frequenti | `src/data/faq.ts` |
| Foto dei lavori (galleria e foto in alto nella home) | `src/assets/galleria/` + testi alternativi in `src/data/galleria.ts` |
| Logo | `src/components/Wordmark.astro` (ora è un logo tipografico) e `public/favicon.svg` |
| Immagine per WhatsApp/Facebook | `brand/og.html` → `node scripts/og.cjs` (usa Playwright) |

Regola: un dato non confermato resta `null` e non compare. Niente prezzi, orari o numeri inventati.

## Pubblicazione

`push su main` → GitHub Actions: `astro check` → build → `scripts/check-data.mjs` → ramo `deploy` → Plesk Git → `httpdocs`.

Il controllo dati **blocca la pubblicazione** finché mancano telefono o WhatsApp e il titolare per la privacy. Il dominio si imposta con la variabile `SITE_URL` (GitHub → Settings → Secrets and variables → Actions → Variables); senza, si usa quello provvisorio in `astro.config.mjs`.

Su Plesk: Siti web e domini → dominio → Git → Aggiungi archivio → `git@github.com:endriazizi/jenny-nails-studio.git`, ramo `deploy`, cartella `httpdocs`, senza azioni di implementazione. Deploy key dedicata (una per repository) e webhook GitHub sul push, come in `enea-sito/GUIDA.md`.

## Stile

Palette chiara: avorio `#FCF8F5` (sfondo), cipria `#F4E7E2` (sezioni), malva `#8E4A5E` (pulsanti e accenti), oro `#7E5F26` (etichette), inchiostro `#2D2226` (testo), grigio rosato `#65565B` (testo secondario).
Font locali: Fraunces (titoli, corsivo per gli accenti) e Manrope (testo). Icone Lucide in linea (`scripts/icons.mjs`).

Contrasti misurati: testo su avorio 14,5:1 · testo secondario su avorio 6,6:1 e su cipria 5,7:1 · bianco su malva 6,4:1 · oro su avorio 5,6:1 e su cipria 4,9:1.

## Da confermare con il salone

- Indirizzo, telefono, numero WhatsApp, email, Instagram, orari
- Titolare (ragione sociale o nome) e P.IVA per footer e privacy
- Elenco trattamenti, prezzi e durata
- Testi della sezione "Lo studio" (in particolare igiene e strumenti)
- Logo e foto dei lavori
- Dominio definitivo

Realizzato da Milloshi Digital Agency · Endri Azizi
