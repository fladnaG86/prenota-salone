const { useState, useMemo, useRef, useEffect } = React;

/* ------------------------------------------------------------------ *
 *  EDITMODE — valori regolabili dal pannello tweaks
 * ------------------------------------------------------------------ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "oklch(0.62 0.13 55)",
  "density": 1,
  "cornerRadius": 18
}/*EDITMODE-END*/;

/* ------------------------------------------------------------------ *
 *  i18n — italiano (default) / inglese con tasto bandiera in alto.
 *  Le chiavi del dizionario sono le stringhe italiane: se manca una
 *  traduzione resta visibile l'italiano (fallback sicuro).
 * ------------------------------------------------------------------ */
const EN = {
  "Prenota online": "Book online",
  "Prenotazione senza account: bastano nome e numero di telefono.": "No account needed: just your name and phone number.",
  "Caricamento…": "Loading…",
  "Servizio e ora": "Service & time",
  "I tuoi dati": "Your details",
  "Conferma": "Confirm",
  "Avanzamento della prenotazione": "Booking progress",
  "Passo {n}: ": "Step {n}: ",
  "Servizi disponibili": "Available services",
  "Più richiesto": "Most popular",
  "Settimana precedente": "Previous week",
  "Settimana successiva": "Next week",
  "Torna a oggi": "Back to today",
  "Giorni della settimana": "Days of the week",
  "chiuso": "closed",
  "trascorso": "past",
  "completo": "full",
  "{n} posti": "{n} seats",
  "{n} posti liberi": "{n} seats free",
  "Fascia oraria": "Time slots",
  "{a} slot liberi su {b}": "{a} of {b} slots free",
  "Filtro slot": "Slot filter",
  "Tutti": "All",
  "Solo liberi": "Free only",
  "libero": "free",
  "ultimo posto": "last seat",
  "Caricamento disponibilità…": "Loading availability…",
  "Nessuno slot libero in questa giornata.": "No free slots on this day.",
  "Prova un altro giorno della settimana: di solito si libera qualcosa il pomeriggio.": "Try another day of the week: a slot usually frees up in the afternoon.",
  "Orari disponibili {date}": "Available times on {date}",
  "Ultimo posto": "Last seat",
  "Completo": "Full",
  "Trascorso": "Past",
  "Passo 1 · Servizio": "Step 1 · Service",
  "Cosa ti serve oggi?": "What do you need today?",
  "La durata scelta determina l'orario di fine appuntamento nel calendario.": "The chosen duration sets the appointment end time in your calendar.",
  "Disponibilità": "Availability",
  "Scegli giorno e ora": "Choose day and time",
  "Prima disponibilità": "Earliest availability",
  "{date} · ore {time}": "{date} · at {time}",
  "Passo 2 · Dati cliente": "Step 2 · Your details",
  "A nome di chi prenoto?": "Who is the booking for?",
  "Servizio": "Service",
  "Data": "Date",
  "Orario": "Time",
  "Barbiere": "Barber",
  "Da pagare in salone": "Pay at the salon",
  "Dati per la prenotazione": "Booking details",
  "Nome e cognome": "Full name",
  "(obbligatorio)": "(required)",
  "Telefono": "Phone",
  "Solo per conferma e promemoria 2 ore prima. Nessun account da creare.": "Only for confirmation and a reminder 2 hours before. No account needed.",
  "Email": "Email",
  "Ti mandiamo qui l'invito pronto da aggiungere al tuo calendario.": "We'll send you a ready-to-add calendar invite here.",
  "Es. Andrea Colombo": "e.g. Andrea Colombo",
  "Es. 335 118 4471": "e.g. 335 118 4471",
  "Es. nome@esempio.it": "e.g. name@example.com",
  "Note per il barbiere": "Notes for the barber",
  "facoltativo": "optional",
  "Es. Macchinetta 1 ai lati, forbice sopra. Arrivo con mio figlio.": "e.g. Clippers #1 on the sides, scissor on top. Coming with my son.",
  "{n} caratteri disponibili": "{n} characters left",
  "Acconsento al trattamento dei dati (nome, telefono, note) per gestire questa prenotazione e inviarmi il promemoria.": "I agree to the processing of my data (name, phone, notes) to manage this booking and send me the reminder.",
  "Leggi l'informativa sulla privacy": "Read the privacy policy",
  "Controlla i campi segnalati: manca poco per completare la prenotazione.": "Check the highlighted fields: you're almost done.",
  "Codice prenotazione: {code}": "Booking code: {code}",
  "Servizio: {name} ({min} min) — €{price}": "Service: {name} ({min} min) — €{price}",
  "Barbiere: {barber}": "Barber: {barber}",
  "Cliente: {name}{phone}": "Client: {name}{phone}",
  "Note: {note}": "Notes: {note}",
  "Per annullare: apri il link «Annulla la prenotazione» nell'email di conferma.": "To cancel: open the «Cancel booking» link in the confirmation email.",
  "Ciao {salon}! Ho prenotato: {service}, {date} alle {time} (codice {code}).": "Hi {salon}! I booked: {service}, {date} at {time} (code {code}).",
  "Passo 3 · Conferma": "Step 3 · Confirmation",
  "Appuntamento confermato": "Appointment confirmed",
  "Ti aspettiamo in {address}. Arriva 5 minuti prima: il tempo di un caffè.": "See you at {address}. Arrive 5 minutes early — time for a coffee.",
  "Invito inviato a te ({email}) e al barbiere ({barber}). Controlla la tua casella email: apri l'allegato .ics e tocca \"Aggiungi al calendario\".": "Invite sent to you ({email}) and the barber ({barber}). Check your inbox: open the .ics attachment and tap \"Add to calendar\".",
  "Non siamo riusciti a inviare l'invito via email. Usa i pulsanti qui sotto per aggiungere l'appuntamento al calendario e avvisa il salone al telefono.": "We couldn't send the invite by email. Use the buttons below to add the appointment to your calendar and call the salon.",
  "Codice {code}": "Code {code}",
  "{date} · ore {a}–{b}": "{date} · {a}–{b}",
  "Durata": "Duration",
  "{n} minuti": "{n} minutes",
  "Indirizzo": "Address",
  "Promemoria": "Reminder",
  "SMS 2 ore prima": "SMS 2 hours before",
  "Aggiungi al calendario (.ics)": "Add to calendar (.ics)",
  "Apri in Google Calendar": "Open in Google Calendar",
  "Invia la conferma su WhatsApp": "Send the confirmation on WhatsApp",
  "File pronto: {name}": "File ready: {name}",
  "Il file .ics si apre direttamente nell’app Calendario su iPhone e in Google Calendar su Android. Se il download è bloccato dal browser, usa il pulsante Google Calendar: è già compilato con data, ora, durata e indirizzo del salone.": "The .ics file opens directly in the Calendar app on iPhone and in Google Calendar on Android. If your browser blocks the download, use the Google Calendar button: it's already filled with date, time, duration and the salon address.",
  "Informazioni sul salone": "Salon information",
  "Il salone": "The salon",
  "Apri in Google Maps": "Open in Google Maps",
  "Consigliata la prenotazione online: in negozio restano pochi posti.": "Online booking recommended: only a few walk-in slots left.",
  "Orari": "Opening hours",
  "oggi": "today",
  "Buono a sapersi": "Good to know",
  "Disponibilità in tempo reale: prenota e ricevi l'invito via email sul tuo calendario.": "Real-time availability: book and get the calendar invite by email.",
  "Scegli la postazione": "Choose a station",
  "Postazioni del salone:": "Salon stations:",
  "Passo {n} di 3: {step}": "Step {n} of 3: {step}",
  "servizio e orario": "service and time",
  "dati cliente": "your details",
  "conferma": "confirmation",
  "Riepilogo": "Summary",
  "Continua": "Continue",
  "Indietro": "Back",
  "Invio in corso…": "Sending…",
  "Conferma prenotazione": "Confirm booking",
  "Nessun pagamento online: {amount} da saldare in salone.": "No online payment: {amount} to pay at the salon.",
  "Prenota un altro appuntamento": "Book another appointment",
  "Chiama il salone": "Call the salon",
  "{name} · scegli un orario": "{name} · pick a time",
  "Scegli servizio e orario": "Choose service and time",
  "Inserisci nome e cognome (almeno 2 caratteri).": "Enter your full name (at least 2 characters).",
  "Aggiungi anche il cognome, così ti riconosciamo alla cassa.": "Please add your last name so we recognise you at the desk.",
  "Inserisci il numero di telefono.": "Enter your phone number.",
  "Numero non valido: usa almeno 9 cifre, es. 335 118 4471.": "Invalid number: use at least 9 digits, e.g. 335 118 4471.",
  "Inserisci l'email: ti arrivano il promemoria e l'invito al calendario.": "Enter your email: you'll get the reminder and the calendar invite.",
  "Email non valida. Controlla l'indirizzo, es. nome@esempio.it": "Invalid email. Check the address, e.g. name@example.com",
  "Serve il consenso per gestire la prenotazione.": "Consent is required to manage the booking.",
  "L'orario delle {time} è appena stato prenotato da qualcun altro. Scegline uno ancora libero qui sotto.": "The {time} slot was just booked by someone else. Pick one that's still free below.",
  "Non è stato possibile completare la prenotazione.": "The booking couldn't be completed.",
  "Server non raggiungibile. Riprova tra qualche secondo.": "Server unreachable. Please try again in a moment.",
  "Aperto ora · chiude alle {time}": "Open now · closes at {time}",
  "Chiuso · apre oggi alle {time}": "Closed · opens today at {time}",
  "Chiuso · apre {when} alle {time}": "Closed · opens {when} at {time}",
  "Chiuso": "Closed",
  "domani": "tomorrow",
  "Barbiere uomo · dal 2014": "Men's barber · since 2014",
  "Tre poltrone, forbici e rasoio a mano libera. Caffè offerto, musica bassa e nessuna fretta.": "Three chairs, scissors and a straight razor. Free coffee, quiet music and no rush.",
  "Prenota online su {name}: scegli servizio, barbiere e orario. Nessun account necessario.": "Book online at {name}: choose service, barber and time. No account needed.",
  "Disdetta: apri il link «Annulla la prenotazione» nell'email di conferma.": "Cancellation: open the «Cancel booking» link in the confirmation email.",
  "Paghi in salone: contanti, bancomat o carta di credito.": "Pay at the salon: cash, debit or credit card.",
  "Paghi in salone: contanti, bancomat o carta.": "Pay at the salon: cash, debit or credit card.",
  "Nessun anticipo e nessun account da creare per prenotare.": "No deposit and no account to create to book.",
  "Nessun account da creare per prenotare.": "No account to create to book.",
  "Macchinetta, forbice e finitura a rasoio.": "Clippers, scissors and a razor finish.",
  "Il pacchetto completo, il più richiesto.": "The complete package, our most requested.",
  "Contorni a rasoio, panno caldo e olio.": "Razor edges, hot towel and oil.",
  "Rasoio a mano libera, due passate.": "Straight razor, two passes.",
  "Fino a 12 anni, con mamma o papà.": "Up to 12 years old, with mum or dad.",
  "Shampoo, massaggio e lozione finale.": "Shampoo, massage and finishing lotion.",
  "Taglio e rifinitura su misura.": "Tailored cut and finish.",
  "Il pacchetto completo.": "The complete package.",
  "Contorni curati a rasoio e panno caldo.": "Razor-clean edges and hot towel.",
  "Rasatura tradizionale a mano libera.": "Traditional straight-razor shave.",
  "Taglio per i più piccoli.": "A cut for the little ones.",
};

