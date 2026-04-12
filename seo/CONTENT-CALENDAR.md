# Content-Kalender — holzpreisvergleich.de

## Übersicht

Alle Seiten als **statische HTML in `/public/`** — kein CMS nötig, sofort crawlbar.
Format: Ein solider Artikel = 800–1.500 Wörter + Tabellen + interner Link zum Rechner.

---

## Phase 1 — Mai / Juni 2026

### 🔴 /umrechner/ — Festmeter, Raummeter, Schüttraummeter umrechnen
**Keyword:** „Festmeter Raummeter umrechnen" (~1.800/Monat)
**Intent:** Tool/Rechner — Featured Snippet wahrscheinlich
**Inhalt:**
- Erklärtabelle: 1 fm = 1,4 rm = 2,0 srm
- Eingebetteter Mini-Rechner (einfaches JS-Widget)
- Wann welche Einheit verwendet wird (Händler-Jargon)
- Verweis auf Hauptrechner für vollständigen Preisvergleich

**Schema:** `HowTo` + `FAQPage`
**Aufwand:** 3–4h

---

### 🟡 /holzarten/ — Übersicht Holzarten & Heizwerte
**Keyword:** „Holzarten Heizwert Vergleich" (~900/Monat)
**Intent:** Informational
**Inhalt:**
- Tabelle aller Holzarten (aus der App)
- Hart- vs. Weichholz erklärt
- Empfehlungen nach Ofentyp
- Links zu einzelnen Holzart-Unterseiten

**Schema:** `Table` + `FAQPage`
**Aufwand:** 2–3h

---

## Phase 2 — Juli / August 2026 (vor Hauptsaison!)

### 🔴 /ratgeber/brennholz-preise-2026/ — Was kostet Brennholz 2026?
**Keyword:** „Wie teuer ist Brennholz 2026" (~600/Monat, saisonal x3 im Herbst)
**Intent:** Informational + Commercial
**Inhalt:**
- Aktuelle Preisspannen (rm, fm) nach Holzart und Region
- Vergleich zu 2024/2025 (Preisentwicklung)
- Worauf achten beim Kauf (Trockenheit, Lieferkosten)
- CTA: „Jetzt konkrete Angebote vergleichen →"

**Schema:** `Article` + `FAQPage` + `BreadcrumbList`
**Aufwand:** 4–5h → **jährlich aktualisieren**

---

### 🟡 /lieferanten/bayern/ — Brennholz Lieferanten Bayern
**Keyword:** „Brennholz kaufen Bayern" (~800/Monat)
**Intent:** Commercial / Local
**Inhalt:**
- Gefilterte Lieferanten-Liste (Bayern aus Airtable)
- Regionale Besonderheiten (Chiemgau-Holz, Bayerischer Wald)
- Tipps für Kauf in Bayern (Forstbetriebe, Direktkauf)

**Schema:** `LocalBusiness` pro Lieferant + `ItemList`
**Aufwand:** 2–3h → Template für weitere Bundesländer

---

### 🟡 /ratgeber/holz-richtig-lagern/ — Brennholz richtig lagern & trocknen
**Keyword:** „Brennholz lagern" (~1.200/Monat) — Evergreen
**Intent:** Informational
**Inhalt:**
- 2–3 Jahre Trocknungszeit erklärt
- Bauanleitung Holzstapel (überdacht, belüftet)
- Holzfeuchte messen (→ Affiliate-Link Messgerät)
- Wann ist Holz ofenfertig?

**Schema:** `HowTo` + `FAQPage`
**Aufwand:** 3–4h

---

## Phase 3 — September / Oktober 2026

### 🟢 /holzarten/buche/ — Buche Brennholz: Heizwert, Eigenschaften, Preis
**Keyword:** „Buche Brennholz" (~1.400/Monat)
**Intent:** Informational + Commercial
**Inhalt:** Detailseite Buche — Heizwert, Brenndauer, Eignung, typische Preise

### 🟢 /ratgeber/co2-holzheizung/ — CO₂ beim Holzheizen: Was steckt dahinter?
**Keyword:** „Holzheizung CO2 neutral" (~300/Monat)
**Intent:** Informational
**Inhalt:** Vertiefung des Emissionen-Tabs als eigenständiger Artikel

### 🟢 /lieferanten/bw/ + /lieferanten/nrw/
Weitere Regional-Seiten nach dem Bayern-Template.

---

## Evergreen-Content (kein festes Datum)

| Seite | Keyword | Volumen |
|-------|---------|---------|
| /ratgeber/holzfeuchte-messen/ | Holzfeuchte messen | ~600 |
| /holzarten/eiche/ | Eiche Brennholz | ~800 |
| /holzarten/birke/ | Birke Brennholz | ~700 |
| /ratgeber/kaminofen-einheizen/ | Kaminofen richtig einheizen | ~900 |

---

## Content-Format (Template)

Jede statische HTML-Seite:
```html
<!-- Gleiches CSS wie die App (via CDN oder kopiert) -->
<!-- Header mit Navigation zurück zum Rechner -->
<!-- H1 = Haupt-Keyword -->
<!-- Strukturierter Text mit H2/H3 -->
<!-- Interne Links: Rechner + verwandte Seiten -->
<!-- Schema.org JSON-LD im <head> -->
<!-- Footer = gleich wie App -->
```
