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
import { photovoltaicExclusion, plantTypeFor } from "../lib/plants.mjs";

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

test("applies the photovoltaic 3 kW per served unit exclusion", () => {
  const plant = {
    ...basePlant,
    typeId: "photovoltaic",
    powerKw: 6,
    servedUnits: 2,
  };
  assert.equal(photovoltaicExclusion(plant)?.code, "pv-power");
  assert.equal(calculatePlant(plant).adjustedValue, 0);
});

test("applies the photovoltaic ground-volume exclusion independently", () => {
  const plant = {
    ...basePlant,
    typeId: "photovoltaic",
    powerKw: 20,
    servedUnits: 1,
    groundMounted: true,
    groundVolume: 149,
  };
  assert.equal(photovoltaicExclusion(plant)?.code, "pv-ground-volume");
});

test("does not treat a photovoltaic system above the gates as automatically excluded", () => {
  const plant = {
    ...basePlant,
    typeId: "photovoltaic",
    powerKw: 6.1,
    servedUnits: 2,
    groundMounted: false,
  };
  assert.equal(photovoltaicExclusion(plant), null);
  assert.equal(calculatePlant(plant).adjustedValue, 30_630);
});

test("values only the incremental part of an improving replacement", () => {
  const result = calculatePlant({
    ...basePlant,
    interventionNature: "improving_replacement",
    baselineCost: 60_000,
  });
  assert.equal(result.assessableCost, 40_000);
  assert.equal(result.adjustedValue, 12_252);
  assert.equal(calculatePlant({ ...basePlant, interventionNature: "equivalent_replacement" }).adjustedValue, 0);
});

test("exposes technical plant categories without inventing cadastral coefficients", () => {
  assert.equal(plantTypeFor("heat_pump").metricLabel, "Potenza termica utile (kWt)");
  assert.equal(plantTypeFor("solar_thermal").treatment, "technical");
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
  assert.equal(result.convergenceStatus, "convergent-above");
});

test("flags disagreement between the 15 percent benchmark and local tariff gap", () => {
  const result = calculateScenario({
    category: "A/2",
    rent: 2_000,
    plants: [basePlant],
    currentTariff: 100,
    nextTariff: 120,
  });
  assert.equal(Number(result.incidence.toFixed(2)), 15.32);
  assert.equal(result.benchmarkMet, true);
  assert.equal(result.localGapMet, false);
  assert.equal(result.convergenceStatus, "borderline");
});

test("keeps qualitative comparison non-numeric", () => {
  assert.equal(evaluateComparison({ envelope: "aligned", plants: "unchanged" }).status, "ordinary");
  assert.equal(evaluateComparison({ envelope: "superior", plants: "aligned" }).status, "review");
  assert.equal(evaluateComparison({ envelope: "unknown", plants: "aligned" }).status, "inconclusive");
});
