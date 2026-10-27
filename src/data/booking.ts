/**
 * Prenotazione online (API Jenny Nails su ENEA).
 * Si accende con PUBLIC_BOOKING_ONLINE=1 quando il backend è attivo (JENNY_ENABLED=1):
 * finché è spenta i pulsanti "Prenota" restano su WhatsApp e /prenota/ rimanda a WhatsApp.
 */
export const BOOKING_ONLINE = import.meta.env.PUBLIC_BOOKING_ONLINE === '1';

export const BOOKING_API = String(import.meta.env.PUBLIC_BOOKING_API || 'https://api.pizzerialalanterna.it/api/jenny/public').replace(/\/+$/, '');

/** Versione dell'informativa privacy mostrata nella pagina /privacy/ (deve coincidere con l'impostazione del backoffice). */
export const PRIVACY_VERSION = '1';
