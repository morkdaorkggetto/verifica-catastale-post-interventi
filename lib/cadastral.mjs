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

export const coefficientMetadata = Object.freeze({
  version: "trento-2026-unverified-v1",
  source: "Foglio 2026 del Collegio Geometri e Geometri Laureati della Provincia di Trento",
  status: "provisional",
  warnings: Object.freeze({
    2020: "Il coefficiente 2020 (0,4472) presenta un'anomalia interna e non è stato validato su una fonte statistica primaria.",
  }),
});

const categoryMultipliers = Object.freeze({
  "A/1": 100, "A/2": 100, "A/3": 100, "A/4": 100, "A/5": 100, "A/6": 100,
  "A/7": 100, "A/8": 100, "A/9": 100, "A/10": 50, "A/11": 100,
  "B/1": 100, "B/2": 100, "B/3": 100, "B/4": 100, "B/5": 100, "B/6": 100,
  "B/7": 100, "B/8": 100,
  "C/1": 34, "C/2": 100, "C/3": 100, "C/4": 100, "C/5": 100, "C/6": 100, "C/7": 100,
});

function issue(severity, code, message, row = null) {
  return { severity, code, message, row };
}

export function validationStatus(issues) {
  if (issues.some(({ severity }) => severity === "invalid")) return "invalid";
  if (issues.some(({ severity }) => severity === "warning")) return "warning";
  return "valid";
}

export function multiplierFor(category) {
  return categoryMultipliers[String(category || "").trim().toUpperCase()] ?? null;
}

export function categoryKind(category) {
  const normalized = String(category || "").trim().toUpperCase();
  if (Object.hasOwn(categoryMultipliers, normalized)) return "ordinary";
  if (/^[DE]\/[0-9]+$/.test(normalized) || normalized.startsWith("D/E")) return "special";
  return "invalid";
}

/**
 * Valore medio infracensuario con periodo di vigenza degli estimi pari a dieci anni.
 * Formula coerente con la tabella vita utile / valore residuo del foglio di origine.
 */
export function depreciationFactor(usefulLife, residual) {
  if (!Number.isFinite(usefulLife) || usefulLife <= 0) return null;
  if (!Number.isFinite(residual) || residual < 0 || residual > 100) return null;
  const factor = 1 - ((1 - residual / 100) * 10) / (2 * usefulLife);
  return factor >= 0 && factor <= 1 ? factor : null;
}

