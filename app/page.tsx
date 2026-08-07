"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateScenario,
  coefficients,
  evaluateComparison,
} from "../lib/cadastral.mjs";

type ChangeKey = "destination" | "consistency" | "distribution" | "shape";
type AnalysisPath = "plants" | "comparative";
type Coherence = "yes" | "no" | "unknown";
type FactorValue = "unchanged" | "aligned" | "superior" | "unknown";
type FactorKey = "envelope" | "plants" | "finishes" | "distribution" | "services" | "conservation";

type Plant = {
  id: number;
  description: string;
  year: number;
  cost: number;
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

const defaultFactors: Record<FactorKey, FactorValue> = {
  envelope: "unknown",
  plants: "unknown",
  finishes: "unknown",
  distribution: "unknown",
  services: "unknown",
  conservation: "unknown",
};

const defaultEvidence = { unitType: false, comparables: false, tariffTable: false };

const newPlant = (id = 1): Plant => ({
  id,
  description: "Impianto fotovoltaico",
  year: 2023,
  cost: 0,
  usefulLife: 20,
  residual: 0,
  share: 100,
  alreadyIncluded: false,
});

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STORAGE_KEY = "verifica-catastale:v2";

export default function Home() {
  const [unit, setUnit] = useState(defaultUnit);
  const [coherence, setCoherence] = useState<Coherence>("unknown");
  const [changes, setChanges] = useState(defaultChanges);
  const [analysisPath, setAnalysisPath] = useState<AnalysisPath>("plants");
  const [plants, setPlants] = useState<Plant[]>([newPlant()]);
  const [factors, setFactors] = useState(defaultFactors);
  const [evidence, setEvidence] = useState(defaultEvidence);
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
          if (parsed.analysisPath) setAnalysisPath(parsed.analysisPath);
          if (Array.isArray(parsed.plants) && parsed.plants.length) setPlants(parsed.plants);
          if (parsed.factors) setFactors({ ...defaultFactors, ...parsed.factors });
          if (parsed.evidence) setEvidence({ ...defaultEvidence, ...parsed.evidence });
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unit, coherence, changes, analysisPath, plants, factors, evidence, notes }));
  }, [hydrated, unit, coherence, changes, analysisPath, plants, factors, evidence, notes]);

  const calculation = useMemo(() => calculateScenario({
    category: unit.category,
    rent: unit.rent,
    plants,
    currentTariff: unit.currentTariff,
    nextTariff: unit.nextTariff,
  }), [plants, unit.category, unit.currentTariff, unit.nextTariff, unit.rent]);

  const comparison = useMemo(() => evaluateComparison(factors), [factors]);
  const selectedChanges = changeDefinitions.filter(({ key }) => changes[key]);
  const hasObjectiveChanges = selectedChanges.length > 0;
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
    if (calculation.multiplier === null) {
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
    if (analysisPath === "plants") {
      if (unit.rent <= 0 || calculation.plantValue <= 0) {
        return {
          key: "incomplete",
          label: "Dati insufficienti",
          title: "Completare il calcolo impiantistico",
          text: "Servono la rendita in atti e almeno un impianto con costo, anno, vita utile e quota riferibile alla UIU.",
          confidence: "Non calcolabile",
          method: "Confronto economico 21/E/2026",
          actions: ["Inserire la rendita", "Valorizzare gli impianti", "Controllare quote e valori già censiti"],
        };
      }
      if (calculation.meetsThreshold) {
        return {
          key: "review",
          label: calculation.thresholdSource === "local-tariff" ? "Scarto tariffario raggiunto" : "Benchmark raggiunto",
          title: "Riclassamento meritevole di verifica",
          text: "L’incremento impiantistico stimato raggiunge il riferimento selezionato. Il risultato non assegna da solo una nuova classe: occorre la comparazione catastale locale.",
          confidence: calculation.thresholdSource === "local-tariff" ? "Medio-alta" : "Media",
          method: calculation.thresholdSource === "local-tariff" ? "21/E + scarto reale fra classi contigue" : "21/E + benchmark nazionale del 15%",
          actions: ["Confrontare le unità tipo", "Verificare la tariffa della classe successiva", "Motivare l’eventuale DOCFA"],
        };
      }
      return {
        key: "ordinary",
        label: "Sotto il riferimento",
        title: "Nessun incremento apprezzabile dal solo impianto",
        text: "Il calcolo non raggiunge il benchmark o lo scarto tariffario locale. Restano da escludere mutazioni e disallineamenti non rappresentati dai dati inseriti.",
        confidence: calculation.thresholdSource === "local-tariff" ? "Medio-alta" : "Media",
        method: calculation.thresholdSource === "local-tariff" ? "21/E + scarto reale fra classi contigue" : "21/E + benchmark nazionale del 15%",
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
  }, [analysisPath, calculation, coherence, comparison, evidenceCount, hasObjectiveChanges, unit.rent]);

  function updatePlant(id: number, patch: Partial<Plant>) {
    setPlants((current) => current.map((plant) => plant.id === id ? { ...plant, ...patch } : plant));
  }

  function resetCase() {
    if (!window.confirm("Azzerare tutti i dati salvati per questa verifica?")) return;
    setUnit(defaultUnit);
    setCoherence("unknown");
    setChanges(defaultChanges);
    setAnalysisPath("plants");
    setPlants([newPlant()]);
    setFactors(defaultFactors);
    setEvidence(defaultEvidence);
    setNotes("");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Torna all’inizio">
          <span className="brand-mark">VC</span>
          <span><strong>Verifica catastale</strong><small>Strumento tecnico post-interventi</small></span>
        </a>
        <div className="header-actions">
          <span className="version-pill">Metodo v0.2</span>
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
            </section>

            <section className="form-section" id="analysis">
              <SectionTitle number="03" label="Scelta del metodo" title="Quale fattispecie devi valutare?" />
              <div className="method-choice-grid">
                <button type="button" className={`method-choice ${analysisPath === "plants" ? "selected" : ""}`} onClick={() => setAnalysisPath("plants")}><span>A</span><strong>Solo ampliamento impiantistico</strong><small>Confronto economico ante/post secondo la Risoluzione 21/E/2026.</small></button>
                <button type="button" className={`method-choice ${analysisPath === "comparative" ? "selected" : ""}`} onClick={() => setAnalysisPath("comparative")}><span>B</span><strong>Opere miste o miglioramento qualitativo</strong><small>Comparazione con unità tipo e ordinarietà locale, senza automatismi di costo.</small></button>
              </div>

              {analysisPath === "plants" ? (
                <PlantAnalysis unit={unit} setUnit={setUnit} plants={plants} setPlants={setPlants} updatePlant={updatePlant} calculation={calculation} />
              ) : (
                <ComparativeAnalysis factors={factors} setFactors={setFactors} evidence={evidence} setEvidence={setEvidence} comparison={comparison} />
              )}
            </section>

            <section className="form-section notes-section">
              <SectionTitle number="04" label="Tracciabilità" title="Annotazioni e riscontri del tecnico" />
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Indicare documenti consultati, unità comparabili, assunzioni estimative e cautele residue…" />
            </section>

            <section className="method-section">
              <SectionTitle number="M" label="Perimetro metodologico" title="Cosa calcola — e cosa non calcola" />
              <div className="method-grid">
                <div><span>01</span><strong>Impianti</strong><p>Costo pertinente, quota UIU, deprezzamento infracensuario e ragguaglio al 1988–1989.</p></div>
                <div><span>02</span><strong>Tariffe locali</strong><p>Se fornite, sostituiscono il benchmark fisso con lo scarto reale tra classi contigue.</p></div>
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
            {analysisPath === "plants" && calculation.multiplier !== null && <>
              <div className="result-values">
                <div><span>Valore ante</span><strong>{euro.format(calculation.valueBefore)}</strong></div>
                <div><span>Impianti ragguagliati</span><strong>{euro.format(calculation.plantValue)}</strong></div>
                <div><span>Valore post stimato</span><strong>{euro.format(calculation.valueAfter)}</strong></div>
                <div className="primary-value"><span>Incidenza</span><strong>{percent.format(calculation.incidence)}%</strong></div>
                <div><span>Riferimento</span><strong>{percent.format(calculation.threshold)}%</strong></div>
              </div>
              <div className="threshold"><div className="threshold-track"><span style={{ width: `${Math.min(100, (calculation.incidence / Math.max(calculation.threshold * 2, 1)) * 100)}%` }} /></div><div><span>0%</span><span className="threshold-mark">soglia {percent.format(calculation.threshold)}%</span><span>{percent.format(calculation.threshold * 2)}%</span></div></div>
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
  return <div className="analysis-panel">
    <div className="panel-heading"><div><p>Dotazione attuale</p><h3>Impianti da apprezzare</h3></div><button className="add-button" type="button" onClick={() => setPlants((current) => [...current, newPlant(Math.max(...current.map(({ id }) => id), 0) + 1)])}>+ Aggiungi impianto</button></div>
    {plants.map((plant, index) => {
      const row = calculation.rows[index];
      return <div className="plant-card" key={plant.id}>
        <div className="plant-card-heading"><span>Impianto {String(index + 1).padStart(2, "0")}</span>{plants.length > 1 && <button type="button" onClick={() => setPlants((current) => current.filter(({ id }) => id !== plant.id))}>Rimuovi</button>}</div>
        <div className="field-grid plant-fields">
          <label className="description">Descrizione<input value={plant.description} onChange={(event) => updatePlant(plant.id, { description: event.target.value })} /></label>
          <label>Anno<select value={plant.year} onChange={(event) => updatePlant(plant.id, { year: Number(event.target.value) })}>{Object.keys(coefficients).reverse().map((year) => <option key={year}>{year}</option>)}</select></label>
          <label>Costo pertinente (€)<input type="number" min="0" value={plant.cost || ""} onChange={(event) => updatePlant(plant.id, { cost: Number(event.target.value) })} /></label>
          <label>Vita utile (anni)<input type="number" min="1" value={plant.usefulLife} onChange={(event) => updatePlant(plant.id, { usefulLife: Number(event.target.value) })} /></label>
          <label>Residuo finale (%)<input type="number" min="0" max="100" value={plant.residual} onChange={(event) => updatePlant(plant.id, { residual: Number(event.target.value) })} /></label>
          <label>Quota UIU (%)<input type="number" min="0" max="100" value={plant.share} onChange={(event) => updatePlant(plant.id, { share: Number(event.target.value) })} /></label>
        </div>
        <label className="included-check"><input type="checkbox" checked={plant.alreadyIncluded} onChange={(event) => updatePlant(plant.id, { alreadyIncluded: event.target.checked })} />Valore già considerato nella rendita in atti</label>
        <div className="plant-metrics"><span><small>Quota costo</small><strong>{euro.format(row?.allocatedCost ?? 0)}</strong></span><span><small>Deprezzamento</small><strong>{percent.format((row?.depreciation ?? 0) * 100)}%</strong></span><span><small>Valore 1988–89</small><strong>{euro.format(row?.adjustedValue ?? 0)}</strong></span></div>
      </div>;
    })}
    <div className="tariff-panel">
      <div><p className="mini-label">Confronto opzionale</p><h3>Scarto tariffario locale</h3><p>Inserisci le tariffe della stessa categoria e zona censuaria. Se i dati non sono disponibili, resta attivo il benchmark del 15%.</p></div>
      <div className="field-grid two">
        <label>Tariffa classe attuale<input type="number" min="0" step="0.01" value={unit.currentTariff || ""} onChange={(event) => setUnit({ ...unit, currentTariff: Number(event.target.value) })} /></label>
        <label>Tariffa classe successiva<input type="number" min="0" step="0.01" value={unit.nextTariff || ""} onChange={(event) => setUnit({ ...unit, nextTariff: Number(event.target.value) })} /></label>
      </div>
      <div className="tariff-result"><span>Riferimento applicato</span><strong>{calculation.thresholdSource === "local-tariff" ? `${percent.format(calculation.threshold)}% — scarto locale` : "15,00% — benchmark"}</strong></div>
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
