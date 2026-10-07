#!/usr/bin/env python3
"""Barberia Lambrate — backend prenotazioni MULTI-TENANT (versione indurita).

Un unico dominio serve la pagina di prenotazione di ogni barbiere iscritto:
leggendo ?salon=SLUG l'app carica i dati del salone da salons.json (in
~/outreach-parrucchieri) e usa la stessa logica atomica di prenotazione,
scoped per salone.

Mantiene tutti gli hardening:
  - input validato -> 400; try/except globale -> sempre una risposta
  - cap Content-Length e timeout socket; rate limiting per IP
  - /bookings protetto da token admin
  - credenziali SMTP da env; UID/codice da sha256
  - .ics con folding RFC 5545, escape CRLF e TZID Europe/Rome
  - html.escape + sanitizzazione header; catalogo servizi server-side
  - ricevuta di avvenuta prestazione automatica alla chiusura (cliente) e
    notifica di pagamento in sospeso al salone (IBAN / PayPal / Satispay)
  - WAL + busy_timeout; retry email; log su file; DB chmod 600

Interfacce:
  GET  /                                  index.html (con ?salon=SLUG)
  GET  /app.js                            bundle
  GET  /salon?slug=X                      config pubblica del salone
  GET  /availability?date=..&salon=X      slot reali per salone
  GET  /bookings                          (X-Admin-Token)
  POST /book                              riserva (richiede campo salon)
  POST /panel/complete                    chiude la prestazione (ricevuta automatica)
  POST /panel/paid                        segna il pagamento come incassato
  POST /panel/list|/panel/cancel|...      pannello barbiere (cookie di sessione)

Uso:  BARBERIA_SMTP_PASSWORD=.. BARBERIA_ADMIN_TOKEN=.. python3 srv.py
"""
import json
import os
import re
import html
import hashlib
import hmac
import logging
import datetime
import sqlite3
import smtplib
import time
import socketserver
import sys
import threading
import email.utils
from email.utils import make_msgid, formataddr
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def _esc(s):
    return html.escape(str(s), quote=True)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("BARBERIA_DB_PATH", str(BASE_DIR / "bookings.db")))
LOG_PATH = Path(os.environ.get("BARBERIA_LOG_PATH", str(BASE_DIR / "server.log")))
OGP_DIR = Path(os.environ.get("BARBERIA_OG_DIR", str(BASE_DIR / "og")))
RETENTION_DAYS = int(os.environ.get("BARBERIA_RETENTION_DAYS", "730"))

# Percorso salons.json: override da env; default = stessa cartella.
_salons_env = os.environ.get("BARBERIA_SALONS_JSON")
OUTREACH_JSON = Path(_salons_env) if _salons_env else (BASE_DIR / "salons.json")

HOST = os.environ.get("BARBERIA_HOST", "0.0.0.0")
PORT = int(os.environ.get("BARBERIA_PORT", "8899"))

MAX_BOOKING_DAYS = 60     # orizzonte massimo di prenotazione (anti-abuso)
MAX_BODY = 16 * 1024      # cap body POST
RATE_LIMIT_N = 10         # max prenotazioni per IP
RATE_LIMIT_WIN = 3600
GLOBAL_RATE_N = 60

# Salone di fallback (quando manca ?salon e non c'è salons.json): demo singola.
DEFAULT_SALON = {
    "slug": "lambrate", "name": "Barberia Lambrate",
    "tagline": "Barbiere uomo · dal 2014",
    "address": "Via Cesare Battisti 24, 20134 Milano",
    "phone": "0245318890", "web": "", "instagram": "",
    "notify_email": "info@salonedemo.it", "note_web": "",
    "piva": "",
    # Coordinate di pagamento del salone (facoltative): se compilate finiscono
    # nella ricevuta inviata al cliente. Non inventare valori reali.
    "payment": {
        "iban": "", "holder": "", "paypal": "", "satispay": "",
        "methods": "Contanti, bancomat o carta in salone", "note": "",
    },
    "services": {
        "taglio":       {"name": "Taglio classico",        "min": 30, "price": 22},
        "taglio-barba": {"name": "Taglio + barba",         "min": 50, "price": 38},
        "barba":        {"name": "Barba modellata",        "min": 25, "price": 16},
        "rasatura":     {"name": "Rasatura tradizionale",  "min": 30, "price": 24},
        "bambino":      {"name": "Taglio bambino",         "min": 25, "price": 15},
        "rituale":      {"name": "Rituale capelli e cute", "min": 20, "price": 14},
    },
    "hours": {1: (540, 1140), 2: (540, 1200), 3: (540, 1200),
              4: (540, 1200), 5: (540, 1200), 6: (540, 1020)},
}

# Nomi barbieri per l'assegnazione in UI (l'email di notifica è del salone).
BARBERS = ["Marco Ferretti", "Giulia Rinaldi", "Samuele Okafor"]

# Credenziali SMTP da variabile d'ambiente (MAI hardcoded).
SMTP_PASSWORD = os.environ.get("BARBERIA_SMTP_PASSWORD", "")
SMTP_CFG = {
    "host": os.environ.get("BARBERIA_SMTP_HOST", "smtp.example.com"),
    "port": int(os.environ.get("BARBERIA_SMTP_PORT", "587")),
    "login": os.environ.get("BARBERIA_SMTP_LOGIN", ""),
}
ADMIN_TOKEN = os.environ.get("BARBERIA_ADMIN_TOKEN", "")

# Ricevuta di avvenuta prestazione. La ricevuta parte in automatico appena la
# prestazione viene chiusa (dal pannello o dal worker). Il worker di fondo, che
# chiude da solo le prenotazioni terminate, si attiva con BARBERIA_AUTO_RECEIPT=1.
AUTO_RECEIPT = os.environ.get("BARBERIA_AUTO_RECEIPT", "0").strip().lower() in (
    "1", "true", "yes", "on")
AUTO_RECEIPT_GRACE_MIN = int(os.environ.get("BARBERIA_AUTO_RECEIPT_GRACE_MIN", "15"))

# Redirect 301 dei sottodomini rinominati: {"vecchio-slug": "slug-canonico"}.
try:
    SLUG_REDIRECTS = json.loads(os.environ.get("BARBERIA_SLUG_REDIRECTS", "{}")) or {}
except Exception:
    SLUG_REDIRECTS = {}

# Log su file (default) oppure su stdout se BARBERIA_LOG_PATH=stdout/-.
# Nei container conviene stdout, cosi' i log si leggono con `docker logs`.
_LOG_FMT = "%(asctime)s %(levelname)s %(message)s"
if str(LOG_PATH).strip().lower() in ("-", "stdout"):
    logging.basicConfig(stream=sys.stdout, level=logging.INFO, format=_LOG_FMT)
else:
    logging.basicConfig(filename=LOG_PATH, level=logging.INFO, format=_LOG_FMT)


# ------------------------------------------------------------------- salons -
def _clean_payment(p):
    """Normalizza il blocco "payment" del salone: stringhe, una riga, corte."""
    out = {}
    for k in ("iban", "holder", "paypal", "satispay", "methods", "note"):
        v = (p or {}).get(k, "")
        out[k] = re.sub(r"[\r\n\x00-\x1f\x7f]", " ", str(v or "")).strip()[:200]
    return out


def _merge_payment(base, extra):
    """Unisce i default di pagamento con quelli del salone: un campo vuoto nel
    salone NON cancella il default (cosi' i saloni che non configurano nulla
    ereditano le coordinate condivise)."""
    out = dict(base)
    for k, v in _clean_payment(extra).items():
        if v:
            out[k] = v
    return out


def _svc_list_to_dict(svcs):
    out = {}
    for sv in svcs:
        if sv.get("id"):
            out[sv["id"]] = {"name": sv.get("name"), "min": int(sv.get("min", 30)),
                             "price": int(sv.get("price", 0))}
    return out


