#!/usr/bin/env python3
"""Test della ricevuta di avvenuta prestazione (cliente + salone).

Solo stdlib: importa srv.py con un DB e un salons.json temporanei, sostituisce
l'invio SMTP con una spia e verifica il flusso completo, anche via HTTP.

    python3 -m unittest discover -s tests -v
"""
import datetime
import http.cookiejar
import json
import os
import pathlib
import re
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

TMP = tempfile.mkdtemp(prefix="prenota-salone-test-")
os.environ["BARBERIA_DB_PATH"] = os.path.join(TMP, "bookings.db")
os.environ["BARBERIA_SALONS_JSON"] = os.path.join(TMP, "salons.json")
os.environ["BARBERIA_PANEL_USERS"] = os.path.join(TMP, "panel_users.json")
os.environ["BARBERIA_LOG_PATH"] = "stdout"
os.environ["BARBERIA_PANEL_SECRET"] = "test-panel-secret"
os.environ["BARBERIA_SMTP_HOST"] = "localhost"
os.environ["BARBERIA_SMTP_LOGIN"] = "noreply@test.example"
os.environ["BARBERIA_SMTP_PASSWORD"] = "test-smtp-password"

_SALONS = {
    "defaults": {
        "services": [{"id": "taglio", "name": "Taglio classico", "min": 30, "price": 25},
                     {"id": "barba", "name": "Barba modellata", "min": 25, "price": 18}],
        "hours": {str(d): [540, 1200] for d in range(1, 7)},
        "payment": {"methods": "Contanti, bancomat o carta in salone",
                    "iban": "", "holder": "", "paypal": "",
                    "satispay": "", "note": ""},
    },
    "salons": [{
        "slug": "test",
        "name": "Salone Test",
        "address": "Via Test 1, Milano",
        "notify_email": "salone@test.example",
        "piva": "P.IVA 00000000000",
        "payment": {"methods": "Contanti o carta",
                    "iban": "IT00X0000000000000000000000",
                    "holder": "Salone Test Srl",
                    "paypal": "salonetest",
                    "satispay": "",
                    "note": "Indica il codice nella causale."},
    }, {
        "slug": "cap1",
        "name": "Salone Cap 1",
        "address": "Via Cap 1, Milano",
        "notify_email": "cap1@test.example",
        "cap": 1,
    }],
}
with open(os.environ["BARBERIA_SALONS_JSON"], "w", encoding="utf-8") as fh:
    json.dump(_SALONS, fh)

import srv  # noqa: E402  (importato dopo le variabili d'ambiente)

SENT = []


def _spy_send(to_addr, msg):
    """Sostituisce srv.send_email: nessun SMTP reale nei test."""
    SENT.append((to_addr, msg))


srv.send_email = _spy_send
CFG = srv.get_salon("test")
PANEL_CODE = "segretissimo"
with open(srv.PANEL_USERS_PATH, "w", encoding="utf-8") as fh:
    json.dump({"test": srv.panel_hash(PANEL_CODE)}, fh)


def next_open_date():
    d = datetime.date.today() + datetime.timedelta(days=1)
    for _ in range(20):
        if d.isoweekday() in (1, 2, 3, 4, 5, 6):
            return d.isoformat()
        d += datetime.timedelta(days=1)
    raise AssertionError("nessun giorno aperto")


def book(rid, date_iso=None, minutes=600, service="taglio", salon="test",
         name="Mario Rossi", email="mario@example.com", phone="3331234567"):
    payload = {"date": date_iso or next_open_date(), "time": minutes,
               "service": {"id": service},
               "client": {"name": name, "email": email, "phone": phone, "note": ""},
               "barber": srv.BARBERS[0], "requestId": rid, "consent": True,
               "salon": salon}
    res, _ = srv.reserve(payload, srv.get_salon(salon), "test.example")
    return res


def hdr(msg, name):
    """Header decodificato (From/Subject possono essere encoded-word)."""
    from email.header import decode_header
    out = []
    for part, enc in decode_header(str(msg[name] or "")):
        out.append(part.decode(enc or "utf-8", "replace")
                   if isinstance(part, bytes) else part)
    return "".join(out)


