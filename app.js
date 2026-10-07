const { useState, useMemo, useRef, useEffect } = React;
const TWEAK_DEFAULTS = (
  /*EDITMODE-BEGIN*/
  {
    "accentColor": "oklch(0.62 0.13 55)",
    "density": 1,
    "cornerRadius": 18
  }
);
const EN = {
  "Prenota online": "Book online",
  "Prenotazione senza account: bastano nome e numero di telefono.": "No account needed: just your name and phone number.",
  "Caricamento\u2026": "Loading\u2026",
  "Servizio e ora": "Service & time",
  "I tuoi dati": "Your details",
  "Conferma": "Confirm",
  "Avanzamento della prenotazione": "Booking progress",
  "Passo {n}: ": "Step {n}: ",
  "Servizi disponibili": "Available services",
  "Pi\xF9 richiesto": "Most popular",
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
  "Caricamento disponibilit\xE0\u2026": "Loading availability\u2026",
  "Nessuno slot libero in questa giornata.": "No free slots on this day.",
  "Prova un altro giorno della settimana: di solito si libera qualcosa il pomeriggio.": "Try another day of the week: a slot usually frees up in the afternoon.",
  "Orari disponibili {date}": "Available times on {date}",
  "Ultimo posto": "Last seat",
  "Completo": "Full",
  "Trascorso": "Past",
  "Passo 1 \xB7 Servizio": "Step 1 \xB7 Service",
  "Cosa ti serve oggi?": "What do you need today?",
  "La durata scelta determina l'orario di fine appuntamento nel calendario.": "The chosen duration sets the appointment end time in your calendar.",
  "Disponibilit\xE0": "Availability",
  "Scegli giorno e ora": "Choose day and time",
  "Prima disponibilit\xE0": "Earliest availability",
  "{date} \xB7 ore {time}": "{date} \xB7 at {time}",
  "Passo 2 \xB7 Dati cliente": "Step 2 \xB7 Your details",
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
  "Servizio: {name} ({min} min) \u2014 \u20AC{price}": "Service: {name} ({min} min) \u2014 \u20AC{price}",
  "Barbiere: {barber}": "Barber: {barber}",
  "Cliente: {name}{phone}": "Client: {name}{phone}",
  "Note: {note}": "Notes: {note}",
  "Per annullare: apri il link \xABAnnulla la prenotazione\xBB nell'email di conferma.": "To cancel: open the \xABCancel booking\xBB link in the confirmation email.",
  "Ciao {salon}! Ho prenotato: {service}, {date} alle {time} (codice {code}).": "Hi {salon}! I booked: {service}, {date} at {time} (code {code}).",
  "Passo 3 \xB7 Conferma": "Step 3 \xB7 Confirmation",
  "Appuntamento confermato": "Appointment confirmed",
  "Ti aspettiamo in {address}. Arriva 5 minuti prima: il tempo di un caff\xE8.": "See you at {address}. Arrive 5 minutes early \u2014 time for a coffee.",
  'Invito inviato a te ({email}) e al barbiere ({barber}). Controlla la tua casella email: apri l\'allegato .ics e tocca "Aggiungi al calendario".': 'Invite sent to you ({email}) and the barber ({barber}). Check your inbox: open the .ics attachment and tap "Add to calendar".',
  "Non siamo riusciti a inviare l'invito via email. Usa i pulsanti qui sotto per aggiungere l'appuntamento al calendario e avvisa il salone al telefono.": "We couldn't send the invite by email. Use the buttons below to add the appointment to your calendar and call the salon.",
  "Codice {code}": "Code {code}",
  "{date} \xB7 ore {a}\u2013{b}": "{date} \xB7 {a}\u2013{b}",
  "Durata": "Duration",
  "{n} minuti": "{n} minutes",
  "Indirizzo": "Address",
  "Promemoria": "Reminder",
  "SMS 2 ore prima": "SMS 2 hours before",
  "Aggiungi al calendario (.ics)": "Add to calendar (.ics)",
  "Apri in Google Calendar": "Open in Google Calendar",
  "Invia la conferma su WhatsApp": "Send the confirmation on WhatsApp",
  "File pronto: {name}": "File ready: {name}",
  "Il file .ics si apre direttamente nell\u2019app Calendario su iPhone e in Google Calendar su Android. Se il download \xE8 bloccato dal browser, usa il pulsante Google Calendar: \xE8 gi\xE0 compilato con data, ora, durata e indirizzo del salone.": "The .ics file opens directly in the Calendar app on iPhone and in Google Calendar on Android. If your browser blocks the download, use the Google Calendar button: it's already filled with date, time, duration and the salon address.",
  "Informazioni sul salone": "Salon information",
  "Il salone": "The salon",
  "Apri in Google Maps": "Open in Google Maps",
  "Consigliata la prenotazione online: in negozio restano pochi posti.": "Online booking recommended: only a few walk-in slots left.",
  "Orari": "Opening hours",
  "oggi": "today",
  "Buono a sapersi": "Good to know",
  "Disponibilit\xE0 in tempo reale: prenota e ricevi l'invito via email sul tuo calendario.": "Real-time availability: book and get the calendar invite by email.",
  "Scegli la postazione": "Choose a station",
  "Postazioni del salone:": "Salon stations:",
  "Passo {n} di 3: {step}": "Step {n} of 3: {step}",
  "servizio e orario": "service and time",
  "dati cliente": "your details",
  "conferma": "confirmation",
  "Riepilogo": "Summary",
  "Continua": "Continue",
  "Indietro": "Back",
  "Invio in corso\u2026": "Sending\u2026",
  "Conferma prenotazione": "Confirm booking",
  "Nessun pagamento online: {amount} da saldare in salone.": "No online payment: {amount} to pay at the salon.",
  "Prenota un altro appuntamento": "Book another appointment",
  "Chiama il salone": "Call the salon",
  "{name} \xB7 scegli un orario": "{name} \xB7 pick a time",
  "Scegli servizio e orario": "Choose service and time",
  "Inserisci nome e cognome (almeno 2 caratteri).": "Enter your full name (at least 2 characters).",
  "Aggiungi anche il cognome, cos\xEC ti riconosciamo alla cassa.": "Please add your last name so we recognise you at the desk.",
  "Inserisci il numero di telefono.": "Enter your phone number.",
  "Numero non valido: usa almeno 9 cifre, es. 335 118 4471.": "Invalid number: use at least 9 digits, e.g. 335 118 4471.",
  "Inserisci l'email: ti arrivano il promemoria e l'invito al calendario.": "Enter your email: you'll get the reminder and the calendar invite.",
  "Email non valida. Controlla l'indirizzo, es. nome@esempio.it": "Invalid email. Check the address, e.g. name@example.com",
  "Serve il consenso per gestire la prenotazione.": "Consent is required to manage the booking.",
  "L'orario delle {time} \xE8 appena stato prenotato da qualcun altro. Scegline uno ancora libero qui sotto.": "The {time} slot was just booked by someone else. Pick one that's still free below.",
  "Non \xE8 stato possibile completare la prenotazione.": "The booking couldn't be completed.",
  "Server non raggiungibile. Riprova tra qualche secondo.": "Server unreachable. Please try again in a moment.",
  "Aperto ora \xB7 chiude alle {time}": "Open now \xB7 closes at {time}",
  "Chiuso \xB7 apre oggi alle {time}": "Closed \xB7 opens today at {time}",
  "Chiuso \xB7 apre {when} alle {time}": "Closed \xB7 opens {when} at {time}",
  "Chiuso": "Closed",
  "domani": "tomorrow",
  "Barbiere uomo \xB7 dal 2014": "Men's barber \xB7 since 2014",
  "Tre poltrone, forbici e rasoio a mano libera. Caff\xE8 offerto, musica bassa e nessuna fretta.": "Three chairs, scissors and a straight razor. Free coffee, quiet music and no rush.",
  "Prenota online su {name}: scegli servizio, barbiere e orario. Nessun account necessario.": "Book online at {name}: choose service, barber and time. No account needed.",
  "Disdetta: apri il link \xABAnnulla la prenotazione\xBB nell'email di conferma.": "Cancellation: open the \xABCancel booking\xBB link in the confirmation email.",
  "Paghi in salone: contanti, bancomat o carta di credito.": "Pay at the salon: cash, debit or credit card.",
  "Paghi in salone: contanti, bancomat o carta.": "Pay at the salon: cash, debit or credit card.",
  "Nessun anticipo e nessun account da creare per prenotare.": "No deposit and no account to create to book.",
  "Nessun account da creare per prenotare.": "No account to create to book.",
  "Macchinetta, forbice e finitura a rasoio.": "Clippers, scissors and a razor finish.",
  "Il pacchetto completo, il pi\xF9 richiesto.": "The complete package, our most requested.",
  "Contorni a rasoio, panno caldo e olio.": "Razor edges, hot towel and oil.",
  "Rasoio a mano libera, due passate.": "Straight razor, two passes.",
  "Fino a 12 anni, con mamma o pap\xE0.": "Up to 12 years old, with mum or dad.",
  "Shampoo, massaggio e lozione finale.": "Shampoo, massage and finishing lotion.",
  "Taglio e rifinitura su misura.": "Tailored cut and finish.",
  "Il pacchetto completo.": "The complete package.",
  "Contorni curati a rasoio e panno caldo.": "Razor-clean edges and hot towel.",
  "Rasatura tradizionale a mano libera.": "Traditional straight-razor shave.",
  "Taglio per i pi\xF9 piccoli.": "A cut for the little ones."
};
const WD_SHORT = {
  it: ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"],
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
};
const WD_LONG = {
  it: ["domenica", "luned\xEC", "marted\xEC", "mercoled\xEC", "gioved\xEC", "venerd\xEC", "sabato"],
  en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
};
const MONTHS = {
  it: [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre"
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
const LANG_KEY = "barberia_lang";
function detectLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "it" || stored === "en") return stored;
  } catch (e) {
  }
  try {
    return String(navigator.language || "").toLowerCase().startsWith("it") ? "it" : "en";
  } catch (e) {
    return "it";
  }
}
let LANG = detectLang();
function makeT(lang) {
  return function t(s, params) {
    let out = lang === "en" && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s;
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
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
  }
  try {
    document.documentElement.lang = lang;
  } catch (e) {
  }
}
const SERVICE_IT_NAMES = {
  taglio: "Taglio classico",
  "taglio-barba": "Taglio + barba",
  barba: "Barba modellata",
  rasatura: "Rasatura tradizionale",
  bambino: "Taglio bambino",
  rituale: "Rituale capelli e cute"
};
const SERVICE_EN_NAMES = {
  taglio: "Classic cut",
  "taglio-barba": "Cut + beard",
  barba: "Beard shaping",
  rasatura: "Traditional shave",
  bambino: "Kids' cut",
  rituale: "Hair & scalp ritual"
};
function serviceName(s) {
  if (!s) return "";
  if (LANG === "en" && SERVICE_EN_NAMES[s.id] && SERVICE_IT_NAMES[s.id] === s.name) {
    return SERVICE_EN_NAMES[s.id];
  }
  return s.name;
}
const LangCtx = React.createContext({ lang: "it", t: (s) => s, toggle: () => {
} });
function useT() {
  return React.useContext(LangCtx);
}
function statusLabel(s) {
  const t = makeT(LANG);
  if (s.kind === "now") return t("Aperto ora \xB7 chiude alle {time}", { time: s.time });
  if (s.kind === "today") return t("Chiuso \xB7 apre oggi alle {time}", { time: s.time });
  if (s.kind === "later") {
    const when = s.days === 1 ? t("domani") : WD_LONG[LANG][s.dow];
    return t("Chiuso \xB7 apre {when} alle {time}", { when, time: s.time });
  }
  return t("Chiuso");
}
let SALON = {
  name: "Barberia Lambrate",
  tagline: "Barbiere uomo \xB7 dal 2014",
  address: "Via Cesare Battisti 24, 20134 Milano",
  phoneLabel: "02 4531 8890",
  phoneHref: "+390245318890",
  whatsapp: "393351184471",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Via+Cesare+Battisti+24+20134+Milano",
  piva: "P.IVA 04821960168",
  story: "Tre poltrone, forbici e rasoio a mano libera. Caff\xE8 offerto, musica bassa e nessuna fretta.",
  policies: [
    "Disdetta: apri il link \xABAnnulla la prenotazione\xBB nell'email di conferma.",
    "Paghi in salone: contanti, bancomat o carta di credito.",
    "Nessun anticipo e nessun account da creare per prenotare."
  ]
};
let HOURS = {
  1: { open: 9 * 60, close: 19 * 60 },
  2: { open: 9 * 60, close: 20 * 60 },
  3: { open: 9 * 60, close: 20 * 60 },
  4: { open: 9 * 60, close: 20 * 60 },
  5: { open: 9 * 60, close: 20 * 60 },
  6: { open: 9 * 60, close: 17 * 60 }
};
let SERVICES = [
  { id: "taglio", name: "Taglio classico", min: 30, price: 22, icon: "scissors", note: "Macchinetta, forbice e finitura a rasoio." },
  { id: "taglio-barba", name: "Taglio + barba", min: 50, price: 38, icon: "combo", note: "Il pacchetto completo, il pi\xF9 richiesto.", popular: true },
  { id: "barba", name: "Barba modellata", min: 25, price: 16, icon: "beard", note: "Contorni a rasoio, panno caldo e olio." },
  { id: "rasatura", name: "Rasatura tradizionale", min: 30, price: 24, icon: "razor", note: "Rasoio a mano libera, due passate." },
  { id: "bambino", name: "Taglio bambino", min: 25, price: 15, icon: "kid", note: "Fino a 12 anni, con mamma o pap\xE0." },
  { id: "rituale", name: "Rituale capelli e cute", min: 20, price: 14, icon: "comb", note: "Shampoo, massaggio e lozione finale." }
];
const BARBERS = ["Marco Ferretti", "Giulia Rinaldi", "Samuele Okafor"];
const SALON_SLUG = (() => {
  const p = new URLSearchParams(location.search).get("salon");
  if (p) return p;
  const labels = location.hostname.split(".").filter(Boolean);
  if (labels.length >= 2 && labels[0] !== "www" && labels[0] !== "localhost" && !/^\d+$/.test(labels[0])) {
    return labels[0];
  }
  return "lambrate";
})();
const SERVICE_ICONS = {
  taglio: "scissors",
  "taglio-barba": "combo",
  barba: "beard",
  rasatura: "razor",
  bambino: "kid",
  rituale: "comb"
};
const SERVICE_NOTES = {
  taglio: "Taglio e rifinitura su misura.",
  "taglio-barba": "Il pacchetto completo.",
  barba: "Contorni curati a rasoio e panno caldo.",
  rasatura: "Rasatura tradizionale a mano libera.",
  bambino: "Taglio per i pi\xF9 piccoli.",
  rituale: "Shampoo, massaggio e lozione finale."
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
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(cfg.address),
    piva: "",
    story: `Prenota online su ${cfg.name}: scegli servizio, barbiere e orario. Nessun account necessario.`,
    policies: [
      "Disdetta: apri il link \xABAnnulla la prenotazione\xBB nell'email di conferma.",
      "Paghi in salone: contanti, bancomat o carta.",
      "Nessun account da creare per prenotare."
    ]
  };
  HOURS = {};
  Object.entries(cfg.hours || {}).forEach(([k, h]) => {
    HOURS[Number(k)] = { open: h[0], close: h[1] };
  });
  SERVICES = (cfg.services || []).map((s) => ({
    id: s.id,
    name: s.name,
    min: s.min,
    price: s.price,
    icon: SERVICE_ICONS[s.id] || "scissors",
    note: SERVICE_NOTES[s.id] || "Su misura."
  }));
}
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
function slotsFor(dateISO, avail) {
  const e = avail && avail[dateISO];
  return e && e.slots || [];
}
function isAvailLoaded(dateISO, avail) {
  const e = avail && avail[dateISO];
  return e !== void 0;
}
function slotMoment(dateISO, minutes) {
  const d = parseISO(dateISO);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60);
}
function slotStatus(free, dateISO, minutes) {
  const now = Date.now();
  const start = slotMoment(dateISO, minutes).getTime();
  if (start < now + 45 * 60 * 1e3) return "past";
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
function closingFor(dateISO) {
  const h = HOURS[parseISO(dateISO).getDay()];
  return h ? h.close : null;
}
function weekDays(offset) {
  const monday = addDays(startOfWeek(/* @__PURE__ */ new Date()), offset * 7);
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
    return `${a.getDate()} \u2013 ${b.getDate()} ${MONTHS[LANG][b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS[LANG][a.getMonth()]} \u2013 ${b.getDate()} ${MONTHS[LANG][b.getMonth()]} ${b.getFullYear()}`;
}
function firstBookableISO(avail) {
  const today = /* @__PURE__ */ new Date();
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const iso = isoDate(d);
    if (!avail || !avail[iso]) continue;
    const s = daySummary(iso, avail);
    if (s.loaded && !s.allPast && s.free > 0) return iso;
  }
  return null;
}
function openStatus() {
  const now = /* @__PURE__ */ new Date();
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
function icsLocal(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
function icsUTC(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function escapeICS(s) {
  return String(s).replace(/\r\n/g, "\\n").replace(/\r/g, "\\n").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
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
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Rome",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T020000",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "DTSTART:19701025T030000",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "END:STANDARD",
  "END:VTIMEZONE"
].join("\r\n");
function buildICS({ uid, title, description, location: location2, start, end }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barberia Lambrate//Prenotazioni//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_ROME,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUTC(/* @__PURE__ */ new Date())}`,
    `DTSTART;TZID=Europe/Rome:${icsLocal(start)}`,
    `DTEND;TZID=Europe/Rome:${icsLocal(end)}`,
    foldICS(`SUMMARY:${escapeICS(title)}`),
    foldICS(`LOCATION:${escapeICS(location2)}`),
    foldICS(`DESCRIPTION:${escapeICS(description)}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    foldICS(`DESCRIPTION:${escapeICS("Promemoria: " + title)}`),
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
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
  setTimeout(() => URL.revokeObjectURL(url), 5e3);
}
function googleCalendarUrl({ title, description, location: location2, start, end }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsLocal(start)}/${icsLocal(end)}`,
    details: description,
    location: location2,
    ctz: "Europe/Rome"
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
const ICON_PATHS = {
  scissors: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "6.2", cy: "6.4", r: "2.4" }), /* @__PURE__ */ React.createElement("circle", { cx: "6.2", cy: "17.6", r: "2.4" }), /* @__PURE__ */ React.createElement("path", { d: "M8.4 7.6 18 16.4M8.4 16.4 18 7.6" })),
  combo: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "5.6", cy: "6.2", r: "2.2" }), /* @__PURE__ */ React.createElement("circle", { cx: "5.6", cy: "17.8", r: "2.2" }), /* @__PURE__ */ React.createElement("path", { d: "M7.6 7.4 17 15M7.6 16.6 17 9" }), /* @__PURE__ */ React.createElement("path", { d: "M17.6 17.4c2-1.6 3-3.4 3-5.4" })),
  beard: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4.5 8.5c1.5-2.4 4.3-3.6 7.5-3.6s6 1.2 7.5 3.6" }), /* @__PURE__ */ React.createElement("path", { d: "M5.2 12.4c0 4 2.6 6.6 6.8 6.6s6.8-2.6 6.8-6.6" }), /* @__PURE__ */ React.createElement("path", { d: "M9.6 15.4c1.5 1.2 3.3 1.2 4.8 0" })),
  razor: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 8.5h11.5a2.5 2.5 0 0 1 0 5H4z" }), /* @__PURE__ */ React.createElement("path", { d: "M15.5 11h4.5" }), /* @__PURE__ */ React.createElement("path", { d: "M7 16.5v3M12 16.5v3" })),
  kid: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "3.4" }), /* @__PURE__ */ React.createElement("path", { d: "M4.8 20c.6-3.8 3.6-6 7.2-6s6.6 2.2 7.2 6" })),
  comb: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M5 5.5h14v5.5H5z" }), /* @__PURE__ */ React.createElement("path", { d: "M7 11v7.5M10.5 11v7.5M14 11v7.5M17.5 11v7.5" })),
  clock: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 7.6V12l3.2 2" })),
  pin: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 21s6.4-5.6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15.4 12 21 12 21z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "10.4", r: "2.3" })),
  phone: /* @__PURE__ */ React.createElement("path", { d: "M6 4.5h3l1.6 4-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.7 2 2 0 0 1 6 4.5z" }),
  calendar: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3.6", y: "5.4", width: "16.8", height: "15", rx: "2.6" }), /* @__PURE__ */ React.createElement("path", { d: "M3.6 10h16.8M8.4 3.6v3.6M15.6 3.6v3.6" })),
  check: /* @__PURE__ */ React.createElement("path", { d: "M4.8 12.6 9.6 17.4 19.2 7" }),
  chevronLeft: /* @__PURE__ */ React.createElement("path", { d: "M14.4 5.6 8 12l6.4 6.4" }),
  chevronRight: /* @__PURE__ */ React.createElement("path", { d: "M9.6 5.6 16 12l-6.4 6.4" }),
  user: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8.4", r: "3.6" }), /* @__PURE__ */ React.createElement("path", { d: "M5.2 20c.7-3.7 3.5-5.8 6.8-5.8s6.1 2.1 6.8 5.8" }))
};
function Icon({ name, size = 20, stroke = 1.6, className }) {
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className,
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false"
    },
    ICON_PATHS[name]
  );
}
function PoleMark() {
  return /* @__PURE__ */ React.createElement("span", { className: "pole", "aria-hidden": "true" });
}
function FlagIcon({ code }) {
  if (code === "it") {
    return /* @__PURE__ */ React.createElement("svg", { className: "flag", viewBox: "0 0 3 2", width: "22", height: "15", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("rect", { width: "1", height: "2", fill: "#009246" }), /* @__PURE__ */ React.createElement("rect", { x: "1", width: "1", height: "2", fill: "#ffffff" }), /* @__PURE__ */ React.createElement("rect", { x: "2", width: "1", height: "2", fill: "#ce2b37" }));
  }
  return /* @__PURE__ */ React.createElement("svg", { className: "flag", viewBox: "0 0 60 30", width: "22", height: "15", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("clipPath", { id: "gb-clip" }, /* @__PURE__ */ React.createElement("path", { d: "M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" })), /* @__PURE__ */ React.createElement("rect", { width: "60", height: "30", fill: "#012169" }), /* @__PURE__ */ React.createElement("path", { d: "M0,0 L60,30 M60,0 L0,30", stroke: "#ffffff", strokeWidth: "6" }), /* @__PURE__ */ React.createElement("path", { d: "M0,0 L60,30 M60,0 L0,30", clipPath: "url(#gb-clip)", stroke: "#c8102e", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M30,0 v30 M0,15 h60", stroke: "#ffffff", strokeWidth: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M30,0 v30 M0,15 h60", stroke: "#c8102e", strokeWidth: "6" }));
}
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
function Stepper({ step, onGo }) {
  const { t } = useT();
  const labels = [t("Servizio e ora"), t("I tuoi dati"), t("Conferma")];
  return /* @__PURE__ */ React.createElement("nav", { className: "stepper", "aria-label": t("Avanzamento della prenotazione") }, labels.map((label, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: label,
      type: "button",
      className: `step${i < step ? " is-done" : ""}`,
      "aria-current": i === step ? "step" : void 0,
      disabled: i >= step,
      onClick: () => onGo(i)
    },
    /* @__PURE__ */ React.createElement("span", { className: "step-bar" }),
    /* @__PURE__ */ React.createElement("span", { className: "step-label" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, t("Passo {n}: ", { n: i + 1 })), label)
  )));
}
function ServiceStrip({ services, value, onChange }) {
  const { t } = useT();
  return /* @__PURE__ */ React.createElement("div", { className: "strip", role: "group", "aria-label": t("Servizi disponibili") }, services.map((s) => {
    const active = s.id === value;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s.id,
        type: "button",
        className: "service",
        "aria-pressed": active,
        onClick: () => onChange(s.id)
      },
      /* @__PURE__ */ React.createElement("span", { className: "svc-row" }, /* @__PURE__ */ React.createElement(Icon, { name: s.icon, size: 22 }), s.popular ? /* @__PURE__ */ React.createElement("span", { className: "badge" }, t("Pi\xF9 richiesto")) : null, /* @__PURE__ */ React.createElement("span", { className: "svc-check" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18, stroke: 2.2 }))),
      /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "svc-name" }, serviceName(s)), /* @__PURE__ */ React.createElement("span", { className: "svc-meta", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("b", null, s.min, " min"), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\xB7"), /* @__PURE__ */ React.createElement("b", null, "\u20AC", s.price))),
      /* @__PURE__ */ React.createElement("span", { className: "svc-note" }, t(s.note))
    );
  }));
}
function WeekStrip({ offset, selected, onSelect, onOffset, onToday, canGoBack, avail }) {
  const { t } = useT();
  const days = useMemo(() => weekDays(offset), [offset]);
  const todayISO = isoDate(/* @__PURE__ */ new Date());
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "week-bar" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "icon-btn",
      onClick: () => onOffset(-1),
      disabled: !canGoBack,
      "aria-label": t("Settimana precedente")
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "chevronLeft", size: 19, stroke: 2 })
  ), /* @__PURE__ */ React.createElement("h3", { className: "week-title" }, weekLabel(offset)), /* @__PURE__ */ React.createElement("div", { className: "week-actions" }, offset !== 0 ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "link-btn", onClick: onToday }, t("Torna a oggi")) : null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "icon-btn",
      onClick: () => onOffset(1),
      "aria-label": t("Settimana successiva")
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "chevronRight", size: 19, stroke: 2 })
  ))), /* @__PURE__ */ React.createElement("div", { className: "days", role: "group", "aria-label": t("Giorni della settimana") }, days.map((d) => {
    const iso = isoDate(d);
    const s = daySummary(iso, avail);
    const disabled = s.loaded && (s.closed || s.allPast || s.free === 0);
    const active = iso === selected;
    const isToday = iso === todayISO;
    const sub = !s.loaded ? "\u2026" : s.closed ? t("chiuso") : s.allPast ? t("trascorso") : s.free === 0 ? t("completo") : t("{n} posti", { n: s.free });
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: iso,
        type: "button",
        className: `day${s.loaded && s.closed ? " is-closed" : ""}`,
        "aria-pressed": active,
        disabled,
        onClick: () => onSelect(iso)
      },
      /* @__PURE__ */ React.createElement("span", { className: "day-abbr" }, WD_SHORT[LANG][d.getDay()]),
      /* @__PURE__ */ React.createElement("span", { className: "day-num" }, d.getDate()),
      /* @__PURE__ */ React.createElement("span", { className: "day-free" }, sub),
      isToday ? /* @__PURE__ */ React.createElement("span", { className: "day-today", "aria-hidden": "true" }) : null,
      /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, longDate(iso), disabled ? `, ${sub}` : `, ${t("{n} posti liberi", { n: s.free })}`)
    );
  })));
}
function SlotGrid({ dateISO, value, onSelect, onlyFree, onToggleFree, avail, service }) {
  const { t } = useT();
  const loaded = isAvailLoaded(dateISO, avail);
  const slots = useMemo(() => slotsFor(dateISO, avail), [dateISO, avail]);
  const closing = dateISO ? closingFor(dateISO) : null;
  const serviceMin = service && service.min || 0;
  const decorated = slots.map((s) => {
    const fits = !serviceMin || closing && s.minutes + serviceMin <= closing;
    return { ...s, status: fits ? slotStatus(s.free, dateISO, s.minutes) : "busy" };
  });
  const visible = onlyFree ? decorated.filter((s) => s.status === "free" || s.status === "last") : decorated;
  const freeCount = decorated.filter((s) => s.status === "free" || s.status === "last").length;
  return /* @__PURE__ */ React.createElement("div", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, t("Fascia oraria")), /* @__PURE__ */ React.createElement("h3", { className: "h2", style: { fontSize: "1.02rem", textTransform: "capitalize" } }, longDate(dateISO))), /* @__PURE__ */ React.createElement("p", { className: "sec-hint" }, loaded ? t("{a} slot liberi su {b}", { a: freeCount, b: decorated.length }) : "\u2026")), /* @__PURE__ */ React.createElement("div", { className: "slot-tools" }, /* @__PURE__ */ React.createElement("div", { className: "seg", role: "group", "aria-label": t("Filtro slot") }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-pressed": !onlyFree, onClick: () => onToggleFree(false) }, t("Tutti")), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-pressed": onlyFree, onClick: () => onToggleFree(true) }, t("Solo liberi"))), /* @__PURE__ */ React.createElement("div", { className: "legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "swatch", "aria-hidden": "true" }), " ", t("libero")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "swatch last", "aria-hidden": "true" }), " ", t("ultimo posto")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "swatch busy", "aria-hidden": "true" }), " ", t("completo")))), !loaded ? /* @__PURE__ */ React.createElement("div", { className: "empty", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("strong", null, t("Caricamento disponibilit\xE0\u2026"))) : visible.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "empty" }, /* @__PURE__ */ React.createElement("strong", null, t("Nessuno slot libero in questa giornata.")), /* @__PURE__ */ React.createElement("p", null, t("Prova un altro giorno della settimana: di solito si libera qualcosa il pomeriggio."))) : /* @__PURE__ */ React.createElement("div", { className: "slot-grid", role: "group", "aria-label": t("Orari disponibili {date}", { date: longDate(dateISO) }) }, visible.map((s) => {
    const active = value === s.minutes;
    const isBusy = s.status === "busy";
    const isPast = s.status === "past";
    const seats = s.status === "last" ? t("Ultimo posto") : t("{n} posti", { n: s.free });
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s.minutes,
        type: "button",
        className: `slot${s.status === "last" ? " is-last" : ""}${isBusy ? " is-busy" : ""}${isPast ? " is-past" : ""}`,
        "aria-pressed": isBusy || isPast ? void 0 : active,
        disabled: isBusy || isPast,
        onClick: () => onSelect(s.minutes)
      },
      /* @__PURE__ */ React.createElement("span", { className: "slot-time" }, hhmm(s.minutes)),
      /* @__PURE__ */ React.createElement("span", { className: "slot-seats" }, isBusy ? t("Completo") : isPast ? t("Trascorso") : seats)
    );
  })));
}
function BookingStep({
  services,
  service,
  serviceId,
  setServiceId,
  weekOffset,
  setWeekOffset,
  dateISO,
  setDateISO,
  time,
  setTime,
  onlyFree,
  setOnlyFree,
  nextFree,
  onNextFree,
  headingRef,
  avail
}) {
  const { t } = useT();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "panel", "aria-labelledby": "step1-h" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, t("Passo 1 \xB7 Servizio")), /* @__PURE__ */ React.createElement("h2", { className: "h2", id: "step1-h", tabIndex: -1, ref: headingRef }, t("Cosa ti serve oggi?")))), /* @__PURE__ */ React.createElement(ServiceStrip, { services, value: serviceId, onChange: (id) => {
    setServiceId(id);
    setTime(null);
  } }), /* @__PURE__ */ React.createElement("p", { className: "sec-hint", style: { marginTop: 12 } }, t("La durata scelta determina l'orario di fine appuntamento nel calendario."))), /* @__PURE__ */ React.createElement("section", { className: "panel section", "aria-labelledby": "step1-week" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, t("Disponibilit\xE0")), /* @__PURE__ */ React.createElement("h2", { className: "h2", id: "step1-week", style: { fontSize: "1.05rem" } }, t("Scegli giorno e ora")))), /* @__PURE__ */ React.createElement(
    WeekStrip,
    {
      offset: weekOffset,
      selected: dateISO,
      avail,
      onSelect: (iso) => {
        setDateISO(iso);
        setTime(null);
      },
      onOffset: (delta) => {
        const next = Math.max(0, Math.min(5, weekOffset + delta));
        setWeekOffset(next);
        const days = weekDays(next);
        const isoOf = days.map((d) => isoDate(d));
        const known = days.find((d) => {
          const s = daySummary(isoDate(d), avail);
          return s.loaded && !s.closed && !s.allPast && s.free > 0;
        });
        setDateISO(known ? isoDate(known) : isoOf[0]);
        setTime(null);
      },
      onToday: () => {
        setWeekOffset(0);
        const d = firstBookableISO(avail);
        if (d) setDateISO(d);
        setTime(null);
      },
      canGoBack: weekOffset > 0
    }
  ), nextFree && !time ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "next-free", onClick: onNextFree }, /* @__PURE__ */ React.createElement(Icon, { name: "clock", size: 20 }), /* @__PURE__ */ React.createElement("span", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "nf-label" }, t("Prima disponibilit\xE0")), /* @__PURE__ */ React.createElement("span", { className: "nf-value" }, t("{date} \xB7 ore {time}", { date: shortDate(nextFree.date), time: hhmm(nextFree.minutes) }))), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", color: "var(--accent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevronRight", size: 18, stroke: 2 }))) : null, /* @__PURE__ */ React.createElement(
    SlotGrid,
    {
      dateISO,
      value: time,
      onSelect: setTime,
      onlyFree,
      onToggleFree: setOnlyFree,
      avail,
      service
    }
  )));
}
function DetailsStep({ service, dateISO, time, barber, form, setForm, errors, onBlurField, onSubmit, sending, headingRef }) {
  const { t } = useT();
  const end = time + service.min;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "panel", "aria-labelledby": "step2-h" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, t("Passo 2 \xB7 Dati cliente")), /* @__PURE__ */ React.createElement("h2", { className: "h2", id: "step2-h", tabIndex: -1, ref: headingRef }, t("A nome di chi prenoto?")))), /* @__PURE__ */ React.createElement("div", { className: "recap" }, /* @__PURE__ */ React.createElement("dl", null, /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Servizio")), /* @__PURE__ */ React.createElement("dd", null, serviceName(service), " \xB7 ", service.min, " min")), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Data")), /* @__PURE__ */ React.createElement("dd", { style: { textTransform: "capitalize" } }, longDate(dateISO))), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Orario")), /* @__PURE__ */ React.createElement("dd", null, hhmm(time), " \u2013 ", hhmm(end))), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Barbiere")), /* @__PURE__ */ React.createElement("dd", null, barber)), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Da pagare in salone")), /* @__PURE__ */ React.createElement("dd", null, "\u20AC", service.price)))), /* @__PURE__ */ React.createElement("form", { className: "form", onSubmit: (e) => {
    e.preventDefault();
    if (onSubmit && !sending) onSubmit();
  }, noValidate: true }, /* @__PURE__ */ React.createElement("fieldset", { style: { border: 0, margin: 0, padding: 0, display: "grid", gap: 18 } }, /* @__PURE__ */ React.createElement("legend", { className: "sr-only" }, t("Dati per la prenotazione")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "label", htmlFor: "c-name" }, t("Nome e cognome"), " ", /* @__PURE__ */ React.createElement("span", { className: "req", "aria-hidden": "true" }, "*"), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, t("(obbligatorio)"))), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "c-name",
      className: "input",
      type: "text",
      autoComplete: "name",
      placeholder: t("Es. Andrea Colombo"),
      value: form.name,
      "aria-invalid": errors.name ? "true" : "false",
      "aria-describedby": errors.name ? "err-name" : void 0,
      onChange: (e) => setForm({ ...form, name: e.target.value }),
      onBlur: () => onBlurField("name")
    }
  ), errors.name ? /* @__PURE__ */ React.createElement("p", { className: "field-error", id: "err-name" }, errors.name) : null), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "label", htmlFor: "c-phone" }, t("Telefono"), " ", /* @__PURE__ */ React.createElement("span", { className: "req", "aria-hidden": "true" }, "*"), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, t("(obbligatorio)"))), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "c-phone",
      className: "input",
      type: "tel",
      inputMode: "tel",
      autoComplete: "tel",
      placeholder: t("Es. 335 118 4471"),
      value: form.phone,
      "aria-invalid": errors.phone ? "true" : "false",
      "aria-describedby": errors.phone ? "err-phone" : "hint-phone",
      onChange: (e) => setForm({ ...form, phone: e.target.value }),
      onBlur: () => onBlurField("phone")
    }
  ), errors.phone ? /* @__PURE__ */ React.createElement("p", { className: "field-error", id: "err-phone" }, errors.phone) : /* @__PURE__ */ React.createElement("p", { className: "field-hint", id: "hint-phone" }, t("Solo per conferma e promemoria 2 ore prima. Nessun account da creare."))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "label", htmlFor: "c-email" }, t("Email"), " ", /* @__PURE__ */ React.createElement("span", { className: "req", "aria-hidden": "true" }, "*"), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, t("(obbligatorio)"))), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "c-email",
      className: "input",
      type: "email",
      inputMode: "email",
      autoComplete: "email",
      placeholder: t("Es. nome@esempio.it"),
      value: form.email,
      "aria-invalid": errors.email ? "true" : "false",
      "aria-describedby": errors.email ? "err-email" : "hint-email",
      onChange: (e) => setForm({ ...form, email: e.target.value }),
      onBlur: () => onBlurField("email")
    }
  ), errors.email ? /* @__PURE__ */ React.createElement("p", { className: "field-error", id: "err-email" }, errors.email) : /* @__PURE__ */ React.createElement("p", { className: "field-hint", id: "hint-email" }, t("Ti mandiamo qui l'invito pronto da aggiungere al tuo calendario."))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "label", htmlFor: "c-note" }, t("Note per il barbiere"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontWeight: 500 } }, "(", t("facoltativo"), ")")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      id: "c-note",
      className: "input",
      rows: 3,
      maxLength: 240,
      placeholder: t("Es. Macchinetta 1 ai lati, forbice sopra. Arrivo con mio figlio."),
      value: form.note,
      onChange: (e) => setForm({ ...form, note: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "field-hint" }, t("{n} caratteri disponibili", { n: 240 - form.note.length }))), /* @__PURE__ */ React.createElement("label", { className: "check", htmlFor: "c-consent" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "c-consent",
      type: "checkbox",
      checked: form.consent,
      "aria-invalid": errors.consent ? "true" : "false",
      onChange: (e) => setForm({ ...form, consent: e.target.checked })
    }
  ), /* @__PURE__ */ React.createElement("span", null, t("Acconsento al trattamento dei dati (nome, telefono, note) per gestire questa prenotazione e inviarmi il promemoria."), " ", /* @__PURE__ */ React.createElement("a", { href: "/privacy", target: "_blank", rel: "noreferrer" }, t("Leggi l'informativa sulla privacy")))))), Object.keys(errors).length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "alert", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "user", size: 18 }), /* @__PURE__ */ React.createElement("span", null, t("Controlla i campi segnalati: manca poco per completare la prenotazione."))) : null));
}
function DoneStep({ service, dateISO, time, barber, code, form, uid, headingRef, sendState }) {
  const { t } = useT();
  const [downloaded, setDownloaded] = useState(null);
  const start = slotMoment(dateISO, time);
  const end = new Date(start.getTime() + service.min * 6e4);
  const title = `${serviceName(service)} \u2014 ${SALON.name}`;
  const description = [
    t("Codice prenotazione: {code}", { code }),
    t("Servizio: {name} ({min} min) \u2014 \u20AC{price}", { name: serviceName(service), min: service.min, price: service.price }),
    t("Barbiere: {barber}", { barber }),
    t("Cliente: {name}{phone}", { name: form.name, phone: form.phone ? ` \xB7 ${form.phone}` : "" }),
    form.note ? t("Note: {note}", { note: form.note }) : "",
    t("Per annullare: apri il link \xABAnnulla la prenotazione\xBB nell'email di conferma.")
  ].filter(Boolean).join("\n");
  const event = { title, description, location: `${SALON.name}, ${SALON.address}`, start, end };
  const filename = `appuntamento-barberia-lambrate-${dateISO}.ics`;
  const handleICS = () => {
    downloadICS(filename, buildICS({ uid, ...event }));
    setDownloaded(filename);
  };
  const waText = encodeURIComponent(
    t(
      "Ciao {salon}! Ho prenotato: {service}, {date} alle {time} (codice {code}).",
      { salon: SALON.name, service: serviceName(service), date: longDate(dateISO), time: hhmm(time), code }
    )
  );
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "done-head", "aria-labelledby": "step3-h" }, /* @__PURE__ */ React.createElement("span", { className: "done-mark", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 26, stroke: 2.4 })), /* @__PURE__ */ React.createElement("p", { className: "eyebrow", style: { marginTop: 16 } }, t("Passo 3 \xB7 Conferma")), /* @__PURE__ */ React.createElement("h2", { className: "h2", id: "step3-h", tabIndex: -1, ref: headingRef, style: { fontSize: "1.5rem" } }, t("Appuntamento confermato")), /* @__PURE__ */ React.createElement("p", { className: "sec-hint", style: { marginTop: 8 } }, t("Ti aspettiamo in {address}. Arriva 5 minuti prima: il tempo di un caff\xE8.", { address: SALON.address })), sendState === "sent" ? /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "status",
      style: {
        marginTop: 16,
        padding: "12px 14px",
        borderRadius: "12px",
        background: "color-mix(in oklab, var(--success) 10%, var(--surface))",
        border: "1px solid color-mix(in oklab, var(--success) 35%, transparent)",
        color: "var(--success)",
        fontSize: ".84rem",
        fontWeight: 600,
        lineHeight: 1.5
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, stroke: 2.2 }),
    " ",
    t(`Invito inviato a te ({email}) e al barbiere ({barber}). Controlla la tua casella email: apri l'allegato .ics e tocca "Aggiungi al calendario".`, { email: form.email, barber })
  ) : sendState === "failed" ? /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "alert",
      style: {
        marginTop: 16,
        padding: "12px 14px",
        borderRadius: "12px",
        background: "color-mix(in oklab, var(--danger) 8%, var(--surface))",
        border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
        color: "color-mix(in oklab, var(--danger) 80%, var(--ink))",
        fontSize: ".82rem",
        fontWeight: 600,
        lineHeight: 1.5
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "user", size: 17 }),
    " ",
    t("Non siamo riusciti a inviare l'invito via email. Usa i pulsanti qui sotto per aggiungere l'appuntamento al calendario e avvisa il salone al telefono.")
  ) : null, /* @__PURE__ */ React.createElement("div", { className: "ticket" }, /* @__PURE__ */ React.createElement("div", { className: "ticket-top" }, /* @__PURE__ */ React.createElement("p", { className: "ticket-code" }, t("Codice {code}", { code })), /* @__PURE__ */ React.createElement("p", { className: "ticket-svc" }, serviceName(service)), /* @__PURE__ */ React.createElement("p", { className: "ticket-when" }, t("{date} \xB7 ore {a}\u2013{b}", { date: cap(longDate(dateISO)), a: hhmm(time), b: hhmm(end.getHours() * 60 + end.getMinutes()) }))), /* @__PURE__ */ React.createElement("div", { className: "ticket-body" }, /* @__PURE__ */ React.createElement("div", { className: "dashes", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("dl", null, /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Durata")), /* @__PURE__ */ React.createElement("dd", null, t("{n} minuti", { n: service.min }))), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Barbiere")), /* @__PURE__ */ React.createElement("dd", null, barber)), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Indirizzo")), /* @__PURE__ */ React.createElement("dd", null, SALON.address)), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Da pagare in salone")), /* @__PURE__ */ React.createElement("dd", null, "\u20AC", service.price)), /* @__PURE__ */ React.createElement("div", { className: "recap-row" }, /* @__PURE__ */ React.createElement("dt", null, t("Promemoria")), /* @__PURE__ */ React.createElement("dd", null, t("SMS 2 ore prima")))))), /* @__PURE__ */ React.createElement("div", { className: "actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary btn-block", onClick: handleICS }, /* @__PURE__ */ React.createElement(Icon, { name: "calendar", size: 20 }), t("Aggiungi al calendario (.ics)")), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: "btn btn-ghost btn-block",
      href: googleCalendarUrl(event),
      target: "_blank",
      rel: "noopener noreferrer"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "calendar", size: 20 }),
    t("Apri in Google Calendar")
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: "btn btn-ghost btn-block",
      href: `https://wa.me/${SALON.whatsapp}?text=${waText}`,
      target: "_blank",
      rel: "noopener noreferrer"
    },
    t("Invia la conferma su WhatsApp")
  )), downloaded ? /* @__PURE__ */ React.createElement("p", { className: "ok-note", role: "status" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, stroke: 2.2 }), t("File pronto: {name}", { name: downloaded })) : null, /* @__PURE__ */ React.createElement("p", { className: "fineprint" }, t("Il file .ics si apre direttamente nell\u2019app Calendario su iPhone e in Google Calendar su Android. Se il download \xE8 bloccato dal browser, usa il pulsante Google Calendar: \xE8 gi\xE0 compilato con data, ora, durata e indirizzo del salone."))));
}
function InfoPanel({ todayDow }) {
  const { t } = useT();
  const rows = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ dow, label: cap(WD_LONG[LANG][dow]) }));
  return /* @__PURE__ */ React.createElement("aside", { className: "info", "aria-label": t("Informazioni sul salone") }, /* @__PURE__ */ React.createElement("h2", null, t("Il salone")), /* @__PURE__ */ React.createElement("div", { className: "info-card" }, /* @__PURE__ */ React.createElement("p", null, t(SALON.story, { name: SALON.name })), /* @__PURE__ */ React.createElement("ul", { className: "info-lines", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "pin", size: 18 }), /* @__PURE__ */ React.createElement("span", null, SALON.address, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("a", { href: SALON.mapUrl, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)" } }, t("Apri in Google Maps")))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "phone", size: 18 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("a", { href: `tel:${SALON.phoneHref}`, style: { color: "var(--ink)", fontWeight: 640 } }, SALON.phoneLabel))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "clock", size: 18 }), /* @__PURE__ */ React.createElement("span", null, t("Consigliata la prenotazione online: in negozio restano pochi posti."))))), /* @__PURE__ */ React.createElement("h2", null, t("Orari")), /* @__PURE__ */ React.createElement("div", { className: "info-card" }, /* @__PURE__ */ React.createElement("ul", { className: "hours" }, rows.map((r) => {
    const h = HOURS[r.dow];
    return /* @__PURE__ */ React.createElement("li", { key: r.label, className: r.dow === todayDow ? "is-today" : "" }, /* @__PURE__ */ React.createElement("span", null, r.label, r.dow === todayDow ? /* @__PURE__ */ React.createElement("span", { className: "day-tag" }, t("oggi")) : null), /* @__PURE__ */ React.createElement("span", { className: h ? "" : "closed" }, h ? `${hhmm(h.open)}\u2013${hhmm(h.close)}` : t("chiuso")));
  }))), /* @__PURE__ */ React.createElement("h2", null, t("Buono a sapersi")), /* @__PURE__ */ React.createElement("div", { className: "info-card" }, /* @__PURE__ */ React.createElement("ul", { className: "info-lines" }, SALON.policies.map((p) => /* @__PURE__ */ React.createElement("li", { key: p }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, stroke: 2.1 }), /* @__PURE__ */ React.createElement("span", null, t(p)))))), /* @__PURE__ */ React.createElement("p", { className: "info-foot" }, SALON.name, " \xB7 ", SALON.piva, /* @__PURE__ */ React.createElement("br", null), t("Disponibilit\xE0 in tempo reale: prenota e ricevi l'invito via email sul tuo calendario.")));
}
function SiblingsStrip() {
  const { t } = useT();
  const sibs = SALON.siblings || [];
  if (!sibs.length) return null;
  const base = (location.hostname || "").split(".");
  const domain = base.length > 1 ? base.slice(1).join(".") : "example.com";
  const cur = SALON.slug || SALON_SLUG;
  return /* @__PURE__ */ React.createElement("div", { className: "sib-strip", role: "navigation", "aria-label": t("Scegli la postazione") }, /* @__PURE__ */ React.createElement("span", { className: "sib-label" }, t("Postazioni del salone:")), sibs.map((s) => /* @__PURE__ */ React.createElement(
    "a",
    {
      key: s.slug,
      href: `https://${s.slug}.${domain}`,
      className: s.slug === cur ? "sib-current" : ""
    },
    s.name
  )));
}
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
  const [sendState, setSendState] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [avail, setAvail] = useState({});
  const [availTick, setAvailTick] = useState(0);
  const [bookFeedback, setBookFeedback] = useState(null);
  const headingRef = useRef(null);
  const [status, setStatus] = useState(openStatus());
  const [salonReady, setSalonReady] = useState(SALON_SLUG === "lambrate");
  useEffect(() => {
    if (SALON_SLUG === "lambrate") return;
    fetch(`/salon?slug=${SALON_SLUG}`).then((r) => r.json()).then((cfg) => {
      if (cfg && cfg.name) applySalon(cfg);
    }).catch(() => {
    }).finally(() => setSalonReady(true));
  }, []);
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch (e) {
    }
    try {
      document.title = `${SALON.name} \u2014 ${makeT(lang)("Prenota online")}`;
    } catch (e) {
    }
  }, [lang, salonReady]);
  const service = SERVICES.find((s) => s.id === serviceId) || null;
  useEffect(() => {
    let cancelled = false;
    const days = weekDays(weekOffset).map((d) => isoDate(d));
    fetch(`/availability?${days.map((d) => `date=${d}`).join("&")}&salon=${SALON_SLUG}`).then((r) => r.json()).then((data) => {
      if (cancelled || !data || !data.dates) return;
      const patch = {};
      data.dates.forEach((e) => {
        if (e && e.date) patch[e.date] = e;
      });
      setAvail((prev) => ({ ...prev, ...patch }));
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [weekOffset, availTick]);
  useEffect(() => {
    const days = [];
    for (let i = 0; i < 17; i++) days.push(isoDate(addDays(/* @__PURE__ */ new Date(), i)));
    fetch(`/availability?${days.map((d) => `date=${d}`).join("&")}&salon=${SALON_SLUG}`).then((r) => r.json()).then((data) => {
      if (!data || !data.dates) return;
      const patch = {};
      data.dates.forEach((e) => {
        if (e && e.date) patch[e.date] = e;
      });
      setAvail((prev) => ({ ...prev, ...patch }));
    }).catch(() => {
    });
  }, []);
  useEffect(() => {
    if (dateISO) return;
    const d = firstBookableISO(avail);
    if (d) setDateISO(d);
  }, [avail, dateISO]);
  useEffect(() => {
    if (!dateISO) return;
    const sel = startOfWeek(parseISO(dateISO));
    const current = startOfWeek(/* @__PURE__ */ new Date());
    const diff = Math.round((sel - current) / (7 * 24 * 3600 * 1e3));
    if (diff !== weekOffset) setWeekOffset(Math.max(0, Math.min(5, diff)));
  }, [dateISO]);
  useEffect(() => {
    const id = setInterval(() => setStatus(openStatus()), 6e4);
    return () => clearInterval(id);
  }, []);
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
    else if (!name.includes(" ")) next.name = t("Aggiungi anche il cognome, cos\xEC ti riconosciamo alla cassa.");
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
    setTouched((t2) => ({ ...t2, [field]: true }));
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
    if (sendState === "loading") return;
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
    const snapshot = {
      service,
      dateISO,
      time,
      barber,
      code,
      uid,
      form: { ...form }
    };
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
          client: { name: form.name, phone: form.phone, email: form.email.trim(), note: form.note }
        })
      });
      const data = await res.json();
      if (data.conflict) {
        setSendState(null);
        setTime(null);
        setBookFeedback({
          type: "conflict",
          msg: t("L'orario delle {time} \xE8 appena stato prenotato da qualcun altro. Scegline uno ancora libero qui sotto.", { time: hhmm(snapshot.time) })
        });
        setAvailTick((t2) => t2 + 1);
        setStep(0);
        return;
      }
      if (data.ok) {
        setAvailTick((t2) => t2 + 1);
        setSendState("sent");
        setConfirmed({ ...snapshot, code: data.code || snapshot.code, sendState: "sent" });
        setStep(2);
        return;
      }
      setSendState(null);
      setBookFeedback({
        type: "error",
        msg: data && data.error || t("Non \xE8 stato possibile completare la prenotazione.")
      });
      setStep(0);
    } catch (e) {
      setSendState(null);
      setBookFeedback({
        type: "error",
        msg: t("Server non raggiungibile. Riprova tra qualche secondo.")
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
  const ctaValue = ready ? `${serviceName(service)} \xB7 ${cap(shortDate(dateISO))} \xB7 ${hhmm(time)}` : service ? t("{name} \xB7 scegli un orario", { name: serviceName(service) }) : t("Scegli servizio e orario");
  if (!salonReady) {
    return /* @__PURE__ */ React.createElement(LangCtx.Provider, { value: ctx }, /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("div", { className: "brand", style: { padding: "20px" } }, /* @__PURE__ */ React.createElement("h1", { className: "wordmark" }, SALON.name), /* @__PURE__ */ React.createElement("p", { className: "brand-note" }, t("Caricamento\u2026")))));
  }
  return /* @__PURE__ */ React.createElement(LangCtx.Provider, { value: ctx }, /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("div", { className: "shell" }, /* @__PURE__ */ React.createElement("div", { className: "book" }, /* @__PURE__ */ React.createElement(SiblingsStrip, null), /* @__PURE__ */ React.createElement("header", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-top" }, /* @__PURE__ */ React.createElement(PoleMark, null), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { className: "brand-eyebrow" }, t(SALON.tagline)), /* @__PURE__ */ React.createElement("h1", { className: "wordmark" }, SALON.name)), /* @__PURE__ */ React.createElement("span", { className: `open-chip${status.open ? "" : " is-closed"}` }, /* @__PURE__ */ React.createElement("span", { className: "dot", "aria-hidden": "true" }), statusLabel(status)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "lang-btn",
      onClick: ctx.toggle,
      "aria-label": lang === "it" ? "Passa all'inglese" : "Switch to Italian",
      title: lang === "it" ? "Passa all'inglese" : "Switch to Italian"
    },
    /* @__PURE__ */ React.createElement(FlagIcon, { code: lang === "it" ? "en" : "it" }),
    /* @__PURE__ */ React.createElement("span", null, lang === "it" ? "EN" : "IT")
  )), /* @__PURE__ */ React.createElement("p", { className: "brand-sub" }, SALON.address, " \xB7", " ", /* @__PURE__ */ React.createElement("a", { href: `tel:${SALON.phoneHref}` }, SALON.phoneLabel)), /* @__PURE__ */ React.createElement("p", { className: "brand-note" }, t("Prenotazione senza account: bastano nome e numero di telefono."))), /* @__PURE__ */ React.createElement(Stepper, { step, onGo: (i) => sendState === "loading" ? null : i < step ? setStep(i) : null }), /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", className: "sr-only" }, t("Passo {n} di 3: {step}", { n: step + 1, step: t(["servizio e orario", "dati cliente", "conferma"][step]) })), /* @__PURE__ */ React.createElement("main", null, step === 0 && bookFeedback ? /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "alert",
      style: {
        marginTop: 18,
        padding: "12px 14px",
        borderRadius: "12px",
        background: "color-mix(in oklab, var(--danger) 8%, var(--surface))",
        border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
        color: "color-mix(in oklab, var(--danger) 80%, var(--ink))",
        fontSize: ".84rem",
        fontWeight: 600,
        lineHeight: 1.5
      }
    },
    bookFeedback.msg
  ) : null, step === 0 ? /* @__PURE__ */ React.createElement(
    BookingStep,
    {
      services: SERVICES,
      service,
      serviceId,
      setServiceId,
      weekOffset,
      setWeekOffset,
      dateISO,
      setDateISO,
      time,
      setTime,
      onlyFree,
      setOnlyFree,
      nextFree,
      onNextFree: () => {
        if (!nextFree) return;
        setDateISO(nextFree.date);
        setTime(nextFree.minutes);
      },
      headingRef,
      avail
    }
  ) : null, step === 1 && service ? /* @__PURE__ */ React.createElement(
    DetailsStep,
    {
      service,
      dateISO,
      time,
      barber,
      form,
      setForm,
      errors,
      onBlurField,
      onSubmit: confirm,
      sending: sendState === "loading",
      headingRef
    }
  ) : null, step === 2 && confirmed ? /* @__PURE__ */ React.createElement(
    DoneStep,
    {
      service: confirmed.service,
      dateISO: confirmed.dateISO,
      time: confirmed.time,
      barber: confirmed.barber,
      code: confirmed.code,
      form: confirmed.form,
      uid: confirmed.uid,
      headingRef,
      sendState: confirmed.sendState || sendState
    }
  ) : null), step === 0 ? /* @__PURE__ */ React.createElement("div", { className: "cta" }, /* @__PURE__ */ React.createElement("div", { className: "cta-inner" }, /* @__PURE__ */ React.createElement("div", { className: "cta-info" }, /* @__PURE__ */ React.createElement("span", { className: "cta-label" }, t("Riepilogo")), /* @__PURE__ */ React.createElement("span", { className: "cta-value" }, ctaValue)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-dark",
      disabled: !ready || sendState === "loading",
      onClick: goToDetails
    },
    t("Continua")
  ))) : null, step === 1 ? /* @__PURE__ */ React.createElement("div", { className: "cta" }, /* @__PURE__ */ React.createElement("div", { className: "cta-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: () => setStep(0), disabled: sendState === "loading" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevronLeft", size: 18, stroke: 2 }), t("Indietro")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: confirm, disabled: sendState === "loading" }, sendState === "loading" ? t("Invio in corso\u2026") : t("Conferma prenotazione"))), /* @__PURE__ */ React.createElement("p", { className: "fineprint", style: { marginTop: 10 } }, t("Nessun pagamento online: {amount} da saldare in salone.", { amount: `\u20AC${confirmed ? confirmed.service.price : service ? service.price : 0}` }))) : null, step === 2 ? /* @__PURE__ */ React.createElement("div", { className: "cta" }, /* @__PURE__ */ React.createElement("div", { className: "cta-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: reset }, t("Prenota un altro appuntamento")), /* @__PURE__ */ React.createElement("a", { className: "btn btn-dark", href: `tel:${SALON.phoneHref}` }, t("Chiama il salone")))) : null), /* @__PURE__ */ React.createElement(InfoPanel, { todayDow: (/* @__PURE__ */ new Date()).getDay() }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
