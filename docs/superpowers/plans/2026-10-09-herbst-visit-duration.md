# Herbst-Update zur Steigerung der Visit Duration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a minimal autumn refresh that updates the landing page copy and pre-fills the calculator with a single placeholder offer plus a reset option.

**Architecture:** Small, focused changes to three existing files: `index.html` for SEO/meta copy, `src/App.jsx` for hero text and calculator state, and `src/App.css` for the reset-link styling. No new routes, no backend, no dependencies.

**Tech Stack:** React 19, Vite 8, Vitest, plain CSS.

## Global Constraints

- Light mode only; reuse existing color tokens.
- German copy, sachlich-neutraler Ton.
- Keep the diff minimal — no new dependencies, no new routes, no backend changes.
- Preserve existing accessibility: `aria-label`, focus states, semantic HTML.
- Follow existing code style in `src/App.jsx` and `src/App.css`.
- Existing tests must still pass: `npm run test`.
- Build must succeed: `npm run build`.

## File Structure

| File | Responsibility |
|------|----------------|
| `index.html` | `<title>` and meta description for autumn SEO. |
| `src/App.jsx` | Hero copy, `mkInitialOffer` helper, initial state, `resetOffers` action, reset button. |
| `src/App.css` | `.btn-text` reset-link styling. |

---

## Task 1: Update `index.html` title and meta description

**Files:**
- Modify: `index.html:10` (title)
- Modify: `index.html:11-12` (meta description)

**Interfaces:**
- Consumes: nothing
- Produces: updated `<title>` and `<meta name="description">`

- [ ] **Step 1: Change the `<title>`**

  Replace line 10:

  ```html
  <title>Holzpreis Vergleich – Brennholz fair nach €/Festmeter & €/kWh</title>
  ```

  with:

  ```html
  <title>Holzpreis Vergleich – Brennholz im Herbst fair vergleichen</title>
  ```

- [ ] **Step 2: Change the meta description**

  Replace lines 11-12:

  ```html
  <meta name="description"
    content="Brennholz-Angebote kostenlos vergleichen: normalisiert auf €/Festmeter und €/kWh, inkl. Lieferkosten, Holzart und Trockenheitsgrad. Kein Login, kein Tracking." />
  ```

  with:

  ```html
  <meta name="description"
    content="Brennholz-Angebote im Herbst kostenlos vergleichen: normalisiert auf €/Festmeter und €/kWh, inkl. Lieferkosten, Holzart und Trockenheitsgrad. Kein Login, kein Tracking." />
  ```

- [ ] **Step 3: Verify**

  Open `index.html` and confirm the title and description contain "Herbst".

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: Herbst-Keywords in Titel und Meta-Description"
  ```

---

## Task 2: Update Hero copy in `src/App.jsx`

**Files:**
- Modify: `src/App.jsx:471` (`<h1>`)
- Modify: `src/App.jsx:472-475` (`<p className="hero-sub">`)

**Interfaces:**
- Consumes: nothing
- Produces: updated hero text rendered above the tabs

- [ ] **Step 1: Update the headline**

  Replace line 471:

  ```jsx
  <h1 className="hero-h1">Drei Angebote, drei Einheiten, ein fairer Vergleich</h1>
  ```

  with:

  ```jsx
  <h1 className="hero-h1">Brennholz im Herbst fair vergleichen</h1>
  ```

- [ ] **Step 2: Update the subline**

  Replace lines 472-475:

  ```jsx
  <p className="hero-sub">
    Sie müssen kein Förster sein. Preis, Menge und Holzart eintragen — wir zeigen den
    echten Preis pro Festmeter.
  </p>
  ```

  with:

  ```jsx
  <p className="hero-sub">
    Vor dem Winter noch schnell Angebote checken: Preis, Menge und Holzart eintragen —
    wir zeigen den echten Preis pro Festmeter und pro Kilowattstunde.
  </p>
  ```

- [ ] **Step 3: Verify**

  Run:

  ```bash
  npm run dev
  ```

  Open http://localhost:5173 and confirm the hero shows:

  - Headline: "Brennholz im Herbst fair vergleichen"
  - Subline mentions "Vor dem Winter" and "Kilowattstunde"

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.jsx
  git commit -m "feat: Hero-Copy auf Herbst fokussieren"
  ```

---

## Task 3: Pre-fill calculator with one placeholder offer and add reset

**Files:**
- Modify: `src/App.jsx:181` area (add `mkInitialOffer` after `mkOffer`)
- Modify: `src/App.jsx:358` (change `useState` initial offers)
- Modify: `src/App.jsx:416-439` area (add `resetOffers` after `addOffer`)
- Modify: `src/App.jsx:617-636` (add reset button in action row)
- Modify: `src/App.css:526` area (add `.btn-text` after `.btn-print`)

**Interfaces:**
- Consumes: `mkId`, existing `mkPos` shape
- Produces: `mkInitialOffer` factory, `resetOffers` callback, `.btn-text` CSS class

