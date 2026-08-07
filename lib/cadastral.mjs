import { photovoltaicExclusion } from "./plants.mjs";

export const coefficients = Object.freeze({
  1988: 1,
  1989: 1,
  1990: 0.9123,
  1991: 0.8574,
  1992: 0.8132,
  1993: 0.7804,
  1994: 0.7512,
  1995: 0.7127,
  1996: 0.686,
  1997: 0.6747,
  1998: 0.6624,
  1999: 0.6521,
  2000: 0.6357,
  2001: 0.6293,
  2002: 0.6049,
  2003: 0.59,
  2004: 0.5788,
  2005: 0.569,
  2006: 0.5577,
  2007: 0.5485,
  2008: 0.531,
  2009: 0.5274,
  2010: 0.5192,
  2011: 0.5058,
  2012: 0.4874,
  2013: 0.4852,
  2014: 0.4838,
  2015: 0.4873,
  2016: 0.4852,
  2017: 0.4799,
  2018: 0.4747,
  2019: 0.4743,
  2020: 0.4472,
  2021: 0.4652,
  2022: 0.4304,
  2023: 0.4084,
  2024: 0.4083,
  2025: 0.3993,
  2026: 0.3968,
});

export function multiplierFor(category) {
  if (category === "A/10") return 50;
  if (category === "C/1") return 34;
  if (category.startsWith("D/E")) return null;
  return 100;
}

/**
 * Valore medio infracensuario con periodo di vigenza degli estimi pari a dieci anni.
 * Formula coerente con la tabella vita utile / valore residuo del foglio di origine.
 */
export function depreciationFactor(usefulLife, residual) {
  if (!Number.isFinite(usefulLife) || usefulLife <= 0) return 0;
  const boundedResidual = Math.min(100, Math.max(0, residual)) / 100;
  return Math.max(0, 1 - ((1 - boundedResidual) * 10) / (2 * usefulLife));
}

export function calculatePlant(plant) {
  const coefficient = coefficients[plant.year] ?? 0;
  const depreciation = depreciationFactor(plant.usefulLife, plant.residual);
  const boundedShare = Math.min(100, Math.max(0, plant.share));
  const ordinaryNewValue = Math.max(0, Number(plant.cost) || 0);
  const baselineValue = plant.interventionNature === "improving_replacement"
    ? Math.max(0, Number(plant.baselineCost) || 0)
    : 0;
  const assessableCost = plant.interventionNature === "equivalent_replacement"
    ? 0
    : Math.max(0, ordinaryNewValue - baselineValue);
  const allocatedCost = assessableCost * (boundedShare / 100);
  const exclusion = photovoltaicExclusion(plant);
  const exclusionReason = plant.alreadyIncluded
    ? "Valore già riflesso nella rendita in atti"
    : plant.interventionNature === "equivalent_replacement"
      ? "Sostituzione equivalente senza incremento autonomo"
      : exclusion?.label ?? null;
  const adjustedValue = exclusionReason
    ? 0
    : allocatedCost * depreciation * coefficient;

  return {
    ...plant,
    coefficient,
    depreciation,
    ordinaryNewValue,
    baselineValue,
    assessableCost,
    allocatedCost,
    adjustedValue,
    exclusion,
    exclusionReason,
  };
}

export function tariffGap(currentTariff, nextTariff) {
  if (!Number.isFinite(currentTariff) || !Number.isFinite(nextTariff)) return null;
  if (currentTariff <= 0 || nextTariff <= currentTariff) return null;
  return ((nextTariff - currentTariff) / currentTariff) * 100;
}

export function evaluateComparison(factors) {
  const values = Object.values(factors);
  const superior = values.filter((value) => value === "superior").length;
  const aligned = values.filter((value) => value === "aligned").length;
  const unchanged = values.filter((value) => value === "unchanged").length;
  const unknown = values.filter((value) => value === "unknown").length;

  if (unknown === values.length || values.length === 0) {
    return { status: "inconclusive", superior, aligned, unchanged, unknown };
  }
  if (superior > 0) {
    return { status: "review", superior, aligned, unchanged, unknown };
  }
  if (unknown > 0) {
    return { status: "inconclusive", superior, aligned, unchanged, unknown };
  }
  return { status: "ordinary", superior, aligned, unchanged, unknown };
}

export function calculateScenario({
  category,
  rent,
  plants,
  currentTariff = 0,
  nextTariff = 0,
}) {
  const multiplier = multiplierFor(category);
  const rows = plants.map(calculatePlant);
  const plantValue = rows.reduce((sum, row) => sum + row.adjustedValue, 0);
  const valueBefore = multiplier ? Math.max(0, rent) * multiplier : 0;
  const incidence = valueBefore > 0 ? (plantValue / valueBefore) * 100 : 0;
  const localGap = tariffGap(currentTariff, nextTariff);
  const threshold = localGap ?? 15;
  const thresholdSource = localGap === null ? "benchmark" : "local-tariff";
  const margin = incidence - threshold;
  const benchmarkMet = incidence >= 15;
  const localGapMet = localGap === null ? null : incidence >= localGap;
  const convergenceStatus = localGap === null
    ? "benchmark-only"
    : benchmarkMet === localGapMet
      ? benchmarkMet ? "convergent-above" : "convergent-below"
      : "borderline";
  const excludedRows = rows.filter(({ exclusionReason }) => exclusionReason);

  return {
    multiplier,
    rows,
    plantValue,
    valueBefore,
    valueAfter: valueBefore + plantValue,
    incidence,
    localGap,
    threshold,
    thresholdSource,
    margin,
    meetsThreshold: incidence >= threshold,
    benchmarkMet,
    localGapMet,
    convergenceStatus,
    excludedRows,
  };
}
