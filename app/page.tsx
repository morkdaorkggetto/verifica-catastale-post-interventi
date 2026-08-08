"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateScenario,
  coefficients,
  evaluateComparison,
} from "../lib/cadastral.mjs";
import { interventionNatures, plantCatalog, plantTypeFor } from "../lib/plants.mjs";
import { buildMarkdownReport, buildRtfReport, reportFileName } from "../lib/report.mjs";

type ChangeKey = "destination" | "consistency" | "distribution" | "shape";
type WorkKey = "envelope" | "windows" | "structural" | "finishes" | "accessibility" | "otherBuilding";
type AnalysisPath = "plants" | "comparative";
type Coherence = "yes" | "no" | "unknown";
type FactorValue = "unchanged" | "aligned" | "superior" | "unknown";
type FactorKey = "envelope" | "plants" | "finishes" | "distribution" | "services" | "conservation";

type Plant = {
  id: number;
  typeId: string;
  description: string;
  interventionNature: string;
  variant: string;
  metricValue: number;
  powerKw: number;
  servedUnits: number;
  shared: boolean;
  groundMounted: boolean;
  groundVolume: number;
  year: number;
  cost: number;
  baselineCost: number;
  costSource: string;
  costBasis: string;
  applyReproductionUplift: boolean;
  upliftFactor: number;
  upliftSource: string;
  usefulLife: number;
  residual: number;
  share: number;
  alreadyIncluded: boolean;
};

const categories = [
  "A/1", "A/2", "A/3", "A/4", "A/5", "A/6", "A/7", "A/8", "A/9", "A/10", "A/11",
  "B/1", "B/2", "B/3", "B/4", "B/5", "B/6", "B/7", "B/8",
  "C/1", "C/2", "C/3", "C/4", "C/5", "C/6", "C/7", "D/E o categoria speciale",
];

const defaultUnit = {
  caseName: "",
  municipality: "",
  censusZone: "",
  sheet: "",
  parcel: "",
  sub: "",
  category: "A/2",
  cadastralClass: "",
  classReference: "unknown",
  rent: 0,
  currentTariff: 0,
  nextTariff: 0,
};

const changeDefinitions: Array<{ key: ChangeKey; title: string; note: string }> = [
  { key: "destination", title: "Destinazione d’uso", note: "Cambio della destinazione ordinaria o della categoria funzionale." },
  { key: "consistency", title: "Consistenza", note: "Vani, superficie, volume, ampliamento, fusione o frazionamento." },
  { key: "distribution", title: "Distribuzione rilevante", note: "Assetto interno o servizi tali da richiedere il riesame censuario." },
  { key: "shape", title: "Sagoma o configurazione", note: "Trasformazioni geometriche o planimetriche non rappresentate in atti." },
];

const workDefinitions: Array<{ key: WorkKey; title: string; note: string }> = [
  { key: "envelope", title: "Involucro", note: "Cappotto, copertura, isolamento o altre opere sull’involucro." },
  { key: "windows", title: "Serramenti", note: "Sostituzione o modifica significativa di infissi e schermature." },
  { key: "structural", title: "Opere strutturali", note: "Consolidamenti, adeguamenti o trasformazioni strutturali." },
  { key: "finishes", title: "Finiture e servizi", note: "Migliorie edilizie, servizi, materiali o dotazioni non meramente impiantistiche." },
  { key: "accessibility", title: "Accessibilità", note: "Ascensori, piattaforme, rampe o modifiche funzionali rilevanti." },
  { key: "otherBuilding", title: "Altre opere edilizie", note: "Qualunque intervento non descrivibile come solo ampliamento impiantistico." },
];

const factorDefinitions: Array<{ key: FactorKey; title: string; note: string }> = [
  { key: "envelope", title: "Involucro e prestazioni", note: "Cappotto, copertura, infissi e isolamento rispetto allo standard locale." },
  { key: "plants", title: "Dotazione impiantistica", note: "Climatizzazione, produzione energetica, automazione e sicurezza." },
  { key: "finishes", title: "Finiture e materiali", note: "Livello qualitativo complessivo rispetto all’unità tipo." },
  { key: "distribution", title: "Distribuzione e funzionalità", note: "Razionalità degli spazi, illuminazione, esposizione e accessibilità." },
  { key: "services", title: "Servizi e dotazioni", note: "Numero e qualità dei servizi, ascensore e dotazioni comuni." },
  { key: "conservation", title: "Conservazione", note: "Effetto dell’intervento rispetto alla normale manutenzione dell’immobile." },
];

const factorOptions: Array<{ value: FactorValue; label: string }> = [
  { value: "unchanged", label: "Invariato" },
  { value: "aligned", label: "Allineato all’ordinario" },
  { value: "superior", label: "Superiore all’unità tipo" },
  { value: "unknown", label: "Da verificare" },
];

const defaultChanges: Record<ChangeKey, boolean> = {
  destination: false,
  consistency: false,
  distribution: false,
  shape: false,
};

const defaultWorks: Record<WorkKey, boolean> = {
  envelope: false,
  windows: false,
  structural: false,
  finishes: false,
  accessibility: false,
  otherBuilding: false,
};

const defaultFactors: Record<FactorKey, FactorValue> = {
  envelope: "unknown",
  plants: "unknown",
  finishes: "unknown",
  distribution: "unknown",
  services: "unknown",
  conservation: "unknown",
};

const defaultEvidence = { unitType: false, comparables: false, tariffTable: false };
const defaultTechnician = {
  name: "",
  qualification: "",
  register: "",
  registrationNumber: "",
  office: "",
};

