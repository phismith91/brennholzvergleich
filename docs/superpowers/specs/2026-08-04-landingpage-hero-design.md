# Landingpage-Hero — Design

## Problem

`holzpreisvergleich.de/` landet direkt auf dem Rechner-Tab. Kein Kontext, keine Einordnung, wofür das Tool da ist — Erstbesucher:innen sehen sofort ein Formular ohne Erklärung.

## Personas (Brainstorming-Ergebnis)

- **Sabine, 52** — hat 3 Angebote in unterschiedlichen Einheiten, will nicht übers Ohr gehauen werden. **Priorisiert für die Headline.**
- **Markus, 38** — erste eigene Heizsaison, kein Vorwissen, will einfach die Zahl sehen.
- **Renate, 61** — skeptisch gegenüber "kostenlosen" Tools, sucht den Haken (Tracking/Login).

Headline bedient Sabine, Trust-Zeile bedient Renate, "keine Vorkenntnisse nötig" bedient Markus.

## Architektur

Kein neuer Router, keine neue URL. Statische GitHub-Pages-SPA — jede Sub-Route (`/umrechner/`, `/holzarten/`, `/ratgeber/`) ist bereits eine eigene statische Seite; der Rechner selbst ist eine einzelne React-SPA unter `/`. Eine Hero-Sektion dort einzuführen heißt: neue Markup-Sektion oberhalb der Tabs in `src/App.jsx`, kein Routing-Umbau, bestehende SEO/Schema-Arbeit auf `/` bleibt unberührt.

```
Header (sticky, unverändert)
Hero (neu)
Tabs (sticky, unverändert)
... bestehender Inhalt
```

Der aktuell nur für Screenreader sichtbare `<h1 className="sr-only">` im Header entfällt — die Hero-Headline wird der echte, sichtbare `h1` der Seite. Sauberer als zwei konkurrierende H1-Quellen (eine sichtbar, eine versteckt).

## Inhalt

- **Headline:** "Drei Angebote, drei Einheiten, ein fairer Vergleich"
- **Subline:** "Sie müssen kein Förster sein. Preis, Menge und Holzart eintragen — wir zeigen den echten Preis pro Festmeter und Kilowattstunde."
- **CTA:** "Jetzt vergleichen ↓" — Anchor-Scroll zu den Tabs (`href="#tabs"` + `id="tabs"` auf der bestehenden `<nav className="tabs">`). Nutzt das bereits global gesetzte `html { scroll-behavior: smooth }` aus App.css — keine neue JS-Logik nötig.
- **Trust-Zeile:** "✓ Kostenlos · ✓ Kein Login · ✓ Kein Tracking"
- **Mini-Demo** (rechte Spalte, Desktop; unter dem Text auf Mobile): drei Beispiel-Angebote, die zeigen, dass der teuerste Rohpreis nach Normalisierung der günstigste Kauf ist. Zahlen mit `src/calc.js` echt nachgerechnet (kein erfundenes Beispiel):
  - 420 € · 3 Raummeter Buche → **196 €/fm**
  - 185 € · 1 Festmeter Eiche → **185 €/fm**
  - 270 € · 6 Schüttraummeter Fichte → **90 €/fm**
  - Payoff-Zeile: "der teuerste Zettel war der günstigste Kauf"

## Komponenten & Styling

Neue Klassen in `src/App.css`, im bestehenden Token-System (`--pine`, `--larch`, `--paper`, Spacing-Scale `--sp-*`):

- `.hero`, `.hero-inner` — Grid, 1.2fr/1fr Split auf Desktop, gestackt (ein Column) unter 720px, analog zu bestehenden Breakpoint-Patterns (`@media (max-width: 520px)` bzw. neuer Breakpoint falls nötig, an bestehenden orientiert)
- `.hero-h1`, `.hero-sub`, `.hero-cta`, `.hero-trust` — folgen bestehender Typografie (`--cond` für Headline, `--sans` für Fließtext)
- `.hero-demo`, `.hero-demo-row`, `.hero-demo-result`, `.hero-demo-payoff` — Mono-Font (`--mono`) für Zahlen, analog zu `.mono`-Nutzung im Rest der App

Kein neues Farbschema, keine neuen Assets, keine Bilder (Anti-Referenz aus `.impeccable.md`: keine Lifestyle-/Kaminatmosphäre-Bilder).

## Accessibility

- Ein `h1` (die Hero-Headline), kein Duplikat.
- CTA ist ein echter `<a href="#tabs">`, keyboard-erreichbar, kein `onClick`-only Button.
- Demo-Block ist rein illustrativ — `aria-hidden="true"` auf den Zahlenreihen wäre falsch (enthält sinnvolle Information), stattdessen normaler Text mit `aria-label` auf dem Container, der das Payoff zusammenfasst (analog zum bereits genutzten Pattern bei den Emissionen-Balken).

## Testing

Reines Markup/Styling, keine neue Berechnungslogik — kein neuer Vitest-Test nötig. Die drei Demo-Zahlen wurden manuell gegen `berechneErgebnisse()` aus `src/calc.js` verifiziert (siehe Brainstorming-Verlauf), nicht frei erfunden.

## Out of Scope

- Kein A/B-Testing-Setup
- Keine Änderung an `index.html`-Meta/Schema (Titel/Description bleiben wie nach dem SEO-Audit-Fix)
- Keine Landingpages für die Sub-Routen (`/umrechner/` etc.) — nur `/`