def mails_to(addr):
    return [m for (to, m) in SENT if to == addr]


def html_body(msg):
    for part in msg.walk():
        if part.get_content_type() == "text/html" and not part.get_filename():
            return part.get_payload(decode=True).decode("utf-8", "replace")
    return ""


def attachment(msg, name_part):
    for part in msg.walk():
        fn = part.get_filename() or ""
        if name_part in fn:
            return part.get_payload(decode=True).decode("utf-8", "replace")
    return None



def row_status(code):
    conn = srv.connect()
    row = conn.execute("SELECT status, receipt_sent FROM bookings WHERE code=?",
                       (code,)).fetchone()
    conn.close()
    return row


class ReceiptTest(unittest.TestCase):
    def setUp(self):
        SENT.clear()

    # ------------------------------------------------------------ struttura DB
    def test_schema_ha_le_colonne_della_ricevuta(self):
        srv.init_db()
        conn = srv.connect()
        cols = {r[1] for r in conn.execute("PRAGMA table_info(bookings)")}
        conn.close()
        for col in ("completed_at", "payment_status", "paid_at",
                    "receipt_sent", "receipt_sent_at"):
            self.assertIn(col, cols)

    # ------------------------------------------- chiusura -> ricevuta cliente
    def test_chiusura_invia_ricevuta_al_cliente_e_notifica_al_salone(self):
        res = book("req-ricevuta-1", minutes=540)
        self.assertTrue(res.get("ok"), res)
        code = res["code"]
        self.assertEqual(res["sent"], 2)  # inviti di conferma
        SENT.clear()

        out = srv.complete_booking(CFG, code, by="code")
        self.assertTrue(out["ok"], out)
        self.assertEqual(out["sent"], 2)
        self.assertFalse(out["paid"])

        client = mails_to("mario@example.com")
        self.assertEqual(len(client), 1)
        msg = client[0]
        self.assertIn("Ricevuta di avvenuta prestazione", hdr(msg, "Subject"))
        self.assertEqual(hdr(msg, "From"), "Salone Test \u2014 Ricevute <noreply@test.example>")

        txt = attachment(msg, "ricevuta-%s.txt" % code)
        self.assertIsNotNone(txt, "manca l'allegato ricevuta .txt")
        self.assertIn("RICEVUTA DI AVVENUTA PRESTAZIONE", txt)
        self.assertIn("non valido ai fini IVA o fiscali", txt)
        self.assertIn("IMPORTO: \u20ac 25,00", txt)
        self.assertIn("STATO: DA PAGARE", txt)
        self.assertIn("Codice prenotazione: %s" % code, txt)
        self.assertIn("Barbiere: %s" % srv.BARBERS[0], txt)
        # coordinate di pagamento del salone
        self.assertIn("IBAN IT00X0000000000000000000000", txt)
        self.assertIn("Salone Test Srl", txt)
        self.assertIn("https://paypal.me/salonetest", txt)
        self.assertIn("Indica il codice nella causale.", txt)

        html = html_body(msg)
        self.assertIn("\u20ac 25,00", html)
        self.assertIn("https://paypal.me/salonetest", html)

        # notifica al salone: pagamento in sospeso
        salon = mails_to("salone@test.example")
        self.assertEqual(len(salon), 1)
        self.assertIn("pagamento in sospeso", hdr(salon[0], "Subject"))
        sh = html_body(salon[0])
        self.assertIn("\u20ac 25,00", sh)
        self.assertIn("IN SOSPESO", sh)
        self.assertIn("Mario Rossi", sh)

        # stato in DB
        conn = srv.connect()
        row = conn.execute("SELECT status, payment_status, receipt_sent, "
                           "completed_at FROM bookings WHERE code=?", (code,)).fetchone()
        conn.close()
        self.assertEqual(row[0], "completed")
        self.assertEqual(row[1], "unpaid")
        self.assertEqual(row[2], 1)
        self.assertTrue(row[3])

    def test_chiusura_idempotente_e_reinvio(self):
        res = book("req-ricevuta-2", minutes=570)
        code = res["code"]
        SENT.clear()

        srv.complete_booking(CFG, code, by="code")
        self.assertEqual(len(SENT), 2)
        SENT.clear()

        again = srv.complete_booking(CFG, code, by="code")
        self.assertTrue(again["ok"])
        self.assertTrue(again.get("already"))
        self.assertEqual(len(SENT), 0, "una seconda chiusura non deve rimpinviare")

        resend = srv.complete_booking(CFG, code, by="code", resend=True)
        self.assertTrue(resend["ok"])
        self.assertEqual(resend["sent"], 2)
        self.assertEqual(len(mails_to("mario@example.com")), 1)

    def test_chiudi_e_incassa_segna_pagato_nella_ricevuta(self):
        res = book("req-ricevuta-3", minutes=690, service="barba")
        code = res["code"]
        SENT.clear()

        out = srv.complete_booking(CFG, code, by="code", paid=True)
        self.assertTrue(out["paid"])
        txt = attachment(mails_to("mario@example.com")[0], "ricevuta-")
        self.assertIn("IMPORTO: \u20ac 18,00", txt)
        self.assertIn("STATO: PAGATO", txt)
        self.assertNotIn("Come pagare:", txt)
        self.assertIn("incassato", hdr(mails_to("salone@test.example")[0], "Subject"))

    def test_mark_payment_toggle(self):
        res = book("req-ricevuta-4", minutes=720)
        code = res["code"]
        srv.complete_booking(CFG, code, by="code")

        out = srv.mark_payment(CFG, code, by="code", paid=True)
        self.assertTrue(out["ok"])
        self.assertTrue(out["paid"])
        conn = srv.connect()
        row = conn.execute("SELECT payment_status, paid_at FROM bookings "
                           "WHERE code=?", (code,)).fetchone()
        conn.close()
        self.assertEqual(row[0], "paid")
        self.assertTrue(row[1])

        out = srv.mark_payment(CFG, code, by="code", paid=False)
        self.assertFalse(out["paid"])

    def test_auto_ricevuta_chiude_le_prestazioni_terminate(self):
        srv.init_db()
        yesterday = (datetime.date.today()
                     - datetime.timedelta(days=1)).isoformat()
        conn = srv.connect()
        conn.execute(
            "INSERT INTO bookings (salon,request_id,date,minutes,service_id,"
            "service_name,duration,price,barber,client_name,client_phone,"
            "client_email,note,code,consent,status) VALUES "
            "('test','req-auto-1',?,600,'taglio','Taglio classico',30,25,?,"
            "'Anna Bianchi','3339999999','anna@example.com','','BL-AUTO',1,"
            "'confirmed')", (yesterday, srv.BARBERS[0]))
        conn.commit()
        conn.close()
        SENT.clear()

        done = srv.auto_complete_due()
        self.assertGreaterEqual(done, 1)
        self.assertEqual(len(mails_to("anna@example.com")), 1)
        self.assertEqual(len(mails_to("salone@test.example")), 1)
        self.assertEqual(srv.auto_complete_due(), 0, "non deve ripetersi")

        conn = srv.connect()
        row = conn.execute("SELECT status, receipt_sent FROM bookings "
                           "WHERE code='BL-AUTO'").fetchone()
        conn.close()
        self.assertEqual(row[0], "completed")
        self.assertEqual(row[1], 1)


    # ------------------------------------------------ casi limite ricevuta
    def test_ricevuta_senza_coordinate_di_pagamento(self):
        cfg = {"slug": "x", "name": "Salone X", "address": "", "piva": "",
               "payment": {"methods": "Contanti in salone"}}
        b = {"id": 7, "date": "2026-03-05", "minutes": 600, "duration": 30,
             "service_name": "Taglio", "barber": "Marco", "code": "BL-XX",
             "client_name": "Tizio", "price": 22, "payment_status": "unpaid"}
        txt = "\n".join(srv.receipt_lines(cfg, b))
        self.assertIn("RICEVUTA DI AVVENUTA PRESTAZIONE", txt)
        self.assertIn("non valido ai fini IVA o fiscali", txt)
        self.assertIn("IMPORTO: \u20ac 22,00", txt)
        self.assertIn("In salone: Contanti in salone", txt)
        self.assertIn("Causale consigliata: BL-XX", txt)
        # nessuna coordinata inventata
        self.assertNotIn("IBAN", txt)
        self.assertNotIn("paypal", txt.lower())

        html = srv.receipt_html(cfg, b)
        self.assertIn("Documento <b>non fiscale</b>", html)
        self.assertIn("\u20ac 22,00", html)
        self.assertNotIn("IBAN", html)

        # anche senza alcun metodo configurato la ricevuta resta coerente
        txt2 = "\n".join(srv.receipt_lines(dict(cfg, payment={}), b))
        self.assertIn("Come pagare:", txt2)
        self.assertIn("Causale consigliata: BL-XX", txt2)

    def test_numero_e_data_della_ricevuta(self):
        b = {"id": 42, "date": "2026-10-08", "minutes": 1035}
        self.assertEqual(srv.receipt_number(b), "2026-00042")
        self.assertEqual(srv.booking_when(b), "gioved\u00ec 8 ottobre alle 17:15")
        # dati mancanti: nessuna eccezione, fallback leggibile
        self.assertEqual(srv.booking_when({"date": "2026-10-08", "minutes": "x"}),
                         "2026-10-08")

    def test_reinvio_non_riporta_lo_stato_a_da_pagare(self):
        res = book("req-paid-keep", minutes=930)
        code = res["code"]
        SENT.clear()
        out = srv.complete_booking(CFG, code, by="code", paid=True)
        self.assertTrue(out["paid"], out)
        SENT.clear()
        # reinvio SENZA paid: lo stato incassato non deve regredire
        out2 = srv.complete_booking(CFG, code, by="code", paid=False, resend=True)
        self.assertTrue(out2["paid"], out2)
        self.assertEqual(out2["sent"], 2)
        txt = attachment(mails_to("mario@example.com")[0], "ricevuta-")
        self.assertIn("STATO: PAGATO", txt)
        self.assertNotIn("Come pagare:", txt)

    def test_chiusura_di_codice_inesistente(self):
        out = srv.complete_booking(CFG, "BL-NON-ESISTE", by="code")
        self.assertFalse(out["ok"], out)
        out = srv.mark_payment(CFG, "BL-NON-ESISTE", by="code")
        self.assertFalse(out["ok"], out)
        # un salone sconosciuto non deve far esplodere nulla
        self.assertIsNone(srv.get_salon("salone-che-non-esiste"))

    def test_senza_smtp_la_prestazione_si_chiude_comunque(self):
        res = book("req-nosmtp", minutes=1020)
        code = res["code"]
        SENT.clear()
        old = srv.SMTP_PASSWORD
        try:
            srv.SMTP_PASSWORD = ""
            out = srv.complete_booking(CFG, code, by="code")
        finally:
            srv.SMTP_PASSWORD = old
        self.assertTrue(out["ok"], out)
        self.assertEqual(out["sent"], 0)
        self.assertEqual(len(SENT), 0)
        conn = srv.connect()
        row = conn.execute("SELECT status, receipt_sent FROM bookings WHERE code=?",
                           (code,)).fetchone()
        conn.close()
        self.assertEqual(row[0], "completed")   # chiusa anche senza email
        self.assertEqual(row[1], 0)             # ricevuta NON segnata come inviata
        # con l'SMTP di nuovo attivo il reinvio parte
        SENT.clear()
        out = srv.complete_booking(CFG, code, by="code")
        self.assertEqual(out["sent"], 2)
        self.assertEqual(len(mails_to("mario@example.com")), 1)

    def test_ricevuta_senza_email_cliente_notifica_solo_il_salone(self):
        srv.init_db()
        conn = srv.connect()
        conn.execute(
            "INSERT INTO bookings (salon,request_id,date,minutes,service_id,"
            "service_name,duration,price,barber,client_name,client_phone,"
            "client_email,note,code,consent,status) VALUES "
            "('test','req-noemail',?,600,'taglio','Taglio classico',30,25,?,"
            "'No Email','3330000000','','','BL-NOEMAIL',1,'confirmed')",
            (next_open_date(), srv.BARBERS[0]))
        conn.commit()
        conn.close()
        SENT.clear()
        out = srv.complete_booking(CFG, "BL-NOEMAIL", by="code")
        self.assertTrue(out["ok"], out)
        self.assertEqual(out["sent"], 1, "solo la notifica al salone")
        self.assertEqual(len(SENT), 1)
        self.assertEqual(hdr(SENT[0][1], "Subject").split("\u2014")[0].strip(),
                         "Prestazione completata")

    def test_ricevuta_esegue_l_escape_dei_dati_cliente(self):
        evil = "<script>alert('x')</script>"
        res = book("req-xss-receipt", minutes=1080, name=evil,
                   email="xss@example.com")
        self.assertTrue(res.get("ok"), res)
        SENT.clear()
        srv.complete_booking(CFG, res["code"], by="code")
        html = html_body(mails_to("xss@example.com")[0])
        self.assertIn("&lt;script&gt;", html)
        self.assertNotIn("<script>alert", html)
        sh = html_body(mails_to("salone@test.example")[0])
        self.assertNotIn("<script>alert", sh)

    def test_prenotazione_chiusa_occupa_ancora_lo_slot(self):
        cfg = srv.get_salon("cap1")
        self.assertEqual(srv.seat_capacity(next_open_date(), cfg), 1)
        res = book("req-cap-done", minutes=780, salon="cap1",
                   name="Cap Done", email="capdone@example.com")
        self.assertTrue(res.get("ok"), res)
        code = res["code"]
        # slot pieno (cap 1): la seconda prenotazione va in conflitto
        res2 = book("req-cap-again", minutes=780, salon="cap1",
                    name="Cap Again", email="capagain@example.com")
        self.assertTrue(res2.get("conflict"), res2)
        # chiudo la prestazione: lo slot resta occupato (status completed)
        srv.complete_booking(cfg, code, by="code")
        res3 = book("req-cap-after", minutes=780, salon="cap1",
                    name="Cap After", email="capafter@example.com")
        self.assertTrue(res3.get("conflict"), res3)
        conn = srv.connect()
        row = conn.execute("SELECT status, barber FROM bookings WHERE code=?",
                           (code,)).fetchone()
        conn.close()
        self.assertEqual(row[0], "completed")

    def test_auto_ricevuta_rispetta_la_finestra_di_grazia(self):
        srv.init_db()
        now = datetime.datetime.now()
        start = now - datetime.timedelta(minutes=40)   # terminata 10 minuti fa
        date_iso = start.date().isoformat()
        minutes = start.hour * 60 + start.minute
        conn = srv.connect()
        conn.execute(
            "INSERT INTO bookings (salon,request_id,date,minutes,service_id,"
            "service_name,duration,price,barber,client_name,client_phone,"
            "client_email,note,code,consent,status) VALUES "
            "('test','req-grace',?,?,'taglio','Taglio classico',30,25,?,"
            "'Grace Test','3331111111','grace@example.com','','BL-GRACE',1,"
            "'confirmed')", (date_iso, minutes, srv.BARBERS[0]))
        conn.commit()
        conn.close()
        old = srv.AUTO_RECEIPT_GRACE_MIN
        try:
            srv.AUTO_RECEIPT_GRACE_MIN = 60      # finestra larga: non deve chiudere
            srv.auto_complete_due()
            row = row_status("BL-GRACE")
            self.assertEqual(row[0], "confirmed", "in grazia non si chiude")
            srv.AUTO_RECEIPT_GRACE_MIN = 0        # nessuna grazia: chiude
            SENT.clear()
            srv.auto_complete_due()
            row = row_status("BL-GRACE")
            self.assertEqual(row[0], "completed")
            self.assertEqual(row[1], 1)
            self.assertEqual(len(mails_to("grace@example.com")), 1)
        finally:
            srv.AUTO_RECEIPT_GRACE_MIN = old

    # ------------------------------------- regressioni scoperte dalle prove
    def test_availability_conta_tutte_le_prenotazioni_sullo_stesso_slot(self):
        # GROUP BY aggrega le prenotazioni identiche: i posti liberi devono
        # riflettere il conteggio, non contare il gruppo una volta sola.
        d = next_open_date()
        cap = srv.seat_capacity(d, CFG)
        n = min(2, cap)
        for i in range(n):
            res = book("req-av-%d" % i, date_iso=d, minutes=1140,
                       name="Av %d" % i, email="av%d@example.com" % i)
            self.assertTrue(res.get("ok"), res)
        av = srv.availability([d], CFG)[0]
        slot = [s for s in av["slots"] if s["minutes"] == 1140][0]
        self.assertEqual(slot["free"], cap - n,
                         "posti liberi sottostimati con prenotazioni sullo stesso slot")
        self.assertEqual(slot["cap"], cap)

    def test_piva_non_duplica_l_etichetta_nell_html(self):
        b = {"id": 3, "date": "2026-03-05", "minutes": 600, "duration": 30,
             "service_name": "Taglio", "barber": "Marco", "code": "BL-XX",
             "client_name": "Tizio", "price": 25, "payment_status": "unpaid"}
        for raw in ("04821960168", "P.IVA 04821960168", "p.iva: 04821960168"):
            cfg = {"slug": "x", "name": "Salone", "address": "", "piva": raw,
                   "payment": {}}
            txt = "\n".join(srv.receipt_lines(cfg, b))
            self.assertIn("P.IVA 04821960168", txt)
            self.assertNotIn("P.IVA P.IVA", txt)
            self.assertNotIn("p.iva", txt.lower().replace("p.iva 04821960168", ""))
            html = srv.receipt_html(cfg, b)
            m = re.search(r"<td[^>]*>P\.IVA</td><td[^>]*>(.*?)</td>", html)
            self.assertIsNotNone(m, "riga P.IVA assente")
            self.assertEqual(m.group(1), "<b>04821960168</b>",
                             "l'etichetta P.IVA non deve ripetersi nel valore")
        # senza piva: nessuna riga
        cfg = {"slug": "x", "name": "Salone", "address": "", "piva": "",
               "payment": {}}
        self.assertNotIn("P.IVA", srv.receipt_html(cfg, b))
        self.assertNotIn("P.IVA", "\n".join(srv.receipt_lines(cfg, b)))

    # ----------------------------------------------------- config pagamento
    def test_payment_lines_normalizza_paypal(self):
        self.assertEqual(
            srv.payment_lines({"paypal": "salonetest"})[0]["href"],
            "https://paypal.me/salonetest")
        self.assertEqual(
            srv.payment_lines({"paypal": "https://paypal.me/x"})[0]["href"],
            "https://paypal.me/x")
        self.assertEqual(
            srv.payment_lines({"paypal": "info@salone.it"})[0]["value"],
            "invia il pagamento a info@salone.it")
        lines = srv.payment_lines({"iban": "IT60X", "holder": "Tizio",
                                   "methods": "Contanti"})
        self.assertIn("IT60X", lines[0]["value"])
        self.assertIn("Tizio", lines[0]["value"])
        self.assertEqual(lines[-1]["label"], "In salone")
        self.assertEqual(srv.payment_lines({}), [])

    def test_payment_eredita_i_default_e_unisce_il_salone(self):
        with open(srv.OUTREACH_JSON, encoding="utf-8") as fh:
            base = json.load(fh)
        base["defaults"]["payment"] = {"iban": "IT00DEFAULTS", "holder": "Default",
                                       "methods": "Contanti"}
        base["salons"] = [
            {"slug": "senza-payment", "name": "Senza Payment",
             "notify_email": "a@test.example"},
            {"slug": "con-paypal", "name": "Con PayPal",
             "notify_email": "b@test.example", "payment": {"paypal": "miohandle"}},
        ]
        tmp = os.path.join(TMP, "salons-merge.json")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(base, fh)
        old = srv.OUTREACH_JSON
        try:
            srv.OUTREACH_JSON = pathlib.Path(tmp)
            salons = srv._load_salons()
        finally:
            srv.OUTREACH_JSON = old
        self.assertEqual(salons["senza-payment"]["payment"]["iban"], "IT00DEFAULTS")
        self.assertEqual(salons["senza-payment"]["payment"]["methods"], "Contanti")
        # il salone sovrascrive solo cio' che compila, il resto lo eredita
        self.assertEqual(salons["con-paypal"]["payment"]["paypal"], "miohandle")
        self.assertEqual(salons["con-paypal"]["payment"]["iban"], "IT00DEFAULTS")
        # i valori sporchi (newline / null) vengono ripuliti
        merged = srv._merge_payment({"iban": "IT00DEFAULTS"},
                                    {"holder": "Tizio\nX", "paypal": "\x00"})
        self.assertEqual(merged["holder"], "Tizio X")
        self.assertEqual(merged.get("paypal", ""), "")
        self.assertEqual(merged["iban"], "IT00DEFAULTS")

    # --------------------------------------------------- migrazione DB vecchio
    def test_migrazione_db_preesistente(self):
        path = os.path.join(TMP, "vecchio.db")
        conn = sqlite3.connect(path)
        conn.execute("""CREATE TABLE bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            salon TEXT NOT NULL DEFAULT 'lambrate',
            request_id TEXT UNIQUE NOT NULL, date TEXT NOT NULL,
            minutes INTEGER NOT NULL, service_id TEXT, service_name TEXT,
            duration INTEGER, price INTEGER, barber TEXT, client_name TEXT,
            client_phone TEXT, client_email TEXT, note TEXT, code TEXT,
            email_sent INTEGER DEFAULT 0, consent INTEGER DEFAULT 0,
            status TEXT DEFAULT 'confirmed',
            created_at TEXT DEFAULT (datetime('now')))""")
        conn.execute("INSERT INTO bookings (salon,request_id,date,minutes,"
                     "service_name,duration,price,client_email,code,status) "
                     "VALUES ('test','old-1','2026-01-01',600,'Taglio',30,25,"
                     "'x@test.example','BL-OLD','confirmed')")
        conn.commit()
        conn.close()
        old = srv.DB_PATH
        try:
            srv.DB_PATH = pathlib.Path(path)
            srv.init_db()
            c = srv.connect()
            cols = {r[1] for r in c.execute("PRAGMA table_info(bookings)")}
            row = c.execute("SELECT status, payment_status, receipt_sent "
                            "FROM bookings WHERE code='BL-OLD'").fetchone()
            c.close()
        finally:
            srv.DB_PATH = old
        for col in ("completed_at", "payment_status", "paid_at",
                    "receipt_sent", "receipt_sent_at"):
            self.assertIn(col, cols)
        self.assertEqual(row[0], "confirmed")
        self.assertEqual(row[1], "unpaid")
        self.assertEqual(row[2], 0)