const WD_SHORT = {
  it: ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"],
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
};
const WD_LONG = {
  it: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
  en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
};
const MONTHS = {
  it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
       "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  en: ["January", "February", "March", "April", "May", "June", "July",
       "August", "September", "October", "November", "December"],
};

const LANG_KEY = "barberia_lang";

function detectLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "it" || stored === "en") return stored;
  } catch (e) { /* localStorage non disponibile */ }
  try {
    return String(navigator.language || "").toLowerCase().startsWith("it") ? "it" : "en";
  } catch (e) {
    return "it";
  }
}

// lingua corrente a livello di modulo: le funzioni di formattazione (date,
// stato di apertura) leggono LANG al momento del render.
let LANG = detectLang();

function makeT(lang) {
  return function t(s, params) {
    let out = (lang === "en" && Object.prototype.hasOwnProperty.call(EN, s)) ? EN[s] : s;
    if (params) {
      Object.keys(params).forEach((k) => {
        out = out.split("{" + k + "}").join(String(params[k]));
      });
    }
    return out;
  };
}

function saveLang(lang) {
  LANG = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignora */ }
  try { document.documentElement.lang = lang; } catch (e) { /* ignora */ }
}

// nomi dei servizi del catalogo integrato (in inglese solo per questi,
// così un nome personalizzato dal salone resta quello del salone)
const SERVICE_IT_NAMES = {
  taglio: "Taglio classico",
  "taglio-barba": "Taglio + barba",
  barba: "Barba modellata",
  rasatura: "Rasatura tradizionale",
  bambino: "Taglio bambino",
  rituale: "Rituale capelli e cute",
};
const SERVICE_EN_NAMES = {
  taglio: "Classic cut",
  "taglio-barba": "Cut + beard",
  barba: "Beard shaping",
  rasatura: "Traditional shave",
  bambino: "Kids' cut",
  rituale: "Hair & scalp ritual",
};

function serviceName(s) {
  if (!s) return "";
  if (LANG === "en" && SERVICE_EN_NAMES[s.id] &&
      SERVICE_IT_NAMES[s.id] === s.name) {
    return SERVICE_EN_NAMES[s.id];
  }
  return s.name;
}

const LangCtx = React.createContext({ lang: "it", t: (s) => s, toggle: () => {} });
function useT() { return React.useContext(LangCtx); }

// etichetta dello stato di apertura, ricalcolata a ogni cambio lingua
function statusLabel(s) {
  const t = makeT(LANG);
  if (s.kind === "now") return t("Aperto ora · chiude alle {time}", { time: s.time });
  if (s.kind === "today") return t("Chiuso · apre oggi alle {time}", { time: s.time });
  if (s.kind === "later") {
    const when = s.days === 1 ? t("domani") : WD_LONG[LANG][s.dow];
    return t("Chiuso · apre {when} alle {time}", { when, time: s.time });
  }
  return t("Chiuso");
}

/* ------------------------------------------------------------------ *
 *  Dati del salone (mock, nessun backend)
 * ------------------------------------------------------------------ */
let SALON = {
  name: "Barberia Lambrate",
  tagline: "Barbiere uomo · dal 2014",
  address: "Via Cesare Battisti 24, 20134 Milano",
  phoneLabel: "02 4531 8890",
  phoneHref: "+390245318890",
  whatsapp: "393351184471",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Via+Cesare+Battisti+24+20134+Milano",
  piva: "P.IVA 04821960168",
  story:
    "Tre poltrone, forbici e rasoio a mano libera. Caffè offerto, musica bassa e nessuna fretta.",
  policies: [
    "Disdetta: apri il link «Annulla la prenotazione» nell'email di conferma.",
    "Paghi in salone: contanti, bancomat o carta di credito.",
    "Nessun anticipo e nessun account da creare per prenotare.",
  ],
};

// 1 = lunedì ... 6 = sabato (0 = domenica, chiuso); reso dinamico per salone
let HOURS = {
  1: { open: 9 * 60, close: 19 * 60 },
  2: { open: 9 * 60, close: 20 * 60 },
  3: { open: 9 * 60, close: 20 * 60 },
  4: { open: 9 * 60, close: 20 * 60 },
  5: { open: 9 * 60, close: 20 * 60 },
  6: { open: 9 * 60, close: 17 * 60 },
};

let SERVICES = [
  { id: "taglio", name: "Taglio classico", min: 30, price: 22, icon: "scissors", note: "Macchinetta, forbice e finitura a rasoio." },
  { id: "taglio-barba", name: "Taglio + barba", min: 50, price: 38, icon: "combo", note: "Il pacchetto completo, il più richiesto.", popular: true },
  { id: "barba", name: "Barba modellata", min: 25, price: 16, icon: "beard", note: "Contorni a rasoio, panno caldo e olio." },
  { id: "rasatura", name: "Rasatura tradizionale", min: 30, price: 24, icon: "razor", note: "Rasoio a mano libera, due passate." },
  { id: "bambino", name: "Taglio bambino", min: 25, price: 15, icon: "kid", note: "Fino a 12 anni, con mamma o papà." },
  { id: "rituale", name: "Rituale capelli e cute", min: 20, price: 14, icon: "comb", note: "Shampoo, massaggio e lozione finale." },
];

const BARBERS = ["Marco Ferretti", "Giulia Rinaldi", "Samuele Okafor"];

// Salone: da ?salon=, altrimenti dal sottodominio (es. sell-barbers.piattaforma.it), altrimenti demo.
const SALON_SLUG = (() => {
  const p = new URLSearchParams(location.search).get("salon");
  if (p) return p;
  const labels = location.hostname.split(".").filter(Boolean);
  if (labels.length >= 2 && labels[0] !== "www" && labels[0] !== "localhost" &&
      !/^\d+$/.test(labels[0])) {
    return labels[0];
  }
  return "lambrate";
})();

const SERVICE_ICONS = {
  taglio: "scissors", "taglio-barba": "combo", barba: "beard",
  rasatura: "razor", bambino: "kid", rituale: "comb",
};
const SERVICE_NOTES = {
  taglio: "Taglio e rifinitura su misura.",
  "taglio-barba": "Il pacchetto completo.",
  barba: "Contorni curati a rasoio e panno caldo.",
  rasatura: "Rasatura tradizionale a mano libera.",
  bambino: "Taglio per i più piccoli.",
  rituale: "Shampoo, massaggio e lozione finale.",
};

function formatPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 11) return `+39 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return String(p || "");
}

function applySalon(cfg) {
  const phone = cfg.phone || "";
  SALON = {
    slug: cfg.slug,
    name: cfg.name,
    siblings: cfg.siblings || [],
    tagline: cfg.tagline || "Prenota online",
    address: cfg.address,
    phoneLabel: formatPhone(phone),
    phoneHref: phone ? "tel:" + phone : "",
    whatsapp: phone || "",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(cfg.address),
    piva: "",
    story: `Prenota online su ${cfg.name}: scegli servizio, barbiere e orario. Nessun account necessario.`,
    policies: [
      "Disdetta: apri il link «Annulla la prenotazione» nell'email di conferma.",
      "Paghi in salone: contanti, bancomat o carta.",
      "Nessun account da creare per prenotare.",
    ],
  };
  HOURS = {};
  Object.entries(cfg.hours || {}).forEach(([k, h]) => {
    HOURS[Number(k)] = { open: h[0], close: h[1] };
  });
  SERVICES = (cfg.services || []).map((s) => ({
    id: s.id, name: s.name, min: s.min, price: s.price,
    icon: SERVICE_ICONS[s.id] || "scissors",
    note: SERVICE_NOTES[s.id] || "Su misura.",
  }));
}


/* ------------------------------------------------------------------ *
 *  Utility date / disponibilità
 * ------------------------------------------------------------------ */
const pad = (n) => String(n).padStart(2, "0");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d) {
  const x = new Date(d);
  const shift = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - shift);
  x.setHours(0, 0, 0, 0);
  return x;
}
function hhmm(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Legge gli slot reali dal server (disponibilità memorizzata in `avail`). */
function slotsFor(dateISO, avail) {
  const e = avail && avail[dateISO];
  return (e && e.slots) || [];
}

/** True solo se il server ha risposto per quella data. */
function isAvailLoaded(dateISO, avail) {
  const e = avail && avail[dateISO];
  return e !== undefined;
}

function slotMoment(dateISO, minutes) {
  const d = parseISO(dateISO);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60);
}

function slotStatus(free, dateISO, minutes) {
  const now = Date.now();
  const start = slotMoment(dateISO, minutes).getTime();
  if (start < now + 45 * 60 * 1000) return "past";
  if (free === 0) return "busy";
  if (free === 1) return "last";
  return "free";
}

function daySummary(dateISO, avail) {
  const e = avail && avail[dateISO];
  if (!e) return { free: 0, closed: false, allPast: false, loaded: false };
  if (e.closed) return { free: 0, closed: true, allPast: false, loaded: true };
  const slots = e.slots || [];
  if (!slots.length) return { free: 0, closed: true, allPast: false, loaded: true };
  let free = 0;
  let open = 0;
  slots.forEach((s) => {
    const st = slotStatus(s.free, dateISO, s.minutes);
    if (st !== "past") {
      open += 1;
      if (st !== "busy") free += s.free;
    }
  });
  return { free, closed: false, allPast: open === 0, loaded: true };
}

/** Minuti di chiusura per una data (dalla tabella orari client). */
function closingFor(dateISO) {
  const h = HOURS[parseISO(dateISO).getDay()];
  return h ? h.close : null;
}

function weekDays(offset) {
  const monday = addDays(startOfWeek(new Date()), offset * 7);
  return [0, 1, 2, 3, 4, 5].map((i) => addDays(monday, i));
}

function longDate(dateISO) {
  if (!dateISO) return "";
  const d = parseISO(dateISO);
  return `${WD_LONG[LANG][d.getDay()]} ${d.getDate()} ${MONTHS[LANG][d.getMonth()]}`;
}
function shortDate(dateISO) {
  if (!dateISO) return "";
  const d = parseISO(dateISO);
  return `${WD_SHORT[LANG][d.getDay()]} ${d.getDate()} ${MONTHS[LANG][d.getMonth()].slice(0, 3)}`;
}

function weekLabel(offset) {
  const days = weekDays(offset);
  const a = days[0];
  const b = days[5];
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS[LANG][b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS[LANG][a.getMonth()]} – ${b.getDate()} ${MONTHS[LANG][b.getMonth()]} ${b.getFullYear()}`;
}

