# Design: Herbst-Update zur Steigerung der Visit Duration

**Projekt:** holzpreisvergleich.de  
**Datum:** 2026-10-09  
**Status:** Vorschlag zur Umsetzung  

## Ausgangslage

Im Herbst steigt das Suchvolumen nach Brennholzpreisen. Umami zeigt mehr Traffic, aber die durchschnittliche Visit Duration liegt nur bei **15 Sekunden**. Das deutet darauf hin, dass Besucher die Relevanz der Seite nicht innerhalb der ersten 5 Sekunden erfassen und keine sofortige Interaktion starten.

## Ziel

Die Visit Duration erhöhen, indem neue Herbst-Besucher sofort verstehen:

1. Das Tool ist aktuell im Herbst relevant.
2. Sie können sofort loslegen, ohne alle Felder selbst auszufüllen.
3. Sie können die Beispieldaten einfach zurücksetzen.

## Gewählter Ansatz

**Minimaler Herbst-Refresh** — kleinstmöglicher Change, der Hero-Copy und Rechner-Initial-State anpasst.

### Nicht gewählte Alternativen

- **Sofort-Ergebnis mit realistischem Angebot:** Stärkerer Aha-Effekt, aber mehr vorgegebene Werte und damit mehr kognitive Reibung.
- **Saisonale Landingpage-Erweiterung:** Mehr Inhalt und visuelle Komplexität; übersteigt den gewünschten Minimal-Ansatz.

## Konkrete Änderungen

### 1. Hero-Copy (saisonal fokussieren)

**Aktuell:**

> Holzpreis Vergleich – Brennholz fair nach €/Festmeter & €/kWh

**Neu:**

> Holzpreis Vergleich – Brennholz im Herbst fair vergleichen

Die Subline bleibt funktional: kostenlos, kein Login, Vergleich nach €/Festmeter und €/kWh.

### 2. Rechner-Initial-State anpassen

Aktuell starten drei leere Angebote. Neu startet der Rechner mit **einem einzigen Angebot**, das mit harmlosen Platzhaltern vorbelegt ist:

| Feld | Wert |
|------|------|
| Menge | `1` |
| Einheit | `rm` (Raummeter) |
| Preis | leer (bestehender Placeholder „250“ bleibt sichtbar) |
| Holzart | `buche` |
| Trockenheit | `ofenfertig` |

Die Buttons „Angebot hinzufügen“ bleiben erhalten, damit Nutzer bei Bedarf weitere Angebote ergänzen können.

### 3. Reset-Link

Neben dem Button „Angebot hinzufügen“ wird ein kleiner Text-Link **„Zurücksetzen“** eingefügt. Ein Klick stellt den Initial-State wieder her (ein Angebot mit den Platzhalter-Werten).

## Betroffene Dateien

- `index.html` — `<title>` und Meta-Description anpassen
- `src/App.jsx` — Hero-Text, Initial-State der Offers, Reset-Funktion
- `src/App.css` — minimale Link-Styling-Anpassung für den Reset-Link (falls nötig)
- `seo/SEO-STRATEGY.md` — optional: Seasonality-Kalender-Status aktualisieren

## Erfolgsmessung

- **Primäre Metrik:** Visit Duration in Umami (Ziel: > 30 Sekunden innerhalb von 2 Wochen nach Deploy).
- **Optionale Metrik:** Klicks auf „Zurücksetzen“ tracken, um zu prüfen, ob Nutzer die Platzhalter aktiv entfernen.

## Nicht im Scope

- Keine neuen Seiten oder Routen.
- Keine Änderungen am Rechenkern (`calc.js`).
- Keine neue Tracking-Instrumentierung außer dem optionalen Reset-Klick.
- Keine vollständigen Demo-Angebote mit realen Preisen.
