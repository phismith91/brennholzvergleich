import { describe, it, expect } from 'vitest';
import { berechneAngebot, berechneErgebnisse } from './calc.js';

const conv = { rm: '1.4', srm: '2.0' };

function pos(overrides = {}) {
  return { id: 'p1', menge: '1', preis: '140', einheit: 'fm', holzart: 'buche', feuchte: 'ofenfertig', ...overrides };
}

function offer(positionen, overrides = {}) {
  return { id: 'o1', lieferkosten: '0', positionen, ...overrides };
}

describe('berechneAngebot – Einheiten-Umrechnung', () => {
  it('fm bleibt 1:1', () => {
    const r = berechneAngebot(offer([pos({ menge: '2', einheit: 'fm' })]), conv);
    expect(r.totalFm).toBeCloseTo(2);
  });

  it('rm wird mit Standardfaktor 1,4 zu fm umgerechnet', () => {
    // 1.4 rm = 1 fm
    const r = berechneAngebot(offer([pos({ menge: '1.4', einheit: 'rm' })]), conv);
    expect(r.totalFm).toBeCloseTo(1, 5);
  });

  it('srm wird mit Standardfaktor 2,0 zu fm umgerechnet', () => {
    const r = berechneAngebot(offer([pos({ menge: '2', einheit: 'srm' })]), conv);
    expect(r.totalFm).toBeCloseTo(1, 5);
  });

  it('respektiert angepasste Umrechnungsfaktoren', () => {
    const r = berechneAngebot(offer([pos({ menge: '1.5', einheit: 'rm' })]), { rm: '1.5', srm: '2.0' });
    expect(r.totalFm).toBeCloseTo(1, 5);
  });

  it('fällt bei Umrechnungsfaktor "0" auf den Standardwert zurück statt Infinity/0€ zu produzieren', () => {
    // input hat min="1", verhindert aber kein Freitext-"0" - darf nicht zu 1/0=Infinity -> perFm=0 führen
    const r = berechneAngebot(offer([pos({ menge: '5', preis: '200', einheit: 'rm' })]), { rm: '0', srm: '2.0' });
    expect(Number.isFinite(r.totalFm)).toBe(true);
    expect(r.perFm).toBeGreaterThan(0);
  });

  it('fällt bei negativem Umrechnungsfaktor auf den Standardwert zurück', () => {
    const r = berechneAngebot(offer([pos({ menge: '5', preis: '200', einheit: 'srm' })]), { rm: '1.4', srm: '-2' });
    expect(r.totalFm).toBeGreaterThan(0);
    expect(r.perFm).toBeGreaterThan(0);
  });
});

describe('berechneAngebot – Preis pro fm', () => {
  it('normalisiert Preis inkl. Lieferkosten auf €/fm', () => {
    const r = berechneAngebot(offer([pos({ menge: '2', preis: '200', einheit: 'fm' })], { lieferkosten: '20' }), conv);
    expect(r.totalPreis).toBe(220);
    expect(r.perFm).toBeCloseTo(110);
  });

  it('summiert mehrere Positionen (Mischlieferung)', () => {
    const r = berechneAngebot(offer([
      pos({ id: 'p1', menge: '1', preis: '140', einheit: 'fm', holzart: 'buche' }),
      pos({ id: 'p2', menge: '1', preis: '100', einheit: 'fm', holzart: 'fichte' }),
    ]), conv);
    expect(r.totalFm).toBeCloseTo(2);
    expect(r.totalPreis).toBe(240);
    expect(r.perFm).toBeCloseTo(120);
  });
});

describe('berechneAngebot – Holzfeuchte-Korrektur für €/kWh', () => {
  it('ofenfertig nutzt vollen Heizwert', () => {
    const r = berechneAngebot(offer([pos({ menge: '1', preis: '140', holzart: 'buche', feuchte: 'ofenfertig' })]), conv);
    expect(r.totalKwh).toBeCloseTo(2100);
  });

  it('frisches Holz reduziert nutzbare kWh um den Feuchte-Faktor', () => {
    const r = berechneAngebot(offer([pos({ menge: '1', preis: '140', holzart: 'buche', feuchte: 'frisch' })]), conv);
    expect(r.totalKwh).toBeCloseTo(2100 * 0.6);
    expect(r.perKwh).toBeCloseTo(140 / (2100 * 0.6));
  });

  it('perKwh ist null wenn Holzart fehlt', () => {
    const r = berechneAngebot(offer([pos({ holzart: '' })]), conv);
    expect(r.totalKwh).toBeNull();
    expect(r.perKwh).toBeNull();
  });
});

describe('berechneAngebot – Funkenflug-Warnung', () => {
  it('markiert Holzarten mit hohem Funkenflug', () => {
    const r = berechneAngebot(offer([pos({ holzart: 'fichte' })]), conv);
    expect(r.funkWarn).toHaveLength(1);
    expect(r.funkWarn[0].id).toBe('fichte');
  });

  it('keine Warnung bei geringem Funkenflug', () => {
    const r = berechneAngebot(offer([pos({ holzart: 'buche' })]), conv);
    expect(r.funkWarn).toHaveLength(0);
  });
});

describe('berechneAngebot – ungültige Eingaben', () => {
  it('ok:false wenn keine Position valide ist (Menge fehlt)', () => {
    const r = berechneAngebot(offer([pos({ menge: '' })]), conv);
    expect(r.ok).toBe(false);
  });

  it('ok:false bei negativem Preis', () => {
    const r = berechneAngebot(offer([pos({ preis: '-5' })]), conv);
    expect(r.ok).toBe(false);
  });

  it('ignoriert ungültige Position, wertet valide trotzdem aus', () => {
    const r = berechneAngebot(offer([pos({ id: 'bad', menge: '0' }), pos({ id: 'good' })]), conv);
    expect(r.ok).toBe(true);
    expect(r.posCalc).toHaveLength(1);
  });
});

describe('berechneErgebnisse', () => {
  it('berechnet mehrere Angebote unabhängig voneinander', () => {
    const results = berechneErgebnisse([
      offer([pos({ menge: '1', preis: '100' })], { id: 'a' }),
      offer([pos({ menge: '1', preis: '200' })], { id: 'b' }),
    ], conv);
    expect(results).toHaveLength(2);
    expect(results[0].perFm).toBeCloseTo(100);
    expect(results[1].perFm).toBeCloseTo(200);
  });
});
