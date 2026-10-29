/**
 * Dati del salone. Unica fonte per contatti, orari e dati strutturati.
 *
 * Regola: un dato non confermato resta `null` e il sito non lo mostra.
 * Mai inventare telefono, indirizzo, orari o prezzi.
 * scripts/check-data.mjs blocca la pubblicazione finché mancano i dati minimi.
 *
 * Anteprima: con PUBLIC_ANTEPRIMA=1 la build usa i dati di esempio di PREVIEW,
 * mostra una fascia "Anteprima" e chiede ai motori di ricerca di non indicizzare.
 */

export interface Hours {
  /** schema.org: Monday…Sunday */
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  label: string;
  /** Fasce orarie "HH:MM-HH:MM". Vuoto = chiuso. */
  slots: string[];
}

export interface SiteData {
  name: string;
  tagline: string;
  description: string;
  /** Ragione sociale o nome e cognome del titolare (per privacy e footer). */
  legalName: string | null;
  vat: string | null;
  /** Forma giuridica come da visura (es. "Impresa individuale"). */
  legalForm: string | null;
  /** Numero REA, es. "MC-300616". */
  rea: string | null;
  /** PEC del titolare: contatto per privacy e comunicazioni formali. */
  pec: string | null;
  address: { street: string; postalCode: string; city: string; province: string; country: string } | null;
  phone: { display: string; tel: string } | null;
  /** Numero WhatsApp in formato internazionale senza + (es. 393331234567). */
  whatsappE164: string | null;
  email: string | null;
  instagram: string | null;
  /** Orari: null finché non confermati. */
  hours: Hours[] | null;
  /** Prenotazione solo su appuntamento. */
  byAppointment: boolean;
  credits: { label: string; author: string; href: string | null };
}

const REAL: SiteData = {
  name: 'Jenny Nails Studio',
  tagline: 'Manicure e nail art su appuntamento.',
  description:
    'Jenny Nails Studio è un salone dedicato alla cura delle unghie a Castelraimondo (MC): manicure, semipermanente, ricostruzione e nail art su appuntamento. Prenota su WhatsApp o con una telefonata.',
  // Dati d'impresa dalla visura CCIAA Marche (iscrizione 26/07/2024). Stessi dati di Impostazioni → Dati società nel gestionale.
  legalName: 'Jenny Nails Studio di Azizi Juxhenia',
  vat: '02067160438',
  legalForm: 'Impresa individuale',
  rea: 'MC-300616',
  pec: 'juxhenia.azizi@pec.it',
  address: { street: 'Largo Rotabella, 1', postalCode: '62022', city: 'Castelraimondo', province: 'MC', country: 'IT' },
  phone: { display: '351 522 8889', tel: '+393515228889' },
  whatsappE164: '393515228889',
  email: null,
  instagram: null,
  // Orari pubblici letti da /api/jenny/public/hours, gestiti da ENEA.
  // Evita che i valori statici obsoleti compaiano nei dati strutturati.
  hours: null,
  byAppointment: true,
  credits: { label: 'Realizzato da Milloshi Digital Agency', author: 'Endri Azizi', href: null },
};

/** Solo per l'anteprima grafica: valori palesemente di esempio, mai pubblicati. */
const PREVIEW: Partial<SiteData> = {
  address: { street: 'Via di Esempio, 1', postalCode: '00000', city: 'Città', province: 'XX', country: 'IT' },
  phone: { display: '000 000 0000', tel: '+390000000000' },
  whatsappE164: '390000000000',
  email: 'info@esempio.it',
  instagram: 'https://www.instagram.com/',
  hours: [
    { day: 'Monday', label: 'Lunedì', slots: [] },
    { day: 'Tuesday', label: 'Martedì', slots: ['09:00-19:00'] },
    { day: 'Wednesday', label: 'Mercoledì', slots: ['09:00-19:00'] },
    { day: 'Thursday', label: 'Giovedì', slots: ['09:00-19:00'] },
    { day: 'Friday', label: 'Venerdì', slots: ['09:00-19:00'] },
    { day: 'Saturday', label: 'Sabato', slots: ['09:00-13:00'] },
    { day: 'Sunday', label: 'Domenica', slots: [] },
  ],
};

import { BOOKING_ONLINE } from './booking';

export const IS_PREVIEW = import.meta.env.PUBLIC_ANTEPRIMA === '1';

export const SITE: SiteData = IS_PREVIEW ? { ...REAL, ...PREVIEW } : REAL;

export const SITE_URL = import.meta.env.SITE as string;

const wa = String(SITE.whatsappE164 ?? '').replace(/\D/g, '');
/** Solo formato internazionale: un fisso che inizia per 0 non è un WhatsApp valido per wa.me. */
export const WHATSAPP: string | null = wa && !wa.startsWith('0') && wa.length >= 11 && wa.length <= 15 ? wa : null;

export const waLink = (text: string): string | null =>
  WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}` : null;

export const WA_HELLO = 'Ciao Jenny! Ti scrivo dal sito, vorrei prenotare un appuntamento.';

/** Il modo migliore per prenotare: online se attivo, poi WhatsApp, telefono, pagina contatti. */
export const BOOK_HREF: string = BOOKING_ONLINE
  ? '/prenota/'
  : waLink(WA_HELLO) ?? (SITE.phone ? `tel:${SITE.phone.tel}` : '/contatti/');

export const fullAddress = (): string | null =>
  SITE.address ? `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city} (${SITE.address.province})` : null;

/** Riga legale del footer: denominazione, sede, P.IVA, REA, PEC (solo i dati presenti). */
export const legalLine = (): string[] =>
  [
    SITE.legalName ?? SITE.name,
    fullAddress(),
    SITE.vat && `P.IVA ${SITE.vat}`,
    SITE.rea && `REA ${SITE.rea}`,
  ].filter((x): x is string => !!x);

export const directionsHref = (): string | null =>
  SITE.address
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${SITE.name}, ${fullAddress()}`)
    : null;
