/**
 * Domande frequenti. Solo risposte vere per qualunque salone su appuntamento:
 * le regole specifiche (disdette, acconti, tempi) vanno confermate con Jenny prima di aggiungerle.
 */
export interface Faq { q: string; a: string }

export const FAQS: Faq[] = [
  {
    q: 'Come prenoto un appuntamento?',
    a: 'Scrivi su WhatsApp o chiama: dicci quale trattamento vuoi e quando preferiresti venire, e ti proponiamo il primo orario libero. L’appuntamento è confermato quando ricevi la risposta.',
  },
  {
    q: 'Posso portare un’idea per la nail art?',
    a: 'Sì, anzi aiuta. Manda una foto di riferimento insieme alla richiesta: così capiamo se si può fare sulle tue unghie e quanto tempo riservare.',
  },
  {
    q: 'Non so quale trattamento scegliere. Come faccio?',
    a: 'Raccontaci come sono le tue unghie e che risultato vorresti: ti consigliamo noi tra manicure, semipermanente e ricostruzione, senza impegno.',
  },
  {
    q: 'Se non riesco a venire?',
    a: 'Avvisa appena puoi, anche con un messaggio: l’orario può andare a un’altra cliente e ne fissiamo uno nuovo per te.',
  },
  {
    q: 'Ho un’allergia o una sensibilità ai prodotti.',
    a: 'Diccelo quando prenoti, prima dell’appuntamento. Valutiamo insieme cosa usare o se è meglio evitare un trattamento.',
  },
];
