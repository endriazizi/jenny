/**
 * Trattamenti del salone.
 *
 * DA CONFERMARE con Jenny: elenco, descrizioni, durata e prezzi.
 * `price` e `duration` restano null finché non sono confermati: il sito non li mostra.
 * Per nascondere un trattamento non offerto, toglilo dall'elenco.
 */
import type { IconName } from './icons';

export interface Trattamento {
  slug: string;
  name: string;
  icon: IconName;
  /** Una riga per la card in home. */
  short: string;
  /** Descrizione per la pagina Trattamenti. */
  text: string;
  /** Es. "da 25 €". */
  price: string | null;
  /** Es. "circa 60 minuti". */
  duration: string | null;
}

export const TRATTAMENTI: Trattamento[] = [
  {
    slug: 'manicure',
    name: 'Manicure',
    icon: 'hand',
    short: 'Unghie in ordine, cuticole curate, mani morbide.',
    text: 'Limatura e forma, cura delle cuticole e finitura. Per avere mani curate anche senza colore, o come base prima dello smalto.',
    price: null,
    duration: null,
  },
  {
    slug: 'semipermanente',
    name: 'Semipermanente',
    icon: 'droplets',
    short: 'Colore brillante che resta, senza allungare l’unghia.',
    text: 'Smalto in gel sull’unghia naturale, indurito in lampada. Scegli il colore insieme a noi e, quando vuoi cambiarlo, la rimozione si fa in salone.',
    price: null,
    duration: null,
  },
  {
    slug: 'ricostruzione',
    name: 'Ricostruzione e allungamento',
    icon: 'gem',
    short: 'Forma e lunghezza su misura, in gel.',
    text: 'Per allungare l’unghia o darle una forma nuova: mandorla, squadrata, ballerina e altre. Ne parliamo prima, così scegliamo insieme la soluzione adatta alle tue unghie.',
    price: null,
    duration: null,
  },
  {
    slug: 'refill',
    name: 'Refill',
    icon: 'sparkles',
    short: 'Mantenimento della ricostruzione quando ricresce.',
    text: 'Quando l’unghia cresce si riempie lo spazio vicino alla cuticola e si sistema la forma. Prenotalo in anticipo, così trovi posto al momento giusto.',
    price: null,
    duration: null,
  },
  {
    slug: 'nail-art',
    name: 'Nail art',
    icon: 'palette',
    short: 'Decorazioni, french, dettagli: porta la tua idea.',
    text: 'Dalla french classica ai disegni su una o più unghie. Se hai una foto di riferimento mandala su WhatsApp quando prenoti: ti diciamo cosa si può fare e quanto tempo serve.',
    price: null,
    duration: null,
  },
  {
    slug: 'pedicure',
    name: 'Pedicure estetico',
    icon: 'flower-2',
    short: 'Piedi curati e smalto anche in semipermanente.',
    text: 'Cura dell’unghia e delle cuticole dei piedi, con smalto tradizionale o semipermanente. È un trattamento estetico, non un servizio medico o podologico.',
    price: null,
    duration: null,
  },
];

export const waTextFor = (t: Trattamento): string =>
  `Ciao Jenny! Ti scrivo dal sito, vorrei prenotare: ${t.name}. Giorno preferito: `;
