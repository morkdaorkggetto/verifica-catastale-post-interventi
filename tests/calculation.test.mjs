import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePlant,
  calculateScenario,
  depreciationFactor,
  evaluateComparison,
  multiplierFor,
  tariffGap,
} from "../lib/cadastral.mjs";

const basePlant = {
  id: 1,
  description: "Fotovoltaico",
  year: 2023,
  cost: 100_000,
  usefulLife: 20,
  residual: 0,
  share: 100,
  alreadyIncluded: false,
};

test("uses the infracensual depreciation implied by the source table", () => {
  assert.equal(depreciationFactor(10, 0), 0.5);
  assert.equal(depreciationFactor(20, 0), 0.75);
  assert.equal(depreciationFactor(20, 20), 0.8);
});

test("uses category-specific multipliers", () => {
  assert.equal(multiplierFor("A/2"), 100);
  assert.equal(multiplierFor("A/10"), 50);
  assert.equal(multiplierFor("C/1"), 34);
  assert.equal(multiplierFor("D/E o categoria speciale"), null);
});

test("calculates a 2023 plant at the 1988-89 epoch", () => {
  const result = calculatePlant(basePlant);
  assert.equal(result.coefficient, 0.4084);
  assert.equal(result.depreciation, 0.75);
  assert.equal(result.adjustedValue, 30_630);
});

test("allocates shared plants and excludes values already in the current rent", () => {
  assert.equal(calculatePlant({ ...basePlant, share: 40 }).adjustedValue, 12_252);
  assert.equal(calculatePlant({ ...basePlant, alreadyIncluded: true }).adjustedValue, 0);
});

test("calculates incidence against the category value before works", () => {
  const result = calculateScenario({ category: "A/2", rent: 800, plants: [basePlant] });
  assert.equal(result.valueBefore, 80_000);
  assert.equal(result.plantValue, 30_630);
  assert.equal(Number(result.incidence.toFixed(4)), 38.2875);
  assert.equal(result.threshold, 15);
  assert.equal(result.meetsThreshold, true);
});

test("uses the actual gap between contiguous local tariffs when supplied", () => {
  assert.equal(Number(tariffGap(72.3, 85.22).toFixed(2)), 17.87);
  const result = calculateScenario({
    category: "A/2",
    rent: 800,
    plants: [basePlant],
    currentTariff: 72.3,
    nextTariff: 85.22,
  });
  assert.equal(result.thresholdSource, "local-tariff");
  assert.equal(Number(result.threshold.toFixed(2)), 17.87);
});

test("keeps qualitative comparison non-numeric", () => {
  assert.equal(evaluateComparison({ envelope: "aligned", plants: "unchanged" }).status, "ordinary");
  assert.equal(evaluateComparison({ envelope: "superior", plants: "aligned" }).status, "review");
  assert.equal(evaluateComparison({ envelope: "unknown", plants: "aligned" }).status, "inconclusive");
});
