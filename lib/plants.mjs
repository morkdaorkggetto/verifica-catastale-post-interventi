export const plantCatalog = Object.freeze([
  {
    id: "photovoltaic",
    group: "Produzione e accumulo",
    label: "Impianto fotovoltaico",
    treatment: "specific",
    treatmentLabel: "Regola catastale specifica",
    metric: "powerKw",
    metricLabel: "Potenza nominale (kWp)",
    variants: ["Su edificio", "A terra", "Integrato o parzialmente integrato"],
    note: "La Circolare 36/E/2013 prevede esclusioni specifiche legate a potenza, UIU servite e, per gli impianti a terra, volume convenzionale.",
  },
  {
    id: "storage",
    group: "Produzione e accumulo",
    label: "Sistema di accumulo elettrico",
    treatment: "analogy",
    treatmentLabel: "Analogia estimativa 21/E",
    metric: "capacityKwh",
    metricLabel: "Capacità utile (kWh)",
    variants: ["Abbinato a fotovoltaico", "Stand-alone"],
    note: "La Risoluzione 21/E/2026 include i sistemi di accumulo tra le dotazioni da esaminare, senza fissare un costo o una vita utile nazionale specifici.",
  },
  {
    id: "heat_pump",
    group: "Climatizzazione e ACS",
    label: "Pompa di calore",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "thermalPowerKw",
    metricLabel: "Potenza termica utile (kWt)",
    variants: ["Aria/aria", "Aria/acqua", "Acqua/acqua", "Geotermica", "A gas"],
    note: "La tipologia segue il D.M. 6 agosto 2020. Non esiste un coefficiente catastale nazionale differenziato per tecnologia.",
  },
  {
    id: "hybrid",
    group: "Climatizzazione e ACS",
    label: "Sistema ibrido",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "thermalPowerKw",
    metricLabel: "Potenza termica utile PDC (kWt)",
    variants: ["Pompa di calore + caldaia a condensazione"],
    note: "Classificazione tecnica ENEA per apparecchi concepiti dal fabbricante per funzionare in abbinamento; il dato non determina da solo rilevanza catastale.",
  },
  {
    id: "condensing_boiler",
    group: "Climatizzazione e ACS",
    label: "Caldaia o generatore a condensazione",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "thermalPowerKw",
    metricLabel: "Potenza termica utile (kWt)",
    variants: ["Caldaia ad acqua", "Generatore d’aria calda"],
    note: "La sostituzione equivalente non costituisce automaticamente un incremento; va isolato l’eventuale valore aggiuntivo rispetto alla dotazione già riflessa in atti.",
  },
  {
    id: "biomass",
    group: "Climatizzazione e ACS",
    label: "Generatore a biomassa",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "thermalPowerKw",
    metricLabel: "Potenza termica utile (kWt)",
    variants: ["Caldaia", "Stufa", "Termostufa", "Termocamino"],
    note: "La categoria tecnica deriva dai vademecum ENEA; costo ordinario e quota immobiliare devono essere documentati ai fini catastali.",
  },
  {
    id: "solar_thermal",
    group: "Climatizzazione e ACS",
    label: "Solare termico",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "collectorAreaM2",
    metricLabel: "Superficie collettori (m²)",
    variants: ["Piano vetrato", "Sottovuoto", "A concentrazione", "Non specificato"],
    note: "La Risoluzione 21/E richiama l’applicabilità per analogia agli impianti solari termici; non stabilisce valori unitari catastali nazionali.",
  },
  {
    id: "hp_water_heater",
    group: "Climatizzazione e ACS",
    label: "Scaldacqua a pompa di calore",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "storageLitres",
    metricLabel: "Volume di accumulo (litri)",
    variants: ["Fino a 150 litri", "Oltre 150 litri"],
    note: "Tipologia prevista dal D.M. 6 agosto 2020. Una sostituzione equivalente va distinta da un effettivo ampliamento della dotazione.",
  },
  {
    id: "micro_cogeneration",
    group: "Produzione e accumulo",
    label: "Microcogeneratore",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "electricPowerKw",
    metricLabel: "Potenza elettrica (kWe)",
    variants: ["Motore endotermico", "Cella a combustibile", "Altro"],
    note: "Il D.M. 6 agosto 2020 definisce microcogeneratori gli impianti sotto 50 kWe; la soglia è tecnica e non equivale a un’esclusione catastale.",
  },
  {
    id: "building_automation",
    group: "Controllo e servizi",
    label: "Building automation",
    treatment: "technical",
    treatmentLabel: "Classificazione ENEA + analogia 21/E",
    metric: "servedAreaM2",
    metricLabel: "Superficie servita (m²)",
    variants: ["Controllo impianti", "Gestione integrata"],
    note: "La classificazione ENEA serve a descrivere la dotazione; la rilevanza catastale resta da motivare rispetto all’ordinarietà locale.",
  },
  {
    id: "ev_charging",
    group: "Controllo e servizi",
    label: "Infrastruttura di ricarica veicoli",
    treatment: "analogy",
    treatmentLabel: "Analogia estimativa 21/E",
    metric: "electricPowerKw",
    metricLabel: "Potenza complessiva (kW)",
    variants: ["Punto singolo", "Più punti", "Infrastruttura condominiale"],
    note: "Non è disponibile una regola catastale nazionale specifica per la tipologia; occorre verificare stabilità, pertinenza e incidenza sulla UIU.",
  },
  {
    id: "other_fixed",
    group: "Altri impianti",
    label: "Altro impianto fisso",
    treatment: "analogy",
    treatmentLabel: "Analogia estimativa 21/E",
    metric: "quantity",
    metricLabel: "Quantità o consistenza",
    variants: ["Altro"],
    note: "Descrivere il bene e documentare perché costituisce una dotazione stabile e un effettivo ampliamento rispetto allo stato già censito.",
  },
]);