/** Prima data utile a partire dai dati reali ricevuti; null se non ancora determinabile. */
function firstBookableISO(avail) {
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const iso = isoDate(d);
    if (!avail || !avail[iso]) continue;      // giorno non ancora caricato
    const s = daySummary(iso, avail);
    if (s.loaded && !s.allPast && s.free > 0) return iso;
  }
  return null;
}

/** Stato di apertura in tempo reale, usato nell'header. */
function openStatus() {
  const now = new Date();
  const dow = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = HOURS[dow];
  if (today && mins >= today.open && mins < today.close) {
    return { open: true, kind: "now", time: hhmm(today.close) };
  }
  for (let i = 0; i < 8; i++) {
    const d = addDays(now, i);
    const h = HOURS[d.getDay()];
    if (!h) continue;
    if (i === 0 && mins < h.open) {
      return { open: false, kind: "today", time: hhmm(h.open) };
    }
    if (i > 0) {
      return { open: false, kind: "later", dow: d.getDay(), days: i, time: hhmm(h.open) };
    }
  }
  return { open: false, kind: "closed" };
}

/* ------------------------------------------------------------------ *
 *  Export calendario (.ics + Google Calendar)
 * ------------------------------------------------------------------ */
function icsLocal(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
function icsUTC(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function escapeICS(s) {
  return String(s).replace(/\r\n/g, "\\n").replace(/\r/g, "\\n")
    .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
function foldICS(s, limit = 75) {
  s = String(s);
  const out = [];
  while (s.length > limit) {
    out.push(s.slice(0, limit));
    s = " " + s.slice(limit);
  }
  out.push(s);
  return out.join("\r\n");
}
const VTIMEZONE_ROME = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Rome",
  "BEGIN:DAYLIGHT", "DTSTART:19700329T020000",
  "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3", "END:DAYLIGHT",
  "BEGIN:STANDARD", "DTSTART:19701025T030000",
  "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10", "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

function buildICS({ uid, title, description, location, start, end }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barberia Lambrate//Prenotazioni//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_ROME,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUTC(new Date())}`,
    `DTSTART;TZID=Europe/Rome:${icsLocal(start)}`,
    `DTEND;TZID=Europe/Rome:${icsLocal(end)}`,
    foldICS(`SUMMARY:${escapeICS(title)}`),
    foldICS(`LOCATION:${escapeICS(location)}`),
    foldICS(`DESCRIPTION:${escapeICS(description)}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    foldICS(`DESCRIPTION:${escapeICS("Promemoria: " + title)}`),
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

function downloadICS(filename, text) {
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function googleCalendarUrl({ title, description, location, start, end }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsLocal(start)}/${icsLocal(end)}`,
    details: description,
    location,
    ctz: "Europe/Rome",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ------------------------------------------------------------------ *
 *  Icone
 * ------------------------------------------------------------------ */
const ICON_PATHS = {
  scissors: (
    <>
      <circle cx="6.2" cy="6.4" r="2.4" />
      <circle cx="6.2" cy="17.6" r="2.4" />
      <path d="M8.4 7.6 18 16.4M8.4 16.4 18 7.6" />
    </>
  ),
  combo: (
    <>
      <circle cx="5.6" cy="6.2" r="2.2" />
      <circle cx="5.6" cy="17.8" r="2.2" />
      <path d="M7.6 7.4 17 15M7.6 16.6 17 9" />
      <path d="M17.6 17.4c2-1.6 3-3.4 3-5.4" />
    </>
  ),
  beard: (
    <>
      <path d="M4.5 8.5c1.5-2.4 4.3-3.6 7.5-3.6s6 1.2 7.5 3.6" />
      <path d="M5.2 12.4c0 4 2.6 6.6 6.8 6.6s6.8-2.6 6.8-6.6" />
      <path d="M9.6 15.4c1.5 1.2 3.3 1.2 4.8 0" />
    </>
  ),
  razor: (
    <>
      <path d="M4 8.5h11.5a2.5 2.5 0 0 1 0 5H4z" />
      <path d="M15.5 11h4.5" />
      <path d="M7 16.5v3M12 16.5v3" />
    </>
  ),
  kid: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.8 20c.6-3.8 3.6-6 7.2-6s6.6 2.2 7.2 6" />
    </>
  ),
  comb: (
    <>
      <path d="M5 5.5h14v5.5H5z" />
      <path d="M7 11v7.5M10.5 11v7.5M14 11v7.5M17.5 11v7.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3.2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.4-5.6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.4" r="2.3" />
    </>
  ),
  phone: <path d="M6 4.5h3l1.6 4-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.7 2 2 0 0 1 6 4.5z" />,
  calendar: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
      <path d="M3.6 10h16.8M8.4 3.6v3.6M15.6 3.6v3.6" />
    </>
  ),
  check: <path d="M4.8 12.6 9.6 17.4 19.2 7" />,
  chevronLeft: <path d="M14.4 5.6 8 12l6.4 6.4" />,
  chevronRight: <path d="M9.6 5.6 16 12l-6.4 6.4" />,
  user: (
    <>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5.2 20c.7-3.7 3.5-5.8 6.8-5.8s6.1 2.1 6.8 5.8" />
    </>
  ),
};

function Icon({ name, size = 20, stroke = 1.6, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function PoleMark() {
  return <span className="pole" aria-hidden="true" />;
}

/* Bandiera disegnata in SVG: le emoji bandiera non si vedono su Windows. */
function FlagIcon({ code }) {
  if (code === "it") {
    return (
      <svg className="flag" viewBox="0 0 3 2" width="22" height="15" aria-hidden="true" focusable="false">
        <rect width="1" height="2" fill="#009246" />
        <rect x="1" width="1" height="2" fill="#ffffff" />
        <rect x="2" width="1" height="2" fill="#ce2b37" />
      </svg>
    );
  }
  return (
    <svg className="flag" viewBox="0 0 60 30" width="22" height="15" aria-hidden="true" focusable="false">
      <clipPath id="gb-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-clip)" stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 *  Stili
 * ------------------------------------------------------------------ */
const CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{
  --accent:var(--ocd-tweak-accent-color, ${TWEAK_DEFAULTS.accentColor});
  --density:var(--ocd-tweak-density, ${TWEAK_DEFAULTS.density});
  --radius:calc(var(--ocd-tweak-corner-radius, ${TWEAK_DEFAULTS.cornerRadius}) * 1px);
  --gutter:calc(var(--density) * 20px);
  --surface:#ffffff;
  --surface-2:oklch(0.968 0.006 80);
  --bg:oklch(0.951 0.008 80);
  --ink:oklch(0.213 0.012 60);
  --ink-2:oklch(0.40 0.012 60);
  --muted:oklch(0.565 0.010 60);
  --border:oklch(0.902 0.006 80);
  --busy-bg:oklch(0.945 0.004 80);
  --cream:oklch(0.965 0.012 85);
  --success:oklch(0.50 0.10 158);
  --danger:oklch(0.52 0.17 25);
  --shadow-1:0 1px 2px rgba(30,25,20,.05),0 1px 3px rgba(30,25,20,.05);
  --shadow-2:0 20px 44px -26px rgba(30,25,20,.34),0 2px 8px -4px rgba(30,25,20,.10);
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--font);color:var(--ink);background:var(--surface);-webkit-font-smoothing:antialiased;overflow-x:hidden}
button{font-family:inherit}
:focus-visible{outline:2.5px solid var(--accent);outline-offset:2px;border-radius:6px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

.page{min-height:100vh;background:var(--surface);position:relative;overflow-x:hidden}
.sib-strip{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 18px;padding:10px 14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2)}
.sib-strip .sib-label{color:var(--muted);font-size:.82rem;font-weight:600}
.sib-strip a{font:inherit;font-size:.85rem;color:var(--accent);text-decoration:none;padding:6px 12px;border:1px solid var(--border);border-radius:999px}
.sib-strip a:hover{background:var(--surface);color:var(--fg)}
.sib-strip .sib-current{background:var(--accent);color:#111;border-color:var(--accent);font-weight:600;cursor:default}
.page::before{content:"";position:fixed;inset:0 0 auto 0;height:280px;pointer-events:none;z-index:0;
  background:repeating-linear-gradient(118deg,transparent 0 20px,color-mix(in oklab,var(--accent) 9%,transparent) 20px 27px);
  -webkit-mask-image:linear-gradient(to bottom,black,transparent);mask-image:linear-gradient(to bottom,black,transparent);opacity:.55}
.shell{position:relative;z-index:1;max-width:640px;margin:0 auto;background:var(--surface)}
.book{position:relative}

/* ---------- header ---------- */
.brand{background:var(--ink);color:var(--cream);padding:calc(var(--density) * 20px) var(--gutter) calc(var(--density) * 18px)}
.brand-top{display:flex;align-items:center;gap:12px}
.pole{flex:0 0 auto;width:11px;height:36px;border-radius:6px;border:1px solid rgba(255,255,255,.28);
  background:repeating-linear-gradient(48deg,var(--cream) 0 5px,var(--accent) 5px 10px)}
.wordmark{margin:2px 0 0;font-family:var(--serif);font-weight:600;font-size:clamp(1.4rem,5.6vw,1.72rem);letter-spacing:-.015em;line-height:1.05}
.brand-eyebrow{margin:0;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:color-mix(in oklab,var(--cream) 62%,transparent)}
.open-chip{margin-left:auto;flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;font-size:.74rem;font-weight:600;
  padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);color:var(--cream)}
.open-chip .dot{width:7px;height:7px;border-radius:50%;background:color-mix(in oklab,var(--accent) 80%,white)}
.open-chip.is-closed .dot{background:oklch(0.72 0.02 60)}
.lang-btn{margin-left:8px;flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:.72rem;font-weight:700;
  letter-spacing:.06em;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.22);
  color:var(--cream);cursor:pointer;transition:background .16s,border-color .16s}
.lang-btn:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.34)}
.lang-btn .flag{display:block;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.35)}
.brand-sub{margin:14px 0 0;font-size:.86rem;line-height:1.5;color:color-mix(in oklab,var(--cream) 74%,transparent)}
.brand-sub a{color:var(--cream);text-decoration:underline;text-underline-offset:2px}
.brand-note{margin:10px 0 0;font-size:.76rem;color:color-mix(in oklab,var(--cream) 58%,transparent)}

/* ---------- stepper ---------- */
.stepper{display:flex;gap:6px;padding:12px var(--gutter);border-bottom:1px solid var(--border);background:var(--surface)}
.step{flex:1 1 0;display:flex;flex-direction:column;gap:6px;background:none;border:0;padding:2px 0;cursor:pointer;text-align:left;color:var(--muted)}
.step:disabled{cursor:default}
.step-bar{height:4px;border-radius:99px;background:var(--border);transition:background .2s}
.step[aria-current="step"] .step-bar{background:var(--accent)}
.step.is-done .step-bar{background:color-mix(in oklab,var(--accent) 42%,var(--border))}
.step-label{font-size:.72rem;font-weight:600;letter-spacing:.01em}
.step[aria-current="step"] .step-label{color:var(--ink)}
.step-num{display:none}

/* ---------- sezioni ---------- */
.panel{padding:calc(var(--density) * 18px) var(--gutter) 0}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}
.eyebrow{margin:0 0 4px;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);font-weight:600}
.h2{margin:0;font-size:1.14rem;font-weight:680;letter-spacing:-.012em}
.h3{margin:0;font-size:.95rem;font-weight:660}
.sec-hint{margin:0;font-size:.78rem;color:var(--muted)}
.section{margin-top:calc(var(--density) * 26px)}

