import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import './App.css';
import { HOLZARTEN, FEUCHTE, berechneErgebnisse } from './calc.js';

// ─── Daten ────────────────────────────────────────────────────────────────────

const HOLZARTEN_SORTED = [...HOLZARTEN].sort((a, b) => b.heizwert - a.heizwert);

// ponytail: "lieferanten" Tab pausiert (kein Live-Angebot), Panel-Code bleibt für Reaktivierung
const TAB_IDS = ["rechner", "holzarten", "emissionen"];
const TABS = [
  { id: "rechner",     icon: "≡", label: "Angebote vergleichen" },
  { id: "holzarten",   icon: "◈", label: "Holzarten & Heizwerte" },
  { id: "emissionen",  icon: "◉", label: "Emissionen & Klima" },
];

// ─── Lieferanten ──────────────────────────────────────────────────────────────
// featured: true = bezahlter Eintrag (sichtbar zuerst, mit Hervorhebung)
// Fallback-Daten für lokale Entwicklung ohne Airtable-Credentials
const LIEFERANTEN_FALLBACK = [
  {
    id: "s1",
    name: "Holzhof Sonnleitner",
    ort: "Rosenheim",
    plz: "83022",
    region: "Bayern",
    holzarten: ["Buche", "Eiche", "Birke"],
    beschreibung: "Seit über 30 Jahren regionaler Holzhandel im Chiemgau. Ofenfertiges Hartholz, sauber gespalten – auf Palette oder lose.",
    liefert_ab_rm: 5,
    tel: "+49 8031 45678",
    website: "https://holzhof-sonnleitner.de",
    featured: true,
    zertifiziert: true,
  },
  {
    id: "s2",
    name: "Brennholz Schwarzwald GmbH",
    ort: "Freudenstadt",
    plz: "72250",
    region: "Baden-Württemberg",
    holzarten: ["Buche", "Esche", "Hainbuche"],
    beschreibung: "Direktverkauf ab Hof und Lieferung in einem Umkreis von 80 km. Hartholz aus nachhaltig bewirtschaftetem Schwarzwälder Privatwald.",
    liefert_ab_rm: 3,
    tel: "+49 7441 98760",
    website: "https://brennholz-schwarzwald.de",
    featured: true,
    zertifiziert: true,
  },
  {
    id: "s3",
    name: "Forst & Feuer Hunsrück",
    ort: "Simmern",
    plz: "55469",
    region: "Rheinland-Pfalz",
    holzarten: ["Buche", "Eiche"],
    beschreibung: "Familienforstbetrieb mit eigener Holzaufbereitung. Lieferung lose gekippt oder auf Palette im Raum Hunsrück / Mosel.",
    liefert_ab_rm: 10,
    tel: "+49 6761 2345",
    website: null,
    featured: false,
    zertifiziert: false,
  },
  {
    id: "s4",
    name: "Kaminholz Sauerland",
    ort: "Meschede",
    plz: "59872",
    region: "Nordrhein-Westfalen",
    holzarten: ["Buche", "Birke", "Esche"],
    beschreibung: "Buchenholz aus dem Sauerland, 2 Jahre natürlich getrocknet. Lieferung ins gesamte Ruhrgebiet und Umland.",
    liefert_ab_rm: 5,
    tel: "+49 291 78901",
    website: "https://kaminholz-sauerland.de",
    featured: false,
    zertifiziert: true,
  },
  {
    id: "s5",
    name: "Märkisches Brennholz",
    ort: "Königs Wusterhausen",
    plz: "15711",
    region: "Brandenburg",
    holzarten: ["Kiefer", "Birke", "Erle"],
    beschreibung: "Norddeutsches Weich- und Hartholz, günstig ab Lager. Kiefer zum Anheizen, Birke als sauberes Allroundholz.",
    liefert_ab_rm: 8,
    tel: null,
    website: "https://maerkisches-brennholz.de",
    featured: false,
    zertifiziert: false,
  },
  {
    id: "s6",
    name: "Erzgebirger Holzkontor",
    ort: "Annaberg-Buchholz",
    plz: "09456",
    region: "Sachsen",
    holzarten: ["Buche", "Fichte", "Lärche"],
    beschreibung: "Ofenfertiges Buchen- und Nadelholz aus dem Erzgebirge. Abholung ab Hof oder Lieferung auf Anfrage.",
    liefert_ab_rm: 4,
    tel: "+49 3733 56789",
    website: null,
    featured: false,
    zertifiziert: false,
  },
];

// ─── Airtable ─────────────────────────────────────────────────────────────────

const AIRTABLE_TABLE = "Lieferanten";

