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

// Pre-sorted copy – avoids mutating the constant during render
const HOLZARTEN_SORTED = [...HOLZARTEN].sort((a, b) => b.heizwert - a.heizwert);

const FEUCHTE = {
  ofenfertig: { label: "Ofenfertig (≤ 20 %)", faktor: 1.00 },
  trocken:    { label: "Trocken (≤ 25 %)",     faktor: 0.88 },
  frisch:     { label: "Frisch (> 35 %)",       faktor: 0.60 },
};

// ─── Hilfs­funktionen ─────────────────────────────────────────────────────────

const fmt  = (n, d = 2) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtE = (n)        => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const mkOffer = (id) => ({ id, label: "", menge: "", einheit: "rm", preis: "", lieferkosten: "", holzart: "", feuchte: "ofenfertig" });

// ─── Haupt­komponente ─────────────────────────────────────────────────────────

export default function App() {
  const nextId = useRef(3);
  const [offers,   setOffers]   = useState(() => [mkOffer(1), mkOffer(2)]);
  const [tab,      setTab]      = useState("rechner");
  const [showConv, setShowConv] = useState(false);
  const [conv,     setConv]     = useState({ rm: "1.4", srm: "2.0" });

  const updOffer = (id, f, v) => setOffers(prev => prev.map(o => o.id === id ? { ...o, [f]: v } : o));
  const addOffer = () => { if (offers.length < 5) setOffers(prev => [...prev, mkOffer(nextId.current++)]); };
  const delOffer = (id) => { if (offers.length > 1) setOffers(prev => prev.filter(o => o.id !== id)); };

  const results = useMemo(() => {
    const fmFaktor = { fm: 1.0, rm: 1 / parseFloat(conv.rm || 1.4), srm: 1 / parseFloat(conv.srm || 2.0) };
    return offers.map(o => {
      const menge = parseFloat(o.menge);
      const preis = parseFloat(o.preis);
      const lief  = parseFloat(o.lieferkosten) || 0;
      if (!menge || !preis || menge <= 0 || preis < 0) return { ...o, ok: false };
      const fm       = menge * fmFaktor[o.einheit];
      const gesamt   = preis + lief;
      const perFm    = gesamt / fm;
      const holz     = HOLZARTEN.find(h => h.id === o.holzart);
      const feuchFak = FEUCHTE[o.feuchte]?.faktor ?? 1;
      const kwh      = holz ? holz.heizwert * fm * feuchFak : null;
      const perKwh   = kwh ? gesamt / kwh : null;
      return { ...o, ok: true, fm, gesamt, perFm, perKwh, kwh, holz };
    });
  }, [offers, conv]);

  const valid     = results.filter(r => r.ok);
  const minPerFm  = valid.length ? Math.min(...valid.map(r => r.perFm)) : null;
  const minPerKwh = valid.filter(r => r.perKwh).length ? Math.min(...valid.filter(r => r.perKwh).map(r => r.perKwh)) : null;
  const maxPerFm  = valid.length ? Math.max(...valid.map(r => r.perFm)) : null;
  const sorted    = [...valid].sort((a, b) => a.perFm - b.perFm);

  const TABS = [
    { id: "rechner",   icon: "⊞", label: "Angebote vergleichen" },
    { id: "holzarten", icon: "🌲", label: "Holzarten & Heizwerte" },
  ];

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header" role="banner">
        <div className="inner header-inner">
          <div className="logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C9 5.5 7 8 7 11a5 5 0 0010 0c0-3-2-5.5-5-9z" fill="white" fillOpacity=".9"/>
              <path d="M12 10c-1 2-2 3-2 4.5a2 2 0 004 0C14 13 13 12 12 10z" fill="white" fillOpacity=".5"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">Brennholz<span>Vergleich</span></div>
            <div className="logo-sub">Angebote normalisiert vergleichen</div>
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
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              role="tab"
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="inner" style={{ paddingTop: 28, paddingBottom: 72 }}>

        {/* ══════════ TAB: RECHNER ══════════ */}
        <div
          id="panel-rechner"
          role="tabpanel"
          aria-labelledby="tab-rechner"
          hidden={tab !== "rechner"}
        >
          {/* Callout */}
          <div className="callout" role="note" style={{ marginBottom: 20 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>💡</span>
            <span>
              Alle Angebote werden auf <strong>€&thinsp;/&thinsp;Festmeter</strong> normalisiert – inklusive Lieferkosten.
              Mit optionaler Holzart-Angabe erscheint zusätzlich der Vergleich nach <strong>€&thinsp;/&thinsp;kWh</strong>.
            </span>
          </div>

          {/* Offer Cards */}
          <div className="offers-grid" role="list">
            {offers.map((offer, idx) => {
              const res = results.find(r => r.id === offer.id);
              return (
                <article key={offer.id} className="card" role="listitem" aria-label={`Angebot ${idx + 1}`} style={{ padding: 18 }}>
                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
                    <div className="card-num" aria-hidden="true">{idx + 1}</div>
                    <input
                      className="input"
                      style={{ border: "none", background: "none", padding: 0, fontWeight: 700, fontSize: 15, flex: 1, minWidth: 0 }}
                      placeholder={`Angebot ${idx + 1}`}
                      value={offer.label}
                      onChange={e => updOffer(offer.id, "label", e.target.value)}
                      aria-label={`Bezeichnung Angebot ${idx + 1}`}
                      maxLength={40}
                    />
                    {offers.length > 1 && (
                      <button className="btn-del" onClick={() => delOffer(offer.id)} aria-label={`Angebot ${idx + 1} entfernen`}>×</button>
                    )}
                  </div>

                  {/* Menge + Einheit */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label className="label" htmlFor={`menge-${offer.id}`}>Menge</label>
                      <input id={`menge-${offer.id}`} className="input mono" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="z.B. 3" value={offer.menge} onChange={e => updOffer(offer.id, "menge", e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor={`einheit-${offer.id}`}>Einheit</label>
                      <select id={`einheit-${offer.id}`} className="input" value={offer.einheit} onChange={e => updOffer(offer.id, "einheit", e.target.value)}>
                        <option value="rm">Raummeter (rm)</option>
                        <option value="fm">Festmeter (fm)</option>
                        <option value="srm">Schüttrm. (srm)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preis + Lieferung */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label className="label" htmlFor={`preis-${offer.id}`}>Preis (€)</label>
                      <input id={`preis-${offer.id}`} className="input mono" type="number" inputMode="decimal" min="0" step="0.01" placeholder="250" value={offer.preis} onChange={e => updOffer(offer.id, "preis", e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor={`lief-${offer.id}`}>Lieferung <span className="opt">(€, 0=kostenlos)</span></label>
                      <input id={`lief-${offer.id}`} className="input mono" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0" value={offer.lieferkosten} onChange={e => updOffer(offer.id, "lieferkosten", e.target.value)} />
                    </div>
                  </div>

                  {/* Holzart + Feuchte */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label className="label" htmlFor={`holz-${offer.id}`}>Holzart <span className="opt">(optional)</span></label>
                      <select id={`holz-${offer.id}`} className="input" value={offer.holzart} onChange={e => updOffer(offer.id, "holzart", e.target.value)}>
                        <option value="">– nicht angegeben –</option>
                        <optgroup label="Hartholz">
                          {HOLZARTEN.filter(h => h.typ === "Hartholz").map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </optgroup>
                        <optgroup label="Weichholz">
                          {HOLZARTEN.filter(h => h.typ === "Weichholz").map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`feuchte-${offer.id}`}>Trockenheit</label>
                      <select id={`feuchte-${offer.id}`} className="input" value={offer.feuchte} onChange={e => updOffer(offer.id, "feuchte", e.target.value)}>
                        {Object.entries(FEUCHTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Mini-Ergebnis im Card */}
                  {res?.ok && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                        {fmt(res.fm, 2)} fm · {fmtE(res.gesamt)}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: res.perFm === minPerFm ? "var(--green)" : "var(--ink)" }}>
                        {fmtE(res.perFm)}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink3)" }}>/fm</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Add + Settings row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {offers.length < 5 && (
              <button className="btn-ghost" onClick={addOffer} aria-label="Weiteres Angebot hinzufügen">
                <span aria-hidden="true">+</span> Angebot hinzufügen
              </button>
            )}
            <button className="note-toggle" onClick={() => setShowConv(!showConv)} aria-expanded={showConv}>
              <span aria-hidden="true">{showConv ? "▾" : "▸"}</span> Umrechnungsfaktoren anpassen
            </button>
          </div>

          {/* Collapsible: Conversion factors */}
          {showConv && (
            <div className="card" style={{ padding: 16, marginTop: -20, marginBottom: 24 }}>
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
              <div className="result-scroll">
                <table className="result-table" aria-label="Angebote sortiert nach Preis pro Festmeter">
                  <thead>
                    <tr>
                      <th className="result-th" style={{ textAlign: "left", paddingLeft: 14 }} scope="col">Angebot</th>
                      <th className="result-th" scope="col">Festmeter</th>
                      <th className="result-th" scope="col">Gesamtpreis</th>
                      <th className="result-th" scope="col">€ / fm</th>
                      <th className="result-th" scope="col">€ / kWh</th>
                      <th className="result-th" scope="col">Aufschlag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => {
                      const isBestFm  = r.perFm  === minPerFm;
                      const isBestKwh = r.perKwh !== null && r.perKwh === minPerKwh;
                      const offerIdx  = offers.findIndex(o => o.id === r.id) + 1;
                      const name      = r.label || `Angebot ${offerIdx}`;
                      const aufschlag = !isBestFm && minPerFm ? ((r.perFm - minPerFm) / minPerFm * 100) : 0;
                      const barWidth  = maxPerFm && minPerFm ? ((r.perFm - minPerFm) / (maxPerFm - minPerFm || 1)) * 100 : 0;
                      const medals    = ["🥇", "🥈", "🥉"];
                      const lief      = parseFloat(offers.find(o => o.id === r.id)?.lieferkosten);

                      return (
                        <tr key={r.id} className={`result-tr${isBestFm ? " best" : ""}`}>
                          <td className="result-td">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span aria-hidden="true" style={{ fontSize: 16 }}>{medals[i] ?? ""}</span>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>
                              {isBestFm && <span className="badge b-green" aria-label="Günstigstes Angebot">✓ Günstigste</span>}
                              {(r.holz?.funkenflug === "Hoch" || r.holz?.funkenflug === "Sehr hoch") && (
                                <span className="badge b-warn" title={`Achtung: ${r.holz.name} hat hohen Funkenflug`}>⚠ Funkenflug</span>
                              )}
                            </div>
                          </td>
                          <td className="result-td mono" style={{ textAlign: "right", color: "var(--ink2)" }}>
                            {fmt(r.fm)} fm
                          </td>
                          <td className="result-td mono" style={{ textAlign: "right", fontWeight: 500 }}>
                            {fmtE(r.gesamt)}
                            {lief > 0 && (
                              <div style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--sans)" }}>
                                inkl. {fmtE(lief)} Lieferung
                              </div>
                            )}
                          </td>
                          <td className="result-td mono" style={{ textAlign: "right" }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: isBestFm ? "var(--green)" : "var(--ink)" }}>
                              {fmtE(r.perFm)}
                            </span>
                          </td>
                          <td className="result-td mono" style={{ textAlign: "right", color: r.perKwh ? (isBestKwh ? "var(--green)" : "var(--ink)") : "var(--ink3)" }}>
                            {r.perKwh
                              ? <><span style={{ fontWeight: 600 }}>{(r.perKwh * 100).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ct</span><span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--sans)" }}>/kWh</span></>
                              : "–"}
                          </td>
                          <td className="result-td" style={{ minWidth: 90 }}>
                            {isBestFm
                              ? <span className="badge b-green">Referenz</span>
                              : <div>
                                  <div style={{ fontSize: 12, color: "#C2410C", fontWeight: 600 }}>+{fmt(aufschlag, 1)} %</div>
                                  <div className="diff-bar"><div className="diff-fill" style={{ width: `${barWidth}%` }} /></div>
                                </div>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="footnote">
                Umrechnung: 1 fm = {conv.rm} rm = {conv.srm} srm &nbsp;·&nbsp;
                Heizwert-Korrekturfaktoren: ofenfertig ×1,00 · trocken ×0,88 · frisch ×0,60 &nbsp;·&nbsp;
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
        <div
          id="panel-holzarten"
          role="tabpanel"
          aria-labelledby="tab-holzarten"
          hidden={tab !== "holzarten"}
        >
          <h2 className="sec-title" style={{ marginBottom: 16 }}>Holzarten & Heizwerte</h2>

          <div className="callout" role="note" style={{ marginBottom: 20 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>ℹ️</span>
            <span>Heizwerte gelten für ofenfertiges Holz (≤ 20 % Holzfeuchte) in kWh pro Festmeter. Frisches Holz hat ca. 35–60 % geringere Energieausbeute und kann den Kamin beschädigen.</span>
          </div>

          <div style={{ borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
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
                    const funkClass =
                      h.funkenflug === "Gering" ? "funk-gering" :
                      h.funkenflug === "Mittel" ? "funk-mittel" :
                      "funk-hoch";
                    return (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14 }}>{h.name}</td>
                        <td><span className={h.typ === "Hartholz" ? "tag-hart" : "tag-weich"}>{h.typ}</span></td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{h.heizwert.toLocaleString("de-DE")}</span>
                          <div style={{ height: 3, borderRadius: 2, background: "var(--border)", marginTop: 4, width: 70 }}>
                            <div style={{ height: "100%", borderRadius: 2, background: h.typ === "Hartholz" ? "var(--accent)" : "#60A5FA", width: `${(h.heizwert / 2300) * 100}%` }} />
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

          {/* Feuchte-Info Tabelle */}
          <h2 className="sec-title" style={{ marginTop: 32, marginBottom: 12 }}>Holzfeuchte & Energieverlust</h2>
          <div style={{ borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
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
                  <td className="mono" style={{ color: "var(--green)", fontWeight: 700 }}>× 1,00</td>
                  <td style={{ color: "var(--green)", fontWeight: 600 }}>0 %</td>
                  <td style={{ fontSize: 12 }}>Ideal – volle Energieausbeute, saubere Verbrennung</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Trocken</td>
                  <td className="mono">≤ 25 %</td>
                  <td className="mono" style={{ color: "#D97706", fontWeight: 700 }}>× 0,88</td>
                  <td style={{ color: "#D97706", fontWeight: 600 }}>– 12 %</td>
                  <td style={{ fontSize: 12 }}>Noch gut verwendbar, leicht erhöhte Rußbildung</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Frisch</td>
                  <td className="mono">&gt; 35 %</td>
                  <td className="mono" style={{ color: "#DC2626", fontWeight: 700 }}>× 0,60</td>
                  <td style={{ color: "#DC2626", fontWeight: 600 }}>– 40 %</td>
                  <td style={{ fontSize: 12 }}>Nicht empfohlen – starke Rußablagerungen, Teerbildung, Schornsteinbrand</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--ink)", color: "#6B6560", padding: "16px 20px", fontSize: 12, textAlign: "center" }}>
        BrennholzVergleich · Kein Backend, keine Cookies · Alle Berechnungen im Browser · Angaben ohne Gewähr
      </footer>
    </div>
  );
}
