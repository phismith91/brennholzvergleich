import { useState, useMemo, useRef } from "react";
import './App.css';

// ─── Daten ────────────────────────────────────────────────────────────────────

const HOLZARTEN = [
  { id: "buche",     name: "Buche",      typ: "Hartholz",  heizwert: 2100, brenndauer: "Lang",        funkenflug: "Gering",    geruch: "Neutral",        eignung: "Universell – ideal für Kaminofen & Kachelofen" },
  { id: "eiche",     name: "Eiche",      typ: "Hartholz",  heizwert: 2100, brenndauer: "Sehr lang",   funkenflug: "Mittel",    geruch: "Leicht würzig",  eignung: "Kaminofen, Kachelofen – sehr langsam brennend" },
  { id: "esche",     name: "Esche",      typ: "Hartholz",  heizwert: 2000, brenndauer: "Lang",        funkenflug: "Gering",    geruch: "Neutral",        eignung: "Universell, auch leicht feucht verwendbar" },
  { id: "hainbuche", name: "Hainbuche",  typ: "Hartholz",  heizwert: 2300, brenndauer: "Sehr lang",   funkenflug: "Gering",    geruch: "Neutral",        eignung: "Höchster Heizwert – ideal für Dauerbetrieb" },
  { id: "birke",     name: "Birke",      typ: "Hartholz",  heizwert: 1900, brenndauer: "Mittel",      funkenflug: "Gering",    geruch: "Leicht süßlich", eignung: "Universell, schnell anzünden" },
  { id: "erle",      name: "Erle",       typ: "Hartholz",  heizwert: 1600, brenndauer: "Mittel",      funkenflug: "Gering",    geruch: "Angenehm",       eignung: "Räuchern, Kaminofen" },
  { id: "fichte",    name: "Fichte",     typ: "Weichholz", heizwert: 1500, brenndauer: "Kurz",        funkenflug: "Hoch",      geruch: "Harzig",         eignung: "Anheizen – nicht für offene Kamine" },
  { id: "kiefer",    name: "Kiefer",     typ: "Weichholz", heizwert: 1700, brenndauer: "Kurz–Mittel", funkenflug: "Hoch",      geruch: "Harzig",         eignung: "Anheizen, geschlossene Öfen" },
  { id: "laerche",   name: "Lärche",     typ: "Weichholz", heizwert: 1900, brenndauer: "Mittel",      funkenflug: "Mittel",    geruch: "Harzig",         eignung: "Kaminofen (nur geschlossen)" },
  { id: "tanne",     name: "Tanne",      typ: "Weichholz", heizwert: 1400, brenndauer: "Kurz",        funkenflug: "Sehr hoch", geruch: "Harzig",         eignung: "Nur zum Anheizen" },
];

const HOLZARTEN_SORTED = [...HOLZARTEN].sort((a, b) => b.heizwert - a.heizwert);

const FEUCHTE = {
  ofenfertig:  { label: "Ofenfertig (≤ 20 %)",  faktor: 1.00 },
  trocken:     { label: "Trocken (≤ 25 %)",      faktor: 0.88 },
  halbtrocken: { label: "Halbtrocken (25–35 %)", faktor: 0.72 },
  frisch:      { label: "Frisch (> 35 %)",       faktor: 0.60 },
};

const TAB_IDS = ["rechner", "holzarten"];
const TABS = [
  { id: "rechner",   icon: "⊞", label: "Angebote vergleichen" },
  { id: "holzarten", icon: "🌲", label: "Holzarten & Heizwerte" },
];

