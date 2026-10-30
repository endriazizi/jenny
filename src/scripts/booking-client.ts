/**
 * Funzioni comuni di /prenota/ e /gestisci/: chiamate all'API, date in ora del salone, DOM sicuro.
 * Il testo che arriva dall'API passa sempre da textContent, mai da innerHTML.
 */

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(base: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'network', 'Connessione non riuscita. Controlla la rete e riprova.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = res.status === 429 ? 'Troppe richieste in poco tempo. Aspetta un minuto e riprova.' : data.message || 'Qualcosa non ha funzionato. Riprova.';
    throw new ApiError(res.status, data.error || 'error', msg);
  }
  return data as T;
}

/** Elemento con attributi e figli; le stringhe diventano nodi di testo. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | number | null | undefined> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const TZ = 'Europe/Rome';

/** Oggi nel fuso del salone, YYYY-MM-DD. */
export const romeToday = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const utc = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const dayLabel = (date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Intl.DateTimeFormat('it-IT', { ...opts, timeZone: 'UTC' }).format(utc(date));

/** "2026-11-03 15:30:00" → "martedì 3 novembre, ore 15:30" */
export const whenLabel = (dt: string) => `${dayLabel(dt)}, ore ${dt.slice(11, 16)}`;

export const euro = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? 'su richiesta' : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export const durationLabel = (min: number) => {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return hh ? `${hh} h${mm ? ` ${mm} min` : ''}` : `${mm} min`;
};

export interface Slot { time: string; staff_id: number; available?: boolean }

/** Riepilogo di un giorno: chiuso, tutto occupato o quanti orari liberi. */
export interface DaySummary { date: string; open: boolean; free: number; first: string | null }

/**
 * Striscia di giorni + orari liberi. `load` restituisce gli orari del giorno scelto.
 * Con `loadDays` i giorni chiusi o pieni sono spenti e si apre da solo il primo giorno con posto.
 */
export function slotPicker(opts: {
  days: number;
  load: (date: string) => Promise<{ slots: Slot[] }>;
  loadDays?: (from: string, count: number) => Promise<{ days: DaySummary[] }>;
  onPick: (date: string, time: string) => void;
}) {
  const root = h('div', { class: 'picker' });
  const strip = h('div', { class: 'days', role: 'group', 'aria-label': 'Giorno' });
  const slotsBox = h('div', { class: 'slots', 'aria-live': 'polite' });
  root.append(strip, slotsBox);
  const today = romeToday();
  const buttons = new Map<string, HTMLButtonElement>();
  let req = 0;

  async function pickDay(date: string, btn: HTMLButtonElement) {
    strip.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    slotsBox.replaceChildren(h('p', { class: 'muted' }, 'Cerco gli orari liberi…'));
    const mine = ++req;
    try {
      const { slots } = await opts.load(date);
      if (mine !== req) return;
      const freeSlots = (Array.isArray(slots) ? slots : []).filter(s => s && s.available !== false && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(s.time));
      if (!freeSlots.length) {
        slotsBox.replaceChildren(h('p', { class: 'muted' }, 'Nessun orario libero in questo giorno. Prova un altro giorno.'));
        return;
      }
      const grid = h('div', { class: 'grid-slots', role: 'group', 'aria-label': `Orari di ${dayLabel(date)}` });
      for (const s of freeSlots) {
        const b = h('button', { type: 'button', class: 'slot' }, s.time);
        b.addEventListener('click', async () => {
          if (b.disabled) return;
          b.disabled = true;
          try {
            // Evita slot obsoleti se un'altra cliente ha prenotato nel frattempo.
            const updated = await opts.load(date);
            if (mine !== req) return;
            const stillFree = updated.slots?.some(slot => slot.time === s.time && slot.available !== false);
            if (!stillFree) { await pickDay(date, btn); return; }
            opts.onPick(date, s.time);
          } catch (error) {
            slotsBox.replaceChildren(h('p', { class: 'err', role: 'alert' }, 'Non riesco a verificare l’orario. Riprova.'));
          } finally { b.disabled = false; }
        });
        grid.append(b);
      }
      slotsBox.replaceChildren(grid);
    } catch (e) {
      if (mine !== req) return;
      slotsBox.replaceChildren(h('p', { class: 'err', role: 'alert' }, (e as Error).message));
    }
  }

  for (let i = 0; i < opts.days; i++) {
    const date = addDays(today, i);
    const b = h(
      'button',
      { type: 'button', class: 'day', 'aria-pressed': 'false', 'aria-label': dayLabel(date) },
      h('span', { class: 'wd' }, i === 0 ? 'Oggi' : i === 1 ? 'Domani' : dayLabel(date, { weekday: 'short' })),
      h('strong', {}, dayLabel(date, { day: 'numeric' })),
      h('span', { class: 'mo' }, dayLabel(date, { month: 'short' })),
    );
    b.addEventListener('click', () => pickDay(date, b));
    buttons.set(date, b);
    strip.append(b);
  }
  slotsBox.append(h('p', { class: 'muted' }, 'Scegli un giorno per vedere gli orari liberi.'));

  /** Segna i giorni chiusi, pieni o quasi pieni; l'API ne dà al massimo 31 per volta. */
  async function markDays() {
    if (!opts.loadDays) return;
    let picked = false;
    for (let i = 0; i < opts.days; i += 31) {
      let list: DaySummary[];
      try {
        ({ days: list } = await opts.loadDays(addDays(today, i), Math.min(31, opts.days - i)));
      } catch {
        return; // senza riepilogo la striscia funziona lo stesso, giorno per giorno
      }
      for (const d of list) {
        const b = buttons.get(d.date);
        if (!b) continue;
        const tag = !d.open ? 'Chiuso' : !d.free ? 'Completo' : d.free <= 3 ? 'Ultimi posti' : '';
        if (tag) b.append(h('span', { class: 'tag' }, tag));
        if (!d.open || !d.free) {
          b.disabled = true;
          b.classList.add(d.open ? 'is-full' : 'is-closed');
          b.setAttribute('aria-label', `${dayLabel(d.date)}, ${tag.toLowerCase()}`);
        } else if (d.free <= 3) b.classList.add('is-few');
        if (!picked && d.open && d.free) {
          picked = true;
          if (req === 0) void pickDay(d.date, b);
        }
      }
    }
    if (!picked) slotsBox.replaceChildren(h('p', { class: 'muted' }, 'Nei prossimi giorni è tutto prenotato. Scrivici: se si libera un posto ti avvisiamo.'));
  }
  void markDays();
  return root;
}