- [ ] **Step 1: Add `mkInitialOffer` factory**

  After `mkOffer` at `src/App.jsx:181`, add:

  ```jsx
  const mkInitialOffer = () => ({
    id: mkId(),
    label: "",
    lieferkosten: "",
    positionen: [{ id: mkId(), menge: "1", einheit: "rm", preis: "", holzart: "buche", feuchte: "ofenfertig" }],
  });
  ```

- [ ] **Step 2: Change initial state to one pre-filled offer**

  Replace line 358:

  ```jsx
  const [offers, setOffers] = useState(() => [mkOffer(), mkOffer(), mkOffer()]);
  ```

  with:

  ```jsx
  const [offers, setOffers] = useState(() => [mkInitialOffer()]);
  ```

- [ ] **Step 3: Add `resetOffers` callback**

  After `addOffer` at `src/App.jsx:416`, add:

  ```jsx
  const resetOffers = () => setOffers([mkInitialOffer()]);
  ```

  The block should now look like:

  ```jsx
  // Offer-Operationen
  const addOffer = () => { if (offers.length < 5) setOffers(prev => [...prev, mkOffer()]); };
  const resetOffers = () => setOffers([mkInitialOffer()]);
  const delOffer = (id) => { if (offers.length > 1) setOffers(prev => prev.filter(o => o.id !== id)); };
  ```

- [ ] **Step 4: Add reset button in action row**

  In `src/App.jsx:617-636`, inside `.action-row`, add a reset button next to the "Angebot hinzufügen" button:

  ```jsx
  {/* Aktionszeile */}
  <div className="action-row">
    {offers.length < 5 && (
      <button className="btn-ghost" onClick={addOffer} aria-label="Weiteres Angebot hinzufügen">
        <span aria-hidden="true">+</span> Angebot hinzufügen
      </button>
    )}
    <button
      className="btn-text"
      onClick={resetOffers}
      aria-label="Angebote zurücksetzen"
      type="button"
    >
      Zurücksetzen
    </button>
    <button
      className="note-toggle"
      onClick={() => setShowConv(!showConv)}
      aria-expanded={showConv}
      aria-controls="conv-panel"
    >
      <span aria-hidden="true">{showConv ? "▾" : "▸"}</span> Umrechnungsfaktoren anpassen
    </button>
    {sorted.length > 0 && (
      <button className="btn-ghost btn-print" onClick={() => window.print()} aria-label="Vergleich drucken oder als PDF speichern">
        <span aria-hidden="true">⎙</span> Drucken / PDF
      </button>
    )}
  </div>
  ```

- [ ] **Step 5: Style the reset link**

  In `src/App.css`, after `.btn-print { margin-left: auto; }` at line 526, add:

  ```css
  .btn-text {
    font-size: 12px;
    color: var(--ink3);
    cursor: pointer;
    background: none;
    border: none;
    font-family: var(--sans);
    padding: var(--sp-3) 0;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .btn-text:hover { color: var(--pine); }
  ```

- [ ] **Step 6: Run tests**

  ```bash
  npm run test
  ```

  Expected: all existing tests pass.

- [ ] **Step 7: Verify in browser**

  ```bash
  npm run dev
  ```

  Open http://localhost:5173 and confirm:

  1. The calculator starts with **exactly one** offer card.
  2. The offer has:
     - Menge: `1`
     - Einheit: `Raummeter (rm)`
     - Preis: empty (placeholder "250" visible)
     - Holzart: `Buche`
     - Trockenheit: `ofenfertig`
  3. A "Zurücksetzen" button is visible in the action row.
  4. After typing a price and adding a second offer, clicking "Zurücksetzen" returns to the single pre-filled offer.

- [ ] **Step 8: Commit**

  ```bash
  git add src/App.jsx src/App.css
  git commit -m "feat: Rechner startet mit einem vorausgefüllten Angebot + Reset"
  ```

---

## Task 4: Final build verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run lint**

  ```bash
  npm run lint
  ```

  Expected: no errors.

- [ ] **Step 2: Run production build**

  ```bash
  npm run build
  ```

  Expected: `dist/` is created without errors.

- [ ] **Step 3: Run preview (optional)**

  ```bash
  npm run preview
  ```

  Open http://localhost:4173 and do a final visual check.

- [ ] **Step 4: Commit (if any fixes were needed)**

  Only if lint or build required changes:

  ```bash
  git add -A
  git commit -m "fix: Lint/Build-Fehler nach Herbst-Update bereinigt"
  ```

---

## Self-Review Checklist

- [ ] Spec coverage: Hero copy, single pre-filled offer, reset link — all covered.
- [ ] No placeholders: every step has exact code or exact command.
- [ ] Type consistency: `mkInitialOffer` returns the same shape as `mkOffer`, only with pre-filled position fields.
- [ ] File paths: all paths are relative to repo root and verified.