export const interventionNatures = Object.freeze([
  { id: "new", label: "Nuova installazione", note: "Si considera il valore ordinario pertinente alla UIU." },
  { id: "expansion", label: "Ampliamento o potenziamento", note: "Si considera soltanto la parte aggiunta rispetto alla dotazione già censita." },
  { id: "equivalent_replacement", label: "Sostituzione equivalente", note: "Non genera valore incrementale nel modello: ripristina una dotazione già riflessa in atti." },
  { id: "improving_replacement", label: "Sostituzione migliorativa", note: "Si considera la differenza documentata tra valore nuovo e valore della dotazione equivalente preesistente." },
]);

export function plantTypeFor(typeId) {
  return plantCatalog.find(({ id }) => id === typeId) ?? plantCatalog[plantCatalog.length - 1];
}

export function plantNatureFor(natureId) {
  return interventionNatures.find(({ id }) => id === natureId) ?? interventionNatures[0];
}

export function photovoltaicExclusion(plant) {
  if (plant.typeId !== "photovoltaic") return null;
  const power = Math.max(0, Number(plant.powerKw) || 0);
  const units = Math.max(1, Number(plant.servedUnits) || 1);
  const groundVolume = Math.max(0, Number(plant.groundVolume) || 0);

  if (power > 0 && power <= 3 * units) {
    return {
      code: "pv-power",
      label: `Potenza ${power.toLocaleString("it-IT")} kWp non superiore a 3 kW × ${units} UIU servite`,
      source: "Circolare Agenzia delle Entrate 36/E/2013, par. 2.2",
    };
  }
  if (plant.groundMounted && groundVolume > 0 && groundVolume < 150) {
    return {
      code: "pv-ground-volume",
      label: `Volume convenzionale a terra ${groundVolume.toLocaleString("it-IT")} m³ inferiore a 150 m³`,
      source: "Circolare Agenzia delle Entrate 36/E/2013, par. 2.2",
    };
  }
  return null;
}
