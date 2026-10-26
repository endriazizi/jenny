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
    'Jenny Nails Studio è un salone dedicato alla cura delle unghie: manicure, semipermanente, ricostruzione e nail art su appuntamento. Prenota su WhatsApp o con una telefonata.',
  legalName: null,
  vat: null,
  address: null,
  phone: null,
  whatsappE164: null,
  email: null,
  instagram: null,
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

export const IS_PREVIEW = import.meta.env.PUBLIC_ANTEPRIMA === '1';

export const SITE: SiteData = IS_PREVIEW ? { ...REAL, ...PREVIEW } : REAL;

export const SITE_URL = import.meta.env.SITE as string;

const wa = String(SITE.whatsappE164 ?? '').replace(/\D/g, '');
/** Solo formato internazionale: un fisso che inizia per 0 non è un WhatsApp valido per wa.me. */
export const WHATSAPP: string | null = wa && !wa.startsWith('0') && wa.length >= 11 && wa.length <= 15 ? wa : null;

export const waLink = (text: string): string | null =>
  WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}` : null;

export const WA_HELLO = 'Ciao Jenny! Ti scrivo dal sito, vorrei prenotare un appuntamento.';

/** Il modo migliore per prenotare con i dati che ci sono: WhatsApp, poi telefono, poi pagina contatti. */
export const BOOK_HREF: string = waLink(WA_HELLO) ?? (SITE.phone ? `tel:${SITE.phone.tel}` : '/contatti/');

export const fullAddress = (): string | null =>
  SITE.address ? `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city} (${SITE.address.province})` : null;

export const directionsHref = (): string | null =>
  SITE.address
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${SITE.name}, ${fullAddress()}`)
    : null;