/* ---------- servizi ---------- */
.strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;padding:2px var(--gutter) 6px;
  margin:0 calc(var(--gutter) * -1);scrollbar-width:none}
.strip::-webkit-scrollbar{display:none}
.service{scroll-snap-align:start;flex:0 0 auto;width:204px;min-height:112px;padding:13px 14px;border-radius:calc(var(--radius) * .78);
  border:1px solid var(--border);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer;
  display:flex;flex-direction:column;gap:8px;justify-content:space-between;transition:border-color .16s,background .16s,box-shadow .16s}
.service:active{transform:scale(.99)}
.service[aria-pressed="true"]{border-color:var(--accent);background:color-mix(in oklab,var(--accent) 7%,var(--surface));box-shadow:var(--shadow-1)}
.svc-row{display:flex;align-items:center;gap:8px;color:var(--accent)}
.service[aria-pressed="true"] .svc-check{opacity:1}
.svc-check{margin-left:auto;opacity:0;color:var(--accent);transition:opacity .16s}
.svc-name{display:block;font-size:.98rem;font-weight:660;letter-spacing:-.01em;line-height:1.25}
.svc-meta{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--muted)}
.svc-meta b{color:var(--ink);font-weight:660}
.svc-note{margin:0;font-size:.78rem;line-height:1.4;color:var(--muted)}
.badge{display:inline-block;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  padding:3px 7px;border-radius:999px;background:color-mix(in oklab,var(--accent) 16%,var(--surface));color:color-mix(in oklab,var(--accent) 78%,var(--ink))}

/* ---------- settimana ---------- */
.week-bar{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.week-title{margin:0;font-size:.95rem;font-weight:660;text-transform:capitalize}
.icon-btn{width:44px;height:44px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border-radius:calc(var(--radius) * .62);
  border:1px solid var(--border);background:var(--surface);color:var(--ink);cursor:pointer;transition:background .16s,color .16s}
.icon-btn:hover:not(:disabled){background:var(--surface-2)}
.icon-btn:disabled{color:color-mix(in oklab,var(--muted) 55%,transparent);cursor:not-allowed}
.week-actions{display:flex;gap:8px;margin-left:auto}
.link-btn{border:0;background:none;padding:8px 4px;min-height:44px;font:inherit;font-size:.82rem;font-weight:640;color:var(--accent);
  text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.days{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;padding:2px var(--gutter) 8px;margin:0 calc(var(--gutter) * -1);scrollbar-width:none}
.days::-webkit-scrollbar{display:none}
.day{scroll-snap-align:center;flex:0 0 auto;width:78px;min-height:92px;padding:10px 6px;border-radius:calc(var(--radius) * .74);
  border:1px solid var(--border);background:var(--surface);color:var(--ink);font:inherit;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transition:background .16s,color .16s,border-color .16s}
.day[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--cream)}
.day:disabled{background:var(--surface-2);color:var(--muted);cursor:not-allowed;border-style:dashed}
.day-abbr{font-size:.66rem;font-weight:700;letter-spacing:.12em;color:var(--muted)}
.day[aria-pressed="true"] .day-abbr{color:color-mix(in oklab,var(--cream) 70%,transparent)}
.day-num{font-size:1.3rem;font-weight:680;line-height:1;font-variant-numeric:tabular-nums}
.day-free{font-size:.68rem;font-weight:600;color:var(--accent);font-variant-numeric:tabular-nums}
.day[aria-pressed="true"] .day-free{color:color-mix(in oklab,var(--cream) 82%,transparent)}
.day.is-closed .day-free,.day:disabled .day-free{color:var(--muted)}
.day-today{width:5px;height:5px;border-radius:50%;background:var(--accent)}
.day[aria-pressed="true"] .day-today{background:var(--cream)}

/* ---------- slot ---------- */
.slot-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.seg{display:inline-flex;padding:3px;gap:3px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border)}
.seg button{border:0;background:none;font:inherit;font-size:.8rem;font-weight:620;color:var(--muted);padding:8px 14px;min-height:38px;border-radius:999px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-1)}
.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:.74rem;color:var(--muted);margin-left:auto}
.legend span{display:inline-flex;align-items:center;gap:6px}
.swatch{width:10px;height:10px;border-radius:3px;border:1px solid var(--border);background:var(--surface)}
.swatch.last{background:color-mix(in oklab,var(--accent) 28%,var(--surface));border-color:color-mix(in oklab,var(--accent) 55%,var(--border))}
.swatch.busy{background:var(--busy-bg);border-color:transparent}
.slot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;margin-top:4px}
.slot{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:56px;padding:10px 14px;font:inherit;
  border-radius:calc(var(--radius) * .68);border:1px solid var(--border);background:var(--surface);color:var(--ink);
  text-align:left;cursor:pointer;transition:border-color .16s,background .16s}
.slot:active{transform:scale(.985)}
.slot-time{font-size:1rem;font-weight:660;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.slot-seats{font-size:.74rem;font-weight:600;color:var(--muted);text-align:right}
.slot.is-last{border-color:color-mix(in oklab,var(--accent) 50%,var(--border));background:color-mix(in oklab,var(--accent) 6%,var(--surface))}
.slot.is-last .slot-seats{color:color-mix(in oklab,var(--accent) 82%,var(--ink))}
.slot[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--cream)}
.slot[aria-pressed="true"] .slot-seats{color:color-mix(in oklab,var(--cream) 76%,transparent)}
.slot.is-busy{background:var(--busy-bg);border-color:transparent;color:var(--muted);cursor:not-allowed}
.slot.is-busy .slot-time{text-decoration:line-through;text-decoration-thickness:1px}
.slot.is-past{background:transparent;border-style:dashed;color:var(--muted);cursor:not-allowed}
.slot.is-past .slot-time{text-decoration:line-through;text-decoration-thickness:1px}
.empty{padding:22px 18px;border:1px dashed var(--border);border-radius:calc(var(--radius) * .8);text-align:left;background:var(--surface-2)}
.empty p{margin:6px 0 0;font-size:.84rem;color:var(--muted);line-height:1.5}
.next-free{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:14px;padding:12px 14px;min-height:56px;
  border-radius:calc(var(--radius) * .68);border:1px dashed color-mix(in oklab,var(--accent) 45%,var(--border));
  background:color-mix(in oklab,var(--accent) 5%,var(--surface));font:inherit;color:var(--ink);cursor:pointer;text-align:left}
.next-free b{font-weight:680}
.next-free .nf-label{display:block;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);font-weight:700}
.next-free .nf-value{font-size:.94rem;font-weight:660;text-transform:capitalize}

/* ---------- riepilogo + form ---------- */
.recap{border:1px solid var(--border);border-radius:calc(var(--radius) * .85);background:var(--surface-2);padding:16px}
.recap-row{display:flex;justify-content:space-between;gap:16px;padding:7px 0;font-size:.88rem}
.recap-row + .recap-row{border-top:1px solid color-mix(in oklab,var(--border) 70%,transparent)}
.recap-row dt{color:var(--muted)}
.recap-row dd{margin:0;font-weight:640;text-align:right}
.recap dl{margin:0}
.form{display:grid;gap:18px;margin-top:18px}
.field{display:grid;gap:7px}
.label{font-size:.84rem;font-weight:640}
.label .req{color:var(--accent)}
.input,textarea.input{width:100%;min-height:52px;padding:13px 14px;font:inherit;font-size:1rem;color:var(--ink);
  background:var(--surface);border:1px solid var(--border);border-radius:calc(var(--radius) * .6);transition:border-color .16s,box-shadow .16s}
textarea.input{min-height:96px;resize:vertical;line-height:1.5}
.input::placeholder{color:color-mix(in oklab,var(--muted) 72%,transparent)}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 18%,transparent);outline:none}
.input[aria-invalid="true"]{border-color:var(--danger)}
.field-error{margin:0;font-size:.78rem;font-weight:600;color:var(--danger)}
.field-hint{margin:0;font-size:.76rem;color:var(--muted)}
.check{display:flex;gap:12px;align-items:flex-start;padding:14px;border:1px solid var(--border);border-radius:calc(var(--radius) * .7);background:var(--surface-2);cursor:pointer}
.check input{width:22px;height:22px;margin:1px 0 0;accent-color:var(--accent);flex:0 0 auto}
.check span{font-size:.82rem;line-height:1.5;color:var(--ink-2)}
.alert{display:flex;gap:10px;align-items:flex-start;margin-top:16px;padding:12px 14px;border-radius:calc(var(--radius) * .6);
  background:color-mix(in oklab,var(--danger) 8%,var(--surface));border:1px solid color-mix(in oklab,var(--danger) 30%,transparent);
  color:color-mix(in oklab,var(--danger) 80%,var(--ink));font-size:.82rem;font-weight:600}