def _load_salons():
    if not OUTREACH_JSON.exists():
        return {"lambrate": DEFAULT_SALON}
    try:
        data = json.loads(OUTREACH_JSON.read_text(encoding="utf-8"))
    except Exception:
        logging.exception("salons.json non leggibile; uso salone demo")
        return {"lambrate": DEFAULT_SALON}
    defaults = data.get("defaults", {})
    default_svcs = _svc_list_to_dict(defaults.get("services", []))
    default_hours = {int(k): tuple(v) for k, v in defaults.get("hours", {}).items()}
    default_payment = _merge_payment(_clean_payment(DEFAULT_SALON["payment"]),
                                     defaults.get("payment"))
    salons = {"lambrate": DEFAULT_SALON}
    for s in data.get("salons", []):
        slug = s.get("slug")
        if not slug:
            continue
        services = _svc_list_to_dict(s.get("services") or []) or default_svcs
        hrs = s.get("hours") or default_hours
        hours = {int(k): tuple(v) for k, v in hrs.items()} if hrs else None
        salons[slug] = {
            "slug": slug,
            "name": s.get("name", slug),
            "tagline": s.get("tagline", ""),
            "address": s.get("address", ""),
            "phone": s.get("phone", ""),
            "web": s.get("web", ""),
            "instagram": s.get("instagram", ""),
            "notify_email": s.get("notify_email", DEFAULT_SALON["notify_email"]),
            "note_web": s.get("note_web", ""),
            "piva": s.get("piva", ""),
            "payment": _merge_payment(default_payment, s.get("payment")),
            "cap": s.get("cap"),
            "siblings": s.get("siblings") or [],
            "services": services or DEFAULT_SALON["services"],
            "hours": hours or default_hours or DEFAULT_SALON["hours"],
        }
    return salons


SALONS = _load_salons()


def get_salon(slug):
    return SALONS.get(slug)


def public_salon(cfg):
    sibs = []
    for s in cfg.get("siblings", []):
        sc = SALONS.get(s)
        if sc:
            sibs.append({"slug": sc["slug"], "name": sc["name"]})
    return {
        "slug": cfg["slug"], "name": cfg["name"], "tagline": cfg["tagline"],
        "address": cfg["address"], "phone": cfg["phone"], "web": cfg["web"],
        "instagram": cfg["instagram"],
        "cap": cfg.get("cap") or 3,
        "siblings": sibs,
        "services": [dict(sv, id=sv_id) for sv_id, sv in cfg["services"].items()],
        "hours": {str(k): list(v) for k, v in cfg["hours"].items()},
    }


# ------------------------------------------------------------------- helpers -
def iso_weekday(date_iso):
    return datetime.date.fromisoformat(date_iso).isoweekday()


def salon_hours(cfg, date_iso):
    return cfg["hours"].get(iso_weekday(date_iso))


def slot_minutes(date_iso, cfg):
    h = salon_hours(cfg, date_iso)
    if not h:
        return []
    return list(range(h[0], h[1] - 30 + 1, 30))


def closing_minutes(date_iso, cfg):
    h = salon_hours(cfg, date_iso)
    return h[1] if h else None


def seat_capacity(date_iso, cfg):
    if not salon_hours(cfg, date_iso):
        return 0
    try:
        cap = int(cfg.get("cap") or 0)
    except (TypeError, ValueError):
        cap = 0
    if cap > 0:
        return cap
    return 2 if iso_weekday(date_iso) == 6 else 3


def valid_date_or_none(s):
    if not isinstance(s, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return None
    try:
        return datetime.date.fromisoformat(s)
    except ValueError:
        return None


# ------------------------------------------------------------------ database -
def connect():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.execute("PRAGMA busy_timeout=15000")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            salon       TEXT    NOT NULL DEFAULT 'lambrate',
            request_id  TEXT UNIQUE NOT NULL,
            date        TEXT    NOT NULL,
            minutes     INTEGER NOT NULL,
            service_id  TEXT,
            service_name TEXT,
            duration    INTEGER,
            price       INTEGER,
            barber      TEXT,
            client_name TEXT,
            client_phone TEXT,
            client_email TEXT,
            note        TEXT,
            code        TEXT,
            email_sent  INTEGER DEFAULT 0,
            consent     INTEGER DEFAULT 0,
            status      TEXT    DEFAULT 'confirmed',
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)
    existing = {row[1] for row in conn.execute("PRAGMA table_info(bookings)")}
    for col, ddl in (("code", "TEXT"), ("email_sent", "INTEGER DEFAULT 0"),
                     ("salon", "TEXT NOT NULL DEFAULT 'lambrate'"),
                     ("consent", "INTEGER DEFAULT 0"),
                     ("completed_at", "TEXT"),
                     ("payment_status", "TEXT DEFAULT 'unpaid'"),
                     ("paid_at", "TEXT"),
                     ("receipt_sent", "INTEGER DEFAULT 0"),
                     ("receipt_sent_at", "TEXT")):
        if col not in existing:
            conn.execute("ALTER TABLE bookings ADD COLUMN %s %s" % (col, ddl))
    conn.execute("CREATE INDEX IF NOT EXISTS idx_slot "
                 "ON bookings(salon, date, minutes, status)")
    conn.commit()
    conn.close()
    try:
        os.chmod(DB_PATH, 0o600)
    except OSError:
        pass
    purge_old_bookings()


def purge_old_bookings():
    """Retention GDPR: cancella le prenotazioni più vecchie di RETENTION_DAYS."""
    try:
        cutoff = (datetime.datetime.now() - datetime.timedelta(days=RETENTION_DAYS)).strftime("%Y-%m-%d")
        conn = connect()
        n = conn.execute("DELETE FROM bookings WHERE date < ?", (cutoff,)).rowcount
        conn.commit()
        conn.close()
        if n:
            logging.info("Retention: rimosse %d prenotazioni più vecchie di %d giorni", n, RETENTION_DAYS)
    except Exception:
        logging.exception("Retention fallita")


def availability(dates, cfg):
    init_db()
    if not dates:
        return []
    salon = cfg["slug"]
    conn = connect()
    conn.row_factory = sqlite3.Row
    ph = ", ".join("?" * len(dates))
    rows = conn.execute(
            "SELECT date, minutes, duration, COUNT(*) c FROM bookings "
            "WHERE status IN ('confirmed','completed') AND salon=? AND date IN (%s) "
            "GROUP BY date, minutes, duration" % ph, [salon] + dates).fetchall()
    conn.close()
    occ = {}
    for r in rows:
        dur = r["duration"] or 30
        occ.setdefault(r["date"], []).append((r["minutes"], r["minutes"] + dur))
    out = []
    for d in dates:
        cap = seat_capacity(d, cfg)
        if cap == 0:
            out.append({"date": d, "closed": True, "slots": []})
            continue
        busy = occ.get(d, [])
        slots = []
        for m in slot_minutes(d, cfg):
            n = sum(1 for (s, e) in busy if s <= m < e)
            slots.append({"minutes": m, "cap": cap, "free": max(0, cap - n)})
        out.append({"date": d, "closed": False, "slots": slots})
    return out


# ---------------------------------------------------------------- ICS/email -
def escape_ics(s):
    s = str(s).replace("\r\n", "\n").replace("\r", "\n")
    return (s.replace("\\", "\\\\").replace(";", "\\;")
             .replace(",", "\\,").replace("\n", "\\n"))


def fold_line(s, limit=75):
    s = str(s)
    out = []
    while len(s) > limit:
        out.append(s[:limit])
        s = " " + s[limit:]
    out.append(s)
    return "\r\n".join(out)


VTIMEZONE = (
    "BEGIN:VTIMEZONE\r\nTZID:Europe/Rome\r\n"
    "BEGIN:DAYLIGHT\r\nDTSTART:19700329T020000\r\n"
    "TZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\n"
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\r\nEND:DAYLIGHT\r\n"
    "BEGIN:STANDARD\r\nDTSTART:19701025T030000\r\n"
    "TZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\n"
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\r\nEND:STANDARD\r\n"
    "END:VTIMEZONE\r\n"
)


def ics_tz(dt):
    return dt.strftime("%Y%m%dT%H%M%S")


def ics_utc_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_ics(uid, title, description, location, start, end):
    body = (
        "BEGIN:VEVENT\r\n"
        "UID:" + uid + "\r\n"
        "DTSTAMP:" + ics_utc_now() + "\r\n"
        "DTSTART;TZID=Europe/Rome:" + ics_tz(start) + "\r\n"
        "DTEND;TZID=Europe/Rome:" + ics_tz(end) + "\r\n" +
        fold_line("SUMMARY:" + escape_ics(title)) + "\r\n" +
        fold_line("LOCATION:" + escape_ics(location)) + "\r\n" +
        fold_line("DESCRIPTION:" + escape_ics(description)) + "\r\n" +
        "STATUS:CONFIRMED\r\nTRANSP:OPAQUE\r\n"
        "BEGIN:VALARM\r\nTRIGGER:-PT2H\r\nACTION:DISPLAY\r\n" +
        "DESCRIPTION:" + escape_ics("Promemoria: " + title) + "\r\n"
        "END:VALARM\r\nEND:VEVENT\r\n")
    return ("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"
            "PRODID:-//Barberia Lambrate//Prenotazioni//IT\r\n"
            "CALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n" + VTIMEZONE + body +
            "END:VCALENDAR\r\n")


