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

const FEUCHTE = {
  ofenfertig:  { label: "Ofenfertig (≤ 20 %)",  faktor: 1.00 },
  trocken:     { label: "Trocken (≤ 25 %)",      faktor: 0.88 },
  halbtrocken: { label: "Halbtrocken (25–35 %)", faktor: 0.72 },
  frisch:      { label: "Frisch (> 35 %)",       faktor: 0.60 },
};

// Fällt auf den Default zurück, wenn der Faktor nicht positiv-endlich ist (z.B. "0" oder "-1" getippt,
// vom <input min="1"> nicht verhindert) - verhindert Division durch 0 -> Infinity -> stiller 0€-Preis.
function safeFactor(value, fallback) {
  const n = parseFloat(value);
  return n > 0 && Number.isFinite(n) ? n : fallback;
}

// Berechnet ein einzelnes Angebot: Gesamt-fm, Gesamtpreis (inkl. Lieferung), €/fm, €/kWh, Funkenflug-Warnungen.
// Angebot ohne mindestens eine valide Position (Menge > 0, Preis >= 0) liefert { ok: false }.
function berechneAngebot(offer, conv) {
  const fmFaktor = { fm: 1.0, rm: 1 / safeFactor(conv.rm, 1.4), srm: 1 / safeFactor(conv.srm, 2.0) };
  const lief = parseFloat(offer.lieferkosten) || 0;

  const posCalc = offer.positionen.map(p => {
    const menge = parseFloat(p.menge);
    const preis = parseFloat(p.preis);
    if (!menge || !preis || menge <= 0 || preis < 0) return null;
    const fm       = menge * fmFaktor[p.einheit];
    const holz     = HOLZARTEN.find(h => h.id === p.holzart) ?? null;
    const feuchFak = FEUCHTE[p.feuchte]?.faktor ?? 1;
    const kwh      = holz ? holz.heizwert * fm * feuchFak : null;
    return { ...p, fm, preis, holz, feuchFak, kwh };
  });

  const validPos = posCalc.filter(Boolean);
  if (validPos.length === 0) return { ...offer, ok: false };

  const totalFm    = validPos.reduce((s, p) => s + p.fm, 0);
  const totalPreis = validPos.reduce((s, p) => s + p.preis, 0) + lief;
  const totalKwh   = validPos.every(p => p.kwh !== null)
    ? validPos.reduce((s, p) => s + p.kwh, 0)
    : null;

  const perFm  = totalPreis / totalFm;
  const perKwh = totalKwh ? totalPreis / totalKwh : null;

  const alleHolze = validPos.map(p => p.holz).filter(Boolean);
  const funkWarn  = alleHolze.filter(h => h.funkenflug === "Hoch" || h.funkenflug === "Sehr hoch");

  return { ...offer, ok: true, posCalc: validPos, totalFm, totalPreis, lief, perFm, perKwh, totalKwh, alleHolze, funkWarn };
}

function berechneErgebnisse(offers, conv) {
  return offers.map(o => berechneAngebot(o, conv));
}

export { HOLZARTEN, FEUCHTE, berechneAngebot, berechneErgebnisse };