/* ---------- conferma ---------- */
.done-head{padding:calc(var(--density) * 26px) var(--gutter) 0;text-align:left}
.done-mark{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:color-mix(in oklab,var(--accent) 16%,var(--surface));color:color-mix(in oklab,var(--accent) 85%,var(--ink));border:1px solid color-mix(in oklab,var(--accent) 34%,transparent)}
.ticket{margin-top:18px;border:1px solid var(--border);border-radius:calc(var(--radius) * .9);background:var(--surface);box-shadow:var(--shadow-1);overflow:hidden}
.ticket-top{padding:16px 18px;background:var(--ink);color:var(--cream)}
.ticket-code{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:color-mix(in oklab,var(--cream) 62%,transparent)}
.ticket-svc{margin:6px 0 0;font-family:var(--serif);font-size:1.34rem;font-weight:600;letter-spacing:-.01em}
.ticket-when{margin:8px 0 0;font-size:.9rem;color:color-mix(in oklab,var(--cream) 82%,transparent)}
.ticket-body{padding:6px 18px 16px}
.dashes{position:relative;height:1px;margin:14px 0;background:repeating-linear-gradient(90deg,var(--border) 0 6px,transparent 6px 12px)}
.dashes::before,.dashes::after{content:"";position:absolute;top:-9px;width:18px;height:18px;border-radius:50%;background:var(--surface);border:1px solid var(--border)}
.dashes::before{left:-27px}
.dashes::after{right:-27px}
.actions{display:grid;gap:10px;margin-top:20px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:52px;padding:14px 18px;font:inherit;font-size:.95rem;
  font-weight:660;letter-spacing:-.005em;border-radius:calc(var(--radius) * .66);cursor:pointer;text-decoration:none;border:1px solid transparent;
  transition:background .16s,color .16s,border-color .16s,transform .08s}
.btn:active{transform:scale(.99)}
.btn-primary{background:var(--accent);color:#fff;border-color:color-mix(in oklab,var(--accent) 88%,black)}
.btn-primary:hover{background:color-mix(in oklab,var(--accent) 90%,black)}
.btn-dark{background:var(--ink);color:var(--cream)}
.btn-dark:hover{background:color-mix(in oklab,var(--ink) 88%,white)}
.btn-ghost{background:var(--surface);color:var(--ink);border-color:var(--border)}
.btn-ghost:hover{background:var(--surface-2)}
.btn:disabled{background:var(--surface-2);color:var(--muted);border-color:var(--border);cursor:not-allowed;transform:none}
.btn-block{width:100%}
.fineprint{margin:14px 0 0;font-size:.76rem;line-height:1.55;color:var(--muted)}
.ok-note{display:flex;gap:8px;align-items:center;margin-top:12px;font-size:.8rem;font-weight:600;color:var(--success)}

/* ---------- barra azione ---------- */
.cta{position:sticky;bottom:0;z-index:5;margin-top:calc(var(--density) * 24px);padding:12px var(--gutter) calc(12px + env(safe-area-inset-bottom,0px));
  background:color-mix(in oklab,var(--surface) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--border)}
.cta-inner{display:flex;align-items:center;gap:12px}
.cta-info{min-width:0;flex:1 1 auto}
.cta-label{display:block;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--muted)}
.cta-value{display:block;font-size:.92rem;font-weight:660;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;text-transform:capitalize}
.cta .btn{flex:0 0 auto;padding-inline:22px}
.cta-row{display:flex;gap:10px}
.cta-row .btn{flex:1 1 0;padding-inline:12px}