export function calculatePlant(plant, index = 0) {
  const issues = [];
  const coefficient = coefficients[plant.year];
  const depreciation = depreciationFactor(plant.usefulLife, plant.residual);
  const share = Number(plant.share);
  const ordinaryNewValue = Number(plant.cost);
  const baselineValue = plant.interventionNature === "improving_replacement"
    ? Number(plant.baselineCost)
    : 0;
  const costBasis = plant.costBasis || "";
  const appliesUplift = Boolean(plant.applyReproductionUplift);
  const upliftFactor = appliesUplift ? Number(plant.upliftFactor) : 1;
  const exclusion = photovoltaicExclusion(plant);
  const exclusionReason = plant.alreadyIncluded
    ? "Valore già riflesso nella rendita in atti"
    : plant.interventionNature === "equivalent_replacement"
      ? "Sostituzione equivalente senza incremento autonomo"
      : exclusion?.label ?? null;

  if (!exclusionReason) {
    if (coefficient === undefined) issues.push(issue("invalid", "coefficient-missing", `Anno ${plant.year || "non indicato"}: coefficiente di ragguaglio non disponibile.`, index));
    if (coefficientMetadata.warnings[plant.year]) issues.push(issue("warning", "coefficient-suspect", coefficientMetadata.warnings[plant.year], index));
    if (depreciation === null) issues.push(issue("invalid", "depreciation-invalid", "Vita utile e valore residuo non producono un fattore infracensuario valido.", index));
    if (!Number.isFinite(share) || share < 0 || share > 100) issues.push(issue("invalid", "share-invalid", "La quota riferibile alla UIU deve essere compresa tra 0% e 100%.", index));
    if (!Number.isFinite(ordinaryNewValue) || ordinaryNewValue < 0) issues.push(issue("invalid", "cost-invalid", "Il valore a nuovo deve essere un numero non negativo.", index));
    if (plant.interventionNature === "improving_replacement" && (!Number.isFinite(baselineValue) || baselineValue < 0 || baselineValue > ordinaryNewValue)) issues.push(issue("invalid", "baseline-invalid", "Il valore della dotazione equivalente deve essere compreso tra zero e il valore a nuovo.", index));
    if (ordinaryNewValue > 0 && !String(plant.costSource || "").trim()) issues.push(issue("invalid", "cost-source-missing", "Indicare la fonte del valore economico.", index));
    if (ordinaryNewValue > 0 && !costBasis) issues.push(issue("invalid", "cost-basis-missing", "Qualificare la base di costo: apparecchiature, fornitura e posa, costo di riproduzione o altra base.", index));
    if (appliesUplift && costBasis !== "supply_install") issues.push(issue("invalid", "uplift-basis-invalid", "Il rialzo al costo di riproduzione può essere applicato soltanto a una base dichiarata di fornitura e posa.", index));
    if (appliesUplift && (!Number.isFinite(upliftFactor) || upliftFactor < 1)) issues.push(issue("invalid", "uplift-invalid", "Il fattore di rialzo deve essere almeno pari a 1.", index));
    if (appliesUplift && !String(plant.upliftSource || "").trim()) issues.push(issue("invalid", "uplift-source-missing", "Indicare la fonte o la motivazione del fattore di rialzo.", index));
    if (ordinaryNewValue > 0 && costBasis === "equipment") issues.push(issue("warning", "equipment-only", "Il solo costo delle apparecchiature non documenta il costo di riproduzione chiavi in mano.", index));
    if (ordinaryNewValue > 0 && costBasis === "supply_install" && !appliesUplift) issues.push(issue("warning", "reproduction-components-missing", "La fornitura e posa non include necessariamente tutte le componenti del costo di riproduzione.", index));
    if (ordinaryNewValue > 0 && costBasis === "other") issues.push(issue("warning", "cost-basis-other", "La base di costo dichiarata richiede una motivazione estimativa nel report.", index));
  }

  const normalizedNewValue = Number.isFinite(ordinaryNewValue) ? ordinaryNewValue * upliftFactor : 0;
  const normalizedBaselineValue = Number.isFinite(baselineValue) ? baselineValue * upliftFactor : 0;
  const assessableCost = plant.interventionNature === "equivalent_replacement" ? 0 : Math.max(0, normalizedNewValue - normalizedBaselineValue);
  const allocatedCost = Number.isFinite(share) ? assessableCost * (share / 100) : 0;
  const status = validationStatus(issues);
  const adjustedValue = exclusionReason || status === "invalid"
    ? 0
    : allocatedCost * depreciation * coefficient;

  return {
    ...plant,
    coefficient,
    depreciation,
    ordinaryNewValue,
    baselineValue,
    normalizedNewValue,
    normalizedBaselineValue,
    costBasis,
    upliftFactor,
    assessableCost,
    allocatedCost,
    adjustedValue,
    exclusion,
    exclusionReason,
    issues,
    status,
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
  const issues = [];
  const kind = categoryKind(category);
  const multiplier = multiplierFor(category);
  if (kind === "invalid") issues.push(issue("invalid", "category-invalid", `Categoria catastale “${category || "non indicata"}” non riconosciuta.`));
  const rows = plants.map((plant, index) => calculatePlant(plant, index));
  issues.push(...rows.flatMap(({ issues: rowIssues }) => rowIssues));
  const plantValue = rows.reduce((sum, row) => sum + row.adjustedValue, 0);
  const numericRent = Number(rent);
  if (kind === "ordinary" && (!Number.isFinite(numericRent) || numericRent < 0)) issues.push(issue("invalid", "rent-invalid", "La rendita deve essere un numero non negativo."));
  const valueBefore = multiplier ? Math.max(0, numericRent) * multiplier : 0;
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
  const status = validationStatus(issues);

  return {
    status,
    issues,
    categoryKind: kind,
    coefficientVersion: coefficientMetadata.version,
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
