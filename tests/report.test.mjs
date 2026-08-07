import assert from "node:assert/strict";
import test from "node:test";
import { buildMarkdownReport, buildRtfReport, reportFileName } from "../lib/report.mjs";

const base = {
  generatedAt: "7 agosto 2026",
  technician: { name: "", qualification: "Architetto", register: "", registrationNumber: "", office: "Napoli" },
  unit: { caseName: "Caso Rossi", municipality: "Giugliano in Campania", censusZone: "", sheet: "53", parcel: "362", sub: "15", category: "A/2", cadastralClass: "2", rent: 800, currentTariff: 0, nextTariff: 0 },
  coherence: "yes",
  changes: [],
  analysisPath: "plants",
  plants: [{ description: "Fotovoltaico", year: 2023, cost: 10_000, share: 100 }],
  calculation: { rows: [{ adjustedValue: 3_000 }], multiplier: 100, valueBefore: 80_000, plantValue: 3_000, valueAfter: 83_000, incidence: 3.75, threshold: 15, thresholdSource: "benchmark" },
  factors: [],
  evidence: {},
  notes: "Verifica effettuata su documentazione disponibile.",
  result: { title: "Sotto il riferimento", text: "Non emerge incremento apprezzabile.", confidence: "Media", method: "21/E + benchmark", actions: ["Conservare il calcolo"] },
};

test("adds placeholders only for missing report fields", () => {
  const markdown = buildMarkdownReport(base);
  assert.match(markdown, /Nome e cognome: \[\[DA INSERIRE: NOME E COGNOME DEL TECNICO\]\]/);
  assert.match(markdown, /Qualifica professionale: Architetto/);
  assert.doesNotMatch(markdown, /DA INSERIRE: COMUNE/);
});

test("describes the selected plant method and calculated values", () => {
  const markdown = buildMarkdownReport(base);
  assert.match(markdown, /Metodo economico per il mero ampliamento impiantistico/);
  assert.match(markdown, /Incidenza calcolata: 3,75%/);
});

test("creates an RTF document with unicode escapes", () => {
  const rtf = buildRtfReport(base);
  assert.match(rtf, /^\{\\rtf1/);
  assert.match(rtf, /\\u/);
});

test("creates a safe report filename", () => {
  assert.equal(reportFileName("Pratica Èlite / 2026", "md"), "pratica-elite-2026-relazione.md");
});