/* ---------- pannello informazioni ---------- */
.info{background:var(--surface-2);border-top:1px solid var(--border);padding:calc(var(--density) * 26px) var(--gutter) 40px;margin-top:8px}
.info h2{margin:0 0 10px;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);font-weight:700}
.info-card{border:1px solid var(--border);border-radius:calc(var(--radius) * .8);background:var(--surface);padding:16px;margin-bottom:14px}
.info-card p{margin:0;font-size:.86rem;line-height:1.6;color:var(--ink-2)}
.info-card p + p{margin-top:10px}
.info-lines{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.info-lines li{display:flex;gap:10px;align-items:flex-start;font-size:.86rem;line-height:1.5;color:var(--ink-2)}
.info-lines svg{flex:0 0 auto;margin-top:2px;color:var(--accent)}
.hours{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.hours li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:.84rem;border-bottom:1px solid color-mix(in oklab,var(--border) 60%,transparent)}
.hours li:last-child{border-bottom:0}
.hours li.is-today{font-weight:680;color:var(--ink)}
.hours li.is-today .day-tag{font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-left:8px}
.hours .closed{color:var(--muted)}
.info-foot{margin-top:18px;font-size:.74rem;line-height:1.6;color:var(--muted)}

/* ---------- desktop ---------- */
@media (min-width:720px){
  .slot-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
}
@media (min-width:1060px){
  body{background:var(--bg)}
  .page{background:var(--bg);padding:36px 24px 64px}
  .page::before{height:420px}
  .shell{max-width:1012px;display:grid;grid-template-columns:minmax(0,1fr) 312px;gap:28px;align-items:start;background:transparent}
  .book{background:var(--surface);border:1px solid var(--border);border-radius:calc(var(--radius) * 1.15);box-shadow:var(--shadow-2)}
  .brand{border-radius:calc(var(--radius) * 1.15) calc(var(--radius) * 1.15) 0 0}
  .info{background:transparent;border-top:0;padding:0;margin:0;position:sticky;top:36px}
  .info-card{background:var(--surface);box-shadow:var(--shadow-1)}
  .cta{border-radius:0 0 calc(var(--radius) * 1.15) calc(var(--radius) * 1.15)}
  .service{width:216px}
}
@media (prefers-reduced-motion:reduce){
  *{transition-duration:.01ms !important;animation-duration:.01ms !important}
}
`;

/* ------------------------------------------------------------------ *
 *  Sotto-componenti
 * ------------------------------------------------------------------ */
function Stepper({ step, onGo }) {
  const { t } = useT();
  const labels = [t("Servizio e ora"), t("I tuoi dati"), t("Conferma")];
  return (
    <nav className="stepper" aria-label={t("Avanzamento della prenotazione")}>
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          className={`step${i < step ? " is-done" : ""}`}
          aria-current={i === step ? "step" : undefined}
          disabled={i >= step}
          onClick={() => onGo(i)}
        >
          <span className="step-bar" />
          <span className="step-label">
            <span className="sr-only">{t("Passo {n}: ", { n: i + 1 })}</span>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}

function ServiceStrip({ services, value, onChange }) {
  const { t } = useT();
  return (
    <div className="strip" role="group" aria-label={t("Servizi disponibili")}>
      {services.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            className="service"
            aria-pressed={active}
            onClick={() => onChange(s.id)}
          >
            <span className="svc-row">
              <Icon name={s.icon} size={22} />
              {s.popular ? <span className="badge">{t("Più richiesto")}</span> : null}
              <span className="svc-check">
                <Icon name="check" size={18} stroke={2.2} />
              </span>
            </span>
            <span>
              <span className="svc-name">{serviceName(s)}</span>
              <span className="svc-meta" style={{ marginTop: 4 }}>
                <b>{s.min} min</b>
                <span aria-hidden="true">·</span>
                <b>€{s.price}</b>
              </span>
            </span>
            <span className="svc-note">{t(s.note)}</span>
          </button>
        );
      })}
    </div>
  );
}

function WeekStrip({ offset, selected, onSelect, onOffset, onToday, canGoBack, avail }) {
  const { t } = useT();
  const days = useMemo(() => weekDays(offset), [offset]);
  const todayISO = isoDate(new Date());
  return (
    <div>
      <div className="week-bar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => onOffset(-1)}
          disabled={!canGoBack}
          aria-label={t("Settimana precedente")}
        >
          <Icon name="chevronLeft" size={19} stroke={2} />
        </button>
        <h3 className="week-title">{weekLabel(offset)}</h3>
        <div className="week-actions">
          {offset !== 0 ? (
            <button type="button" className="link-btn" onClick={onToday}>
              {t("Torna a oggi")}
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn"
            onClick={() => onOffset(1)}
            aria-label={t("Settimana successiva")}
          >
            <Icon name="chevronRight" size={19} stroke={2} />
          </button>
        </div>
      </div>
      <div className="days" role="group" aria-label={t("Giorni della settimana")}>
        {days.map((d) => {
          const iso = isoDate(d);
          const s = daySummary(iso, avail);
          const disabled = s.loaded && (s.closed || s.allPast || s.free === 0);
          const active = iso === selected;
          const isToday = iso === todayISO;
          const sub = !s.loaded ? "…" : s.closed ? t("chiuso") : s.allPast ? t("trascorso") : s.free === 0 ? t("completo") : t("{n} posti", { n: s.free });
          return (
            <button
              key={iso}
              type="button"
              className={`day${(s.loaded && s.closed) ? " is-closed" : ""}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(iso)}
            >
              <span className="day-abbr">{WD_SHORT[LANG][d.getDay()]}</span>
              <span className="day-num">{d.getDate()}</span>
              <span className="day-free">{sub}</span>
              {isToday ? <span className="day-today" aria-hidden="true" /> : null}
              <span className="sr-only">
                {longDate(iso)}
                {disabled ? `, ${sub}` : `, ${t("{n} posti liberi", { n: s.free })}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotGrid({ dateISO, value, onSelect, onlyFree, onToggleFree, avail, service }) {
  const { t } = useT();
  const loaded = isAvailLoaded(dateISO, avail);
  const slots = useMemo(() => slotsFor(dateISO, avail), [dateISO, avail]);
  const closing = dateISO ? closingFor(dateISO) : null;
  const serviceMin = (service && service.min) || 0;
  const decorated = slots.map((s) => {
    const fits = !serviceMin || (closing && s.minutes + serviceMin <= closing);
    return { ...s, status: fits ? slotStatus(s.free, dateISO, s.minutes) : "busy" };
  });
  const visible = onlyFree ? decorated.filter((s) => s.status === "free" || s.status === "last") : decorated;
  const freeCount = decorated.filter((s) => s.status === "free" || s.status === "last").length;

  return (
    <div className="section">
      <div className="sec-head">
        <div>
          <p className="eyebrow">{t("Fascia oraria")}</p>
          <h3 className="h2" style={{ fontSize: "1.02rem", textTransform: "capitalize" }}>
            {longDate(dateISO)}
          </h3>
        </div>
        <p className="sec-hint">
          {loaded ? t("{a} slot liberi su {b}", { a: freeCount, b: decorated.length }) : "…"}
        </p>
      </div>

      <div className="slot-tools">
        <div className="seg" role="group" aria-label={t("Filtro slot")}>
          <button type="button" aria-pressed={!onlyFree} onClick={() => onToggleFree(false)}>
            {t("Tutti")}
          </button>
          <button type="button" aria-pressed={onlyFree} onClick={() => onToggleFree(true)}>
            {t("Solo liberi")}
          </button>
        </div>
        <div className="legend">
          <span>
            <i className="swatch" aria-hidden="true" /> {t("libero")}
          </span>
          <span>
            <i className="swatch last" aria-hidden="true" /> {t("ultimo posto")}
          </span>
          <span>
            <i className="swatch busy" aria-hidden="true" /> {t("completo")}
          </span>
        </div>
      </div>

      {!loaded ? (
        <div className="empty" aria-busy="true">
          <strong>{t("Caricamento disponibilità…")}</strong>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <strong>{t("Nessuno slot libero in questa giornata.")}</strong>
          <p>{t("Prova un altro giorno della settimana: di solito si libera qualcosa il pomeriggio.")}</p>
        </div>
      ) : (
        <div className="slot-grid" role="group" aria-label={t("Orari disponibili {date}", { date: longDate(dateISO) })}>
          {visible.map((s) => {
            const active = value === s.minutes;
            const isBusy = s.status === "busy";
            const isPast = s.status === "past";
            const seats = s.status === "last" ? t("Ultimo posto") : t("{n} posti", { n: s.free });
            return (
              <button
                key={s.minutes}
                type="button"
                className={`slot${s.status === "last" ? " is-last" : ""}${isBusy ? " is-busy" : ""}${isPast ? " is-past" : ""}`}
                aria-pressed={isBusy || isPast ? undefined : active}
                disabled={isBusy || isPast}
                onClick={() => onSelect(s.minutes)}
              >
                <span className="slot-time">{hhmm(s.minutes)}</span>
                <span className="slot-seats">{isBusy ? t("Completo") : isPast ? t("Trascorso") : seats}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookingStep({
  services, service, serviceId, setServiceId, weekOffset, setWeekOffset, dateISO, setDateISO,
  time, setTime, onlyFree, setOnlyFree, nextFree, onNextFree, headingRef, avail,
}) {
  const { t } = useT();
  return (
    <>
      <section className="panel" aria-labelledby="step1-h">
        <div className="sec-head">
          <div>
            <p className="eyebrow">{t("Passo 1 · Servizio")}</p>
            <h2 className="h2" id="step1-h" tabIndex={-1} ref={headingRef}>
              {t("Cosa ti serve oggi?")}
            </h2>
          </div>
        </div>
        <ServiceStrip services={services} value={serviceId} onChange={(id) => { setServiceId(id); setTime(null); }} />
        <p className="sec-hint" style={{ marginTop: 12 }}>
          {t("La durata scelta determina l'orario di fine appuntamento nel calendario.")}
        </p>
      </section>

      <section className="panel section" aria-labelledby="step1-week">
        <div className="sec-head">
          <div>
            <p className="eyebrow">{t("Disponibilità")}</p>
            <h2 className="h2" id="step1-week" style={{ fontSize: "1.05rem" }}>
              {t("Scegli giorno e ora")}
            </h2>
          </div>
        </div>
        <WeekStrip
          offset={weekOffset}
          selected={dateISO}
          avail={avail}
          onSelect={(iso) => {
            setDateISO(iso);
            setTime(null);
          }}
          onOffset={(delta) => {
            const next = Math.max(0, Math.min(5, weekOffset + delta));
            setWeekOffset(next);
            const days = weekDays(next);
            const isoOf = days.map((d) => isoDate(d));
            // data provvisoria nella nuova settimana (evita il rimbalzo alla precedente)
            const known = days.find((d) => {
              const s = daySummary(isoDate(d), avail);
              return s.loaded && !s.closed && !s.allPast && s.free > 0;
            });
            setDateISO(known ? isoDate(known) : isoOf[0]);
            setTime(null);
          }}
          onToday={() => {
            setWeekOffset(0);
            const d = firstBookableISO(avail);
            if (d) setDateISO(d);
            setTime(null);
          }}
          canGoBack={weekOffset > 0}
        />

        {nextFree && !time ? (
          <button type="button" className="next-free" onClick={onNextFree}>
            <Icon name="clock" size={20} />
            <span style={{ minWidth: 0 }}>
              <span className="nf-label">{t("Prima disponibilità")}</span>
              <span className="nf-value">
                {t("{date} · ore {time}", { date: shortDate(nextFree.date), time: hhmm(nextFree.minutes) })}
              </span>
            </span>
            <span style={{ marginLeft: "auto", color: "var(--accent)" }}>
              <Icon name="chevronRight" size={18} stroke={2} />
            </span>
          </button>
        ) : null}

        <SlotGrid
          dateISO={dateISO}
          value={time}
          onSelect={setTime}
          onlyFree={onlyFree}
          onToggleFree={setOnlyFree}
          avail={avail}
          service={service}
        />
      </section>
    </>
  );
}

function DetailsStep({ service, dateISO, time, barber, form, setForm, errors, onBlurField, onSubmit, sending, headingRef }) {
  const { t } = useT();
  const end = time + service.min;
  return (
    <>
      <section className="panel" aria-labelledby="step2-h">
        <div className="sec-head">
          <div>
            <p className="eyebrow">{t("Passo 2 · Dati cliente")}</p>
            <h2 className="h2" id="step2-h" tabIndex={-1} ref={headingRef}>
              {t("A nome di chi prenoto?")}
            </h2>
          </div>
        </div>

        <div className="recap">
          <dl>
            <div className="recap-row">
              <dt>{t("Servizio")}</dt>
              <dd>
                {serviceName(service)} · {service.min} min
              </dd>
            </div>
            <div className="recap-row">
              <dt>{t("Data")}</dt>
              <dd style={{ textTransform: "capitalize" }}>{longDate(dateISO)}</dd>
            </div>
            <div className="recap-row">
              <dt>{t("Orario")}</dt>
              <dd>
                {hhmm(time)} – {hhmm(end)}
              </dd>
            </div>
            <div className="recap-row">
              <dt>{t("Barbiere")}</dt>
              <dd>{barber}</dd>
            </div>
            <div className="recap-row">
              <dt>{t("Da pagare in salone")}</dt>
              <dd>€{service.price}</dd>
            </div>
          </dl>
        </div>

        <form className="form" onSubmit={(e) => { e.preventDefault(); if (onSubmit && !sending) onSubmit(); }} noValidate>
          <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: 18 }}>
            <legend className="sr-only">{t("Dati per la prenotazione")}</legend>

            <div className="field">
              <label className="label" htmlFor="c-name">
                {t("Nome e cognome")} <span className="req" aria-hidden="true">*</span>
                <span className="sr-only">{t("(obbligatorio)")}</span>
              </label>
              <input
                id="c-name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder={t("Es. Andrea Colombo")}
                value={form.name}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "err-name" : undefined}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => onBlurField("name")}
              />
              {errors.name ? (
                <p className="field-error" id="err-name">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label className="label" htmlFor="c-phone">
                {t("Telefono")} <span className="req" aria-hidden="true">*</span>
                <span className="sr-only">{t("(obbligatorio)")}</span>
              </label>
              <input
                id="c-phone"
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("Es. 335 118 4471")}
                value={form.phone}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "err-phone" : "hint-phone"}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={() => onBlurField("phone")}
              />
              {errors.phone ? (
                <p className="field-error" id="err-phone">
                  {errors.phone}
                </p>
              ) : (
                <p className="field-hint" id="hint-phone">
                  {t("Solo per conferma e promemoria 2 ore prima. Nessun account da creare.")}
                </p>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="c-email">
                {t("Email")} <span className="req" aria-hidden="true">*</span>
                <span className="sr-only">{t("(obbligatorio)")}</span>
              </label>
              <input
                id="c-email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("Es. nome@esempio.it")}
                value={form.email}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "err-email" : "hint-email"}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => onBlurField("email")}
              />
              {errors.email ? (
                <p className="field-error" id="err-email">
                  {errors.email}
                </p>
              ) : (
                <p className="field-hint" id="hint-email">
                  {t("Ti mandiamo qui l'invito pronto da aggiungere al tuo calendario.")}
                </p>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="c-note">
                {t("Note per il barbiere")} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({t("facoltativo")})</span>
              </label>
              <textarea
                id="c-note"
                className="input"
                rows={3}
                maxLength={240}
                placeholder={t("Es. Macchinetta 1 ai lati, forbice sopra. Arrivo con mio figlio.")}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
              <p className="field-hint">{t("{n} caratteri disponibili", { n: 240 - form.note.length })}</p>
            </div>

            <label className="check" htmlFor="c-consent">
              <input
                id="c-consent"
                type="checkbox"
                checked={form.consent}
                aria-invalid={errors.consent ? "true" : "false"}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              />
              <span>
                {t("Acconsento al trattamento dei dati (nome, telefono, note) per gestire questa prenotazione e inviarmi il promemoria.")}{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">{t("Leggi l'informativa sulla privacy")}</a>
              </span>
            </label>
          </fieldset>
        </form>

        {Object.keys(errors).length > 0 ? (
          <div className="alert" role="alert">
            <Icon name="user" size={18} />
            <span>{t("Controlla i campi segnalati: manca poco per completare la prenotazione.")}</span>
          </div>
        ) : null}
      </section>
    </>
  );
}

function DoneStep({ service, dateISO, time, barber, code, form, uid, headingRef, sendState }) {
  const { t } = useT();
  const [downloaded, setDownloaded] = useState(null);
  const start = slotMoment(dateISO, time);
  const end = new Date(start.getTime() + service.min * 60000);
  const title = `${serviceName(service)} — ${SALON.name}`;
  const description = [
    t("Codice prenotazione: {code}", { code }),
    t("Servizio: {name} ({min} min) — €{price}", { name: serviceName(service), min: service.min, price: service.price }),
    t("Barbiere: {barber}", { barber }),
    t("Cliente: {name}{phone}", { name: form.name, phone: form.phone ? ` · ${form.phone}` : "" }),
    form.note ? t("Note: {note}", { note: form.note }) : "",
    t("Per annullare: apri il link «Annulla la prenotazione» nell'email di conferma."),
  ]
    .filter(Boolean)
    .join("\n");

  const event = { title, description, location: `${SALON.name}, ${SALON.address}`, start, end };
  const filename = `appuntamento-barberia-lambrate-${dateISO}.ics`;

  const handleICS = () => {
    downloadICS(filename, buildICS({ uid, ...event }));
    setDownloaded(filename);
  };

  const waText = encodeURIComponent(
    t("Ciao {salon}! Ho prenotato: {service}, {date} alle {time} (codice {code}).",
      { salon: SALON.name, service: serviceName(service), date: longDate(dateISO), time: hhmm(time), code })
  );

  return (
    <>
      <section className="done-head" aria-labelledby="step3-h">
        <span className="done-mark" aria-hidden="true">
          <Icon name="check" size={26} stroke={2.4} />
        </span>
        <p className="eyebrow" style={{ marginTop: 16 }}>
          {t("Passo 3 · Conferma")}
        </p>
        <h2 className="h2" id="step3-h" tabIndex={-1} ref={headingRef} style={{ fontSize: "1.5rem" }}>
          {t("Appuntamento confermato")}
        </h2>
        <p className="sec-hint" style={{ marginTop: 8 }}>
                  {t("Ti aspettiamo in {address}. Arriva 5 minuti prima: il tempo di un caffè.", { address: SALON.address })}
                </p>

                {sendState === "sent" ? (
                  <div
                    role="status"
                    style={{
                      marginTop: 16, padding: "12px 14px", borderRadius: "12px",
                      background: "color-mix(in oklab, var(--success) 10%, var(--surface))",
                      border: "1px solid color-mix(in oklab, var(--success) 35%, transparent)",
                      color: "var(--success)", fontSize: ".84rem", fontWeight: 600, lineHeight: 1.5,
                    }}
                  >
                    <Icon name="check" size={17} stroke={2.2} />{" "}
                    {t("Invito inviato a te ({email}) e al barbiere ({barber}). Controlla la tua casella email: apri l'allegato .ics e tocca \"Aggiungi al calendario\".", { email: form.email, barber })}
                  </div>
                ) : sendState === "failed" ? (
                  <div
                    role="alert"
                    style={{
                      marginTop: 16, padding: "12px 14px", borderRadius: "12px",
                      background: "color-mix(in oklab, var(--danger) 8%, var(--surface))",
                      border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
                      color: "color-mix(in oklab, var(--danger) 80%, var(--ink))",
                      fontSize: ".82rem", fontWeight: 600, lineHeight: 1.5,
                    }}
                  >
                    <Icon name="user" size={17} />{" "}
                    {t("Non siamo riusciti a inviare l'invito via email. Usa i pulsanti qui sotto per aggiungere l'appuntamento al calendario e avvisa il salone al telefono.")}
                  </div>
                ) : null}

                <div className="ticket">
          <div className="ticket-top">
            <p className="ticket-code">{t("Codice {code}", { code })}</p>
            <p className="ticket-svc">{serviceName(service)}</p>
            <p className="ticket-when">
              {t("{date} · ore {a}–{b}", { date: cap(longDate(dateISO)), a: hhmm(time), b: hhmm(end.getHours() * 60 + end.getMinutes()) })}
            </p>
          </div>
          <div className="ticket-body">
            <div className="dashes" aria-hidden="true" />
            <dl>
              <div className="recap-row">
                <dt>{t("Durata")}</dt>
                <dd>{t("{n} minuti", { n: service.min })}</dd>
              </div>
              <div className="recap-row">
                <dt>{t("Barbiere")}</dt>
                <dd>{barber}</dd>
              </div>
              <div className="recap-row">
                <dt>{t("Indirizzo")}</dt>
                <dd>{SALON.address}</dd>
              </div>
              <div className="recap-row">
                <dt>{t("Da pagare in salone")}</dt>
                <dd>€{service.price}</dd>
              </div>
              <div className="recap-row">
                <dt>{t("Promemoria")}</dt>
                <dd>{t("SMS 2 ore prima")}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary btn-block" onClick={handleICS}>
            <Icon name="calendar" size={20} />
            {t("Aggiungi al calendario (.ics)")}
          </button>
          <a
            className="btn btn-ghost btn-block"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="calendar" size={20} />
            {t("Apri in Google Calendar")}
          </a>
          <a
            className="btn btn-ghost btn-block"
            href={`https://wa.me/${SALON.whatsapp}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Invia la conferma su WhatsApp")}
          </a>
        </div>

        {downloaded ? (
          <p className="ok-note" role="status">
            <Icon name="check" size={17} stroke={2.2} />
            {t("File pronto: {name}", { name: downloaded })}
          </p>
        ) : null}

        <p className="fineprint">
          {t("Il file .ics si apre direttamente nell’app Calendario su iPhone e in Google Calendar su Android. Se il download è bloccato dal browser, usa il pulsante Google Calendar: è già compilato con data, ora, durata e indirizzo del salone.")}
        </p>
      </section>
    </>
  );
}