const newPlant = (id = 1): Plant => ({
  id,
  typeId: "photovoltaic",
  description: "Impianto fotovoltaico",
  interventionNature: "new",
  variant: "Su edificio",
  metricValue: 0,
  powerKw: 0,
  servedUnits: 1,
  shared: false,
  groundMounted: false,
  groundVolume: 0,
  year: 2023,
  cost: 0,
  baselineCost: 0,
  costSource: "",
  costBasis: "",
  applyReproductionUplift: false,
  upliftFactor: 1.37,
  upliftSource: "",
  usefulLife: 20,
  residual: 0,
  share: 100,
  alreadyIncluded: false,
});

function normalizePlant(plant: Partial<Plant>, index: number): Plant {
  const inferredType = plant.typeId ?? (plant.description?.toLowerCase().includes("fotovolta") ? "photovoltaic" : "other_fixed");
  const type = plantTypeFor(inferredType);
  return {
    ...newPlant(Number(plant.id) || index + 1),
    ...plant,
    typeId: inferredType,
    description: plant.description || type.label,
    variant: plant.variant || type.variants[0],
  };
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STORAGE_KEY = "verifica-catastale:v2";

export default function Home() {
  const [unit, setUnit] = useState(defaultUnit);
  const [coherence, setCoherence] = useState<Coherence>("unknown");
  const [changes, setChanges] = useState(defaultChanges);
  const [works, setWorks] = useState(defaultWorks);
  const [inventoryConfirmed, setInventoryConfirmed] = useState(false);
  const [analysisPath, setAnalysisPath] = useState<AnalysisPath>("plants");
  const [overrideReason, setOverrideReason] = useState("");
  const [plants, setPlants] = useState<Plant[]>([newPlant()]);
  const [factors, setFactors] = useState(defaultFactors);
  const [evidence, setEvidence] = useState(defaultEvidence);
  const [technician, setTechnician] = useState(defaultTechnician);
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.unit) setUnit({ ...defaultUnit, ...parsed.unit });
          if (parsed.coherence) setCoherence(parsed.coherence);
          if (parsed.changes) setChanges({ ...defaultChanges, ...parsed.changes });
          if (parsed.works) setWorks({ ...defaultWorks, ...parsed.works });
          if (parsed.inventoryConfirmed) setInventoryConfirmed(true);
          if (parsed.analysisPath) setAnalysisPath(parsed.analysisPath);
          if (parsed.overrideReason) setOverrideReason(parsed.overrideReason);
          if (Array.isArray(parsed.plants) && parsed.plants.length) setPlants(parsed.plants.map(normalizePlant));
          if (parsed.factors) setFactors({ ...defaultFactors, ...parsed.factors });
          if (parsed.evidence) setEvidence({ ...defaultEvidence, ...parsed.evidence });
          if (parsed.technician) setTechnician({ ...defaultTechnician, ...parsed.technician });
          if (parsed.notes) setNotes(parsed.notes);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unit, coherence, changes, works, inventoryConfirmed, analysisPath, overrideReason, plants, factors, evidence, technician, notes }));
  }, [hydrated, unit, coherence, changes, works, inventoryConfirmed, analysisPath, overrideReason, plants, factors, evidence, technician, notes]);

  const calculation = useMemo(() => calculateScenario({
    category: unit.category,
    rent: unit.rent,
    plants,
    currentTariff: unit.currentTariff,
    nextTariff: unit.nextTariff,
  }), [plants, unit.category, unit.currentTariff, unit.nextTariff, unit.rent]);

  const comparison = useMemo(() => evaluateComparison(factors), [factors]);
  const selectedChanges = changeDefinitions.filter(({ key }) => changes[key]);
  const selectedWorks = workDefinitions.filter(({ key }) => works[key]);
  const hasObjectiveChanges = selectedChanges.length > 0;
  const hasMixedWorks = selectedWorks.length > 0;
  const recommendedPath: AnalysisPath = hasMixedWorks ? "comparative" : "plants";
  const isMethodOverride = analysisPath !== recommendedPath;
  const unresolvedOverride = isMethodOverride && !overrideReason.trim();
  const evidenceCount = Object.values(evidence).filter(Boolean).length;

  const result = useMemo(() => {
    if (hasObjectiveChanges) {
      return {
        key: "necessary",
        label: "Obbligo dichiarativo",
        title: "Aggiornamento da predisporre",
        text: "È stata dichiarata una mutazione oggettiva che impone il riesame di categoria, classe, consistenza o rappresentazione catastale.",
        confidence: "Alta",
        method: "Mutazioni oggettive — artt. 17 e 20 R.D.L. 652/1939",
        actions: ["Verificare la corrispondenza planimetrica", "Definire la causale DOCFA", "Motivare il classamento proposto"],
      };
    }
    if (coherence !== "yes") {
      return {
        key: "inconclusive",
        label: "Controllo preliminare",
        title: "Base ante operam non validata",
        text: "Il confronto non è affidabile finché il classamento in atti non viene verificato rispetto allo stato precedente ai lavori.",
        confidence: "Bassa",
        method: "Verifica preliminare del classamento",
        actions: ["Ricostruire lo stato ante operam", "Controllare categoria, classe e consistenza", "Acquisire planimetria e visura storica"],
      };
    }
    if (calculation.categoryKind === "invalid") {
      return {
        key: "incomplete", label: "Input non valido", title: "Categoria catastale non riconosciuta",
        text: "Il calcolo è bloccato: selezionare una categoria ordinaria valida oppure il percorso dedicato alle categorie speciali.",
        confidence: "Non calcolabile", method: "Validazione bloccante degli input",
        actions: ["Correggere la categoria", "Non applicare moltiplicatori predefiniti a categorie non riconosciute"],
      };
    }
    if (calculation.categoryKind === "special") {
      return {
        key: "inconclusive",
        label: "Fuori perimetro",
        title: "Stima diretta specifica richiesta",
        text: "Le categorie speciali e particolari non possono essere trattate con il modello semplificato delle unità ordinarie.",
        confidence: "Non applicabile",
        method: "Approccio estimativo dedicato categorie D/E",
        actions: ["Applicare la metodologia pertinente", "Documentare costi e deprezzamenti", "Non usare il benchmark ordinario del 15%"],
      };
    }
    if (!inventoryConfirmed) {
      return {
        key: "incomplete", label: "Inventario da confermare", title: "Confermare il perimetro dei lavori",
        text: "L’assenza di opere selezionate non equivale ancora alla dichiarazione che l’intervento sia meramente impiantistico.",
        confidence: "Non calcolabile", method: "Inventario obbligatorio degli interventi",
        actions: ["Verificare tutte le categorie di opere", "Confermare che l’inventario descrive l’intero intervento"],
      };
    }
    if (unresolvedOverride) {
      return {
        key: "incomplete", label: "Deroga non motivata", title: "Motivare la scelta del metodo",
        text: `L’inventario indirizza al percorso ${recommendedPath === "plants" ? "impiantistico" : "comparativo"}, ma è stato selezionato un metodo diverso. La deroga professionale è ammessa solo se motivata e tracciata.`,
        confidence: "Non calcolabile", method: "Instradamento guidato con deroga motivata",
        actions: ["Inserire la motivazione della deroga", "Oppure ripristinare il metodo raccomandato"],
      };
    }
    if (analysisPath === "plants") {
      if (calculation.status === "invalid") {
        return {
          key: "incomplete", label: "Input non validi", title: "Correggere i dati prima del calcolo",
          text: calculation.issues.filter(({ severity }) => severity === "invalid").map(({ message }) => message).join(" "),
          confidence: "Non calcolabile", method: "Validazione bloccante valid / warning / invalid",
          actions: ["Correggere i campi segnalati", "Verificare anno, costi, quote e parametri infracensuari"],
        };
      }
      if (calculation.status === "warning") {
        return {
          key: "inconclusive", label: "Dato da validare", title: "Calcolo provvisorio non conclusivo",
          text: calculation.issues.filter(({ severity }) => severity === "warning").map(({ message }) => message).join(" "),
          confidence: "Bassa", method: "Calcolo economico con riserve esplicite",
          actions: ["Rimuovere o motivare le avvertenze", "Confermare la base economica e le fonti", "Usare il valore solo come riscontro provvisorio"],
        };
      }
      if (unit.classReference === "top") {
        return {
          key: "inconclusive", label: "Classe apicale", title: "Occorrono riferimenti censuari esterni alla zona",
          text: "La UIU è già all’ultima classe disponibile nella zona censuaria. Il benchmark economico resta un riscontro, ma non consente un esito conclusivo senza unità tipo o classi di un’altra zona dello stesso Comune o di un Comune analogo della provincia.",
          confidence: "Bassa", method: "Gate della classe apicale — Risoluzione 21/E/2026",
          actions: ["Reperire riferimenti in altra zona censuaria", "Confrontare un Comune analogo della provincia", "Documentare la scelta dei comparabili"],
        };
      }
      if (unit.rent <= 0) {
        return {
          key: "incomplete",
          label: "Dati insufficienti",
          title: "Completare il calcolo impiantistico",
          text: "Serve la rendita in atti per costruire il valore catastale ante operam e confrontarlo con le dotazioni aggiunte.",
          confidence: "Non calcolabile",
          method: "Confronto economico 21/E/2026",
          actions: ["Inserire la rendita", "Verificare il classamento ante operam", "Documentare il valore ordinario degli impianti"],
        };
      }
      if (calculation.excludedRows.length === plants.length && plants.some(({ cost, powerKw, metricValue }) => cost > 0 || powerKw > 0 || metricValue > 0)) {
        return {
          key: "ordinary",
          label: "Esclusione documentata",
          title: "Nessun valore incrementale nel metodo selezionato",
          text: "Tutte le dotazioni inserite risultano escluse dal calcolo per una regola fotovoltaica specifica, perché già comprese nella rendita oppure perché configurate come sostituzioni equivalenti.",
          confidence: "Medio-alta",
          method: "Gate impiantistici preliminari",
          actions: ["Conservare i dati tecnici e la fonte", "Verificare che non vi siano opere o dotazioni ulteriori", "Riportare l’esclusione nella relazione"],
        };
      }
      if (calculation.plantValue <= 0) {
        return {
          key: "incomplete",
          label: "Dati insufficienti",
          title: "Completare la valorizzazione impiantistica",
          text: "Almeno una dotazione non esclusa deve avere valore ordinario a nuovo, anno, vita utile e quota riferibile alla UIU.",
          confidence: "Non calcolabile",
          method: "Confronto economico 21/E/2026",
          actions: ["Documentare il valore a nuovo", "Indicare la fonte del costo", "Controllare quota e valore preesistente"],
        };
      }
      if (calculation.convergenceStatus === "borderline") {
        return {
          key: "inconclusive",
          label: "Zona di incertezza",
          title: "I due riferimenti non convergono",
          text: "L’incidenza supera uno soltanto tra il benchmark operativo del 15% e lo scarto tariffario locale. Il dato numerico non è sufficiente per concludere senza comparazione con unità tipo e classi contigue.",
          confidence: "Media",
          method: "21/E + doppio riscontro benchmark/tariffe",
          actions: ["Verificare le tariffe ufficiali", "Confrontare l’unità tipo", "Motivare espressamente lo scostamento"],
        };
      }
      if (calculation.benchmarkMet && (calculation.localGapMet ?? true)) {
        return {
          key: "review",
          label: calculation.localGap === null ? "Benchmark raggiunto" : "Riferimenti convergenti",
          title: "Riclassamento meritevole di verifica",
          text: "L’incremento impiantistico stimato raggiunge il benchmark e, quando disponibile, anche lo scarto tariffario locale. Il risultato non assegna da solo una nuova classe: occorre la comparazione catastale locale.",
          confidence: calculation.localGap === null ? "Media" : "Medio-alta",
          method: calculation.localGap === null ? "21/E + benchmark operativo del 15%" : "21/E + convergenza benchmark/scarto locale",
          actions: ["Confrontare le unità tipo", "Verificare la tariffa della classe successiva", "Motivare l’eventuale DOCFA"],
        };
      }
      return {
        key: "ordinary",
        label: "Sotto il riferimento",
        title: "Nessun incremento apprezzabile dal solo impianto",
        text: "Il calcolo non raggiunge il benchmark o lo scarto tariffario locale. Restano da escludere mutazioni e disallineamenti non rappresentati dai dati inseriti.",
        confidence: calculation.localGap === null ? "Media" : "Medio-alta",
        method: calculation.localGap === null ? "21/E + benchmark operativo del 15%" : "21/E + convergenza benchmark/scarto locale",
        actions: ["Conservare il calcolo", "Documentare gli impianti", "Motivare l’assenza di variazioni ulteriori"],
      };
    }
    if (comparison.status === "review") {
      return {
        key: "review",
        label: "Scostamento comparativo",
        title: "Approfondire il possibile salto di classe",
        text: `${comparison.superior} fattori risultano superiori all’unità tipo dichiarata. La conclusione richiede riscontri locali, non una somma automatica dei costi.` ,
        confidence: evidenceCount >= 2 ? "Media" : "Bassa",
        method: "Comparazione con unità tipo — art. 61 DPR 1142/1949",
        actions: ["Allegare unità tipo o comparabili", "Verificare il quadro tariffario", "Redigere il giudizio estimativo"],
      };
    }
    if (comparison.status === "ordinary") {
      return {
        key: "ordinary",
        label: "Ordinarietà dinamica",
        title: "Non emerge un salto qualitativo",
        text: "I fattori risultano invariati o ricondotti allo standard ordinario. L’esito è sostenibile solo con documentazione comparativa coerente con il contesto locale.",
        confidence: evidenceCount >= 2 ? "Media" : "Bassa",
        method: "Comparazione qualitativa con unità tipo",
        actions: ["Conservare i riscontri comparativi", "Descrivere l’allineamento agli standard", "Escludere mutazioni oggettive"],
      };
    }
    return {
      key: "inconclusive",
      label: "Istruttoria incompleta",
      title: "La comparazione non è ancora motivabile",
      text: "Uno o più fattori non sono stati valutati. L’app evita di trasformare l’incertezza tecnica in un esito numerico artificiale.",
      confidence: "Bassa",
      method: "Comparazione qualitativa con unità tipo",
      actions: ["Completare i fattori", "Acquisire unità tipo o comparabili", "Verificare le tariffe locali"],
    };
  }, [analysisPath, calculation, coherence, comparison, evidenceCount, hasObjectiveChanges, inventoryConfirmed, plants, recommendedPath, unresolvedOverride, unit.classReference, unit.rent]);

  function updatePlant(id: number, patch: Partial<Plant>) {
    setPlants((current) => current.map((plant) => plant.id === id ? { ...plant, ...patch } : plant));
  }

  function resetCase() {
    if (!window.confirm("Azzerare tutti i dati salvati per questa verifica?")) return;
    setUnit(defaultUnit);
    setCoherence("unknown");
    setChanges(defaultChanges);
    setWorks(defaultWorks);
    setInventoryConfirmed(false);
    setAnalysisPath("plants");
    setOverrideReason("");
    setPlants([newPlant()]);
    setFactors(defaultFactors);
    setEvidence(defaultEvidence);
    setTechnician(defaultTechnician);
    setNotes("");
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportReport(format: "md" | "rtf") {
    const reportData = {
      generatedAt: new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date()),
      technician,
      unit,
      coherence,
      changes: selectedChanges.map(({ title }) => title),
      works: selectedWorks.map(({ title }) => title),
      inventoryConfirmed,
      analysisPath,
      recommendedPath,
      overrideReason,
      plants,
      calculation,
      factors: factorDefinitions.map(({ key, title }) => ({
        title,
        label: factorOptions.find(({ value }) => value === factors[key])?.label ?? "Da verificare",
      })),
      evidence,
      notes,
      result,
    };
    const content = format === "md" ? buildMarkdownReport(reportData) : buildRtfReport(reportData);
    const blob = new Blob([content], { type: format === "md" ? "text/markdown;charset=utf-8" : "application/rtf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName(unit.caseName, format);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const reportBlocked = !inventoryConfirmed || (analysisPath === "plants" && calculation.status === "invalid") || unresolvedOverride;

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Torna all’inizio">
          <span className="brand-mark">VC</span>
          <span><strong>Verifica catastale</strong><small>Strumento tecnico post-interventi</small></span>
        </a>
        <div className="header-actions">
          <span className="version-pill">Metodo v0.5</span>
          <button className="text-button" type="button" onClick={resetCase}>Nuovo caso</button>
          <button className="print-button" type="button" onClick={() => window.print()}>Stampa scheda</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <p className="overline">Istruttoria catastale guidata</p>
            <h1>Prima il <em>metodo</em>, poi il risultato.</h1>
          </div>
          <p className="hero-copy">Lo strumento distingue mutazioni oggettive, mero ampliamento impiantistico e comparazione qualitativa. Ogni esito espone il proprio perimetro e non sostituisce il giudizio del tecnico.</p>
        </section>

        <nav className="step-nav" aria-label="Sezioni della verifica">
          <a href="#identify"><span>01</span>Immobile</a>
          <a href="#scope"><span>02</span>Perimetro</a>
          <a href="#analysis"><span>03</span>Analisi</a>
          <a href="#result"><span>04</span>Esito</a>
        </nav>

        <div className="workspace">
          <div className="form-column">
            <section className="form-section" id="identify">
              <SectionTitle number="01" label="Dati di base" title="Identifica la UIU e valida l’ante operam" />
              <div className="field-grid four">
                <label className="wide">Riferimento del caso<input value={unit.caseName} onChange={(event) => setUnit({ ...unit, caseName: event.target.value })} placeholder="Es. Rossi — via Roma 12" /></label>
                <label className="wide">Comune<input value={unit.municipality} onChange={(event) => setUnit({ ...unit, municipality: event.target.value })} /></label>
                <label>Zona censuaria<input value={unit.censusZone} onChange={(event) => setUnit({ ...unit, censusZone: event.target.value })} /></label>
                <label>Foglio<input value={unit.sheet} onChange={(event) => setUnit({ ...unit, sheet: event.target.value })} /></label>
                <label>Particella<input value={unit.parcel} onChange={(event) => setUnit({ ...unit, parcel: event.target.value })} /></label>
                <label>Subalterno<input value={unit.sub} onChange={(event) => setUnit({ ...unit, sub: event.target.value })} /></label>
                <label>Categoria<select value={unit.category} onChange={(event) => setUnit({ ...unit, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Classe in atti<input value={unit.cadastralClass} onChange={(event) => setUnit({ ...unit, cadastralClass: event.target.value })} /></label>
                <label>Classe successiva nella zona<select value={unit.classReference} onChange={(event) => setUnit({ ...unit, classReference: event.target.value })}><option value="unknown">Da verificare</option><option value="available">Disponibile</option><option value="top">Classe apicale / non disponibile</option></select></label>
                <label className="rent-field">Rendita in atti (€)<input type="number" min="0" value={unit.rent || ""} onChange={(event) => setUnit({ ...unit, rent: Number(event.target.value) })} /></label>
              </div>
              <fieldset className="radio-fieldset">
                <legend>Il classamento ante operam è stato verificato rispetto allo stato reale?</legend>
                <div className="segmented">
                  {(["yes", "no", "unknown"] as Coherence[]).map((value) => <label key={value} className={coherence === value ? "selected" : ""}><input type="radio" checked={coherence === value} onChange={() => setCoherence(value)} />{value === "yes" ? "Sì" : value === "no" ? "No" : "Non ancora"}</label>)}
                </div>
              </fieldset>
            </section>

            <section className="form-section" id="scope">
              <SectionTitle number="02" label="Gate dichiarativo" title="Escludi prima le mutazioni oggettive" />
              <p className="section-intro">Se almeno una voce ricorre, il problema non può essere risolto con la sola soglia economica degli impianti.</p>
              <div className="check-grid">
                {changeDefinitions.map(({ key, title, note }) => <label className={`check-card ${changes[key] ? "checked" : ""}`} key={key}><input type="checkbox" checked={changes[key]} onChange={(event) => setChanges({ ...changes, [key]: event.target.checked })} /><span className="check-box">{changes[key] ? "✓" : ""}</span><span><strong>{title}</strong><small>{note}</small></span></label>)}
              </div>
              <label className="included-check"><input type="checkbox" checked={inventoryConfirmed} onChange={(event) => setInventoryConfirmed(event.target.checked)} />Confermo che l’inventario descrive l’intero intervento, comprese eventuali opere non impiantistiche</label>
            </section>

            <section className="form-section" id="analysis">
              <SectionTitle number="03" label="Inventario e metodo" title="Quali interventi sono stati eseguiti?" />
              <p className="section-intro">L’inventario instrada automaticamente il metodo. Se sono presenti opere edilizie o qualitative, il confronto economico dei soli impianti non è il percorso ordinario.</p>
              <div className="check-grid">
                {workDefinitions.map(({ key, title, note }) => <label className={`check-card ${works[key] ? "checked" : ""}`} key={key}><input type="checkbox" checked={works[key]} onChange={(event) => {
                  const nextWorks = { ...works, [key]: event.target.checked };
                  const nextRecommended = Object.values(nextWorks).some(Boolean) ? "comparative" : "plants";
                  setWorks(nextWorks);
                  setAnalysisPath(nextRecommended);
                  setOverrideReason("");
                }} /><span className="check-box">{works[key] ? "✓" : ""}</span><span><strong>{title}</strong><small>{note}</small></span></label>)}
              </div>
              <div className="comparison-callout"><strong>Metodo raccomandato: {recommendedPath === "plants" ? "solo ampliamento impiantistico" : "comparazione complessiva"}.</strong><p>L’utente può derogare, ma la motivazione viene resa obbligatoria e riportata nella relazione.</p></div>
              <div className="method-choice-grid">
                <button type="button" className={`method-choice ${analysisPath === "plants" ? "selected" : ""}`} onClick={() => setAnalysisPath("plants")}><span>A</span><strong>Solo ampliamento impiantistico</strong><small>Confronto economico ante/post secondo la Risoluzione 21/E/2026.</small></button>
                <button type="button" className={`method-choice ${analysisPath === "comparative" ? "selected" : ""}`} onClick={() => setAnalysisPath("comparative")}><span>B</span><strong>Opere miste o miglioramento qualitativo</strong><small>Comparazione con unità tipo e ordinarietà locale, senza automatismi di costo.</small></button>
              </div>
              {isMethodOverride && <label className="notes-label">Motivazione della deroga al metodo raccomandato<textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Indicare perché il metodo scelto è pertinente nonostante l’inventario degli interventi…" /></label>}

              {analysisPath === "plants" ? (
                <PlantAnalysis unit={unit} setUnit={setUnit} plants={plants} setPlants={setPlants} updatePlant={updatePlant} calculation={calculation} />
              ) : (
                <ComparativeAnalysis factors={factors} setFactors={setFactors} evidence={evidence} setEvidence={setEvidence} comparison={comparison} />
              )}
            </section>

            <section className="form-section notes-section">
              <SectionTitle number="04" label="Relazione esportabile" title="Completa i dati del tecnico" />
              <p className="section-intro">I campi sono facoltativi nell’app. Nel documento scaricato, ogni dato mancante sarà sostituito da un segnaposto chiaramente riconoscibile.</p>
              <div className="field-grid technician-grid">
                <label className="wide">Nome e cognome<input value={technician.name} onChange={(event) => setTechnician({ ...technician, name: event.target.value })} placeholder="Lascia vuoto per generare il segnaposto" /></label>
                <label>Qualifica<input value={technician.qualification} onChange={(event) => setTechnician({ ...technician, qualification: event.target.value })} placeholder="Es. Architetto" /></label>
                <label>Ordine o Collegio<input value={technician.register} onChange={(event) => setTechnician({ ...technician, register: event.target.value })} /></label>
                <label>Numero iscrizione<input value={technician.registrationNumber} onChange={(event) => setTechnician({ ...technician, registrationNumber: event.target.value })} /></label>
                <label className="wide">Studio o recapito<input value={technician.office} onChange={(event) => setTechnician({ ...technician, office: event.target.value })} /></label>
              </div>
              <label className="notes-label">Annotazioni e riscontri<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Documenti consultati, unità comparabili, assunzioni estimative e cautele residue…" /></label>
              <div className="export-panel">
                <div><p className="mini-label">Documento dinamico</p><strong>Relazione costruita sul metodo applicato</strong><small>Il testo include calcoli o comparazione qualitativa, esito, attendibilità, passaggi successivi e avvertenze.</small></div>
                <div className="export-actions"><button type="button" disabled={reportBlocked} title={reportBlocked ? "Correggere gli errori bloccanti prima di generare la relazione" : undefined} onClick={() => exportReport("md")}>Scarica .md</button><button type="button" disabled={reportBlocked} title={reportBlocked ? "Correggere gli errori bloccanti prima di generare la relazione" : undefined} onClick={() => exportReport("rtf")}>Scarica .rtf</button></div>
              </div>
            </section>

            <section className="method-section">
              <SectionTitle number="M" label="Perimetro metodologico" title="Cosa calcola — e cosa non calcola" />
              <div className="method-grid">
                <div><span>01</span><strong>Impianti</strong><p>Costo pertinente, quota UIU, deprezzamento infracensuario e ragguaglio al 1988–1989.</p></div>
                <div><span>02</span><strong>Tariffe locali</strong><p>Se fornite, sono confrontate con il benchmark del 15%: l’app segnala convergenza o zona d’incertezza.</p></div>
                <div><span>03</span><strong>Opere miste</strong><p>Restano affidate alla comparazione professionale; i costi non generano automaticamente rendita.</p></div>
                <div><span>04</span><strong>Esito</strong><p>È uno screening motivato. Categoria, classe e rendita definitiva restano oggetto di proposta e controllo.</p></div>
              </div>
            </section>
          </div>

          <aside className={`result-card result-${result.key}`} id="result">
            <div className="result-topline"><span>Esito in tempo reale</span><span className="live-dot">Dati locali</span></div>
            <p className="result-eyebrow">{result.label}</p>
            <h2>{result.title}</h2>
            <p className="result-text">{result.text}</p>
            <div className="result-meta"><span>Metodo applicato<strong>{result.method}</strong></span><span>Attendibilità<strong>{result.confidence}</strong></span></div>
            {analysisPath === "plants" && calculation.issues.length > 0 && <div className="exclusion-note"><strong>Stato dati: {calculation.status}</strong>{calculation.issues.map(({ code, message }) => <span key={`${code}-${message}`}>{message}</span>)}</div>}
            {analysisPath === "plants" && calculation.multiplier !== null && <>
              <div className="result-values">
                <div><span>Valore ante</span><strong>{euro.format(calculation.valueBefore)}</strong></div>
                <div><span>Impianti ragguagliati</span><strong>{euro.format(calculation.plantValue)}</strong></div>
                <div><span>Valore post stimato</span><strong>{euro.format(calculation.valueAfter)}</strong></div>
                <div className="primary-value"><span>Incidenza</span><strong>{percent.format(calculation.incidence)}%</strong></div>
                <div><span>Benchmark operativo</span><strong>15,00%</strong></div>
                {calculation.localGap !== null && <div><span>Scarto tariffario</span><strong>{percent.format(calculation.localGap)}%</strong></div>}
              </div>
              <div className="threshold"><div className="threshold-track"><span style={{ width: `${Math.min(100, (calculation.incidence / 30) * 100)}%` }} /></div><div><span>0%</span><span className="threshold-mark">benchmark 15,00%</span><span>30,00%</span></div></div>
            </>}
            {analysisPath === "comparative" && <div className="comparison-summary"><span><strong>{comparison.superior}</strong> superiori</span><span><strong>{comparison.aligned}</strong> allineati</span><span><strong>{comparison.unknown}</strong> da verificare</span></div>}
            <div className="next-actions"><strong>Passaggi successivi</strong><ol>{result.actions.map((action) => <li key={action}>{action}</li>)}</ol></div>
            <p className="legal-note">Strumento di supporto tecnico. Non produce automaticamente una rendita né sostituisce DOCFA, unità tipo e giudizio professionale.</p>
          </aside>
        </div>
      </main>
      <footer><span>Verifica catastale post-interventi</span><span>I dati restano nel browser</span></footer>
    </>
  );
}

function SectionTitle({ number, label, title }: { number: string; label: string; title: string }) {
  return <div className="section-heading"><span>{number}</span><div><p>{label}</p><h2>{title}</h2></div></div>;
}

function PlantAnalysis({ unit, setUnit, plants, setPlants, updatePlant, calculation }: {
  unit: typeof defaultUnit;
  setUnit: (unit: typeof defaultUnit) => void;
  plants: Plant[];
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  updatePlant: (id: number, patch: Partial<Plant>) => void;
  calculation: ReturnType<typeof calculateScenario>;
}) {
  const groups = [...new Set(plantCatalog.map(({ group }) => group))];

  return <div className="analysis-panel">
    <div className="comparison-callout"><strong>Prima classifica, poi valorizza.</strong><p>La tipologia determina i dati tecnici e gli eventuali gate normativi. I valori unitari delle asseverazioni fiscali non sono trasferiti automaticamente nel calcolo catastale.</p></div>
    <div className="panel-heading"><div><p>Dotazione attuale</p><h3>Impianti da esaminare</h3></div><button className="add-button" type="button" onClick={() => setPlants((current) => [...current, newPlant(Math.max(...current.map(({ id }) => id), 0) + 1)])}>+ Aggiungi impianto</button></div>
    {plants.map((plant, index) => {
      const row = calculation.rows[index];
      const plantType = plantTypeFor(plant.typeId);
      const nature = interventionNatures.find(({ id }) => id === plant.interventionNature) ?? interventionNatures[0];
      const isPhotovoltaic = plant.typeId === "photovoltaic";

      function changeType(typeId: string) {
        const nextType = plantTypeFor(typeId);
        updatePlant(plant.id, {
          typeId,
          description: nextType.label,
          variant: nextType.variants[0],
          metricValue: 0,
          powerKw: typeId === "photovoltaic" ? plant.powerKw : 0,
          groundMounted: false,
          groundVolume: 0,
        });
      }

      return <div className="plant-card" key={plant.id}>
        <div className="plant-card-heading"><span>Impianto {String(index + 1).padStart(2, "0")}</span><span className={`treatment-badge treatment-${plantType.treatment}`}>{plantType.treatmentLabel}</span>{plants.length > 1 && <button type="button" onClick={() => setPlants((current) => current.filter(({ id }) => id !== plant.id))}>Rimuovi</button>}</div>
        <div className="plant-classification">
          <label>Categoria impianto<select value={plant.typeId} onChange={(event) => changeType(event.target.value)}>{groups.map((group) => <optgroup label={group} key={group}>{plantCatalog.filter((item) => item.group === group).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
          <label>Natura dell’intervento<select value={plant.interventionNature} onChange={(event) => updatePlant(plant.id, { interventionNature: event.target.value })}>{interventionNatures.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}</select></label>
          <label>Tipologia tecnica<select value={plant.variant} onChange={(event) => updatePlant(plant.id, { variant: event.target.value })}>{plantType.variants.map((variant) => <option key={variant}>{variant}</option>)}</select></label>
        </div>
        <div className="criteria-note"><strong>{nature.note}</strong><span>{plantType.note}</span></div>
        <div className="field-grid plant-fields">
          <label className="description">Descrizione<input value={plant.description} onChange={(event) => updatePlant(plant.id, { description: event.target.value })} /></label>
          <label>{plantType.metricLabel}<input type="number" min="0" step="0.01" value={(isPhotovoltaic ? plant.powerKw : plant.metricValue) || ""} onChange={(event) => updatePlant(plant.id, isPhotovoltaic ? { powerKw: Number(event.target.value) } : { metricValue: Number(event.target.value) })} /></label>
          <label>Anno<select value={plant.year} onChange={(event) => updatePlant(plant.id, { year: Number(event.target.value) })}>{Object.keys(coefficients).reverse().map((year) => <option key={year}>{year}</option>)}</select></label>
          <label>Valore economico disponibile (€)<input type="number" min="0" value={plant.cost || ""} onChange={(event) => updatePlant(plant.id, { cost: Number(event.target.value) })} /></label>
          <label>Base economica<select value={plant.costBasis} onChange={(event) => updatePlant(plant.id, { costBasis: event.target.value, applyReproductionUplift: event.target.value === "supply_install" ? plant.applyReproductionUplift : false })}><option value="">Da qualificare</option><option value="equipment">Solo apparecchiature</option><option value="supply_install">Fornitura e posa / CME</option><option value="reproduction">Costo di riproduzione chiavi in mano</option><option value="other">Altra base documentata</option></select></label>
          {plant.interventionNature === "improving_replacement" && <label>Valore dotazione equivalente (€)<input type="number" min="0" value={plant.baselineCost || ""} onChange={(event) => updatePlant(plant.id, { baselineCost: Number(event.target.value) })} /></label>}
          <label>Vita utile (anni)<input type="number" min="1" value={plant.usefulLife} onChange={(event) => updatePlant(plant.id, { usefulLife: Number(event.target.value) })} /></label>
          <label>Residuo finale (%)<input type="number" min="0" max="100" value={plant.residual} onChange={(event) => updatePlant(plant.id, { residual: Number(event.target.value) })} /></label>
          <label>Quota UIU (%)<input type="number" min="0" max="100" value={plant.share} onChange={(event) => updatePlant(plant.id, { share: Number(event.target.value) })} /></label>
          <label className="description">Fonte del valore<input value={plant.costSource} onChange={(event) => updatePlant(plant.id, { costSource: event.target.value })} placeholder="Preventivo depurato, listino, computo…" /></label>
        </div>
        {plant.costBasis === "supply_install" && <div className="pv-gate">
          <div><p className="mini-label">Base di costo</p><h4>Rialzo esplicito al costo di riproduzione</h4><p>Il riferimento 1,37 è desunto dalla prassi FVG e non è una regola nazionale. Non viene applicato automaticamente.</p></div>
          <label className="toggle-line"><input type="checkbox" checked={plant.applyReproductionUplift} onChange={(event) => updatePlant(plant.id, { applyReproductionUplift: event.target.checked })} />Applica un fattore documentato</label>
          {plant.applyReproductionUplift && <><label>Fattore di rialzo<input type="number" min="1" step="0.01" value={plant.upliftFactor} onChange={(event) => updatePlant(plant.id, { upliftFactor: Number(event.target.value) })} /></label><label className="description">Fonte e motivazione<input value={plant.upliftSource} onChange={(event) => updatePlant(plant.id, { upliftSource: event.target.value })} placeholder="Es. Nota tecnica FVG, componenti incluse e pertinenza al caso" /></label></>}
        </div>}
        {isPhotovoltaic && <div className="pv-gate">
          <div><p className="mini-label">Gate Circolare 36/E/2013</p><h4>Verifica della modesta entità</h4></div>
          <label>UIU servite<input type="number" min="1" value={plant.servedUnits} onChange={(event) => updatePlant(plant.id, { servedUnits: Math.max(1, Number(event.target.value)) })} /></label>
          <label className="toggle-line"><input type="checkbox" checked={plant.shared} onChange={(event) => updatePlant(plant.id, { shared: event.target.checked })} />Impianto su parti comuni</label>
          <label className="toggle-line"><input type="checkbox" checked={plant.groundMounted} onChange={(event) => updatePlant(plant.id, { groundMounted: event.target.checked, variant: event.target.checked ? "A terra" : plant.variant })} />Installazione a terra</label>
          {plant.groundMounted && <label>Volume convenzionale (m³)<input type="number" min="0" value={plant.groundVolume || ""} onChange={(event) => updatePlant(plant.id, { groundVolume: Number(event.target.value) })} /></label>}
        </div>}
        <label className="included-check"><input type="checkbox" checked={plant.alreadyIncluded} onChange={(event) => updatePlant(plant.id, { alreadyIncluded: event.target.checked })} />Valore già considerato nella rendita in atti</label>
        {row?.exclusionReason && <div className="exclusion-note"><strong>Escluso dal calcolo</strong><span>{row.exclusionReason}</span>{row.exclusion?.source && <small>{row.exclusion.source}</small>}</div>}
        {row?.issues?.length > 0 && <div className="exclusion-note"><strong>Validazione: {row.status}</strong>{row.issues.map(({ code, message }: { code: string; message: string }) => <span key={code}>{message}</span>)}</div>}
        <div className="plant-metrics"><span><small>Base normalizzata</small><strong>{euro.format(row?.normalizedNewValue ?? 0)}</strong></span><span><small>Valore apprezzabile</small><strong>{euro.format(row?.assessableCost ?? 0)}</strong></span><span><small>Quota UIU</small><strong>{euro.format(row?.allocatedCost ?? 0)}</strong></span><span><small>Fattore infracensuario</small><strong>{row?.depreciation === null ? "Non valido" : `${percent.format((row?.depreciation ?? 0) * 100)}%`}</strong></span><span><small>Valore 1988–89</small><strong>{euro.format(row?.adjustedValue ?? 0)}</strong></span></div>
      </div>;
    })}
    <div className="tariff-panel">
      <div><p className="mini-label">Doppio riscontro</p><h3>Scarto tariffario locale</h3><p>Inserisci le tariffe ufficiali della stessa categoria e zona censuaria. Lo scarto non sostituisce il 15%: i due riferimenti sono mostrati insieme e un eventuale disaccordo genera una zona d’incertezza.</p></div>
      <div className="field-grid two">
        <label>Tariffa classe attuale<input type="number" min="0" step="0.01" value={unit.currentTariff || ""} onChange={(event) => setUnit({ ...unit, currentTariff: Number(event.target.value) })} /></label>
        <label>Tariffa classe successiva<input type="number" min="0" step="0.01" value={unit.nextTariff || ""} onChange={(event) => setUnit({ ...unit, nextTariff: Number(event.target.value) })} /></label>
      </div>
      <div className="tariff-result"><span>Riscontro disponibile</span><strong>{calculation.localGap === null ? "15,00% — solo benchmark operativo" : `${percent.format(calculation.localGap)}% locale + 15,00% benchmark`}</strong></div>
    </div>
  </div>;
}

function ComparativeAnalysis({ factors, setFactors, evidence, setEvidence, comparison }: {
  factors: Record<FactorKey, FactorValue>;
  setFactors: (factors: Record<FactorKey, FactorValue>) => void;
  evidence: typeof defaultEvidence;
  setEvidence: (evidence: typeof defaultEvidence) => void;
  comparison: ReturnType<typeof evaluateComparison>;
}) {
  return <div className="analysis-panel">
    <div className="comparison-callout"><strong>Giudizio relativo, non punteggio.</strong><p>Valuta lo stato post operam rispetto all’unità tipo della classe attuale e all’ordinarietà della zona. “Allineato” significa recupero dell’obsolescenza, non incremento di classe.</p></div>
    <div className="factor-table">
      {factorDefinitions.map(({ key, title, note }) => <div className="factor-row" key={key}><div><strong>{title}</strong><small>{note}</small></div><select value={factors[key]} onChange={(event) => setFactors({ ...factors, [key]: event.target.value as FactorValue })}>{factorOptions.map(({ value, label }) => <option value={value} key={value}>{label}</option>)}</select></div>)}
    </div>
    <div className="evidence-panel">
      <p className="mini-label">Base documentale</p><h3>Quali riscontri sono disponibili?</h3>
      <div className="evidence-grid">
        <label className={evidence.unitType ? "checked" : ""}><input type="checkbox" checked={evidence.unitType} onChange={(event) => setEvidence({ ...evidence, unitType: event.target.checked })} /><span>Unità tipo / Modello 16</span></label>
        <label className={evidence.comparables ? "checked" : ""}><input type="checkbox" checked={evidence.comparables} onChange={(event) => setEvidence({ ...evidence, comparables: event.target.checked })} /><span>UIU comparabili locali</span></label>
        <label className={evidence.tariffTable ? "checked" : ""}><input type="checkbox" checked={evidence.tariffTable} onChange={(event) => setEvidence({ ...evidence, tariffTable: event.target.checked })} /><span>Quadro tariffario</span></label>
      </div>
      <p className="evidence-status">Stato: <strong>{comparison.status === "review" ? "scostamento da approfondire" : comparison.status === "ordinary" ? "ordinarietà dichiarata" : "istruttoria incompleta"}</strong></p>
    </div>
  </div>;
}