def clean_header(s):
    return re.sub(r"[\r\n\x00-\x1f\x7f]", " ", str(s)).strip()


def build_message(to_name, to_email, subject, body_html, ics_bytes=None, filename=None,
                  from_name="Barberia Lambrate Prenotazioni",
                  plain_fallback="Email HTML con allegato calendario .ics da aprire."):
    """Messaggio multipart; l'allegato e' facoltativo (.ics, .txt o binario)."""
    msg = MIMEMultipart("mixed")
    msg["From"] = formataddr((clean_header(from_name), SMTP_CFG["login"]))
    msg["To"] = formataddr((clean_header(to_name), to_email))
    msg["Subject"] = clean_header(subject)
    msg["Date"] = email.utils.formatdate()
    msg["Message-ID"] = make_msgid()
    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(plain_fallback, "plain", "utf-8"))
    alt.attach(MIMEText(body_html, "html", "utf-8"))
    msg.attach(alt)
    if ics_bytes is not None:
        fname = filename or "allegato.dat"
        ext = fname.rsplit(".", 1)[-1].lower()
        if ext == "ics":
            att = MIMEBase("text", "calendar", method="PUBLISH")
            att.set_payload(ics_bytes)
            att.add_header("Content-Type",
                           'text/calendar; charset="utf-8"; method=PUBLISH; name="%s"'
                           % fname)
        elif ext == "txt":
            att = MIMEBase("text", "plain")
            att.set_payload(ics_bytes)
            att.add_header("Content-Type",
                           'text/plain; charset="utf-8"; name="%s"' % fname)
        else:
            att = MIMEBase("application", "octet-stream")
            att.set_payload(ics_bytes)
            att.add_header("Content-Type",
                           'application/octet-stream; name="%s"' % fname)
        att.add_header("Content-Disposition", 'attachment; filename="%s"' % fname)
        encoders.encode_base64(att)
        msg.attach(att)
    return msg


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def send_email(to_addr, msg):
    if not SMTP_PASSWORD:
        raise RuntimeError("BARBERIA_SMTP_PASSWORD non configurata")
    try:
        with smtplib.SMTP(SMTP_CFG["host"], SMTP_CFG["port"], timeout=30) as s:
            s.ehlo()
            s.starttls()
            s.ehlo()
            s.login(SMTP_CFG["login"], SMTP_PASSWORD)
            s.sendmail(SMTP_CFG["login"], [to_addr], msg.as_string())
        logging.info("Email inviata a %s (ok)", to_addr)
    except Exception as e:
        logging.error("Errore invio email a %s: %s", to_addr, e)
        raise


# ------------------------------------------------------------ rate limiting -
_rate = {}
_global_bucket = []


def allow_booking(ip):
    now = time.time()
    bucket = _rate.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < RATE_LIMIT_WIN]
    _global_bucket[:] = [t for t in _global_bucket if now - t < RATE_LIMIT_WIN]
    if len(bucket) >= RATE_LIMIT_N or len(_global_bucket) >= GLOBAL_RATE_N:
        return False
    bucket.append(now)
    _global_bucket.append(now)
    return True


_cancel_rate = {}


def allow_cancel(ip):
    """Rate-limit per la cancellazione self-service col codice."""
    now = time.time()
    bucket = _cancel_rate.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < RATE_LIMIT_WIN]
    if len(bucket) >= 20:
        return False
    bucket.append(now)
    return True


# ------------------------------------------------------------------- booking -
def parse_payload(payload, cfg):
    need = ["date", "time", "service", "client", "requestId"]
    missing = [k for k in need if k not in payload]
    if missing:
        return False, {"error": "dati mancanti: " + ", ".join(missing)}

    date_iso = payload["date"]
    d = valid_date_or_none(date_iso)
    if d is None:
        return False, {"error": "data non valida"}
    today = datetime.date.today()
    if d < today:
        return False, {"error": "data nel passato"}
    if d > today + datetime.timedelta(days=MAX_BOOKING_DAYS):
        return False, {"error": "data oltre il limite di prenotazione"}

    tv = payload["time"]
    if isinstance(tv, bool):
        return False, {"error": "orario non valido"}
    if isinstance(tv, str) and tv.isdigit():
        tv = int(tv)
    if not isinstance(tv, int):
        return False, {"error": "orario non valido"}
    minutes = tv
    if minutes not in slot_minutes(date_iso, cfg):
        return False, {"error": "orario non disponibile"}

    sid = payload["service"]
    if not isinstance(sid, dict) or not isinstance(sid.get("id"), str):
        return False, {"error": "servizio non valido"}
    svc = cfg["services"].get(sid["id"])
    if svc is None:
        return False, {"error": "servizio sconosciuto"}
    close = closing_minutes(date_iso, cfg)
    if close is None or minutes + svc["min"] > close:
        return False, {"error": "il servizio non termina in orario"}

    barber = payload.get("barber", "")
    if not isinstance(barber, str) or barber not in BARBERS:
        return False, {"error": "barbiere non valido"}
    notify_email = cfg["notify_email"]
    if "@example.com" in notify_email:
        return False, {"error": "email salone non configurata"}

    client = payload.get("client")
    if not isinstance(client, dict):
        return False, {"error": "dati cliente mancanti"}
    name = re.sub(r"\s+", " ", str(client.get("name", ""))).strip()
    email = str(client.get("email", "")).strip().lower()
    phone = re.sub(r"\s+", " ", str(client.get("phone", ""))).strip()
    note = str(client.get("note", ""))[:240]
    if not (2 <= len(name) <= 90):
        return False, {"error": "nome non valido"}
    if not EMAIL_RE.fullmatch(email):
        return False, {"error": "email non valida"}
    if not phone or len(phone) > 30:
        return False, {"error": "telefono non valido"}

    rid = payload.get("requestId")
    if not isinstance(rid, str) or not re.fullmatch(r"[A-Za-z0-9._@-]{6,80}", rid):
        return False, {"error": "richiesta non valida"}

    return True, {"date": date_iso, "minutes": minutes, "barber": barber,
                  "notify_email": notify_email, "service_id": sid["id"],
                  "service": svc, "client": {"name": name, "phone": phone,
                                             "email": email, "note": note},
                  "requestId": rid}


def gen_code(rid, conn):
    c = "BL-" + hashlib.sha256(rid.encode()).hexdigest()[:4].upper()
    for _ in range(10):
        if not conn.execute("SELECT 1 FROM bookings WHERE code=?", (c,)).fetchone():
            return c
        c = "BL-" + hashlib.sha256(rid.encode()).hexdigest()[:6 + _].upper()
    return c


def reserve(payload, cfg, host="example.com"):
    init_db()
    if payload.get("consent") is not True:
        return {"ok": False, "error": "Serve il consenso al trattamento dei dati per completare la prenotazione."}, None
    ok, data = parse_payload(payload, cfg)
    if not ok:
        return {"ok": False, "error": data["error"]}, None

    salon = cfg["slug"]
    date_iso = data["date"]
    minutes = data["minutes"]
    svc = data["service"]
    client = data["client"]
    rid = data["requestId"]
    cap = seat_capacity(date_iso, cfg)

    conn = connect()
    try:
        conn.execute("BEGIN IMMEDIATE")
        new_end = minutes + int(svc["min"])
        taken = conn.execute(
            "SELECT COUNT(*) FROM bookings WHERE salon=? AND date=? "
            "AND status IN ('confirmed','completed') AND minutes < ? AND minutes + duration > ?",
            (salon, date_iso, new_end, minutes)).fetchone()[0]
        if taken >= cap:
            dup = conn.execute("SELECT COUNT(*) FROM bookings WHERE request_id=?",
                               (rid,)).fetchone()[0]
            conn.rollback()
            return ({"ok": True, "duplicate": True}, None) if dup else \
                   ({"ok": False, "conflict": True}, None)
        code = gen_code(rid, conn)
        conn.execute(
            "INSERT INTO bookings (salon,request_id,date,minutes,service_id,"
            "service_name,duration,price,barber,client_name,client_phone,"
            "client_email,note,code,consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)",
            (salon, rid, date_iso, minutes, data["service_id"], svc["name"],
             svc["min"], svc["price"], data["barber"], client["name"],
             client["phone"], client["email"], client["note"], code))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        try:
            dup = conn.execute("SELECT COUNT(*) FROM bookings WHERE request_id=?",
                               (rid,)).fetchone()[0]
        except Exception:
            dup = 0
        logging.exception("IntegrityError riservazione")
        return ({"ok": True, "duplicate": True}, None) if dup else \
               ({"ok": False, "error": "errore interno"}, None)
    except Exception:
        conn.rollback()
        logging.exception("Errore in reserve")
        return {"ok": False, "error": "errore interno"}, None
    finally:
        conn.close()

    sent = _send_invites(cfg, date_iso, minutes, svc, data["barber"],
                         data["notify_email"], client, code, host)
    return {"ok": True, "sent": sent, "code": code}, None