class PanelHttpTest(unittest.TestCase):
    """Gira il vero server in un thread e usa gli endpoint del pannello."""

    @classmethod
    def setUpClass(cls):
        cls.server = srv.ThreadingHTTPServer(("127.0.0.1", 0), srv.Handler)
        cls.port = cls.server.server_address[1]
        cls.base = "http://127.0.0.1:%d" % cls.port
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.jar = http.cookiejar.CookieJar()
        cls.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(cls.jar))

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def post(self, path, body=None):
        req = urllib.request.Request(
            self.base + path, data=json.dumps(body or {}).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST")
        try:
            with self.opener.open(req, timeout=10) as r:
                return r.status, json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8")
            try:
                return e.code, json.loads(raw)
            except ValueError:
                return e.code, {"raw": raw}

    def test_flusso_pannello(self):
        # 1. senza login: 401
        code, data = self.post("/panel/list")
        self.assertEqual(code, 401)
        # 2. passcode sbagliato: 401
        code, data = self.post("/panel/login",
                               {"salon": "test", "passcode": "nope"})
        self.assertEqual(code, 401)
        # 3. login corretto
        code, data = self.post("/panel/login",
                               {"salon": "test", "passcode": PANEL_CODE})
        self.assertEqual(code, 200, data)
        self.assertTrue(data["ok"])

        # 4. prenotazione + lista con riepilogo incassi
        res = book("req-http-1", minutes=660, name="Luca Verdi",
                   email="luca@example.com")
        self.assertTrue(res.get("ok"), res)
        code, data = self.post("/panel/list")
        self.assertEqual(code, 200)
        self.assertEqual(data["name"], "Salone Test")
        mine = [x for x in data["bookings"] if x["code"] == res["code"]]
        self.assertEqual(len(mine), 1)
        self.assertIn("payment_status", mine[0])
        self.assertIn("receipt_sent", mine[0])
        self.assertEqual(data["payments"]["pending_count"], 0)

        # 5. chiusura dal pannello -> ricevuta + notifica
        SENT.clear()
        code, data = self.post("/panel/complete", {"id": mine[0]["id"]})
        self.assertEqual(code, 200, data)
        self.assertTrue(data["ok"])
        self.assertEqual(data["sent"], 2)
        self.assertEqual(len(mails_to("luca@example.com")), 1)
        self.assertEqual(len(mails_to("salone@test.example")), 1)

        # 6. il riepilogo conta il pagamento in sospeso
        code, data = self.post("/panel/list")
        self.assertEqual(data["payments"]["pending_count"], 1)
        self.assertEqual(data["payments"]["pending_total"], 25)

        # 7. incasso
        code, data = self.post("/panel/paid", {"id": mine[0]["id"], "paid": True})
        self.assertEqual(code, 200, data)
        self.assertTrue(data["paid"])
        code, data = self.post("/panel/list")
        self.assertEqual(data["payments"]["pending_count"], 0)

        # 8. reinvio esplicito
        SENT.clear()
        code, data = self.post("/panel/complete",
                               {"id": mine[0]["id"], "resend": True})
        self.assertEqual(code, 200, data)
        self.assertEqual(data["sent"], 2)

        # 9. id sconosciuto -> 404
        code, data = self.post("/panel/complete", {"id": 999999})
        self.assertEqual(code, 404)
        self.assertFalse(data["ok"])

    def test_pannello_completa_e_incassa_per_codice(self):
        code, data = self.post("/panel/login",
                               {"salon": "test", "passcode": PANEL_CODE})
        self.assertEqual(code, 200, data)
        res = book("req-http-code", minutes=960, name="Carla Blu",
                   email="carla@example.com")
        self.assertTrue(res.get("ok"), res)
        SENT.clear()
        # chiusura per codice (non per id)
        code, data = self.post("/panel/complete", {"code": res["code"]})
        self.assertEqual(code, 200, data)
        self.assertEqual(data["sent"], 2)
        self.assertEqual(len(mails_to("carla@example.com")), 1)
        # incasso per codice
        code, data = self.post("/panel/paid", {"code": res["code"], "paid": True})
        self.assertEqual(code, 200, data)
        self.assertTrue(data["paid"])
        # codice inesistente -> 404
        code, data = self.post("/panel/complete", {"code": "BL-NOPE"})
        self.assertEqual(code, 404)
        # senza id/code -> 400
        code, data = self.post("/panel/complete", {})
        self.assertEqual(code, 400)

    def test_pagina_pannello_e_disponibilita(self):
        with self.opener.open(self.base + "/panel", timeout=10) as r:
            self.assertEqual(r.status, 200)
            page = r.read().decode("utf-8")
        self.assertIn("/panel/complete", page)
        self.assertIn("Segna incassata", page)
        date_iso = next_open_date()
        with self.opener.open(self.base + "/availability?salon=test&date=" + date_iso,
                              timeout=10) as r:
            self.assertEqual(r.status, 200)
            data = json.loads(r.read().decode("utf-8"))
        self.assertFalse(data["dates"][0]["closed"])
        self.assertTrue(data["dates"][0]["slots"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
