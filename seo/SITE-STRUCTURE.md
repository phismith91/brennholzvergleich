# Site-Struktur — holzpreisvergleich.de

## Aktueller Zustand (Problem)

Die App ist eine Single-Page-Application mit 4 Tabs — alle unter `/`.
Google sieht zwar den JS-gerenderter Inhalt, aber es gibt **keine eigenständigen URLs** für:
- Holzarten-Guide
- Emissionen-Seite
- Lieferanten nach Region

→ Kein internes Linking, keine thematischen Landingpages, kein Crawl-Budget-Management.

## Ziel-Architektur (12 Monate)

```
holzpreisvergleich.de/
│
├── /                           ← Preisrechner (SPA — Haupttool)
│
├── /umrechner/                 ← Festmeter / Raummeter / Schüttraummeter
│   └── Statische HTML-Seite + eingebetteter Mini-Rechner
│
├── /holzarten/                 ← Übersicht alle Holzarten
│   ├── /holzarten/buche/       ← Buche: Heizwert, Eigenschaften, Preise
│   ├── /holzarten/eiche/       ← Eiche
│   ├── /holzarten/birke/       ← Birke
│   └── /holzarten/fichte/      ← Fichte (Warnung: Funkenflug)
│
├── /lieferanten/               ← Lieferanten-Verzeichnis (Übersicht)
│   ├── /lieferanten/bayern/    ← Bayern: regionale Lieferanten
│   ├── /lieferanten/bw/        ← Baden-Württemberg
│   ├── /lieferanten/nrw/       ← NRW
│   └── ...                     ← weitere Bundesländer on demand
│
├── /ratgeber/                  ← Blog / Guides
│   ├── /ratgeber/brennholz-preise-2026/
│   ├── /ratgeber/holz-richtig-lagern/
│   ├── /ratgeber/holzfeuchte-messen/
│   └── /ratgeber/co2-holzheizung/
│
└── /ueber-uns/                 ← About + Impressum (optional)
```

## Umsetzung auf GitHub Pages

Da der Hauptrechner eine Vite-SPA ist, werden die zusätzlichen Seiten als **statische HTML-Dateien** in `/public/` angelegt:

```
public/
├── CNAME
├── fonts/
├── umrechner/
│   └── index.html
├── holzarten/
│   ├── index.html
│   └── buche/
│       └── index.html
├── lieferanten/
│   └── index.html
└── ratgeber/
    └── brennholz-preise-2026/
        └── index.html
```

Diese Seiten sind komplett statisches HTML — kein Build-Schritt, sofort crawlbar.

## Interne Verlinkung

- Jede Holzart-Seite verlinkt zurück zum Hauptrechner: „Jetzt Buchen-Angebote vergleichen →"
- Lieferanten-Seiten verlinken auf den Rechner mit vorausgefüllter Region
- Ratgeber-Seiten verlinken auf den Rechner + thematisch passende Holzart-Seiten
- Rechner-Footer: Links zu /umrechner/, /holzarten/, /ratgeber/

## Priorität der Seiten (nach SEO-Potenzial)

| Priorität | Seite | Grund |
|-----------|-------|-------|
| 🔴 P0 | /umrechner/ | Featured-Snippet-Potenzial, 1.800 Suchen/Monat |
| 🔴 P0 | /ratgeber/brennholz-preise-2026/ | Saisonaler Traffic-Spike, Q3–Q1 |
| 🟡 P1 | /holzarten/ (Übersicht) | Informational Intent, intern verlinkt |
| 🟡 P1 | /lieferanten/bayern/ | Lokaler Intent, Monetarisierung |
| 🟢 P2 | /ratgeber/holz-richtig-lagern/ | Evergreen, gutes Backlink-Potenzial |
| 🟢 P2 | /holzarten/buche/ | Meistgesuchte Holzart |
