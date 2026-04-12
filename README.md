# HolzpreisVergleich

**[holzpreisvergleich.de](https://holzpreisvergleich.de)** — Kostenloser Brennholz-Preisrechner.
Angebote normalisiert vergleichen nach €/Festmeter und €/kWh.

## Features

- **Preisrechner** — Bis zu 5 Angebote gleichzeitig vergleichen, normalisiert auf €/fm und €/kWh. Unterstützt Mischlieferungen (2 Holzarten pro Angebot), Lieferkosten, Holzfeuchte-Korrekturfaktor.
- **Holzarten & Heizwerte** — Referenztabelle mit 10 Holzarten, filterbar nach Typ und Funkenflug, sortierbare Spalten.
- **Emissionen & Klima** — PM2.5-Feinstaubwerte nach Holzfeuchte, CO₂-Vergleich mit Gas/Öl, Aufklärung über den biogenen Kreislauf.
- **Lieferanten finden** — Regionales Lieferantenverzeichnis mit Live-Daten aus Airtable. Featured-Einträge für bezahlte Lieferanten.
- **Umrechner** — Statische SEO-Seite: Festmeter / Raummeter / Schüttraummeter.
- **Ratgeber** — Statische SEO-Seiten (z.B. Brennholz Preise 2026).

## Tech Stack

| Bereich          | Technologie                                            |
| ---------------- | ------------------------------------------------------ |
| Framework        | React 19 + Vite 8                                      |
| Styling          | CSS Custom Properties, kein UI-Framework               |
| Fonts            | Barlow, Barlow Condensed, Fira Code (self-hosted WOFF2)|
| Lieferanten-Daten| Airtable (read-only API fetch)                         |
| Kontaktformular  | Formspree                                              |
| Hosting          | GitHub Pages                                           |
| DNS              | Cloudflare                                             |
| Domain           | United Domains                                         |

Kein Backend. Keine Datenbank. Alle Berechnungen im Browser.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Airtable-Credentials eintragen
npm run dev                   # http://localhost:5173
```

### Umgebungsvariablen

| Variable                | Beschreibung                                        |
| ----------------------- | --------------------------------------------------- |
| `VITE_AIRTABLE_TOKEN`   | Personal Access Token (scope: `data.records:read`)  |
| `VITE_AIRTABLE_BASE_ID` | Base ID aus der Airtable-URL (`appXXXXXXXX`)        |

Ohne Credentials lädt der Lieferanten-Tab Fallback-Beispieldaten.

## Deployment

Push auf `main` → GitHub Actions baut mit Vite → deployt `dist/` auf GitHub Pages.

```bash
npm run build   # dist/ erzeugen
npm run preview # dist/ lokal vorschauen
```

## Projekt-Struktur

```text
src/
└── App.jsx          # Gesamte App (Rechner, Tabs, Modals)
└── App.css          # Design-System (Tokens, Komponenten)

public/
├── fonts/           # Self-hosted WOFF2 (Barlow, Fira Code)
├── umrechner/       # Statische SEO-Seite: fm/rm/srm Umrechner
├── ratgeber/
│   └── brennholz-preise-2026/   # Ratgeber (Draft, noindex bis Aug 2026)
├── CNAME            # holzpreisvergleich.de
├── robots.txt
├── sitemap.xml
└── share.png        # OG-Bild (1200×630)

seo/                 # SEO-Strategie-Dokumente
├── SEO-STRATEGY.md
├── COMPETITOR-ANALYSIS.md
├── CONTENT-CALENDAR.md
├── IMPLEMENTATION-ROADMAP.md
└── SITE-STRUCTURE.md

.github/
└── workflows/
    └── deploy.yml   # Build + Deploy auf GitHub Pages
```

## Monetarisierung

- **Affiliate** — Holzfeuchtemessgerät (Amazon Partnerprogramm) im Emissionen-Tab
- **Featured Listings** — Bezahlte Lieferanten-Einträge via Airtable (`featured: true`)
- **Ko-fi** — [buymeacoffee.com/philsmith91](https://buymeacoffee.com/philsmith91)

## Rechtliches

Impressum und Datenschutzerklärung sind als Modals in der App integriert (Footer).
Kontaktformular via Formspree (`mkokwndj`).

---

Entwickelt von [Philipp Schmidt](mailto:hallo@holzpreisvergleich.de) · Aidlingen