function mapAirtableRecord(r) {
  const f = r.fields;
  return {
    id:            r.id,
    name:          f.name          || "",
    ort:           f.ort           || "",
    plz:           f.plz           || "",
    region:        f.region        || "",
    holzarten:     f.holzarten     || [],
    beschreibung:  f.beschreibung  || "",
    liefert_ab_rm: f.liefert_ab_rm || null,
    tel:           f.tel           || null,
    website:       f.website       || null,
    featured:      f.featured      || false,
    zertifiziert:  f.zertifiziert  || false,
  };
}

// ─── Emissionsfaktoren ────────────────────────────────────────────────────────
// Quelle: UBA Handbuch Emissionsfaktoren – Holzfeuerung in Kleinanlagen
// PM2.5 in g pro kWh thermischer Energie
const PM25_PRO_KWH = {
  ofenfertig:  0.15,   // moderner Ofen, trockenes Holz ≤ 20 %
  trocken:     0.36,   // ≤ 25 %
  halbtrocken: 1.10,   // 25–35 %
  frisch:      3.00,   // > 35 % – 20× schlechter als ofenfertig
};
// CO2 in kg pro kWh (biogene Verbrennung – tatsächlicher Ausstoß)
const CO2_PRO_KWH  = 0.36;  // kg CO2/kWh
// Zum Vergleich:
const CO2_ERDGAS   = 0.201; // kg CO2/kWh
const CO2_HEIZOEL  = 0.266; // kg CO2/kWh

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

// [optimize] Kein module-level mutable state – sicher in React StrictMode & HMR
const mkId = () => Math.random().toString(36).slice(2, 9);
const mkPos = () => ({ id: mkId(), menge: "", einheit: "rm", preis: "", holzart: "", feuchte: "ofenfertig" });
const mkOffer = () => ({ id: mkId(), label: "", lieferkosten: "", positionen: [mkPos()] });

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