def _send_invites(cfg, date_iso, minutes, svc, barber, barber_email, client, code, host="example.com"):
    """Invia le due email (cliente + salone). Ritorna quante ne sono partite
    davvero: 2 se inviate, 0 se l'SMTP non e' configurato o l'invio fallisce.
    La prenotazione resta valida anche senza email."""
    if not SMTP_PASSWORD:
        logging.warning("SMTP non configurato: nessuna email inviata per %s", code)
        return 0
    salon_name = cfg["name"]
    location = "%s, %s" % (salon_name, cfg["address"])
    start = datetime.datetime.combine(
        datetime.date.fromisoformat(date_iso),
        datetime.time(minutes // 60, minutes % 60))
    end = start + datetime.timedelta(minutes=svc["min"])
    when_str = "%s alle %s" % (italian_long(start), start.strftime("%H:%M"))
    filename = "appuntamento-%s-%s.ics" % (cfg["slug"], date_iso)
    cname = html.escape(client["name"])
    cphone = html.escape(client["phone"])
    cnote = html.escape(client["note"]) or "—"
    cemail = html.escape(client["email"])
    sname = html.escape(svc["name"])
    barber_safe = html.escape(barber)

    uid_c = ("bl-" + hashlib.sha256(("c" + code).encode()).hexdigest()[:32]
             + "@example.com")
    desc_c = ("Codice prenotazione: %s\nServizio: %s (%d min) — %d euro\n"
              "Barbiere: %s\nIndirizzo: %s\nNessun pagamento online."
              % (code, sname, svc["min"], svc["price"], barber, location))
    ics_c = build_ics(uid_c, "%s — %s" % (sname, salon_name), desc_c,
                      location, start, end)
    body_c = ("<p>Ciao <b>%s</b>, la tua prenotazione è confermata:</p>"
              "<p><b>%s</b> · <b>%s</b></p>"
              "<p>Barbiere: %s<br>Indirizzo: %s</p>"
              "<p>In allegato l'invito calendario (<b>%s</b>): aprilo e tocca "
              "<i>Aggiungi al calendario</i>. Promemoria 2 ore prima.</p>"
              "<p>Pagamento in salone. Se devi annullare, usa il link qui sotto.</p>"
              "<p>—<br>Codice prenotazione: <b>%s</b><br>"
              "Se devi annullare: <a href='https://%s/annulla?code=%s'>annulla la prenotazione</a></p>"
              ) % (cname, sname, when_str, barber_safe,
                   html.escape(location), filename, code, _esc(host), _esc(code))

    uid_b = ("bl-" + hashlib.sha256(("b" + code).encode()).hexdigest()[:32]
             + "@example.com")
    desc_b = ("Codice prenotazione: %s\nCliente: %s · %s · %s\n"
              "Servizio: %s (%d min) — %d euro\nNote: %s"
              % (code, client["name"], cphone, cemail, sname, svc["min"],
                 svc["price"], client["note"] or "—"))
    ics_b = build_ics(uid_b, "%s — %s" % (sname, client["name"]),
                      desc_b, location, start, end)
    body_b = ("<p><b>Nuova prenotazione</b></p>"
              "<p><b>%s</b> · <b>%s</b> · %d minuti</p>"
              "<p>Cliente: %s<br>Telefono: %s<br>Email: <a href='mailto:%s'>%s</a>"
              "<br>Note: %s</p>"
              "<p>Allegato: invito calendario da aggiungere.</p>"
              ) % (sname, when_str, svc["min"], cname, cphone, cemail,
                   client["email"], cnote)

    for attempt in (0, 1):
        try:
            send_email(client["email"], build_message(
                client["name"], client["email"],
                "Prenotazione confermata — %s alle %s"
                % (sname, start.strftime("%H:%M")), body_c, ics_c, filename))
            send_email(barber_email, build_message(
                salon_name, barber_email,
                "Nuova prenotazione: %s — %s" % (sname, when_str),
                body_b, ics_b, filename))
            _mark_email_sent(code)
            return 2
        except Exception:
            if attempt == 1:
                logging.exception("Invio email fallito per codice %s", code)
    return 0


def _mark_email_sent(code):
    try:
        conn = connect()
        conn.execute("UPDATE bookings SET email_sent=1 WHERE code=?", (code,))
        conn.commit()
        conn.close()
    except Exception:
        pass


# ------------------------------------------- prestazione completata / ricevuta -
def _euro(n):
    """Importo in euro con la virgola: 38 -> '€ 38,00'."""
    try:
        n = int(n or 0)
    except (TypeError, ValueError):
        n = 0
    return "\u20ac %d,00" % n


def receipt_number(b):
    """Numero progressivo della ricevuta, derivato da anno + id prenotazione."""
    year = str(b.get("date") or "")[:4] or str(datetime.date.today().year)
    try:
        n = int(b.get("id") or 0)
    except (TypeError, ValueError):
        n = 0
    return "%s-%05d" % (year, n)


def booking_when(b):
    """'giovedì 8 ottobre alle 17:30' a partire dalla riga prenotazione."""
    try:
        minutes = int(b.get("minutes") or 0)
        start = datetime.datetime.combine(
            datetime.date.fromisoformat(str(b.get("date"))),
            datetime.time(minutes // 60, minutes % 60))
    except Exception:
        return str(b.get("date") or "")
    return "%s alle %s" % (italian_long(start), start.strftime("%H:%M"))


def payment_lines(pay):
    """Righe di pagamento (IBAN, PayPal, Satispay, in salone) per email e ricevuta."""
    pay = pay or {}
    out = []
    if pay.get("iban"):
        val = "IBAN " + pay["iban"]
        if pay.get("holder"):
            val += " \u2014 intestatario: " + pay["holder"]
        out.append({"label": "Bonifico bancario", "value": val, "href": None})
    if pay.get("paypal"):
        v = str(pay["paypal"]).strip()
        if v.lower().startswith("http"):
            out.append({"label": "PayPal", "value": v, "href": v})
        elif "@" in v:
            out.append({"label": "PayPal", "value": "invia il pagamento a " + v,
                        "href": "mailto:" + v})
        else:
            url = "https://paypal.me/" + v.lstrip("/")
            out.append({"label": "PayPal", "value": url, "href": url})
    if pay.get("satispay"):
        out.append({"label": "Satispay", "value": pay["satispay"], "href": None})
    if pay.get("methods"):
        out.append({"label": "In salone", "value": pay["methods"], "href": None})
    return out


def _piva(cfg):
    """'P.IVA 04821960168' senza duplicare l'etichetta se e' gia' nel config."""
    v = str(cfg.get("piva") or "").strip()
    if not v:
        return ""
    return v if v.lower().replace(" ", "").startswith("p.iva") else "P.IVA " + v


def receipt_lines(cfg, b):
    """Ricevuta di avvenuta prestazione in formato testo (allegato .txt)."""
    pay = _clean_payment(cfg.get("payment"))
    paid = (b.get("payment_status") == "paid")
    out = [
        "RICEVUTA DI AVVENUTA PRESTAZIONE",
        "Documento non fiscale \u2014 non valido ai fini IVA o fiscali.",
        "",
        "Numero: %s" % receipt_number(b),
        "Prestazione del: %s" % booking_when(b),
        "Salone: %s" % (cfg.get("name") or ""),
    ]
    if cfg.get("address"):
        out.append("Indirizzo: %s" % cfg["address"])
    if _piva(cfg):
        out.append(_piva(cfg))
    out += [
        "",
        "Cliente: %s" % (b.get("client_name") or ""),
        "Prestazione: %s (%d minuti)" % (b.get("service_name") or "",
                                         int(b.get("duration") or 30)),
        "Barbiere: %s" % (b.get("barber") or ""),
        "Codice prenotazione: %s" % (b.get("code") or ""),
        "",
        "IMPORTO: %s" % _euro(b.get("price")),
        "STATO: %s" % ("PAGATO \u2014 grazie" if paid else "DA PAGARE"),
    ]
    if not paid:
        out += ["", "Come pagare:"]
        for pl in payment_lines(pay):
            out.append("- %s: %s" % (pl["label"], pl["value"]))
        out.append("Causale consigliata: %s" % (b.get("code") or ""))
        if pay.get("note"):
            out.append("Nota: %s" % pay["note"])
    out += ["", "Grazie e a presto,", str(cfg.get("name") or "")]
    return out


def receipt_html(cfg, b):
    """Corpo HTML della ricevuta inviata al cliente."""
    pay = _clean_payment(cfg.get("payment"))
    paid = (b.get("payment_status") == "paid")
    rows = [
        ("Numero", receipt_number(b)),
        ("Prestazione del", booking_when(b)),
        ("Salone", cfg.get("name") or ""),
    ]
    if cfg.get("address"):
        rows.append(("Indirizzo", cfg["address"]))
    if _piva(cfg):
        rows.append(("P.IVA", _piva(cfg)))
    rows += [
        ("Cliente", b.get("client_name") or ""),
        ("Prestazione", "%s (%d minuti)" % (b.get("service_name") or "",
                                            int(b.get("duration") or 30))),
        ("Barbiere", b.get("barber") or ""),
        ("Codice prenotazione", b.get("code") or ""),
    ]
    table = "".join("<tr><td style='padding:3px 10px 3px 0;color:#6b6b6b'>%s</td>"
                    "<td style='padding:3px 0'><b>%s</b></td></tr>" % (_esc(k), _esc(v))
                    for k, v in rows)
    pay_rows = []
    for pl in payment_lines(pay):
        val = _esc(pl["value"])
        if pl["href"]:
            val = "<a href='%s'>%s</a>" % (_esc(pl["href"]), val)
        pay_rows.append("<li><b>%s</b>: %s</li>" % (_esc(pl["label"]), val))
    pay_block = ""
    if not paid:
        pay_block = ("<p><b>Importo da pagare:</b> <span style='font-size:19px'>%s</span>"
                     "<br><b>Stato:</b> da pagare</p><ul>%s</ul>"
                     "<p>Indica il codice <b>%s</b> nella causale del pagamento."
                     "%s</p>") % (_euro(b.get("price")), "".join(pay_rows),
                                  _esc(b.get("code") or ""),
                                  "<br>Nota: " + _esc(pay["note"]) if pay.get("note") else "")
    else:
        pay_block = ("<p><b>Importo:</b> %s<br><b>Stato:</b> "
                     "<span style='color:#24744D'>pagato \u2014 grazie</span></p>"
                     ) % _euro(b.get("price"))
    return ("<div style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,"
            "sans-serif;color:#1d1813;font-size:15px;line-height:1.55\">"
            "<p style='color:#6b6b6b;font-size:12px;letter-spacing:.08em;"
            "text-transform:uppercase;margin:0 0 2px'>Ricevuta di avvenuta prestazione</p>"
            "<h2 style='margin:0 0 4px'>%s</h2>"
            "<p style='margin:0 0 14px;color:#6b6b6b'>Documento <b>non fiscale</b>: "
            "non valido ai fini IVA o fiscali.</p>"
            "<table style='border-collapse:collapse'>%s</table>"
            "%s"
            "<p style='margin-top:16px;color:#6b6b6b'>Questa ricevuta \u00e8 allegata "
            "anche come file di testo. Grazie e a presto!</p></div>"
            ) % (_esc(cfg.get("name") or ""), table, pay_block)


def barber_payment_html(cfg, b):
    """Corpo HTML della notifica di pagamento in sospeso inviata al salone."""
    paid = (b.get("payment_status") == "paid")
    rows = [
        ("Cliente", b.get("client_name") or ""),
        ("Telefono", b.get("client_phone") or ""),
        ("Email", b.get("client_email") or ""),
        ("Prestazione", "%s (%d minuti)" % (b.get("service_name") or "",
                                            int(b.get("duration") or 30))),
        ("Barbiere", b.get("barber") or ""),
        ("Quando", booking_when(b)),
        ("Codice", b.get("code") or ""),
    ]
    table = "".join("<tr><td style='padding:3px 10px 3px 0;color:#6b6b6b'>%s</td>"
                    "<td style='padding:3px 0'><b>%s</b></td></tr>" % (_esc(k), _esc(v))
                    for k, v in rows)
    state = ("<span style='color:#24744D'>incassato</span>" if paid
             else "<span style='color:#B63132'>IN SOSPESO \u2014 da incassare</span>")
    return ("<div style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,"
            "sans-serif;color:#1d1813;font-size:15px;line-height:1.55\">"
            "<p style='color:#6b6b6b;font-size:12px;letter-spacing:.08em;"
            "text-transform:uppercase;margin:0 0 2px'>Prestazione completata</p>"
            "<h2 style='margin:0 0 10px'>Importo %s \u2014 %s</h2>"
            "<table style='border-collapse:collapse'>%s</table>"
            "<p style='margin-top:14px'>%s</p>"
            "<p style='margin-top:10px;color:#6b6b6b'>%s</p></div>"
            ) % (_euro(b.get("price")), state, table,
                 "Pagamento gi\u00e0 ricevuto." if paid
                 else "Riceverai una notifica a ogni prestazione chiusa in sospeso.",
                 "La ricevuta \u00e8 stata inviata al cliente." if paid
                 else "La ricevuta \u00e8 stata inviata al cliente. Segna l'incasso dal "
                      "pannello (<b>/panel</b>) per chiudere la partita.")


def _mark_receipt_sent(code):
    try:
        conn = connect()
        conn.execute("UPDATE bookings SET receipt_sent=1, "
                     "receipt_sent_at=datetime('now') WHERE code=?", (code,))
        conn.commit()
        conn.close()
    except Exception:
        pass


def _send_receipts(cfg, b, trigger="panel"):
    """Invia la ricevuta al cliente e la notifica di pagamento in sospeso al
    salone. Ritorna quante email sono partite (0..2), 0 se l'SMTP non e'
    configurato o l'invio fallisce: la prenotazione resta comunque chiusa e
    la ricevuta pu\u00f2 essere reinviata dal pannello."""
    code = b.get("code") or ""
    if not SMTP_PASSWORD:
        logging.warning("SMTP non configurato: ricevuta non inviata per %s", code)
        return 0
    salon_name = cfg.get("name") or ""
    svc = str(b.get("service_name") or "")
    client_email = str(b.get("client_email") or "").strip()
    amount = _euro(b.get("price"))
    sent = 0
    if EMAIL_RE.fullmatch(client_email):
        try:
            txt = ("\n".join(receipt_lines(cfg, b)) + "\n").encode("utf-8")
            msg = build_message(
                b.get("client_name") or "", client_email,
                "Ricevuta di avvenuta prestazione \u2014 %s" % svc,
                receipt_html(cfg, b), txt, "ricevuta-%s.txt" % (code or "salone"),
                from_name="%s \u2014 Ricevute" % salon_name,
                plain_fallback="Ricevuta di avvenuta prestazione (documento non fiscale) "
                               "in allegato.")
            send_email(client_email, msg)
            sent += 1
        except Exception:
            logging.exception("Ricevuta cliente non inviata per %s", code)
    else:
        logging.warning("Ricevuta cliente non inviata (email assente) per %s", code)
    notify = str(cfg.get("notify_email") or "").strip()
    if EMAIL_RE.fullmatch(notify):
        paid = (b.get("payment_status") == "paid")
        try:
            subj = ("Prestazione completata \u2014 %s %s (%s)"
                    % ("incassato" if paid else "pagamento in sospeso", amount, code))
            msg = build_message(
                salon_name, notify, subj, barber_payment_html(cfg, b),
                from_name="%s \u2014 Ricevute" % salon_name,
                plain_fallback="Prestazione %s: importo %s, %s."
                               % (code, amount,
                                  "incassato" if paid else "in sospeso / da incassare"))
            send_email(notify, msg)
            sent += 1
        except Exception:
            logging.exception("Notifica incasso non inviata per %s", code)
    else:
        logging.warning("Notifica salone non inviata (notify_email assente) per %s", code)
    if sent:
        _mark_receipt_sent(code)
    logging.info("Ricevuta %s: %d email inviate (%s)", code, sent, trigger)
    return sent


def complete_booking(cfg, value, by="id", paid=False, resend=False, trigger="panel"):
    """Chiude la prestazione e manda in automatico la ricevuta al cliente e la
    notifica di pagamento al salone.

    by="id" (pannello) oppure "code". paid=True segna subito l'incasso.
    resend=True reinvia anche se la ricevuta era gi\u00e0 partita. chiamate
    ripetute non duplicano l'email (a meno di resend)."""
    init_db()
    salon = cfg["slug"]
    col = "code" if by == "code" else "id"
    conn = connect()
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM bookings WHERE salon=? AND %s=?" % col,
                       (salon, value)).fetchone()
    if row is None:
        conn.close()
        return {"ok": False, "error": "prenotazione non trovata"}
    b = dict(row)
    if b.get("status") == "completed" and b.get("receipt_sent") and not resend:
        conn.close()
        return {"ok": True, "already": True, "sent": 0, "code": b.get("code"),
                "price": b.get("price"),
                "error": "prestazione gi\u00e0 chiusa e ricevuta gi\u00e0 inviata"}
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    pay_status = "paid" if paid else (b.get("payment_status") or "unpaid")
    paid_at = now if pay_status == "paid" else b.get("paid_at")
    conn.execute("UPDATE bookings SET status='completed', "
                 "completed_at=COALESCE(completed_at,?), payment_status=?, paid_at=? "
                 "WHERE salon=? AND id=?",
                 (now, pay_status, paid_at, salon, b["id"]))
    conn.commit()
    conn.close()
    b.update({"status": "completed", "payment_status": pay_status, "paid_at": paid_at})
    sent = _send_receipts(cfg, b, trigger=trigger)
    return {"ok": True, "sent": sent, "code": b.get("code"), "id": b["id"],
            "price": b.get("price"), "amount": _euro(b.get("price")),
            "paid": pay_status == "paid", "trigger": trigger,
            "receipt_sent": bool(b.get("receipt_sent") or sent)}


def mark_payment(cfg, value, by="id", paid=True):
    """Segna un pagamento come incassato (o di nuovo in sospeso)."""
    init_db()
    salon = cfg["slug"]
    col = "code" if by == "code" else "id"
    conn = connect()
    row = conn.execute("SELECT id, code, price FROM bookings WHERE salon=? AND %s=?" % col,
                       (salon, value)).fetchone()
    if row is None:
        conn.close()
        return {"ok": False, "error": "prenotazione non trovata"}
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("UPDATE bookings SET payment_status=?, paid_at=? WHERE salon=? AND id=?",
                 ("paid" if paid else "unpaid", now if paid else None, salon, row[0]))
    conn.commit()
    conn.close()
    return {"ok": True, "paid": bool(paid), "code": row[1], "price": row[2],
            "amount": _euro(row[2])}


def auto_complete_due():
    """Chiude le prenotazioni terminate e invia le ricevute (worker opt-in)."""
    init_db()
    cutoff = datetime.datetime.now() - datetime.timedelta(
        minutes=max(0, AUTO_RECEIPT_GRACE_MIN))
    conn = connect()
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM bookings WHERE status='confirmed' "
                        "ORDER BY date ASC, minutes ASC").fetchall()
    conn.close()
    done = 0
    for r in rows:
        b = dict(r)
        try:
            minutes = int(b.get("minutes") or 0)
            start = datetime.datetime.combine(
                datetime.date.fromisoformat(str(b.get("date"))),
                datetime.time(minutes // 60, minutes % 60))
        except Exception:
            continue
        if start + datetime.timedelta(minutes=int(b.get("duration") or 30)) > cutoff:
            continue
        cfg = get_salon(b.get("salon") or "")
        if not cfg:
            continue
        if complete_booking(cfg, b["id"], by="id", trigger="auto").get("sent"):
            done += 1
    if done:
        logging.info("Auto-ricevuta: chiuse e notificate %d prestazioni", done)
    return done


def auto_receipt_worker():
    """Giro di fondo: ogni 2 minuti cerca le prestazioni terminate."""
    while True:
        try:
            auto_complete_due()
        except Exception:
            logging.exception("Auto-ricevuta: errore nel giro")
        time.sleep(120)


def italian_long(dt):
    month = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
             "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
    wd = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
    return "%s %d %s" % (wd[dt.weekday()], dt.day, month[dt.month - 1])


def cancel_booking(payload):
    """Annulla/elimina una prenotazione (per code/request_id/id) liberando lo slot."""
    init_db()
    value = payload.get("code") or payload.get("request_id") or payload.get("id")
    if not value:
        return {"ok": False, "error": "serve 'code', 'request_id' o 'id'"}, None
    if payload.get("code"):
        col = "code"
    elif payload.get("request_id"):
        col = "request_id"
    else:
        col = "id"
    conn = connect()
    row = conn.execute("SELECT id FROM bookings WHERE %s = ?" % col, (value,)).fetchone()
    if not row:
        conn.close()
        return {"ok": False, "error": "prenotazione non trovata"}, None
    conn.execute("DELETE FROM bookings WHERE %s = ?" % col, (value,))
    conn.commit()
    conn.close()
    return {"ok": True, "cancellata": True}, None


# ------------------------------------------------------------------ HTTP app -
def client_ip(handler):
    h = handler.headers
    # Cloudflare imposta CF-Connecting-IP (non falsificabile dal client) -> priorità
    cfc = h.get("CF-Connecting-IP", "")
    if cfc:
        return cfc.strip()
    fwd = h.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    rip = h.get("X-Real-IP", "")
    if rip:
        return rip.strip()
    return handler.client_address[0] if handler.client_address else "?"


class Handler(BaseHTTPRequestHandler):
    timeout = 30

    def log_message(self, fmt, *args):
        pass

    def _send(self, code, body, ctype, cookies=None):
        data = body.encode("utf-8") if isinstance(body, str) else body
        logging.info("%s %s %s", client_ip(self), self.command, code)
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        if cookies:
            for c in cookies:
                self.send_header("Set-Cookie", c)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _json(self, code, obj, cookies=None):
        self._send(code, json.dumps(obj, ensure_ascii=False), "application/json", cookies)

    def _query_params(self, qs):
        out = {}
        for kv in (qs.split("&") if qs else []):
            k, _, v = kv.partition("=")
            out[k] = v
        return out

    def _resolve_salon(self, explicit=None):
        """Salone da: parametro esplicito (?salon= / payload.salon) -> sottodominio (Host) -> demo."""
        if explicit:
            cfg = get_salon(explicit)
            if cfg:
                return cfg
        host = (self.headers.get("Host", "") or "").split(":")[0].strip().lower()
        labels = [l for l in host.split(".") if l]
        if len(labels) >= 2 and labels[0] not in ("www", "localhost"):
            if not labels[0].isdigit():               # niente IP numerico come slug
                cfg = get_salon(labels[0])
                if cfg:
                    return cfg
        return get_salon("lambrate")

    def do_GET(self):
        try:
            self._do_get()
        except Exception:
            logging.exception("GET non gestito")
            self._json(500, {"ok": False, "error": "errore interno"})

    def do_HEAD(self):
        """Risponde alle richerte HEAD (crawler/social/uptime) senza body."""
        try:
            path = self.path.partition("?")[0]
            if path in ("/", "/index.html"):
                ctype = "text/html; charset=utf-8"
            elif path == "/privacy":
                ctype = "text/html; charset=utf-8"
            elif path == "/app.js":
                ctype = "application/javascript; charset=utf-8"
            elif path.startswith("/og/") and path.endswith(".png"):
                ctype = "image/png"
            elif path == "/favicon.ico":
                self._send(204, "", "text/plain")
                return
            else:
                self._json(404, {"error": "not found"})
                return
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
        except Exception:
            logging.exception("HEAD non gestito")

    def _do_get(self):
        path, _, qs = self.path.partition("?")
        params = self._query_params(qs)
        _host = (self.headers.get("Host", "") or "").split(":")[0].strip().lower()
        _first = _host.split(".")[0] if _host else ""
        # Redirect 301 per slug rinominati: {"<vecchio-slug>": "<slug-canonico>"}.
        # Configurabile via BARBERIA_SLUG_REDIRECTS (JSON in env), vuoto di default.
        _canon = dict(SLUG_REDIRECTS)
        if _first in _canon:
            _rest = _host.split(".", 1)[1] if "." in _host else _host
            loc = "https://%s.%s%s" % (_canon[_first], _rest, self.path)
            self.send_response(301)
            self.send_header("Location", loc)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if path in ("/", "/index.html"):
            self._serve_index(params)
            return
        if path.startswith("/og/") and path.endswith(".png"):
            self._serve_og(path)
            return
        if path == "/privacy":
            self._serve_file("privacy.html", "text/html")
            return
        if path == "/annulla":
            self._serve_annulla(params)
            return
        if path == "/panel":
            self._serve_file("panel.html", "text/html")
            return
        if path == "/logo":
            slug = params.get("slug", "")
            png = None
            if slug:
                for cand in (OGP_DIR / f"{slug}-logo.png", OGP_DIR / f"{slug}.png"):
                    if cand.is_file():
                        png = cand
                        break
            if png is None:
                png = OGP_DIR / "lambrate.png"
            if png.is_file():
                self._send(200, png.read_bytes(), "image/png")
            else:
                self._json(404, {"ok": False, "error": "logo non trovato"})
            return
        if path == "/salons":
            lista = [{"slug": s.get("slug"), "name": s.get("name"),
                      "address": s.get("address", "")} for s in SALONS.values()
                     if not (str(s.get("slug", "")).startswith("demo-") or s.get("slug") == "lambrate")]
            self._json(200, {"ok": True, "salons": lista})
            return
        if path == "/app.js":
            self._serve_file("app.js", "application/javascript")
            return
        if path == "/favicon.ico":
            self._send(204, "", "text/plain")
            return
        if path == "/salon":
            cfg = get_salon(params.get("slug", "lambrate"))
            if not cfg:
                self._json(404, {"error": "salone non trovato"})
                return
            self._json(200, public_salon(cfg))
            return
        if path == "/availability":
            dates = []
            for kv in (qs.split("&") if qs else []):
                k, _, v = kv.partition("=")
                if k == "date" and v and valid_date_or_none(v):
                    dates.append(v)
            cfg = self._resolve_salon(params.get("salon"))
            self._json(200, {"dates": availability(dates[:25], cfg)})
            return
        if path == "/bookings":
            if not ADMIN_TOKEN or self.headers.get("X-Admin-Token", "") != ADMIN_TOKEN:
                self._json(401, {"ok": False, "error": "non autorizzato"})
                return
            self._json(200, {"bookings": self._recent_bookings()})
            return
        self._json(404, {"error": "not found"})

    def _serve_annulla(self, params):
        code = (params.get("code") or "").strip()
        c = _esc(code)
        html_t = """<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Annulla prenotazione</title><style>
body{background:#0f1620;color:#eef1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:60px auto;padding:20px}
h1{font-size:22px}.btn{background:#d33;color:#fff;border:0;border-radius:10px;padding:14px 20px;font-size:16px;cursor:pointer}
.msg{margin-top:16px;margin:auto 0}.ok{color:#7bd389}.err{color:#ff8f8f}.muted{color:#9aa6b2}</style></head><body>
<h1>Annulla la prenotazione</h1>
<p class="muted">Codice: <b>%s</b></p>
<p>Stai per annullare la tua prenotazione. Lo slot tornerà disponibile.</p>
<button class="btn" id="go">Annulla la prenotazione</button>
<div class="msg" id="out"></div>
<script>
const code=%s;
async function doIt(){
 const out=document.getElementById('out');
 try{
  const r=await fetch('/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
  const d=await r.json();
  if(r.ok||d.cancellata){out.innerHTML='<p class="ok">Prenotazione annullata. Grazie!</p>';document.getElementById('go').style.display='none';}
  else{out.innerHTML='<p class="err">'+ (d.error||'Impossibile annullare') +'.</p>';}
 }catch(e){out.innerHTML='<p class="err">Errore di rete, riprova.</p>';}
}
document.getElementById('go').onclick=doIt;
</script></body></html>""" % (c, json.dumps(code))
        self._send(200, html_t, "text/html")

    def _serve_index(self, params):
        fp = BASE_DIR / "index.html"
        if not fp.exists():
            self._json(404, {"error": "missing index.html"})
            return
        cfg = self._resolve_salon(params.get("salon"))
        host = (self.headers.get("Host", "example.com") or "").split(":")[0].strip().lower()
        base = "https://%s" % host
        name = cfg.get("name", "Il tuo salone")
        slug = cfg.get("slug", "")
        title = "%s — Prenota online" % name
        desc = "Prenota da %s online: scegli servizio, giorno e orario. Conferma subito sul calendario." % name
        og_img = "%s/og/%s.png" % (base, slug) if slug else ""
        meta = "\n".join([
            '<meta property="og:title" content="%s">' % _esc(title),
            '<meta property="og:description" content="%s">' % _esc(desc),
            '<meta property="og:type" content="website">',
            '<meta property="og:url" content="%s%s">' % (base, self.path),
            '<meta property="og:image" content="%s">' % og_img if og_img else '',
            '<meta name="twitter:card" content="summary_large_image">',
            '<meta name="twitter:title" content="%s">' % _esc(title),
            '<meta name="twitter:description" content="%s">' % _esc(desc),
            '<meta name="twitter:image" content="%s">' % og_img if og_img else '',
            '<meta name="theme-color" content="#111827">',
        ])
        html = fp.read_text("utf-8")
        html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % _esc(title), html, count=1, flags=re.S)
        html = html.replace("</title>", "</title>\n" + meta, 1)
        self._send(200, html, "text/html")

    def _serve_og(self, path):
        name = path.rsplit("/", 1)[-1]
        if "/" in name or "\\" in name or not name:
            self._json(404, {"error": "not found"})
            return
        fp = OGP_DIR / name
        if not fp.exists() or not fp.is_file():
            self._json(404, {"error": "not found"})
            return
        data = fp.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        self.wfile.write(data)

    def _serve_file(self, name, ctype):
        fp = BASE_DIR / name
        if not fp.exists():
            self._json(404, {"error": "missing " + name})
            return
        self._send(200, fp.read_bytes(), ctype + "; charset=utf-8")

    def _recent_bookings(self, limit=50):
        init_db()
        conn = connect()
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT salon, date, minutes, service_name, barber, client_name, "
            "client_phone, client_email, status, price, payment_status, "
            "completed_at, paid_at, receipt_sent, code, email_sent, created_at "
            "FROM bookings ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def do_POST(self):
        try:
            self._do_post()
        except Exception:
            logging.exception("POST non gestito")
            self._json(500, {"ok": False, "error": "errore interno"})

    def _do_post(self):
        path = self.path.split("?")[0]
        header = self.headers.get("Content-Length")
        try:
            length = int(header) if header else 0
        except ValueError:
            self._json(400, {"ok": False, "error": "Content-Length non valido"})
            return
        if length > MAX_BODY:
            if length > 0:
                try:
                    self.rfile.read(min(length, 1 << 20))
                except Exception:
                    pass
            self._json(413, {"ok": False, "error": "richiesta troppo grande"})
            return
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw or b"{}")
        except Exception:
            self._json(400, {"ok": False, "error": "JSON non valido"})
            return
        if path == "/panel/login":
            if not panel_allow_login(client_ip(self)):
                self._json(429, {"ok": False, "error": "troppi tentativi, riprova tra poco"})
                return
            slug = str(payload.get("salon") or "").strip()
            code = str(payload.get("passcode") or "")
            stored = panel_passcodes().get(slug)
            if not slug or not stored or not panel_verify(code, stored):
                self._json(401, {"ok": False, "error": "salone o codice non validi"})
                return
            tok = panel_token(slug)
            self._json(200, {"ok": True, "salon": slug},
                       ["barberia_panel=%s; HttpOnly; Path=/; Max-Age=%d" % (tok, PANEL_MAX_DAYS * 86400)])
            return
        if path == "/panel/logout":
            self._json(200, {"ok": True},
                       ["barberia_panel=; HttpOnly; Path=/; Max-Age=0"])
            return
        if path.startswith("/panel/"):
            salon = _panel_current(self)
            if not salon:
                self._json(401, {"ok": False, "error": "non autenticato"})
                return
            if path == "/panel/list":
                bookings = panel_bookings(salon)
                pending = [x for x in bookings if x.get("status") == "completed"
                           and x.get("payment_status") != "paid"]
                self._json(200, {"ok": True, "salon": salon,
                                 "name": (get_salon(salon) or {}).get("name", salon),
                                 "bookings": bookings,
                                 "auto_receipt": AUTO_RECEIPT,
                                 "payments": {
                                     "pending_count": len(pending),
                                     "pending_total": sum(int(x.get("price") or 0)
                                                          for x in pending)}})
                return
            if path == "/panel/complete":
                cfg = get_salon(salon)
                if not cfg:
                    self._json(404, {"ok": False, "error": "salone non trovato"})
                    return
                value = payload.get("code") or payload.get("id")
                if value in (None, ""):
                    self._json(400, {"ok": False, "error": "serve 'id' o 'code'"})
                    return
                res = complete_booking(cfg, value,
                                       by=("code" if payload.get("code") else "id"),
                                       paid=bool(payload.get("paid")),
                                       resend=bool(payload.get("resend")))
                self._json(200 if res.get("ok") else 404, res)
                return
            if path == "/panel/paid":
                cfg = get_salon(salon)
                if not cfg:
                    self._json(404, {"ok": False, "error": "salone non trovato"})
                    return
                value = payload.get("code") or payload.get("id")
                if value in (None, ""):
                    self._json(400, {"ok": False, "error": "serve 'id' o 'code'"})
                    return
                res = mark_payment(cfg, value,
                                   by=("code" if payload.get("code") else "id"),
                                   paid=bool(payload.get("paid", True)))
                self._json(200 if res.get("ok") else 404, res)
                return
            if path == "/panel/cancel":
                value = payload.get("code") or payload.get("id")
                conn = connect()
                col = "code" if payload.get("code") else "id"
                row = conn.execute("SELECT id FROM bookings WHERE salon=? AND %s=?" %
                                   col, (salon, value)).fetchone()
                if not row:
                    conn.close()
                    self._json(404, {"ok": False, "error": "prenotazione non trovata"})
                    return
                conn.execute("DELETE FROM bookings WHERE salon=? AND %s=?" % col, (salon, value))
                conn.commit(); conn.close()
                self._json(200, {"ok": True, "cancellata": True})
                return
            if path == "/panel/reschedule":
                bid = payload.get("id")
                ndate = payload.get("date") or ""
                ntime = payload.get("time")
                conn = connect()
                row = conn.execute("SELECT duration FROM bookings "
                                   "WHERE salon=? AND id=?", (salon, bid)).fetchone()
                if not row:
                    conn.close()
                    self._json(404, {"ok": False, "error": "prenotazione non trovata"})
                    return
                cfg = get_salon(salon) or {}
                d = valid_date_or_none(ndate)
                if d is None or d < datetime.date.today() or \
                        d > datetime.date.today() + datetime.timedelta(days=MAX_BOOKING_DAYS):
                    conn.close()
                    self._json(400, {"ok": False, "error": "data non valida o troppo lontana"})
                    return
                try:
                    ntime = int(ntime)
                except Exception:
                    conn.close()
                    self._json(400, {"ok": False, "error": "orario non valido"})
                    return
                if ntime not in slot_minutes(ndate, cfg):
                    conn.close()
                    self._json(400, {"ok": False, "error": "orario non disponibile"})
                    return
                new_end = ntime + int(row[0] or 30)
                if closing_minutes(ndate, cfg) and new_end > closing_minutes(ndate, cfg):
                    conn.close()
                    self._json(400, {"ok": False, "error": "il servizio non termina in orario"})
                    return
                cap = seat_capacity(ndate, cfg)
                conn.execute("BEGIN IMMEDIATE")
                taken = conn.execute(
                    "SELECT COUNT(*) FROM bookings WHERE salon=? AND date=? "
                    "AND status IN ('confirmed','completed') AND id<>? AND minutes < ? AND minutes + duration > ?",
                    (salon, ndate, bid, new_end, ntime)).fetchone()[0]
                if taken >= cap:
                    conn.rollback()
                    self._json(409, {"ok": False, "conflict": True,
                                     "error": "orario appena occupato da un'altra prenotazione"})
                    return
                conn.execute("UPDATE bookings SET date=?, minutes=? WHERE salon=? AND id=?",
                             (ndate, ntime, salon, bid))
                conn.commit(); conn.close()
                self._json(200, {"ok": True, "spostata": True})
                return
            self._json(404, {"ok": False, "error": "rotta non valida"})
            return
        if path == "/cancel":
            if "code" in payload:
                # self-service: il cliente annulla la propria prenotazione col codice
                if not allow_cancel(client_ip(self)):
                    self._json(429, {"ok": False, "error": "troppe richieste, riprova tra poco"})
                    return
                result, _ = cancel_booking(payload)
                self._json(200 if result.get("ok") else 400, result)
                return
            # admin: cancellazione per id / request_id
            if ADMIN_TOKEN and self.headers.get("X-Admin-Token", "") != ADMIN_TOKEN:
                self._json(401, {"ok": False, "error": "non autorizzato"})
                return
            result, _ = cancel_booking(payload)
            self._json(200 if result.get("ok") else 400, result)
            return
        if path != "/book":
            self._json(404, {"ok": False, "error": "rotta non valida"})
            return
        if not allow_booking(client_ip(self)):
            self._json(429, {"ok": False, "error": "troppe richieste, riprova tra poco"})
            return
        cfg = self._resolve_salon(payload.get("salon"))
        if not cfg:
            self._json(404, {"ok": False, "error": "salone non trovato"})
            return
        host = (self.headers.get("Host", "example.com") or "").split(":")[0].strip().lower()
        result, _ = reserve(payload, cfg, host)
        if result.get("conflict"):
            self._json(409, result)
        elif result.get("ok"):
            self._json(200, result)
        else:
            self._json(400, result)


# ------------------------------------------------------------------ PANEL barbiere -
PANEL_SECRET = os.environ.get("BARBERIA_PANEL_SECRET", "dev-panel-secret")
PANEL_USERS_PATH = Path(os.environ.get("BARBERIA_PANEL_USERS",
                                       str(BASE_DIR / "panel_users.json")))
PANEL_MAX_DAYS = 7
_login_rate = {}


def panel_passcodes():
    try:
        return json.loads(PANEL_USERS_PATH.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def panel_hash(code, salt=None):
    if not salt:
        salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", str(code).encode(), salt.encode(), 120_000).hex()
    return "pbkdf2$%s$%s" % (salt, digest)


def panel_verify(code, stored):
    try:
        method, salt, h = stored.split("$")
        if method != "pbkdf2":
            return False
        return hashlib.pbkdf2_hmac("sha256", str(code).encode(), salt.encode(),
                                   120_000).hex() == h
    except Exception:
        return False


def panel_token(salon):
    exp = int(time.time()) + PANEL_MAX_DAYS * 86400
    payload = "%s.%d" % (salon, exp)
    sig = hmac.new(PANEL_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return "%s.%s" % (payload, sig)


def panel_verify_token(tok):
    try:
        salon, exp, sig = tok.split(".")
        if abs(int(exp)) < time.time():
            return None
        if not hmac.compare_digest(
                hmac.new(PANEL_SECRET.encode(), ("%s.%s" % (salon, exp)).encode(),
                         hashlib.sha256).hexdigest(), sig):
            return None
        return salon
    except Exception:
        return None


def _panel_current(self_):
    return panel_verify_token((self_.headers.get("Cookie", "") or "").split(
        "barberia_panel=", 1)[-1].split(";", 1)[0])


def panel_allow_login(ip):
    now = time.time()
    b = _login_rate.setdefault(ip, [])
    b[:] = [t for t in b if now - t < 600]
    if len(b) >= 10:
        return False
    b.append(now)
    return True


def panel_bookings(salon):
    conn = connect()
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, code, date, minutes, service_name, duration, price, "
        "barber, client_name, client_phone, client_email, note, status, "
        "payment_status, completed_at, paid_at, receipt_sent, created_at "
        "FROM bookings WHERE salon=? ORDER BY date ASC, minutes ASC",
        (salon,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    init_db()
    if AUTO_RECEIPT:
        threading.Thread(target=auto_receipt_worker, daemon=True).start()
        logging.info("Auto-ricevuta ATTIVA: chiudo le prestazioni %d min dopo la fine",
                     AUTO_RECEIPT_GRACE_MIN)
    logging.info("Avvio multi-tenant su 0.0.0.0:%d | saloni=%d | SMTP=%s | admin=%s",
                 PORT, len(SALONS), "ok" if SMTP_PASSWORD else "DISATTIVATO",
                 "protetto" if ADMIN_TOKEN else "NON CONFIGURATO")
    socketserver.TCPServer.allow_reuse_address = True
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()