function InfoPanel({ todayDow }) {
  const { t } = useT();
  const rows = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ dow, label: cap(WD_LONG[LANG][dow]) }));
  return (
    <aside className="info" aria-label={t("Informazioni sul salone")}>
      <h2>{t("Il salone")}</h2>
      <div className="info-card">
        <p>{t(SALON.story, { name: SALON.name })}</p>
        <ul className="info-lines" style={{ marginTop: 14 }}>
          <li>
            <Icon name="pin" size={18} />
            <span>
              {SALON.address}
              <br />
              <a href={SALON.mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                {t("Apri in Google Maps")}
              </a>
            </span>
          </li>
          <li>
            <Icon name="phone" size={18} />
            <span>
              <a href={`tel:${SALON.phoneHref}`} style={{ color: "var(--ink)", fontWeight: 640 }}>
                {SALON.phoneLabel}
              </a>
            </span>
          </li>
          <li>
            <Icon name="clock" size={18} />
            <span>{t("Consigliata la prenotazione online: in negozio restano pochi posti.")}</span>
          </li>
        </ul>
      </div>

      <h2>{t("Orari")}</h2>
      <div className="info-card">
        <ul className="hours">
          {rows.map((r) => {
            const h = HOURS[r.dow];
            return (
              <li key={r.label} className={r.dow === todayDow ? "is-today" : ""}>
                <span>
                  {r.label}
                  {r.dow === todayDow ? <span className="day-tag">{t("oggi")}</span> : null}
                </span>
                <span className={h ? "" : "closed"}>
                  {h ? `${hhmm(h.open)}–${hhmm(h.close)}` : t("chiuso")}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <h2>{t("Buono a sapersi")}</h2>
      <div className="info-card">
        <ul className="info-lines">
          {SALON.policies.map((p) => (
            <li key={p}>
              <Icon name="check" size={17} stroke={2.1} />
              <span>{t(p)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="info-foot">
        {SALON.name} · {SALON.piva}
        <br />
        {t("Disponibilità in tempo reale: prenota e ricevi l'invito via email sul tuo calendario.")}
      </p>
    </aside>
  );
}

function SiblingsStrip() {
  const { t } = useT();
  const sibs = SALON.siblings || [];
  if (!sibs.length) return null;
  const base = (location.hostname || "").split(".");
  const domain = base.length > 1 ? base.slice(1).join(".") : "example.com";
  const cur = SALON.slug || SALON_SLUG;
  return (
    <div className="sib-strip" role="navigation" aria-label={t("Scegli la postazione")}>
      <span className="sib-label">{t("Postazioni del salone:")}</span>
      {sibs.map((s) => (
        <a
          key={s.slug}
          href={`https://${s.slug}.${domain}`}
          className={s.slug === cur ? "sib-current" : ""}
        >
          {s.name}
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  App
 * ------------------------------------------------------------------ */
function App() {
  const [lang, setLangState] = useState(LANG);
  const t = useMemo(() => makeT(lang), [lang]);
  const toggleLang = () => {
    const l = lang === "it" ? "en" : "it";
    saveLang(l);
    setLangState(l);
  };
  const ctx = { lang, t, toggle: toggleLang };
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateISO, setDateISO] = useState(null);
  const [time, setTime] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "", consent: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sendState, setSendState] = useState(null); // null|loading|sent|failed
  const [confirmed, setConfirmed] = useState(null); // snapshot congelato della prenotazione
  const [avail, setAvail] = useState({});           // dateISO -> {slots, closed}
  const [availTick, setAvailTick] = useState(0);    // incrementa per ricaricare
  const [bookFeedback, setBookFeedback] = useState(null); // {type, msg}
  const headingRef = useRef(null);
  const [status, setStatus] = useState(openStatus());
  const [salonReady, setSalonReady] = useState(SALON_SLUG === "lambrate");

  // carica la configurazione del salone dall'URL e aggiorna l'interfaccia
  useEffect(() => {
    if (SALON_SLUG === "lambrate") return;
    fetch(`/salon?slug=${SALON_SLUG}`)
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg && cfg.name) applySalon(cfg);
      })
      .catch(() => {})
      .finally(() => setSalonReady(true));
  }, []);

  // titolo della scheda e attributo lang dell'HTML seguono la lingua scelta
  useEffect(() => {
    try { document.documentElement.lang = lang; } catch (e) { /* ignora */ }
    try { document.title = `${SALON.name} — ${makeT(lang)("Prenota online")}`; } catch (e) { /* ignora */ }
  }, [lang, salonReady]);

  const service = SERVICES.find((s) => s.id === serviceId) || null;

  // carica la disponibilità REALE dal server per la settimana visibile
  useEffect(() => {
    let cancelled = false;
    const days = weekDays(weekOffset).map((d) => isoDate(d));
    fetch(`/availability?${days.map((d) => `date=${d}`).join("&")}&salon=${SALON_SLUG}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data || !data.dates) return;
        const patch = {};
        data.dates.forEach((e) => {
          if (e && e.date) patch[e.date] = e;
        });
        setAvail((prev) => ({ ...prev, ...patch }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [weekOffset, availTick]);

  // carica un orizzonte di ~2 settimane all'avvio: così la prima data utile è
  // sempre disponibile anche a cavallo di un cambio settimana
  useEffect(() => {
    const days = [];
    for (let i = 0; i < 17; i++) days.push(isoDate(addDays(new Date(), i)));
    fetch(`/availability?${days.map((d) => `date=${d}`).join("&")}&salon=${SALON_SLUG}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data.dates) return;
        const patch = {};
        data.dates.forEach((e) => { if (e && e.date) patch[e.date] = e; });
        setAvail((prev) => ({ ...prev, ...patch }));
      })
      .catch(() => {});
  }, []);

  // appena i dati del server sono pronti, seleziona la prima data utile
  useEffect(() => {
    if (dateISO) return;
    const d = firstBookableISO(avail);
    if (d) setDateISO(d);
  }, [avail, dateISO]);

  // settimana corrente allineata alla data selezionata
  useEffect(() => {
    if (!dateISO) return;
    const sel = startOfWeek(parseISO(dateISO));
    const current = startOfWeek(new Date());
    const diff = Math.round((sel - current) / (7 * 24 * 3600 * 1000));
    if (diff !== weekOffset) setWeekOffset(Math.max(0, Math.min(5, diff)));
  }, [dateISO]);

  // orologio dell'header
  useEffect(() => {
    const id = setInterval(() => setStatus(openStatus()), 60000);
    return () => clearInterval(id);
  }, []);

  // focus sul titolo del passo per chi usa screen reader o tastiera
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const barber = useMemo(() => {
    if (!dateISO || time === null) return BARBERS[0];
    return BARBERS[hash(`${dateISO}|${time}|barber`) % BARBERS.length];
  }, [dateISO, time]);

  const uid = useMemo(
    () => `bl-${hash(`${dateISO}|${time}|${serviceId}|${form.phone}`).toString(36)}@barberialambrate.it`,
    [dateISO, time, serviceId, form.phone]
  );
  const code = useMemo(
    () => `BL-${hash(`${dateISO}${time}${serviceId}${form.phone}`).toString(36).slice(0, 4).toUpperCase()}`,
    [dateISO, time, serviceId, form.phone]
  );

  // prima disponibilità utile a partire dal giorno selezionato
  const nextFree = useMemo(() => {
    if (!dateISO) return null;
    const start = parseISO(dateISO);
    for (let i = 0; i < 21; i++) {
      const d = addDays(start, i);
      const iso = isoDate(d);
      const slot = slotsFor(iso, avail).find((s) => {
        const st = slotStatus(s.free, iso, s.minutes);
        return st === "free" || st === "last";
      });
      if (slot) return { date: iso, minutes: slot.minutes };
    }
    return null;
  }, [dateISO, avail]);

  const validate = (values) => {
    const next = {};
    const name = values.name.trim();
    if (name.length < 2) next.name = t("Inserisci nome e cognome (almeno 2 caratteri).");
    else if (!name.includes(" ")) next.name = t("Aggiungi anche il cognome, così ti riconosciamo alla cassa.");
    const digits = values.phone.replace(/\D/g, "");
    if (digits.length === 0) next.phone = t("Inserisci il numero di telefono.");
    else if (digits.length < 9 || digits.length > 13) next.phone = t("Numero non valido: usa almeno 9 cifre, es. 335 118 4471.");
    const email = values.email.trim();
    if (email.length === 0) next.email = t("Inserisci l'email: ti arrivano il promemoria e l'invito al calendario.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("Email non valida. Controlla l'indirizzo, es. nome@esempio.it");
    if (!values.consent) next.consent = t("Serve il consenso per gestire la prenotazione.");
    return next;
  };

  const onBlurField = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const found = validate(form);
    setErrors((prev) => {
      const next = { ...prev };
      if (found[field]) next[field] = found[field];
      else delete next[field];
      return next;
    });
  };

  const goToDetails = () => {
    if (!service || time === null) return;
    setErrors({});
    setTouched({});
    setStep(1);
  };

  const confirm = async () => {
    if (sendState === "loading") return;          // blocca doppio submit
    const found = validate(form);
    setErrors(found);
    setTouched({ name: true, phone: true, email: true, consent: true });
    if (Object.keys(found).length > 0) {
      const firstId = found.name ? "c-name" : found.phone ? "c-phone" : found.email ? "c-email" : "c-consent";
      const el = document.getElementById(firstId);
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (!service || time === null || !dateISO) return;
    // congelo il payload: quello che viene mostrato a conferma è QUESTO, non lo stato vivo
    const snapshot = {
      service,
      dateISO,
      time,
      barber,
      code,
      uid,
      form: { ...form },
    };
    // riserva lo slot sul server (transazione atomica) e invia gli inviti
    setSendState("loading");
    setBookFeedback(null);
    try {
      const res = await fetch("/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon: SALON_SLUG,
          requestId: uid,
          consent: form.consent === true,
          date: dateISO,
          time,
          barber,
          code,
          service: { id: service.id },
          client: { name: form.name, phone: form.phone, email: form.email.trim(), note: form.note },
        }),
      });
      const data = await res.json();
      if (data.conflict) {
        // lo slot è stato preso tra il caricamento e la conferma
        setSendState(null);
        setTime(null);
        setBookFeedback({
          type: "conflict",
          msg: t("L'orario delle {time} è appena stato prenotato da qualcun altro. Scegline uno ancora libero qui sotto.", { time: hhmm(snapshot.time) }),
        });
        setAvailTick((t) => t + 1);
        setStep(0);
        return;
      }
      if (data.ok) {
        // prenotazione confermata e inviti inviati
        setAvailTick((t) => t + 1);
        setSendState("sent");
        setConfirmed({ ...snapshot, code: data.code || snapshot.code, sendState: "sent" });
        setStep(2);
        return;
      }
      // altro errore (es. email barbiere non configurata)
      setSendState(null);
      setBookFeedback({
        type: "error",
        msg: (data && data.error) || t("Non è stato possibile completare la prenotazione."),
      });
      setStep(0);
    } catch (e) {
      setSendState(null);
      setBookFeedback({
        type: "error",
        msg: t("Server non raggiungibile. Riprova tra qualche secondo."),
      });
      setStep(0);
    }
  };

  const reset = () => {
    setStep(0);
    setServiceId(null);
    setTime(null);
    setForm({ name: "", phone: "", email: "", note: "", consent: false });
    setErrors({});
    setTouched({});
    setSendState(null);
    setBookFeedback(null);
    setConfirmed(null);
    setDateISO(firstBookableISO(avail));
    setWeekOffset(0);
  };

  const ready = Boolean(service) && time !== null && (() => {
    if (!dateISO) return false;
    const e = avail && avail[dateISO];
    if (!e || !e.slots) return false;
    const slot = e.slots.find((s) => s.minutes === time);
    if (!slot || slot.free <= 0) return false;
    const st = slotStatus(slot.free, dateISO, time);
    if (st === "past" || st === "busy") return false;
    const closing = dateISO ? closingFor(dateISO) : null;
    if (closing && time + service.min > closing) return false;
    return true;
  })();
  const ctaValue = ready
    ? `${serviceName(service)} · ${cap(shortDate(dateISO))} · ${hhmm(time)}`
    : service
    ? t("{name} · scegli un orario", { name: serviceName(service) })
    : t("Scegli servizio e orario");

  if (!salonReady) {
    return (
      <LangCtx.Provider value={ctx}>
      <div className="page">
        <style>{CSS}</style>
        <div className="brand" style={{ padding: "20px" }}>
          <h1 className="wordmark">{SALON.name}</h1>
          <p className="brand-note">{t("Caricamento…")}</p>
        </div>
      </div>
      </LangCtx.Provider>
    );
  }

  return (
    <LangCtx.Provider value={ctx}>
    <div className="page">
      <style>{CSS}</style>
      <div className="shell">
        <div className="book">
          <SiblingsStrip />
          <header className="brand">
            <div className="brand-top">
              <PoleMark />
              <div style={{ minWidth: 0 }}>
                <p className="brand-eyebrow">{t(SALON.tagline)}</p>
                <h1 className="wordmark">{SALON.name}</h1>
              </div>
              <span className={`open-chip${status.open ? "" : " is-closed"}`}>
                <span className="dot" aria-hidden="true" />
                {statusLabel(status)}
              </span>
              <button
                type="button"
                className="lang-btn"
                onClick={ctx.toggle}
                aria-label={lang === "it" ? "Passa all'inglese" : "Switch to Italian"}
                title={lang === "it" ? "Passa all'inglese" : "Switch to Italian"}
              >
                <FlagIcon code={lang === "it" ? "en" : "it"} />
                <span>{lang === "it" ? "EN" : "IT"}</span>
              </button>
            </div>
            <p className="brand-sub">
              {SALON.address} ·{" "}
              <a href={`tel:${SALON.phoneHref}`}>{SALON.phoneLabel}</a>
            </p>
            <p className="brand-note">
              {t("Prenotazione senza account: bastano nome e numero di telefono.")}
            </p>
          </header>

          <Stepper step={step} onGo={(i) => (sendState === "loading" ? null : (i < step ? setStep(i) : null))} />

          <div aria-live="polite" className="sr-only">
            {t("Passo {n} di 3: {step}", { n: step + 1, step: t(["servizio e orario", "dati cliente", "conferma"][step]) })}
          </div>

          <main>
            {step === 0 && bookFeedback ? (
              <div
                role="alert"
                style={{
                  marginTop: 18, padding: "12px 14px", borderRadius: "12px",
                  background: "color-mix(in oklab, var(--danger) 8%, var(--surface))",
                  border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
                  color: "color-mix(in oklab, var(--danger) 80%, var(--ink))",
                  fontSize: ".84rem", fontWeight: 600, lineHeight: 1.5,
                }}
              >
                {bookFeedback.msg}
              </div>
            ) : null}

            {step === 0 ? (
              <BookingStep
                services={SERVICES}
                service={service}
                serviceId={serviceId}
                setServiceId={setServiceId}
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
                dateISO={dateISO}
                setDateISO={setDateISO}
                time={time}
                setTime={setTime}
                onlyFree={onlyFree}
                setOnlyFree={setOnlyFree}
                nextFree={nextFree}
                onNextFree={() => {
                  if (!nextFree) return;
                  setDateISO(nextFree.date);
                  setTime(nextFree.minutes);
                }}
                headingRef={headingRef}
                avail={avail}
              />
            ) : null}

            {step === 1 && service ? (
              <DetailsStep
                service={service}
                dateISO={dateISO}
                time={time}
                barber={barber}
                form={form}
                setForm={setForm}
                errors={errors}
                onBlurField={onBlurField}
                onSubmit={confirm}
                sending={sendState === "loading"}
                headingRef={headingRef}
              />
            ) : null}

            {step === 2 && confirmed ? (
              <DoneStep
                service={confirmed.service}
                dateISO={confirmed.dateISO}
                time={confirmed.time}
                barber={confirmed.barber}
                code={confirmed.code}
                form={confirmed.form}
                uid={confirmed.uid}
                headingRef={headingRef}
                sendState={confirmed.sendState || sendState}
              />
            ) : null}
          </main>

          {step === 0 ? (
            <div className="cta">
              <div className="cta-inner">
                <div className="cta-info">
                  <span className="cta-label">{t("Riepilogo")}</span>
                  <span className="cta-value">{ctaValue}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-dark"
                  disabled={!ready || sendState === "loading"}
                  onClick={goToDetails}
                >
                  {t("Continua")}
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="cta">
              <div className="cta-row">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(0)} disabled={sendState === "loading"}>
                  <Icon name="chevronLeft" size={18} stroke={2} />
                  {t("Indietro")}
                </button>
                <button type="button" className="btn btn-primary" onClick={confirm} disabled={sendState === "loading"}>
                  {sendState === "loading" ? t("Invio in corso…") : t("Conferma prenotazione")}
                </button>
              </div>
              <p className="fineprint" style={{ marginTop: 10 }}>
                {t("Nessun pagamento online: {amount} da saldare in salone.", { amount: `€${confirmed ? confirmed.service.price : (service ? service.price : 0)}` })}
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="cta">
              <div className="cta-row">
                <button type="button" className="btn btn-ghost" onClick={reset}>
                  {t("Prenota un altro appuntamento")}
                </button>
                <a className="btn btn-dark" href={`tel:${SALON.phoneHref}`}>
                  {t("Chiama il salone")}
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <InfoPanel todayDow={new Date().getDay()} />
      </div>
    </div>
    </LangCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