function handleTabKeyDown(e, currentId, setTab) {
  const idx = TAB_IDS.indexOf(currentId);
  if (e.key === "ArrowRight") {
    e.preventDefault();
    const next = TAB_IDS[(idx + 1) % TAB_IDS.length];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    const prev = TAB_IDS[(idx - 1 + TAB_IDS.length) % TAB_IDS.length];
    setTab(prev);
    document.getElementById(`tab-${prev}`)?.focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    setTab(TAB_IDS[0]);
    document.getElementById(`tab-${TAB_IDS[0]}`)?.focus();
  } else if (e.key === "End") {
    e.preventDefault();
    const last = TAB_IDS[TAB_IDS.length - 1];
    setTab(last);
    document.getElementById(`tab-${last}`)?.focus();
  }
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

const fmt  = (n, d = 2) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtE = (n)        => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// Datenmodell: Ein Angebot = ein Anbieter/eine Lieferung
// Jede Position hat eigene Menge, Einheit, Preis, Holzart, Trockenheit
// Lieferkosten gelten einmal für die gesamte Lieferung

let _posId = 100;
const mkPos = () => ({ id: _posId++, menge: "", einheit: "rm", preis: "", holzart: "", feuchte: "ofenfertig" });

let _offerId = 1;
const mkOffer = () => ({ id: _offerId++, label: "", lieferkosten: "", positionen: [mkPos()] });

// ─── HolzartSelect ────────────────────────────────────────────────────────────

function HolzartSelect({ id, value, onChange, label, optional = false }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} {optional && <span className="opt">(optional)</span>}
      </label>
      <select id={id} className="input" value={value} onChange={onChange}>
        <option value="">– nicht angegeben –</option>
        <optgroup label="Hartholz">
          {HOLZARTEN.filter(h => h.typ === "Hartholz").map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </optgroup>
        <optgroup label="Weichholz">
          {HOLZARTEN.filter(h => h.typ === "Weichholz").map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </optgroup>
      </select>
    </div>
  );
}

// ─── PositionBlock ────────────────────────────────────────────────────────────

function PositionBlock({ pos, posIdx, offerId, canRemove, onUpdate, onRemove }) {
  const feuchte = FEUCHTE[pos.feuchte];
  return (
    <div className="pos-block">
      <div className="pos-header">
        <span className="pos-label">Position {posIdx + 1}</span>
        {canRemove && (
          <button
            className="btn-del"
            onClick={() => onRemove(pos.id)}
            aria-label={`Position ${posIdx + 1} entfernen`}
          >×</button>
        )}
      </div>

      {/* Menge + Einheit */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label className="label" htmlFor={`menge-${offerId}-${pos.id}`}>Menge</label>
          <input
            id={`menge-${offerId}-${pos.id}`}
            className="input mono"
            type="number" inputMode="decimal" min="0.01" step="0.01"
            placeholder="z.B. 3"
            value={pos.menge}
            onChange={e => onUpdate(pos.id, "menge", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`einheit-${offerId}-${pos.id}`}>Einheit</label>
          <select
            id={`einheit-${offerId}-${pos.id}`}
            className="input"
            value={pos.einheit}
            onChange={e => onUpdate(pos.id, "einheit", e.target.value)}
          >
            <option value="rm">Raummeter (rm)</option>
            <option value="fm">Festmeter (fm)</option>
            <option value="srm">Schüttraummeter (srm)</option>
          </select>
        </div>
      </div>

      {/* Preis */}
      <div style={{ marginBottom: 10 }}>
        <label className="label" htmlFor={`preis-${offerId}-${pos.id}`}>Preis (€)</label>
        <input
          id={`preis-${offerId}-${pos.id}`}
          className="input mono"
          type="number" inputMode="decimal" min="0" step="0.01"
          placeholder="250"
          value={pos.preis}
          onChange={e => onUpdate(pos.id, "preis", e.target.value)}
        />
      </div>

      {/* Holzart + Trockenheit */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <HolzartSelect
          id={`holz-${offerId}-${pos.id}`}
          label="Holzart"
          optional
          value={pos.holzart}
          onChange={e => onUpdate(pos.id, "holzart", e.target.value)}
        />

        <div>
          <label className="label" htmlFor={`feuchte-${offerId}-${pos.id}`}>
            Trockenheit <span className="opt">– beeinflusst kWh</span>
          </label>
          <select
            id={`feuchte-${offerId}-${pos.id}`}
            className="input"
            value={pos.feuchte}
            onChange={e => onUpdate(pos.id, "feuchte", e.target.value)}
          >
            {Object.entries(FEUCHTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className={`field-hint${pos.feuchte !== "ofenfertig" ? " field-hint--warn" : ""}`}>
            Korrekturfaktor ×{feuchte.faktor.toFixed(2)}
            {pos.feuchte !== "ofenfertig"
              ? ` → ${Math.round((1 - feuchte.faktor) * 100)} % weniger Heizenergie`
              : " – voller Heizwert (Referenz)"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function App() {
  const [offers,   setOffers]   = useState(() => [mkOffer(), mkOffer(), mkOffer()]);
  const [tab,      setTab]      = useState("rechner");
  const [showConv, setShowConv] = useState(false);
  const [conv,     setConv]     = useState({ rm: "1.4", srm: "2.0" });

  // Offer-Operationen
  const addOffer = () => { if (offers.length < 5) setOffers(prev => [...prev, mkOffer()]); };
  const delOffer = (id) => { if (offers.length > 1) setOffers(prev => prev.filter(o => o.id !== id)); };
  const updOfferField = (offerId, field, value) =>
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, [field]: value } : o));

  // Positions-Operationen
  const addPos = (offerId) =>
    setOffers(prev => prev.map(o =>
      o.id === offerId && o.positionen.length < 2
        ? { ...o, positionen: [...o.positionen, mkPos()] }
        : o
    ));
  const delPos = (offerId, posId) =>
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, positionen: o.positionen.filter(p => p.id !== posId) }
        : o
    ));
  const updPos = (offerId, posId, field, value) =>
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, positionen: o.positionen.map(p => p.id === posId ? { ...p, [field]: value } : p) }
        : o
    ));

  const results = useMemo(() => {
    const fmFaktor = { fm: 1.0, rm: 1 / parseFloat(conv.rm || 1.4), srm: 1 / parseFloat(conv.srm || 2.0) };

    return offers.map(o => {
      const lief = parseFloat(o.lieferkosten) || 0;

      // Jede Position einzeln auswerten
      const posCalc = o.positionen.map(p => {
        const menge = parseFloat(p.menge);
        const preis = parseFloat(p.preis);
        if (!menge || !preis || menge <= 0 || preis < 0) return null;
        const fm       = menge * fmFaktor[p.einheit];
        const holz     = HOLZARTEN.find(h => h.id === p.holzart) ?? null;
        const feuchFak = FEUCHTE[p.feuchte]?.faktor ?? 1;
        const kwh      = holz ? holz.heizwert * fm * feuchFak : null;
        return { ...p, fm, preis, holz, feuchFak, kwh };
      });

      // Mindestens eine Position muss valide sein
      const validPos = posCalc.filter(Boolean);
      if (validPos.length === 0) return { ...o, ok: false };

      const totalFm    = validPos.reduce((s, p) => s + p.fm, 0);
      const totalPreis = validPos.reduce((s, p) => s + p.preis, 0) + lief;
      const totalKwh   = validPos.every(p => p.kwh !== null)
        ? validPos.reduce((s, p) => s + p.kwh, 0)
        : null;

      const perFm  = totalPreis / totalFm;
      const perKwh = totalKwh ? totalPreis / totalKwh : null;

      // Funkenflug-Check aller Holzarten
      const alleHolze = validPos.map(p => p.holz).filter(Boolean);
      const funkWarn  = alleHolze.filter(h => h.funkenflug === "Hoch" || h.funkenflug === "Sehr hoch");

      return { ...o, ok: true, posCalc: validPos, totalFm, totalPreis, lief, perFm, perKwh, totalKwh, alleHolze, funkWarn };
    });
  }, [offers, conv]);

  const valid     = results.filter(r => r.ok);
  const minPerFm  = valid.length ? Math.min(...valid.map(r => r.perFm)) : null;
  const minPerKwh = valid.filter(r => r.perKwh).length ? Math.min(...valid.filter(r => r.perKwh).map(r => r.perKwh)) : null;
  const maxPerFm  = valid.length ? Math.max(...valid.map(r => r.perFm)) : null;
  const sorted    = [...valid].sort((a, b) => a.perFm - b.perFm);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header" role="banner">
        <div className="inner header-inner">
          <div className="logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C9 5.5 7 8 7 11a5 5 0 0010 0c0-3-2-5.5-5-9z" fill="white" fillOpacity=".9"/>
              <path d="M12 10c-1 2-2 3-2 4.5a2 2 0 004 0C14 13 13 12 12 10z" fill="white" fillOpacity=".5"/>
            </svg>
          </div>
          <div>
            <div className="logo-text" aria-hidden="true">Brennholz<span>Vergleich</span></div>
            <div className="logo-sub">Angebote normalisiert vergleichen</div>
            <h1 className="sr-only">BrennholzVergleich – Kaminholz-Angebote fair vergleichen</h1>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="tabs" aria-label="Hauptnavigation">
        <div className="tabs-inner" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              className={`tab ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
              onKeyDown={e => handleTabKeyDown(e, t.id, setTab)}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              role="tab"
              tabIndex={tab === t.id ? 0 : -1}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="inner main-content">

        {/* ══════════ TAB: RECHNER ══════════ */}
        <div id="panel-rechner" role="tabpanel" aria-labelledby="tab-rechner" hidden={tab !== "rechner"}>

          <div className="callout" role="note" style={{ marginBottom: 20 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>💡</span>
            <span>
              Alle Angebote werden auf <strong>€&thinsp;/&thinsp;Festmeter</strong> normalisiert – inklusive Lieferkosten.
              Jedes Angebot kann bis zu zwei Holzarten (Positionen) mit eigener Menge, Preis und Trockenheit enthalten.
              Mit Holzart-Angabe erscheint auch der Vergleich nach <strong>€&thinsp;/&thinsp;kWh</strong>.
            </span>
          </div>

          {/* Angebotskarten */}
          <div className="offers-grid" role="list">
            {offers.map((offer, idx) => {
              const res = results.find(r => r.id === offer.id);
              const isMixed = offer.positionen.length > 1;
              return (
                <article key={offer.id} className="card" role="listitem" aria-label={`Angebot ${idx + 1}`} style={{ padding: 18 }}>

                  {/* Kopfzeile */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                    <div className="card-num" aria-hidden="true">{idx + 1}</div>
                    {isMixed && <span className="badge b-mix" aria-label="Mischlieferung">2 Holzarten</span>}
                    {offers.length > 1 && (
                      <button
                        className="btn-del"
                        onClick={() => delOffer(offer.id)}
                        aria-label={`Angebot ${idx + 1} entfernen`}
                        style={{ marginLeft: "auto" }}
                      >×</button>
                    )}
                  </div>

                  {/* Bezeichnung */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="label" htmlFor={`label-${offer.id}`}>Bezeichnung <span className="opt">(optional)</span></label>
                    <input
                      id={`label-${offer.id}`}
                      className="input"
                      placeholder="z.B. Nachbar, Holzhandel Schwarz …"
                      value={offer.label}
                      onChange={e => updOfferField(offer.id, "label", e.target.value)}
                      maxLength={40}
                    />
                  </div>

                  {/* Positionen */}
                  {offer.positionen.map((pos, posIdx) => (
                    <PositionBlock
                      key={pos.id}
                      pos={pos}
                      posIdx={posIdx}
                      offerId={offer.id}
                      canRemove={offer.positionen.length > 1}
                      onUpdate={(posId, field, value) => updPos(offer.id, posId, field, value)}
                      onRemove={(posId) => delPos(offer.id, posId)}
                    />
                  ))}

                  {/* Lieferkosten + 2. Holzart Button */}
                  <div style={{ display: "grid", gridTemplateColumns: offer.positionen.length < 2 ? "1fr auto" : "1fr", gap: 10, alignItems: "end", marginTop: 12 }}>
                    <div>
                      <label className="label" htmlFor={`lief-${offer.id}`}>
                        Lieferkosten (€) <span className="opt">für gesamte Lieferung</span>
                      </label>
                      <input
                        id={`lief-${offer.id}`}
                        className="input mono"
                        type="number" inputMode="decimal" min="0" step="0.01"
                        placeholder="0 = kostenlos"
                        value={offer.lieferkosten}
                        onChange={e => updOfferField(offer.id, "lieferkosten", e.target.value)}
                      />
                    </div>
                    {offer.positionen.length < 2 && (
                      <button
                        className="btn-ghost btn-add-pos"
                        onClick={() => addPos(offer.id)}
                        aria-label="Zweite Holzart hinzufügen (Mischlieferung)"
                        title="Zweite Holzart hinzufügen"
                      >
                        + 2. Holzart
                      </button>
                    )}
                  </div>

                  {/* Mini-Ergebnis */}
                  {res?.ok && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                        {fmt(res.totalFm, 2)} fm · {fmtE(res.totalPreis)}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: res.perFm === minPerFm ? "var(--larch)" : "var(--ink)" }}>
                        {fmtE(res.perFm)}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink3)" }}>/fm</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Aktionszeile */}
          <div className="action-row">
            {offers.length < 5 && (
              <button className="btn-ghost" onClick={addOffer} aria-label="Weiteres Angebot hinzufügen">
                <span aria-hidden="true">+</span> Angebot hinzufügen
              </button>
            )}
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

          {/* Aufklappbar: Umrechnungsfaktoren */}
          {showConv && (
            <div id="conv-panel" className="card" style={{ padding: 16, marginTop: -12, marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 12 }}>
                Standardwerte: 1 fm = 1,4 rm = 2,0 srm. Bei stark gebogenen oder unregelmäßigen Scheiten können die Werte abweichen.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <label className="label" htmlFor="conv-rm">1 fm = ___ rm</label>
                  <input id="conv-rm" className="input mono" type="number" inputMode="decimal" step="0.01" min="1" max="2" value={conv.rm} onChange={e => setConv(c => ({ ...c, rm: e.target.value }))} style={{ width: 100 }} />
                </div>
                <div>
                  <label className="label" htmlFor="conv-srm">1 fm = ___ srm</label>
                  <input id="conv-srm" className="input mono" type="number" inputMode="decimal" step="0.01" min="1" max="3" value={conv.srm} onChange={e => setConv(c => ({ ...c, srm: e.target.value }))} style={{ width: 100 }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Ergebnistabelle ── */}
          {sorted.length > 0 && (
            <section aria-label="Vergleichsergebnisse">
              <h2 className="sec-title">Vergleich</h2>
              <div className="result-table-wrap">
                <div className="result-scroll">
                  <table className="result-table" aria-label="Angebote sortiert nach Preis pro Festmeter">
                    <thead>
                      <tr className="result-thead-row">
                        <th scope="col">Angebot</th>
                        <th scope="col">Festmeter</th>
                        <th scope="col">Gesamtpreis</th>
                        <th scope="col">€ / fm</th>
                        <th scope="col">€ / kWh</th>
                        <th scope="col">Aufschlag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((r, i) => {
                        const isBestFm  = r.perFm === minPerFm;
                        const isBestKwh = r.perKwh !== null && r.perKwh === minPerKwh;
                        const offerIdx  = offers.findIndex(o => o.id === r.id) + 1;
                        const name      = r.label || `Angebot ${offerIdx}`;
                        const aufschlag = !isBestFm && minPerFm ? ((r.perFm - minPerFm) / minPerFm * 100) : 0;
                        const barWidth  = maxPerFm && minPerFm ? ((r.perFm - minPerFm) / (maxPerFm - minPerFm || 1)) * 100 : 0;
                        const medals    = ["🥇", "🥈", "🥉"];

                        return (
                          <tr key={r.id} className={`result-tr${isBestFm ? " best" : ""}`}>
                            <td className="result-td">
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span aria-hidden="true" style={{ fontSize: 16 }}>{medals[i] ?? ""}</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>
                                {r.posCalc.length > 1 && (
                                  <span className="badge b-mix">gemischt</span>
                                )}
                                {isBestFm && <span className="badge b-green" aria-label="Günstigstes Angebot">✓ Günstigste</span>}
                                {r.funkWarn.length > 0 && (
                                  <span className="badge b-warn" aria-label={`Achtung: ${r.funkWarn.map(h => h.name).join(', ')} – hoher Funkenflug`}>
                                    <span aria-hidden="true">⚠</span> Funkenflug
                                  </span>
                                )}
                              </div>
                              {/* Holzarten-Detail */}
                              <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4, lineHeight: 1.6 }}>
                                {r.posCalc.map((p, pi) => (
                                  <div key={p.id}>
                                    {p.holz ? p.holz.name : "–"}
                                    {' · '}{fmt(p.fm, 2)} fm
                                    {' · '}{FEUCHTE[p.feuchte]?.label ?? ""}
                                    {p.kwh && <> · {Math.round(p.kwh).toLocaleString("de-DE")} kWh</>}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="result-td mono" style={{ textAlign: "right", color: "var(--ink2)" }}>
                              {fmt(r.totalFm)} fm
                            </td>
                            <td className="result-td mono" style={{ textAlign: "right", fontWeight: 500 }}>
                              {fmtE(r.totalPreis)}
                              {r.lief > 0 && (
                                <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                                  inkl. {fmtE(r.lief)} Lieferung
                                </div>
                              )}
                            </td>
                            <td className="result-td mono" style={{ textAlign: "right" }}>
                              <span style={{ fontWeight: 800, fontSize: 16, color: isBestFm ? "var(--larch)" : "var(--ink)" }}>
                                {fmtE(r.perFm)}
                              </span>
                            </td>
                            <td className="result-td mono" style={{ textAlign: "right", color: r.perKwh ? (isBestKwh ? "var(--larch)" : "var(--ink)") : "var(--ink3)" }}>
                              {r.perKwh
                                ? <><span style={{ fontWeight: 600 }}>{(r.perKwh * 100).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ct</span><span style={{ fontSize: 11, color: "var(--ink3)" }}>/kWh</span></>
                                : "–"}
                            </td>
                            <td className="result-td" style={{ minWidth: 90 }}>
                              {isBestFm
                                ? <span className="badge b-green">Referenz</span>
                                : <div>
                                    <div style={{ fontSize: 12, color: "var(--larch)", fontWeight: 600 }}>
                                      <span className="sr-only">Aufschlag gegenüber günstigstem Angebot: </span>
                                      +{fmt(aufschlag, 1)} %
                                    </div>
                                    <div className="diff-bar" aria-hidden="true"><div className="diff-fill" style={{ width: `${barWidth}%` }} /></div>
                                  </div>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="footnote">
                Umrechnung: 1 fm = {conv.rm} rm = {conv.srm} srm &nbsp;·&nbsp;
                Korrekturfaktoren: ofenfertig ×1,00 · trocken ×0,88 · halbtrocken ×0,72 · frisch ×0,60 &nbsp;·&nbsp;
                Heizwerte lt. Holzarten-Tabelle
              </p>
            </section>
          )}

          {sorted.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink3)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">🪵</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Menge und Preis eingeben um den Vergleich zu starten</div>
            </div>
          )}
        </div>

        {/* ══════════ TAB: HOLZARTEN ══════════ */}
        <div id="panel-holzarten" role="tabpanel" aria-labelledby="tab-holzarten" hidden={tab !== "holzarten"}>

          <h2 className="sec-title" style={{ marginBottom: 16 }}>Holzarten & Heizwerte</h2>

          <div className="callout" role="note" style={{ marginBottom: 20 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>ℹ️</span>
            <span>Heizwerte gelten für ofenfertiges Holz (≤ 20 % Holzfeuchte) in kWh pro Festmeter. Frisches Holz hat ca. 35–60 % geringere Energieausbeute und kann den Kamin beschädigen.</span>
          </div>

          <div className="htable-wrap">
            <div style={{ overflowX: "auto" }}>
              <table className="htable" aria-label="Holzarten mit Heizwerten und Eigenschaften">
                <thead>
                  <tr>
                    <th scope="col">Holzart</th>
                    <th scope="col">Typ</th>
                    <th scope="col">kWh / fm</th>
                    <th scope="col">Brenndauer</th>
                    <th scope="col">Funkenflug</th>
                    <th scope="col">Eignung</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLZARTEN_SORTED.map(h => {
                    const funkClass = h.funkenflug === "Gering" ? "funk-gering" : h.funkenflug === "Mittel" ? "funk-mittel" : "funk-hoch";
                    return (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14 }}>{h.name}</td>
                        <td><span className={h.typ === "Hartholz" ? "tag-hart" : "tag-weich"}>{h.typ}</span></td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{h.heizwert.toLocaleString("de-DE")}</span>
                          <div style={{ height: 3, borderRadius: 1, background: "var(--border)", marginTop: 4, width: 70 }} aria-hidden="true">
                            <div style={{ height: "100%", borderRadius: 1, background: h.typ === "Hartholz" ? "var(--pine)" : "var(--larch)", width: `${(h.heizwert / 2300) * 100}%` }} />
                          </div>
                        </td>
                        <td>{h.brenndauer}</td>
                        <td className={funkClass} style={{ fontWeight: 500 }}>{h.funkenflug}</td>
                        <td style={{ fontSize: 12 }}>{h.eignung}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="footnote" style={{ marginTop: 16 }}>
            <strong>Hinweis:</strong> Bei hohem Funkenflug (Fichte, Kiefer, Tanne) nur geschlossene Kaminöfen verwenden.
            Frisches Holz unbedingt 2–3 Jahre trocknen lassen (mindestens überdacht, beidseitig belüftet).
          </p>

          {/* Feuchte-Info */}
          <h2 className="sec-title" style={{ marginTop: 32, marginBottom: 12 }}>Holzfeuchte & Energieverlust</h2>
          <div className="htable-wrap">
            <table className="htable" aria-label="Holzfeuchte und Auswirkung auf Heizwert">
              <thead>
                <tr>
                  <th scope="col">Trockenheitsgrad</th>
                  <th scope="col">Holzfeuchte</th>
                  <th scope="col">Korrekturfaktor</th>
                  <th scope="col">Energieverlust</th>
                  <th scope="col">Hinweis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>Ofenfertig</td>
                  <td className="mono">≤ 20 %</td>
                  <td className="mono" style={{ color: "var(--pine)", fontWeight: 700 }}>× 1,00</td>
                  <td style={{ color: "var(--pine)", fontWeight: 600 }}>0 %</td>
                  <td style={{ fontSize: 12 }}>Ideal – volle Energieausbeute, saubere Verbrennung</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Trocken</td>
                  <td className="mono">≤ 25 %</td>
                  <td className="mono" style={{ color: "var(--larch)", fontWeight: 700 }}>× 0,88</td>
                  <td style={{ color: "var(--larch)", fontWeight: 600 }}>– 12 %</td>
                  <td style={{ fontSize: 12 }}>Noch gut verwendbar, leicht erhöhte Rußbildung</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Halbtrocken</td>
                  <td className="mono">25–35 %</td>
                  <td className="mono" style={{ color: "#8B5E1A", fontWeight: 700 }}>× 0,72</td>
                  <td style={{ color: "#8B5E1A", fontWeight: 600 }}>– 28 %</td>
                  <td style={{ fontSize: 12 }}>Typisch nach 1 Jahr Lagerung – erhöhte Rußbildung, nur geschlossene Öfen</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Frisch</td>
                  <td className="mono">&gt; 35 %</td>
                  <td className="mono" style={{ color: "var(--red-warn)", fontWeight: 700 }}>× 0,60</td>
                  <td style={{ color: "var(--red-warn)", fontWeight: 600 }}>– 40 %</td>
                  <td style={{ fontSize: 12 }}>Nicht empfohlen – starke Rußablagerungen, Teerbildung, Schornsteinbrand</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="footer" role="contentinfo">
        BrennholzVergleich · Kein Backend, keine Cookies · Alle Berechnungen im Browser · Angaben ohne Gewähr
      </footer>
    </div>
  );
}
