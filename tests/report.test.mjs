import assert from "node:assert/strict";
import test from "node:test";
import { buildMarkdownReport, buildRtfReport, reportFileName } from "../lib/report.mjs";

const base = {
  generatedAt: "7 agosto 2026",
  technician: { name: "", qualification: "Tecnico abilitato", register: "", registrationNumber: "", office: "Località di esempio" },
  unit: { caseName: "Caso dimostrativo", municipality: "Comune fittizio", censusZone: "", sheet: "", parcel: "", sub: "", category: "A/2", cadastralClass: "2", rent: 800, currentTariff: 0, nextTariff: 0 },
  coherence: "yes",
  changes: [],
  works: [],
  inventoryConfirmed: true,
  analysisPath: "plants",
  recommendedPath: "plants",
  overrideReason: "",
  plants: [{ typeId: "photovoltaic", description: "Fotovoltaico", variant: "Su edificio", interventionNature: "new", powerKw: 6, year: 2023, cost: 10_000, costBasis: "reproduction", applyReproductionUplift: false, costSource: "Computo metrico", usefulLife: 20, residual: 0, share: 100 }],
  calculation: { status: "valid", coefficientVersion: "test-v1", rows: [{ adjustedValue: 3_000, normalizedNewValue: 10_000, upliftFactor: 1, exclusionReason: null, issues: [] }], multiplier: 100, valueBefore: 80_000, plantValue: 3_000, valueAfter: 83_000, incidence: 3.75, threshold: 15, thresholdSource: "benchmark", localGap: null, convergenceStatus: "benchmark-only" },
  factors: [],
  evidence: {},
  notes: "Verifica effettuata su documentazione disponibile.",
  result: { title: "Sotto il riferimento", text: "Non emerge incremento apprezzabile.", confidence: "Media", method: "21/E + benchmark", actions: ["Conservare il calcolo"] },
};

test("adds placeholders only for missing report fields", () => {
  const markdown = buildMarkdownReport(base);
  assert.match(markdown, /Nome e cognome: \[\[DA INSERIRE: NOME E COGNOME DEL TECNICO\]\]/);
  assert.match(markdown, /Qualifica professionale: Tecnico abilitato/);
  assert.doesNotMatch(markdown, /DA INSERIRE: COMUNE/);
});

test("describes the selected plant method and calculated values", () => {
  const markdown = buildMarkdownReport(base);
  assert.match(markdown, /Metodo economico per il mero ampliamento impiantistico/);
  assert.match(markdown, /Incidenza calcolata: 3,75%/);
  assert.match(markdown, /Regola catastale specifica/);
  assert.match(markdown, /Fonte del valore: Computo metrico/);
  assert.match(markdown, /Base economica dichiarata: Costo di riproduzione chiavi in mano/);
  assert.match(markdown, /Versione tabella coefficienti: test-v1/);
});

test("creates an RTF document with unicode escapes", () => {
  const rtf = buildRtfReport(base);
  assert.match(rtf, /^\{\\rtf1/);
  assert.match(rtf, /\\u/);
});

test("creates a safe report filename", () => {
  assert.equal(reportFileName("Pratica Èlite / 2026", "md"), "pratica-elite-2026-relazione.md");
});
