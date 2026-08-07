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
  const allocatedCost = Math.max(0, plant.cost) * (boundedShare / 100);
  const adjustedValue = plant.alreadyIncluded
    ? 0
    : allocatedCost * depreciation * coefficient;

  return { ...plant, coefficient, depreciation, allocatedCost, adjustedValue };
}

export function calculateScenario({ category, rent, plants }) {
  const multiplier = multiplierFor(category);
  const rows = plants.map(calculatePlant);
  const plantValue = rows.reduce((sum, row) => sum + row.adjustedValue, 0);
  const valueBefore = multiplier ? Math.max(0, rent) * multiplier : 0;
  const incidence = valueBefore > 0 ? (plantValue / valueBefore) * 100 : 0;

  return { multiplier, rows, plantValue, valueBefore, incidence };
}
