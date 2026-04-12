# Implementierungs-Roadmap — holzpreisvergleich.de

## Phase 1 — Technische Basis (Woche 1–2, sofort)

### P0: Sitemap + robots.txt
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://holzpreisvergleich.de/</loc><priority>1.0</priority></url>
  <!-- weitere URLs nach und nach ergänzen -->
</urlset>
```
```
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://holzpreisvergleich.de/sitemap.xml
```

### P0: Google Search Console anmelden
1. search.google.com/search-console → Property hinzufügen
2. Domain: holzpreisvergleich.de → TXT-Record in Cloudflare verifizieren
3. Sitemap einreichen

### P0: Schema.org in index.html erweitern
Bereits vorhanden: `WebApplication` — ergänzen um:
```json
{
  "@type": "WebApplication",
  "author": {
    "@type": "Person",
    "name": "Philipp Schmidt",
    "url": "https://holzpreisvergleich.de/"
  }
}
```

### P1: Open Graph Bild erstellen (share.png)
1200×630px PNG für Social Sharing → aktuell fehlt `/share.png`
Einfache Lösung: Canva, dunkler Hintergrund, Logo + Tagline

---

## Phase 2 — Erste Content-Seiten (Woche 3–6)

### /umrechner/ — Höchste Priorität
- **Warum zuerst:** Niedrigster Wettbewerb, Featured-Snippet-Potenzial
- **Aufwand:** ~3h
- Statisches HTML in `public/umrechner/index.html`
- Mini-Rechner als einfaches Inline-JS

### /holzarten/ — Bereits als App-Tab vorhanden
- Als eigenständige statische Seite duplizieren
- Interne Verlinkung aus der App ergänzen

### Sitewide Navigation ergänzen
Footer-Link im Rechner: „Umrechner · Holzarten · Ratgeber"

---

## Phase 3 — Saisonaler Content (Juli–August 2026)

**Deadline: 1. August** — vor dem Traffic-Spike der Heizsaison

- [ ] `/ratgeber/brennholz-preise-2026/` live
- [ ] `/lieferanten/bayern/` live
- [ ] `/ratgeber/holz-richtig-lagern/` live
- [ ] Sitemap aktualisiert und neu eingereicht
- [ ] 3–5 Forum-Posts (Heizungsforum.de, gutefrage.net) mit Link

---

## Phase 4 — Backlinks & Autorität (September–Dezember 2026)

### Backlink-Quellen (realistisch ohne Budget)

**Foren:**
- heizungsforum.de — Ratgeber-Thread mit Link zum Rechner
- energieforum.net — CO₂-Diskussion → Emissionen-Tab
- reddit.com/r/de + r/germany — „Gebaut: kostenloser Brennholz-Rechner"

**Lieferanten:**
- Jeder Featured-Lieferant bekommt Anweisung: „Bitte verlinken Sie auf holzpreisvergleich.de"
- Das sind die wertvollsten Links (thematisch relevant)

**Lokale Presse:**
- Böblinger Kreiszeitung, Sindelfinger Zeitung
- Pitch: „Aidlinger Entwickler baut kostenloses Tool für Brennholz-Käufer"
- 1 lokaler Presseartikel = DA-Boost + Trust-Signal

**Verzeichnisse:**
- producthunt.com (Englisch, aber DA sehr hoch)
- alternativeto.net
- Heizung.de Partnerseite anfragen

---

## Technische Checkliste (einmalig)

- [ ] `public/robots.txt` anlegen
- [ ] `public/sitemap.xml` anlegen
- [ ] Google Search Console verifizieren
- [ ] `/share.png` für OG-Bild erstellen
- [ ] Google Analytics / Plausible einrichten (Datenschutz-konform)
- [ ] Core Web Vitals prüfen (PageSpeed Insights)
- [ ] Mobile Usability prüfen (Search Console)

## Analytics-Empfehlung

**Plausible.io** (nicht Google Analytics):
- DSGVO-konform ohne Cookie-Banner
- Kostenlos bis 10k Seitenaufrufe/Monat (reicht für Jahr 1)
- 1 Zeile Code, keine Cookies
- Passt zum „Kein Tracking"-Versprechen in der App

---

## Erfolgsmessung

Monatlich prüfen:
1. Search Console: Impressionen, Klicks, Average Position
2. Plausible: Organischer Traffic, meistbesuchte Seiten
3. Ahrefs Free / Ubersuggest: Keyword-Rankings der Top-5-Seiten
4. Lieferanten: Wie viele Featured-Anfragen kamen rein?
