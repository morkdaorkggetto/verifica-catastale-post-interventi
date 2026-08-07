export type PlantInput = {
  id: number;
  description: string;
  year: number;
  cost: number;
  usefulLife: number;
  residual: number;
  share: number;
  alreadyIncluded: boolean;
};

export type CalculatedPlant = PlantInput & {
  coefficient: number;
  depreciation: number;
  allocatedCost: number;
  adjustedValue: number;
};

export const coefficients: Readonly<Record<number, number>>;
export function multiplierFor(category: string): number | null;
export function depreciationFactor(usefulLife: number, residual: number): number;
export function calculatePlant(plant: PlantInput): CalculatedPlant;
export function tariffGap(currentTariff: number, nextTariff: number): number | null;
export function evaluateComparison(
  factors: Record<string, "unchanged" | "aligned" | "superior" | "unknown">,
): {
  status: "ordinary" | "review" | "inconclusive";
  superior: number;
  aligned: number;
  unchanged: number;
  unknown: number;
};
export function calculateScenario(input: {
  category: string;
  rent: number;
  plants: PlantInput[];
  currentTariff?: number;
  nextTariff?: number;
}): {
  multiplier: number | null;
  rows: CalculatedPlant[];
  plantValue: number;
  valueBefore: number;
  valueAfter: number;
  incidence: number;
  localGap: number | null;
  threshold: number;
  thresholdSource: "benchmark" | "local-tariff";
  margin: number;
  meetsThreshold: boolean;
};
