# Prenota Salone — online booking for barbershops & salons

A tiny, self-contained **multi-tenant online booking app** for barbershops and
hair salons. One Python file (stdlib only) + SQLite serves the web app **and**
the JSON API. No framework, no build step for the backend, no external services
required (email is optional).

Each salon gets its own subdomain: `salone-a.example.com`, `salone-b.example.com`,
all from **one** deployment and **one** SQLite file.

![Salone Demo](og/demo.png)

![Booking screen](docs/screenshot.png)

## Why it exists

Small salons usually don't have a booking system: they take appointments by
phone or DM, and lose clients when nobody answers. This is a drop-in page they
can put on their phone / Instagram bio, where clients book themselves — evenings
and Sundays included. No app to install for the client.

## Features

- **Multi-tenant** — many salons from one instance, resolved by subdomain
  (`<slug>.domain`) or by `?salon=<slug>`; unknown slugs fall back gracefully.
- **Client side (no login)** — pick a service, a day and a free slot, leave a
  name and phone; the appointment is confirmed instantly.
- **Concurrency-safe** bookings: an atomic SQLite transaction + a
  duration-aware capacity check, so two clients can't grab the same slot.
- **Owner panel** (`/panel`, one passcode per salon) — view, reschedule and
  cancel bookings; login rate-limited, session cookie is HMAC-signed.
- **Optional email** — booking confirmation + a `.ics` calendar attachment
  (works with any SMTP, e.g. a free Gmail/ProtonMail account).
- **GDPR-friendly** — a ready privacy page, explicit consent checkbox, minimal
  data collected.
- **Hardened by default** — rate limiting, capped request sizes, HTML escaping,
  banner-injected `og:` tags for WhatsApp/social previews, secrets from env only.

## Quickstart

Requires **Python 3.8+** (standard library only) and a modern browser.

```bash
git clone https://github.com/<you>/prenota-salone.git
cd prenota-salone

# optional but recommended: your own secrets
export BARBERIA_PANEL_SECRET="$(python3 -c 'import secrets;print(secrets.token_hex(32))')"
export BARBERIA_ADMIN_TOKEN="$(python3 -c 'import secrets;print(secrets.token_hex(32))')"

python3 srv.py
```

Open <http://localhost:8899/> — you'll see the **Salone Demo** tenant.
Owner panel: <http://localhost:8899/panel> (demo passcode **`demo1234`**).

The whole configuration lives in two JSON files at the repo root:

- `salons.json` — the tenants (`slug`, `name`, address, services, opening hours…).
- `panel_users.json` — one hashed passcode per salon.

> The demo passcode `demo1234` is public on purpose. **Always change it** before
> going live: hash a new one with `python3 panel_hash.py <slug> <new-code>`.

## Configuration (environment variables)

All optional; sensible defaults. Secrets are **never** in the source.

| Variable | Meaning |
|---|---|
| `BARBERIA_PORT` | listen port (default `8899`) |
| `BARBERIA_HOST` | bind address (default `0.0.0.0`) |
| `BARBERIA_DB_PATH` | SQLite path (default `./bookings.db`) |
| `BARBERIA_LOG_PATH` | log file (default `./server.log`) |
| `BARBERIA_SALONS_JSON` | tenants file (default `./salons.json`) |
| `BARBERIA_PANEL_USERS` | passcodes file (default `./panel_users.json`) |
| `BARBERIA_RETENTION_DAYS` | booking retention (default `730`) |
| `BARBERIA_PANEL_SECRET` | HMAC key for panel session cookies |
| `BARBERIA_ADMIN_TOKEN` | token for the admin `GET /bookings` endpoint |
| `BARBERIA_SMTP_HOST` / `_PORT` / `_LOGIN` / `_PASSWORD` | optional email sending |
| `BARBERIA_OG_DIR` | folder with `og/<slug>.png` social banners |
| `BARBERIA_SLUG_REDIRECTS` | JSON of `{"old-slug":"new-slug"}` → 301 redirects |

See `.env.example`.

## Adding a salon

1. Add an entry to `salons.json` under `salons` (copy an existing one).
2. Generate its passcode:
   ```bash
   python3 panel_hash.py <slug> 'la-tua-password'
   ```
   and put the printed hash into `panel_users.json` under the same slug.
3. *(optional)* drop `og/<slug>.png` (1200×630) and `og/<slug>-logo.png`.
4. Restart the service.

## Production deploy (short version)

- Run as a systemd service under a dedicated user, with an `EnvironmentFile`
  (`chmod 600`), `Restart=on-failure`, `UMask=0077`.
- Put nginx in front with a wildcard `server_name *.yourdomain` → `127.0.0.1:<port>`
  (`proxy_set_header Host $host`).
- TLS: either a wildcard cert (`certbot ... -d yourdomain -d "*.yourdomain"`) or
  **Cloudflare Free** in front (SSL/TLS mode **Flexible**, since the origin only
  speaks HTTP). DNS: `A @` and `A *` → your server IP; proxy the per-tenant
  records too.
- Backup = copy the single `bookings.db` + the two JSON files.

## Project layout

```
srv.py            backend: HTTP server + JSON API + tenant resolution + panel auth
App.jsx           frontend source (React 18, UMD, no bundler config)
app.js            transpiled bundle actually served  (esbuild App.jsx --outfile app.js)
index.html        client page (loads React UMD + app.js)
panel.html        owner panel
privacy.html      GDPR privacy notice template
salons.json       tenant configuration
panel_users.json  per-salon hashed passcodes
og/               social-preview banners (og/<slug>.png, og/<slug>-logo.png)
panel_hash.py     helper: hash a new passcode
```

To rebuild the frontend after editing `App.jsx`:

```bash
npx esbuild App.jsx --loader:.jsx=jsx --bundle --outfile=app.js
```

(or run any esbuild you already have; the server serves `app.js` as-is).

## License

MIT — see [LICENSE](LICENSE).

---

## Italiano

**Prenota Salone** è una piccola app di prenotazione online **multi-salone** per
barbieri e parrucchieri. Un solo file Python (solo libreria standard) + SQLite
serve sia la web app sia le API: nessun framework, nessun database esterno, nessun
servizio obbligatorio (l'email è opzionale).

Ogni salone ha il suo sottodominio (`salone-a.tuodominio.it`), tutto da **un solo**
deploy e **un solo** file SQLite.

Il cliente sceglie servizio, giorno e orario libero e prenota in pochi secondi,
senza installare niente; il titolare gestisce appuntamenti da `/panel`.
Le prenotazioni sono **sicure in concorrenza** (transazione atomica + controllo
capienza), e i dati raccolti sono minimi (pagina privacy GDPR inclusa).

Avvio rapido: `python3 srv.py` → <http://localhost:8899/> (demo), pannello
`/panel` con codice **`demo1234`**. Licenza MIT.
