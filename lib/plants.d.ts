export type PlantTreatment = "specific" | "analogy" | "technical";
export type PlantCatalogItem = {
  id: string;
  group: string;
  label: string;
  treatment: PlantTreatment;
  treatmentLabel: string;
  metric: string;
  metricLabel: string;
  variants: string[];
  note: string;
};
export const plantCatalog: readonly PlantCatalogItem[];
export const interventionNatures: readonly { id: string; label: string; note: string }[];
export function plantTypeFor(typeId: string): PlantCatalogItem;
export function plantNatureFor(natureId: string): { id: string; label: string; note: string };
export function photovoltaicExclusion(plant: Record<string, unknown>): null | {
  code: string;
  label: string;
  source: string;
};
