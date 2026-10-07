#!/usr/bin/env python3
"""Guardia i18n del frontend (solo stdlib).

Verifica che:
  - ogni stringa usata con t("...") in App.jsx abbia una traduzione inglese;
  - il bundle app.js sia aggiornato, cioe' abbia lo stesso dizionario EN.

App.jsx e' JSON-compatibile, app.js no (esbuild usa apici singoli e \\uXXXX):
il parsing tollera entrambi gli stili, senza dipendenze esterne.

    python3 -m unittest discover -s tests -v
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_JSX = os.path.join(ROOT, "App.jsx")
APP_JS = os.path.join(ROOT, "app.js")

_STR = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'')
_ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f",
        "\\": "\\", "'": "'", '"': '"', "`": "`", "/": "/", "0": "\0"}


def _unescape(lit):
    body = lit[1:-1]
    out = []
    i = 0
    while i < len(body):
        c = body[i]
        if c == "\\" and i + 1 < len(body):
            n = body[i + 1]
            if n == "u" and i + 6 <= len(body):
                out.append(chr(int(body[i + 2:i + 6], 16)))
                i += 6
                continue
            if n == "x" and i + 4 <= len(body):
                out.append(chr(int(body[i + 2:i + 4], 16)))
                i += 4
                continue
            out.append(_ESC.get(n, n))
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def _extract_en_object(src):
    """Testo dell'oggetto `const EN = {...}`, con le graffe bilanciate."""
    i = src.index("{", src.index("const EN = {"))
    depth = 0
    in_str = None
    esc = False
    for j in range(i, len(src)):
        ch = src[j]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in "\"'":
            in_str = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
    raise AssertionError("chiusura di EN non trovata")


def _parse_en(src):
    """Dizionario EN come {italiano: inglese} (l'oggetto ha solo coppie stringa/stringa)."""
    obj = _extract_en_object(src)
    lits = [_unescape(m.group(0)) for m in _STR.finditer(obj)]
    assert len(lits) % 2 == 0, "numero dispari di stringhe in EN"
    return {lits[k]: lits[k + 1] for k in range(0, len(lits), 2)}


def _t_literals(src):
    out = set()
    for m in re.finditer(r'\bt\(\s*("(?:[^"\\]|\\.)*")', src):
        lit = m.group(1)
        out.add(re.sub(r"\\(.)", r"\1", lit[1:-1]))
    return out


class I18nTest(unittest.TestCase):
    def test_ogni_t_ha_una_traduzione(self):
        src = _read(APP_JSX)
        en = _parse_en(src)
        self.assertGreater(len(en), 80, "dizionario EN sospettosamente piccolo")
        keys = _t_literals(src)
        self.assertGreater(len(keys), 50, "poche stringhe t() trovate")
        missing = sorted(k for k in keys if k not in en)
        self.assertEqual(missing, [],
                         "stringhe senza traduzione inglese: %s" % missing)
        for k, v in en.items():
            self.assertTrue(v.strip(), "traduzione vuota: %r" % k)

    def test_app_js_e_aggiornato_rispetto_ad_app_jsx(self):
        en_jsx = _parse_en(_read(APP_JSX))
        en_js = _parse_en(_read(APP_JS))
        diff = sorted(set(en_jsx) ^ set(en_js)) or \
            sorted(k for k in en_jsx if en_jsx[k] != en_js[k])
        self.assertEqual(diff, [],
                         "app.js non e' aggiornato: ricostruisci con "
                         "`npx esbuild App.jsx --loader:.jsx=jsx --outfile=app.js` "
                         "(differenze: %s)" % diff[:5])

    def test_il_bundle_espone_il_toggle(self):
        js = _read(APP_JS)
        for marker in ("lang-btn", "FlagIcon", "barberia_lang"):
            self.assertIn(marker, js, "manca %s in app.js" % marker)


if __name__ == "__main__":
    unittest.main(verbosity=2)
