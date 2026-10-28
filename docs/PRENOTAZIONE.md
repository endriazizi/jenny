# Prenotazione online

Le pagine `/prenota/` e `/gestisci/` usano l'API Jenny Nails di ENEA (`/api/jenny/public`, enea-be).

## Accendere

1. Sul backend: `JENNY_ENABLED=1` e `JENNY_PUBLIC_ORIGINS=https://jenny.milloshi.it` (vedi `docs/JENNY-NAILS.md` in enea-be).
2. Su GitHub → Settings → Secrets and variables → Actions → Variables:
   - `PUBLIC_BOOKING_ONLINE` = `1`
   - `PUBLIC_BOOKING_API` = `https://api.pizzerialalanterna.it/api/jenny/public` (facoltativa, è il valore predefinito)
3. Nuovo deploy. I pulsanti "Prenota" passano da WhatsApp a `/prenota/` e la privacy mostra la sezione "Prenotazione online".
   In Trattamenti ogni scheda ha "Prenota" (calendario) e "Info" (WhatsApp con la domanda sul trattamento);
   nella barra in basso del telefono "Prenota" è l'azione principale e WhatsApp diventa "Info".

Spegnere: `PUBLIC_BOOKING_ONLINE` vuota e nuovo deploy. Se l'API non risponde, `/prenota/` mostra da sola WhatsApp e telefono.

## Come funziona

- `/prenota/`: trattamenti → giorno e ora (i giorni chiusi e quelli pieni sono spenti con "Chiuso" o "Completo",
  "Ultimi posti" se restano 3 orari o meno; si vedono solo gli orari liberi, mai quelli occupati) → dati e consensi (privacy obbligatoria, WhatsApp e novità facoltativi e separati) → codice a 6 cifre via email → link personale.
- `/gestisci/#token`: il token sta nel frammento dell'indirizzo, quindi non arriva ai log del server. Vedi, sposta, annulla fino al limite impostato nel backoffice.
- Entrambe `noindex` e fuori dalla sitemap.
- La versione dell'informativa è `PRIVACY_VERSION` in `src/data/booking.ts`: deve coincidere con "Versione informativa" nelle impostazioni del backoffice.

## App (PWA)

`public/manifest.webmanifest`, icone in `public/icons/`, `public/sw.js`. Il service worker tiene in cache solo file statici
(`/_astro/`, icone, favicon): pagine, orari e prenotazioni arrivano sempre dalla rete. Il pulsante "Aggiungi alla
schermata Home" nel footer compare solo se il browser lo permette; su iPhone mostra le istruzioni di Safari.