// ─── Modal ────────────────────────────────────────────────────────────────────

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Modal({ id, title, onClose, children }) {
  const modalRef     = useRef(null);
  const prevFocusRef = useRef(null);

  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    // Focus first focusable element on open
    const focusable = modalRef.current?.querySelectorAll(FOCUSABLE);
    focusable?.[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const all = Array.from(modalRef.current?.querySelectorAll(FOCUSABLE) ?? []);
      if (all.length === 0) { e.preventDefault(); return; }
      const first = all[0], last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={`${id}-title`} className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function App() {
  const [offers,      setOffers]      = useState(() => [mkOffer(), mkOffer(), mkOffer()]);
  const [tab,         setTab]         = useState("rechner");
  const [showConv,    setShowConv]    = useState(false);
  const [conv,        setConv]        = useState({ rm: "1.4", srm: "2.0" });
  const [filterTyp,        setFilterTyp]        = useState("Alle");
  const [filterFunk,       setFilterFunk]       = useState("Alle");
  const [sortCol,          setSortCol]          = useState("heizwert");
  const [sortDir,          setSortDir]          = useState("desc");
  const [supplierSearch,   setSupplierSearch]   = useState("");
  const [supplierHolzfilt, setSupplierHolzfilt] = useState("Alle");
  const [modal,            setModal]            = useState(null); // null | "impressum" | "datenschutz" | "kontakt"
  const [formState,        setFormState]        = useState("idle"); // idle | sending | sent | error
  const [suppliers,        setSuppliers]        = useState(LIEFERANTEN_FALLBACK);
  const [suppliersStatus,  setSuppliersStatus]  = useState("loading"); // loading | ok | error

  useEffect(() => {
    // ponytail: Lieferanten-Tab pausiert (nicht in TAB_IDS) - kein Sinn, bei jedem Seitenaufruf Airtable zu fragen
    if (!TAB_IDS.includes("lieferanten")) return;

    const token  = import.meta.env.VITE_AIRTABLE_TOKEN;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!token || !baseId) { setSuppliersStatus("ok"); return; }

    fetch(
      `https://api.airtable.com/v0/${baseId}/${AIRTABLE_TABLE}?sort[0][field]=featured&sort[0][direction]=desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setSuppliers(data.records.map(mapAirtableRecord)); setSuppliersStatus("ok"); })
      .catch(() => setSuppliersStatus("error"));
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setFormState("idle");
  }, []);

  async function handleContactSubmit(e) {
    e.preventDefault();
    setFormState("sending");
    try {
      const res = await fetch("https://formspree.io/f/mkokwndj", {
        method: "POST",
        body: new FormData(e.target),
        headers: { Accept: "application/json" },
      });
      setFormState(res.ok ? "sent" : "error");
    } catch {
      setFormState("error");
    }
  }

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "heizwert" ? "desc" : "asc"); }
  };

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

  const results = useMemo(() => berechneErgebnisse(offers, conv), [offers, conv]);

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
            <div className="logo-text" aria-hidden="true">Holzpreis<span>Vergleich</span></div>
            <div className="logo-sub">Angebote normalisiert vergleichen</div>
            <h1 className="sr-only">HolzpreisVergleich – Brennholz-Angebote fair vergleichen</h1>
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
            <span aria-hidden="true" style={{ fontSize: 14, color: "var(--larch)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</span>
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
                  <input id="conv-rm" className="input mono" type="number" inputMode="decimal" step="0.01" min="1" max="2" value={conv.rm} onChange={e => setConv(c => ({ ...c, rm: e.target.value }))} style={{ width: "6rem" }} />
                </div>
                <div>
                  <label className="label" htmlFor="conv-srm">1 fm = ___ srm</label>
                  <input id="conv-srm" className="input mono" type="number" inputMode="decimal" step="0.01" min="1" max="3" value={conv.srm} onChange={e => setConv(c => ({ ...c, srm: e.target.value }))} style={{ width: "6rem" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Ergebnistabelle ── */}
          {sorted.length > 0 && (
            <section aria-label="Vergleichsergebnisse">
              <h2 className="sec-title">Vergleich</h2>
              <div role="status" aria-live="polite" aria-atomic="false" className="sr-only">
                {sorted.length} Angebot{sorted.length !== 1 ? "e" : ""} verglichen.
                Günstigstes: {sorted[0]?.label || `Angebot ${offers.findIndex(o => o.id === sorted[0]?.id) + 1}`},
                {sorted[0]?.perFm != null ? ` ${fmtE(sorted[0].perFm)} pro Festmeter` : ""}
              </div>
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
                                    <div className="diff-bar" aria-hidden="true"><div className="diff-fill" style={{ transform: `scaleX(${barWidth / 100})` }} /></div>
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
            <span aria-hidden="true" style={{ fontSize: 14, color: "var(--larch)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</span>
            <span>Heizwerte gelten für ofenfertiges Holz (≤ 20 % Holzfeuchte) in kWh pro Festmeter. Frisches Holz hat ca. 35–60 % geringere Energieausbeute und kann den Kamin beschädigen.</span>
          </div>

          {/* Filter */}
          <div className="htable-filters" role="group" aria-label="Holzarten filtern">
            <div className="filter-group" role="group" aria-label="Nach Holztyp filtern">
              <span className="filter-label" aria-hidden="true">Typ</span>
              {["Alle", "Hartholz", "Weichholz"].map(v => (
                <button
                  key={v}
                  className={`filter-btn${filterTyp === v ? " filter-btn--on" : ""}`}
                  onClick={() => setFilterTyp(v)}
                  aria-pressed={filterTyp === v}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="filter-group" role="group" aria-label="Nach Funkenflug filtern">
              <span className="filter-label" aria-hidden="true">Funkenflug</span>
              {["Alle", "Gering", "Mittel", "Hoch", "Sehr hoch"].map(v => (
                <button
                  key={v}
                  className={`filter-btn${filterFunk === v ? " filter-btn--on" : ""}`}
                  onClick={() => setFilterFunk(v)}
                  aria-pressed={filterFunk === v}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="htable-wrap">
            <div style={{ overflowX: "auto" }}>
              <table className="htable" aria-label="Holzarten mit Heizwerten und Eigenschaften">
                <thead>
                  <tr>
                    {[
                      { col: "name",       label: "Holzart",    align: "left"  },
                      { col: "typ",        label: "Typ",        align: "left"  },
                      { col: "heizwert",   label: "kWh / fm",   align: "right" },
                      { col: "brenndauer", label: "Brenndauer", align: "left"  },
                      { col: "funkenflug", label: "Funkenflug", align: "left"  },
                      { col: null,         label: "Eignung",    align: "left"  },
                    ].map(({ col, label, align }) => (
                      <th
                        key={label}
                        scope="col"
                        style={{ textAlign: align, cursor: col ? "pointer" : "default", userSelect: "none" }}
                        onClick={col ? () => toggleSort(col) : undefined}
                        aria-sort={col && sortCol === col ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        title={col ? `Nach ${label} sortieren` : undefined}
                      >
                        {label}
                        {col && (
                          <span aria-hidden="true" style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3 }}>
                            {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const FUNK_ORDER = { "Gering": 0, "Mittel": 1, "Hoch": 2, "Sehr hoch": 3 };
                    const BRENN_ORDER = { "Kurz": 0, "Kurz–Mittel": 1, "Mittel": 2, "Lang": 3, "Sehr lang": 4 };
                    const filtered = HOLZARTEN_SORTED
                      .filter(h => filterTyp  === "Alle" || h.typ        === filterTyp)
                      .filter(h => filterFunk === "Alle" || h.funkenflug === filterFunk);
                    const sorted = [...filtered].sort((a, b) => {
                      let va, vb;
                      if      (sortCol === "name")       { va = a.name;      vb = b.name; }
                      else if (sortCol === "typ")        { va = a.typ;       vb = b.typ; }
                      else if (sortCol === "heizwert")   { va = a.heizwert;  vb = b.heizwert; }
                      else if (sortCol === "brenndauer") { va = BRENN_ORDER[a.brenndauer] ?? 0; vb = BRENN_ORDER[b.brenndauer] ?? 0; }
                      else if (sortCol === "funkenflug") { va = FUNK_ORDER[a.funkenflug]  ?? 0; vb = FUNK_ORDER[b.funkenflug]  ?? 0; }
                      if (va < vb) return sortDir === "asc" ? -1 : 1;
                      if (va > vb) return sortDir === "asc" ?  1 : -1;
                      return 0;
                    });
                    return sorted;
                  })().map(h => {
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
                  <td className="mono" style={{ color: "var(--larch-d)", fontWeight: 700 }}>× 0,72</td>
                  <td style={{ color: "var(--larch-d)", fontWeight: 600 }}>– 28 %</td>
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

        {/* ══════════ TAB: EMISSIONEN ══════════ */}
        <div id="panel-emissionen" role="tabpanel" aria-labelledby="tab-emissionen" hidden={tab !== "emissionen"}>

          <h2 className="sec-title" style={{ marginBottom: 16 }}>Emissionen & Klima</h2>

          <div className="callout" role="note" style={{ marginBottom: 28 }}>
            <span aria-hidden="true" style={{ fontSize: 14, color: "var(--larch)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</span>
            <span>
              Holz gilt offiziell als <strong>CO₂-neutral</strong> – aber das ist eine Vereinfachung.
              Das beim Verbrennen freigesetzte CO₂ wurde im Baum über <strong>60–100 Jahre</strong> gespeichert
              und braucht ebenso lange zur Wiederaufnahme durch nachwachsenden Wald.
              Feinstaub (PM2.5) hingegen entsteht direkt durch unvollständige Verbrennung
              und schadet Lunge und Klima – besonders bei feuchtem Holz.
            </span>
          </div>

          {/* ── Feinstaub nach Feuchte ── */}
          <h3 className="sec-title" style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Feinstaub (PM2.5) nach Holzfeuchte</h3>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16 }}>
            PM2.5-Partikel (&lt;&nbsp;2,5&nbsp;µm) dringen tief in die Lunge ein und gelten als gesundheitsgefährdend.
            Nasses Holz erzeugt bis zu <strong style={{ color: "var(--red-warn)" }}>20× mehr Feinstaub</strong> als ofenfertiges.
          </p>

          <div className="em-bars" role="img" aria-label="PM2.5-Emissionen nach Holzfeuchte: Ofenfertig 0,15 g/kWh, Trocken 0,36, Halbtrocken 1,10, Frisch 3,00 – 20-mal schlechter">
            {[
              { key: "ofenfertig",  label: "Ofenfertig  (≤ 20 %)",  val: 0.15, color: "var(--pine)" },
              { key: "trocken",     label: "Trocken     (≤ 25 %)",  val: 0.36, color: "var(--larch)" },
              { key: "halbtrocken", label: "Halbtrocken (25–35 %)", val: 1.10, color: "var(--larch-d)" },
              { key: "frisch",      label: "Frisch      (> 35 %)",  val: 3.00, color: "var(--red-warn)" },
            ].map(({ key, label, val, color }) => (
              <div key={key} className="em-bar-row">
                <div className="em-bar-label">{label}</div>
                <div className="em-bar-track" aria-hidden="true">
                  <div className="em-bar-fill" style={{ transform: `scaleX(${val / 3.00})`, background: color }} />
                </div>
                <div className="em-bar-val mono" style={{ color }}>{val.toFixed(2)}&thinsp;g/kWh</div>
              </div>
            ))}
          </div>
          <p className="footnote" style={{ marginTop: 10, marginBottom: 28 }}>
            Quelle: UBA Handbuch Emissionsfaktoren – Holzfeuerung in Kleinanlagen (Kaminöfen, Kachelöfen)
          </p>

          {/* ── CO2-Vergleich ── */}
          <h3 className="sec-title" style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>CO₂-Emissionen im Vergleich</h3>
          <div className="htable-wrap" style={{ marginBottom: 28 }}>
            <table className="htable" aria-label="CO2-Emissionen verschiedener Energieträger im Vergleich">
              <thead>
                <tr>
                  <th scope="col">Energieträger</th>
                  <th scope="col">kg CO₂ / kWh</th>
                  <th scope="col">Typ</th>
                  <th scope="col">Klimawirkung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>Holz (Kaminofen)</td>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--larch)" }}>0,360</td>
                  <td><span className="em-tag em-tag--biogen">Biogen</span></td>
                  <td style={{ fontSize: 12 }}>CO₂ im Kreislauf – Rückbindung über 60–100 Jahre Waldwachstum</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Heizöl</td>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--larch-d)" }}>0,266</td>
                  <td><span className="em-tag em-tag--fossil">Fossil</span></td>
                  <td style={{ fontSize: 12 }}>Dauerhafter CO₂-Anstieg – kein natürlicher Kreislauf</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Erdgas</td>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--ink2)" }}>0,201</td>
                  <td><span className="em-tag em-tag--fossil">Fossil</span></td>
                  <td style={{ fontSize: 12 }}>Geringstes CO₂ pro kWh – trotzdem fossile Quelle</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Per-Offer Emissions ── */}
          {valid.filter(r => r.totalKwh).length > 0 && (
            <>
              <h3 className="sec-title" style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Ihre Angebote – geschätzte Emissionen</h3>
              <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16 }}>
                Basierend auf Holzart und Trockenheit der eingegebenen Angebote.
              </p>
              <div className="htable-wrap" style={{ marginBottom: 8 }}>
                <table className="htable" aria-label="Geschätzte Emissionen pro Angebot">
                  <thead>
                    <tr>
                      <th scope="col">Angebot</th>
                      <th scope="col">Heizenergie</th>
                      <th scope="col">PM2.5 gesamt</th>
                      <th scope="col">CO₂ (biogen)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valid.filter(r => r.totalKwh).map(r => {
                      const offerIdx = offers.findIndex(o => o.id === r.id) + 1;
                      const name  = r.label || `Angebot ${offerIdx}`;
                      const pm25  = r.posCalc.reduce((s, p) => s + (p.kwh ? p.kwh * PM25_PRO_KWH[p.feuchte] : 0), 0);
                      const co2   = r.totalKwh * CO2_PRO_KWH;
                      const pm25Color = pm25 > 200 ? "var(--red-warn)" : pm25 > 50 ? "var(--larch-d)" : "var(--pine)";
                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 700 }}>{name}</td>
                          <td className="mono">{Math.round(r.totalKwh).toLocaleString("de-DE")}&thinsp;kWh</td>
                          <td className="mono" style={{ color: pm25Color, fontWeight: 600 }}>
                            {fmt(pm25, 0)}&thinsp;g
                          </td>
                          <td className="mono">{fmt(co2, 0)}&thinsp;kg</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="footnote" style={{ marginBottom: 28 }}>
                PM2.5 nach UBA-Emissionsfaktoren für Kaminöfen · CO₂ biogen = {CO2_PRO_KWH}&thinsp;kg/kWh · Näherungswerte
              </p>
            </>
          )}

          {/* ── Der CO2-Kreislauf ── */}
          <div className="em-kreislauf">
            <div className="em-kreislauf-title">Der CO₂-Kreislauf beim Holzheizen</div>
            <p>
              Wälder binden CO₂ über Jahrzehnte. Wenn ein Baum gefällt und verbrannt wird,
              wird das gespeicherte CO₂ sofort freigesetzt – der Wald braucht <strong>60–100 Jahre</strong>,
              um es wieder aufzunehmen. Holzheizen ist daher nicht „klimaneutral heute",
              sondern ein <em>Kreislauf über Generationen</em>.
              Lokal und nachhaltig bewirtschaftete Wälder verkürzen diesen Zeitraum gegenüber
              Holz aus Kahlschlägen deutlich.
            </p>
            <p style={{ marginBottom: 0 }}>
              Fossile Energie (Öl, Gas) setzt dagegen CO₂ frei, das über <strong>Millionen von Jahren</strong> gebunden war –
              es gibt keinen natürlichen Rückbindungs-Kreislauf auf menschlichen Zeitskalen.
            </p>
          </div>

          {/* ── Tipps ── */}
          <h3 className="sec-title" style={{ marginTop: 32, marginBottom: 16, fontSize: 16 }}>Emissionen reduzieren – praktische Tipps</h3>
          <div className="em-tips">
            {[
              {
                icon: "◈",
                title: "Nur trockenes Holz verwenden",
                text: "Holzfeuchte ≤ 20 % (ofenfertig). Nasses Holz erzeugt bis zu 7× mehr Feinstaub, mehr Teer und verschmutzt den Schornstein schneller.",
              },
              {
                icon: "◉",
                title: "Moderner, zertifizierter Ofen",
                text: "Ein Kaminofen nach BImSchV Stufe 2 reduziert PM2.5 gegenüber alten Öfen und offenen Kaminen um ca. 80 %. Investition lohnt sich langfristig.",
              },
              {
                icon: "≡",
                title: "Von oben anzünden (Top-down)",
                text: "Großscheite unten, Anzündholz und Zunder oben. Weniger Qualm in der Anheizphase, schnellere Betriebstemperatur, effizientere Verbrennung.",
              },
              {
                icon: "▸",
                title: "Holz richtig lagern",
                text: "Frisch geschlagenes Holz hat ca. 50 % Wasseranteil. 2–3 Jahre trocken, überdacht und beidseitig belüftet lagern – erst dann ist es ofenfertig.",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="em-tip">
                <div className="em-tip-icon" aria-hidden="true">{icon}</div>
                <div>
                  <div className="em-tip-title">{title}</div>
                  <div className="em-tip-text">{text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Affiliate: Holzfeuchtemessgerät ── */}
          <div className="affiliate-card" style={{ marginTop: 32 }}>
            <div className="affiliate-label">Werbung</div>
            <div className="affiliate-inner">
              <div className="affiliate-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="3" rx="1" fill="currentColor" opacity=".3"/>
                  <rect x="10.5" y="4" width="3" height="14" rx="1.5" fill="currentColor" opacity=".15"/>
                  <circle cx="12" cy="18" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="12" y1="16" x2="12" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="12" y1="18.5" x2="13.5" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="affiliate-body">
                <div className="affiliate-title">Holzfeuchte selbst messen</div>
                <div className="affiliate-text">
                  Ein Feuchtemessgerät kostet €15–40 und zeigt sofort, ob Ihr Holz wirklich ofenfertig ist.
                  Spart Feinstaub, Teer und bares Geld beim nächsten Einkauf.
                </div>
              </div>
              <a
                className="affiliate-btn"
                href="https://www.amazon.de/s?k=holzfeuchtemessger%C3%A4t&tag=DEIN-AFFILIATE-ID-21"
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label="Holzfeuchtemessgeräte auf Amazon ansehen (Affiliate-Link, öffnet in neuem Tab)"
              >
                Auf Amazon ansehen →
              </a>
            </div>
          </div>

        </div>

        {/* ══════════ TAB: LIEFERANTEN ══════════ */}
        <div id="panel-lieferanten" role="tabpanel" aria-labelledby="tab-lieferanten" hidden={tab !== "lieferanten"}>

          <h2 className="sec-title" style={{ marginBottom: 16 }}>Lieferanten finden</h2>

          <div className="callout" role="note" style={{ marginBottom: 24 }}>
            <span aria-hidden="true" style={{ fontSize: 14, color: "var(--larch)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</span>
            <span>
              Regionale Anbieter liefern oft günstiger und mit kürzeren Wegen als überregionale Händler.
              <strong> Hervorgehobene Einträge</strong> sind bezahlte Empfehlungen – alle anderen Angaben sind kostenlos und redaktionell gepflegt.
              Lieferant fehlt? <a href="mailto:hallo@holzpreisvergleich.de" style={{ color: "var(--larch)" }}>Eintrag anfragen</a>.
            </span>
          </div>

          {/* Such- und Filterleiste */}
          <div className="supplier-filters">
            <div className="supplier-search-wrap">
              <label className="sr-only" htmlFor="supplier-search">Ort, PLZ oder Name suchen</label>
              <input
                id="supplier-search"
                className="input"
                type="search"
                placeholder="Ort, PLZ oder Name …"
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                style={{ maxWidth: 280 }}
              />
            </div>
            <div className="filter-group" role="group" aria-label="Nach Holzart filtern">
              <span className="filter-label" aria-hidden="true">Holzart</span>
              {["Alle", "Buche", "Eiche", "Birke", "Kiefer"].map(v => (
                <button
                  key={v}
                  className={`filter-btn${supplierHolzfilt === v ? " filter-btn--on" : ""}`}
                  onClick={() => setSupplierHolzfilt(v)}
                  aria-pressed={supplierHolzfilt === v}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Lieferantenkarten */}
          {suppliersStatus === "loading" && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink3)" }}>
              <div style={{ fontSize: 13 }}>Lieferanten werden geladen …</div>
            </div>
          )}
          {suppliersStatus === "error" && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink3)" }}>
              <div style={{ fontSize: 13, color: "var(--red-warn)" }}>Lieferanten konnten nicht geladen werden.</div>
            </div>
          )}
          {suppliersStatus === "ok" && (() => {
            const q = supplierSearch.toLowerCase().trim();
            const filtered = suppliers
              .filter(s =>
                (!q || s.name.toLowerCase().includes(q) || s.ort.toLowerCase().includes(q) || s.plz.includes(q) || s.region.toLowerCase().includes(q)) &&
                (supplierHolzfilt === "Alle" || s.holzarten.includes(supplierHolzfilt))
              )
              .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

            if (filtered.length === 0) return (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink3)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">◭</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>Kein Lieferant gefunden</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Suchbegriff anpassen oder Filter zurücksetzen</div>
              </div>
            );

            return (
              <div className="supplier-grid" role="list">
                {filtered.map(s => (
                  <article key={s.id} className={`supplier-card${s.featured ? " supplier-card--featured" : ""}`} role="listitem">
                    <div className="supplier-card-head">
                      <div>
                        <div className="supplier-name">{s.name}</div>
                        <div className="supplier-location">
                          {s.plz} {s.ort} · {s.region}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                        {s.featured && <span className="badge b-larch">Empfohlen</span>}
                        {s.zertifiziert && <span className="badge b-green" title="Nachhaltige Forstwirtschaft zertifiziert">✓ Zertifiziert</span>}
                      </div>
                    </div>

                    <p className="supplier-desc">{s.beschreibung}</p>

                    <div className="supplier-holzarten" aria-label={`Holzarten: ${s.holzarten.join(', ')}`}>
                      {s.holzarten.map(h => <span key={h} className="supplier-holzart">{h}</span>)}
                    </div>

                    <div className="supplier-footer">
                      <div className="supplier-meta">
                        {s.liefert_ab_rm && <span>Lieferung ab {s.liefert_ab_rm} rm</span>}
                        {s.tel && <a href={`tel:${s.tel.replace(/\s/g, "")}`} className="supplier-contact">{s.tel}</a>}
                      </div>
                      {s.website && (
                        <a
                          href={s.website}
                          className="btn-ghost"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${s.name} Website öffnen (öffnet in neuem Tab)`}
                          style={{ fontSize: 13, padding: "6px 14px" }}
                        >
                          Website →
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            );
          })()}

          <p className="footnote" style={{ marginTop: 20, display: suppliersStatus !== "ok" ? "none" : undefined }}>
            Alle Angaben ohne Gewähr · Hervorgehobene Einträge sind bezahlte Werbung · Stand: {new Date().getFullYear()}
          </p>

        </div>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} holzpreisvergleich.de · Kein Backend, keine Cookies · Angaben ohne Gewähr</span>
          <nav className="footer-links" aria-label="Weitere Seiten">
            <a className="footer-link" href="/umrechner/">Umrechner</a>
            <a className="footer-link" href="/holzarten/">Holzarten</a>
            <a className="footer-link" href="/ratgeber/">Ratgeber</a>
          </nav>
          <nav className="footer-links" aria-label="Rechtliches">
            <button className="footer-link" onClick={() => setModal("kontakt")}>Kontakt</button>
            <button className="footer-link" onClick={() => setModal("impressum")}>Impressum</button>
            <button className="footer-link" onClick={() => setModal("datenschutz")}>Datenschutz</button>
            <a className="kofi-link" href="https://buymeacoffee.com/philsmith91" target="_blank" rel="noopener noreferrer" aria-label="Entwicklung unterstützen (öffnet in neuem Tab)">
              ☕ Kaffee spendieren
            </a>
          </nav>
        </div>
      </footer>

      {/* ══ Modals ══ */}
      {modal === "kontakt" && (
        <Modal id="kontakt" title="Kontakt" onClose={closeModal}>
          {formState === "sent" ? (
            <div className="form-success">
              <div className="form-success-icon" aria-hidden="true">✓</div>
              <div className="form-success-title">Nachricht gesendet!</div>
              <p>Ich melde mich so schnell wie möglich bei Ihnen.</p>
              <button className="btn-ghost" onClick={closeModal}>Schließen</button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} noValidate>
              <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 20 }}>
                Fragen zum Tool, Feedback oder Interesse an einem <strong>Lieferanten-Eintrag</strong>?
                Schreiben Sie uns gerne.
              </p>
              <div className="form-row">
                <label className="label" htmlFor="c-name">Name</label>
                <input id="c-name" name="name" className="input" type="text" placeholder="Ihr Name" required maxLength={80} />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="c-email">E-Mail</label>
                <input id="c-email" name="email" className="input" type="email" placeholder="ihre@email.de" required />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="c-betreff">Betreff</label>
                <select id="c-betreff" name="betreff" className="input">
                  <option value="feedback">Feedback / Fehler melden</option>
                  <option value="lieferant">Lieferanten-Eintrag anfragen</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="c-msg">Nachricht</label>
                <textarea id="c-msg" name="message" className="input" rows={5} placeholder="Ihre Nachricht …" required maxLength={2000} style={{ resize: "vertical" }} />
              </div>
              {formState === "error" && (
                <div style={{ fontSize: 13, color: "var(--red-warn)", marginBottom: 12 }}>
                  Fehler beim Senden – bitte versuchen Sie es erneut oder schreiben Sie direkt an hallo@holzpreisvergleich.de
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn-ghost" onClick={closeModal}>Abbrechen</button>
                <button
                  type="submit"
                  className="affiliate-btn"
                  disabled={formState === "sending"}
                  style={{ opacity: formState === "sending" ? 0.6 : 1 }}
                >
                  {formState === "sending" ? "Wird gesendet …" : "Absenden"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {modal === "impressum" && (
        <Modal id="impressum" title="Impressum" onClose={closeModal}>
          <div className="legal-text">
            <h3>Angaben gemäß § 5 TMG</h3>
            <p>
              Philipp Schmidt<br />
              Dachteler Bergstraße 48<br />
              71134 Aidlingen
            </p>
            <h3>Kontakt</h3>
            <p>
              E-Mail: <a href="mailto:hallo@holzpreisvergleich.de">hallo@holzpreisvergleich.de</a>
            </p>
            <h3>Hinweis zu Affiliate-Links</h3>
            <p>
              Diese Website enthält Affiliate-Links zum Amazon Partnerprogramm. Als Amazon-Partner
              verdiene ich an qualifizierten Käufen eine Provision. Der Kaufpreis für Sie ändert
              sich dadurch nicht. Affiliate-Links sind als „Werbung" gekennzeichnet.
            </p>
            <h3>Haftung für Inhalte</h3>
            <p>
              Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte kann keine Gewähr übernommen werden.
              Alle Berechnungen sind Näherungswerte und dienen nur zur Orientierung.
            </p>
            <h3>Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter. Auf deren Inhalte haben
              wir keinen Einfluss und übernehmen keine Haftung.
            </p>
          </div>
        </Modal>
      )}

      {modal === "datenschutz" && (
        <Modal id="datenschutz" title="Datenschutzerklärung" onClose={closeModal}>
          <div className="legal-text">
            <h3>1. Verantwortlicher</h3>
            <p>
              Philipp Schmidt, Dachteler Bergstraße 48, 71134 Aidlingen<br />
              E-Mail: <a href="mailto:hallo@holzpreisvergleich.de">hallo@holzpreisvergleich.de</a>
            </p>
            <h3>2. Grundsatz: keine Datenerhebung</h3>
            <p>
              Diese Website verwendet <strong>keine Cookies</strong>, kein Tracking und kein Analytics.
              Alle Berechnungen finden ausschließlich in Ihrem Browser statt – keine Daten werden
              an einen Server übertragen oder gespeichert.
            </p>
            <h3>3. Kontaktformular</h3>
            <p>
              Das Kontaktformular wird von <strong>Formspree</strong> (Formspree, Inc., USA) verarbeitet.
              Wenn Sie das Formular absenden, werden Name, E-Mail-Adresse und Nachricht an Formspree
              übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung).
              Weitere Informationen: <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">formspree.io/legal/privacy-policy</a>
            </p>
            <h3>4. Affiliate-Links (Amazon)</h3>
            <p>
              Diese Website nimmt am Amazon Partnerprogramm teil. Beim Klick auf Affiliate-Links
              werden Sie zu Amazon weitergeleitet. Amazon kann dabei Cookies setzen. Nähere
              Informationen finden Sie in der Datenschutzerklärung von Amazon.
            </p>
            <h3>5. Externe Links (Lieferanten)</h3>
            <p>
              Die verlinkten Lieferanten-Websites sind eigenverantwortliche Angebote Dritter.
              Deren Datenschutzerklärungen gelten beim Besuch dieser Seiten.
            </p>
            <h3>6. Hosting</h3>
            <p>
              Die Website wird bei <strong>GitHub Pages</strong> (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) gehostet. Beim Aufruf der Seite wird Ihre
              IP-Adresse im Rahmen der technischen Notwendigkeit verarbeitet und in Server-Logs
              gespeichert (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO).
            </p>
            <h3>7. Ihre Rechte</h3>
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
              Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit.
              Wenden Sie sich dazu an die oben genannte Kontaktadresse.
            </p>
            <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 20 }}>
              Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </p>
          </div>
        </Modal>
      )}

    </div>
  );
}
