"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateScenario, coefficients } from "../lib/cadastral.mjs";

type ChangeKey = "destination" | "consistency" | "distribution" | "shape";
type InterventionType = "plants" | "mixed" | "building";
type Coherence = "yes" | "no" | "unknown";

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
  "C/1", "C/2", "C/3", "C/4", "C/5", "C/6", "C/7",
  "D/E o categoria speciale",
];

const defaultUnit = {
  municipality: "",
  sheet: "",
  parcel: "",
  sub: "",
  category: "A/2",
  cadastralClass: "",
  rent: 0,
};

const defaultChanges: Record<ChangeKey, boolean> = {
  destination: false,
  consistency: false,
  distribution: false,
  shape: false,
};

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

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STORAGE_KEY = "verifica-catastale-mvp:v1";

export default function Home() {
  const [unit, setUnit] = useState(defaultUnit);
  const [coherence, setCoherence] = useState<Coherence>("unknown");
  const [changes, setChanges] = useState(defaultChanges);
  const [interventionType, setInterventionType] = useState<InterventionType>("plants");
  const [plants, setPlants] = useState<Plant[]>([newPlant()]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.unit) setUnit(parsed.unit);
          if (parsed.coherence) setCoherence(parsed.coherence);
          if (parsed.changes) setChanges(parsed.changes);
          if (parsed.interventionType) setInterventionType(parsed.interventionType);
          if (Array.isArray(parsed.plants) && parsed.plants.length) setPlants(parsed.plants);
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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ unit, coherence, changes, interventionType, plants }),
    );
  }, [hydrated, unit, coherence, changes, interventionType, plants]);

  const calculation = useMemo(() => {
    return calculateScenario({ category: unit.category, rent: unit.rent, plants });
  }, [plants, unit.category, unit.rent]);

  const hasObjectiveChanges = Object.values(changes).some(Boolean);

  const result = useMemo(() => {
    if (hasObjectiveChanges) {
      return {
        key: "necessary",
        eyebrow: "Obbligo dichiarativo",
        title: "Aggiornamento necessario",
        text: "È stata indicata almeno una mutazione oggettiva che comporta il riesame di categoria, classe, consistenza o configurazione dell’unità.",
      };
    }
    if (calculation.multiplier === null) {
      return {
        key: "review",
        eyebrow: "Fuori perimetro MVP",
        title: "Stima specifica richiesta",
        text: "Le categorie speciali e particolari richiedono un procedimento estimativo dedicato e non vengono risolte da questo modello semplificato.",
      };
    }
    if (coherence !== "yes") {
      return {
        key: "review",
        eyebrow: "Controllo preliminare",
        title: "Verificare il classamento ante operam",
        text: "Il confronto economico non è conclusivo finché non è accertata la coerenza tra classamento in atti e stato di fatto precedente ai lavori.",
      };
    }
    if (interventionType !== "plants") {
      return {
        key: "technical",
        eyebrow: "Interventi non solo impiantistici",
        title: "Valutazione tecnico-estimativa complessiva",
        text: "Per opere miste o edilizie il 15% non opera come soglia generale di esclusione: occorre valutare l’effetto complessivo sul livello qualitativo, funzionale e reddituale.",
      };
    }
    if (unit.rent <= 0 || calculation.plantValue <= 0) {
      return {
        key: "incomplete",
        eyebrow: "Dati incompleti",
        title: "Completare la scheda di calcolo",
        text: "Inserire la rendita attuale e almeno un impianto con costo, anno, vita utile e quota riferibile all’unità.",
      };
    }
    if (calculation.incidence >= 15) {
      return {
        key: "positive",
        eyebrow: "Verifica economica positiva",
        title: "Rideterminazione del classamento meritevole di valutazione",
        text: "Nel caso di mero ampliamento impiantistico, l’incremento stimato è pari o superiore al riferimento del 15%. L’esito va tradotto in una proposta di classamento coerente con le unità comparabili.",
      };
    }
    return {
      key: "below",
      eyebrow: "Verifica economica sotto soglia",
      title: "Non emerge un incremento apprezzabile dal solo calcolo",
      text: "Per il mero ampliamento impiantistico il riferimento del 15% non è raggiunto. L’esito non sana disallineamenti preesistenti e non sostituisce il confronto con il quadro tariffario locale.",
    };
  }, [calculation, coherence, hasObjectiveChanges, interventionType, unit.rent]);

  function updatePlant(id: number, patch: Partial<Plant>) {
    setPlants((current) => current.map((plant) => (plant.id === id ? { ...plant, ...patch } : plant)));
  }

  function addPlant() {
    setPlants((current) => [...current, newPlant(Math.max(...current.map((item) => item.id), 0) + 1)]);
  }

  function resetAll() {
    setUnit(defaultUnit);
    setCoherence("unknown");
    setChanges(defaultChanges);
    setInterventionType("plants");
    setPlants([newPlant()]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Torna all’inizio">
          <span className="brand-mark">VC</span>
          <span>
            <strong>Verifica catastale</strong>
            <small>post-interventi</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="version-pill">MVP · Regole 21/E/2026</span>
          <button className="text-button" type="button" onClick={resetAll}>Azzera</button>
          <button className="print-button" type="button" onClick={() => window.print()}>Stampa scheda</button>
        </div>
      </header>

      <div className="hero" id="top">
        <div>
          <p className="overline">Strumento di orientamento tecnico</p>
          <h1>Dal costo dei lavori a una decisione <em>motivata</em>.</h1>
        </div>
        <p className="hero-copy">
          Un percorso guidato che separa le variazioni oggettive, il calcolo per i soli impianti e i casi che richiedono una valutazione comparativa del classamento.
        </p>
      </div>

      <nav className="step-nav" aria-label="Sezioni della verifica">
        <a href="#immobile"><span>01</span> Immobile</a>
        <a href="#mutazioni"><span>02</span> Mutazioni</a>
        <a href="#interventi"><span>03</span> Interventi</a>
        <a href="#esito"><span>04</span> Esito</a>
      </nav>

      <div className="workspace">
        <div className="form-column">
          <section className="form-section" id="immobile">
            <div className="section-heading">
              <span>01</span>
              <div>
                <p>Dati di partenza</p>
                <h2>Unità immobiliare</h2>
              </div>
            </div>
            <div className="field-grid four">
              <label className="wide">
                Comune
                <input value={unit.municipality} onChange={(e) => setUnit({ ...unit, municipality: e.target.value })} placeholder="es. Giugliano in Campania" />
              </label>
              <label>Foglio<input value={unit.sheet} onChange={(e) => setUnit({ ...unit, sheet: e.target.value })} /></label>
              <label>Particella<input value={unit.parcel} onChange={(e) => setUnit({ ...unit, parcel: e.target.value })} /></label>
              <label>Subalterno<input value={unit.sub} onChange={(e) => setUnit({ ...unit, sub: e.target.value })} /></label>
              <label>
                Categoria
                <select value={unit.category} onChange={(e) => setUnit({ ...unit, category: e.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>Classe<input value={unit.cadastralClass} onChange={(e) => setUnit({ ...unit, cadastralClass: e.target.value })} /></label>
              <label className="rent-field">Rendita attuale (€)<input type="number" min="0" step="0.01" value={unit.rent || ""} onChange={(e) => setUnit({ ...unit, rent: Number(e.target.value) })} /></label>
            </div>

            <fieldset className="radio-fieldset">
              <legend>Il classamento in atti era coerente con lo stato di fatto precedente ai lavori?</legend>
              <div className="segmented">
                {(["yes", "no", "unknown"] as Coherence[]).map((value) => (
                  <label key={value} className={coherence === value ? "selected" : ""}>
                    <input type="radio" name="coherence" checked={coherence === value} onChange={() => setCoherence(value)} />
                    {value === "yes" ? "Sì" : value === "no" ? "No" : "Da verificare"}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="form-section" id="mutazioni">
            <div className="section-heading">
              <span>02</span>
              <div><p>Prima soglia decisionale</p><h2>Mutazioni oggettive</h2></div>
            </div>
            <p className="section-intro">Indica le variazioni intervenute rispetto allo stato catastale precedente. Una risposta positiva prevale sul calcolo economico.</p>
            <div className="check-grid">
              {([
                ["destination", "Destinazione d’uso", "Mutamento permanente della destinazione ordinaria"],
                ["consistency", "Consistenza", "Vani, superfici, volume o ampliamento"],
                ["distribution", "Distribuzione interna", "Configurazione planimetrica o caratteri distributivi"],
                ["shape", "Conformazione o sagoma", "Modifica geometrica, tipologica o costruttiva rilevante"],
              ] as [ChangeKey, string, string][]).map(([key, title, note]) => (
                <label className={`check-card ${changes[key] ? "checked" : ""}`} key={key}>
                  <input type="checkbox" checked={changes[key]} onChange={(e) => setChanges({ ...changes, [key]: e.target.checked })} />
                  <span className="check-box" aria-hidden="true">{changes[key] ? "✓" : ""}</span>
                  <span><strong>{title}</strong><small>{note}</small></span>
                </label>
              ))}
            </div>
          </section>

          <section className="form-section" id="interventi">
            <div className="section-heading">
              <span>03</span>
              <div><p>Perimetro della verifica</p><h2>Tipologia di intervento</h2></div>
            </div>
            <div className="choice-grid">
              {([
                ["plants", "Solo ampliamento impiantistico", "Fotovoltaico, accumulo, eolico, solare termico o altri impianti, senza ulteriori opere edilizie."],
                ["mixed", "Intervento misto", "Impianti insieme a cappotto, serramenti, ascensore, finiture o altre migliorie."],
                ["building", "Opere edilizie o qualitative", "Interventi sull’involucro o sul livello funzionale senza nuovi impianti rilevanti."],
              ] as [InterventionType, string, string][]).map(([value, title, note]) => (
                <label className={`choice-card ${interventionType === value ? "selected" : ""}`} key={value}>
                  <input type="radio" name="intervention" checked={interventionType === value} onChange={() => setInterventionType(value)} />
                  <span className="radio-dot" />
                  <strong>{title}</strong><small>{note}</small>
                </label>
              ))}
            </div>

            {interventionType !== "building" ? (
              <div className="plants-panel">
                <div className="panel-heading">
                  <div><p>Dotazione impiantistica</p><h3>Impianti da valutare</h3></div>
                  <button type="button" className="add-button" onClick={addPlant}>+ Aggiungi impianto</button>
                </div>
                {plants.map((plant, index) => {
                  const row = calculation.rows[index];
                  return (
                    <article className="plant-card" key={plant.id}>
                      <div className="plant-card-heading">
                        <span>Impianto {String(index + 1).padStart(2, "0")}</span>
                        {plants.length > 1 ? <button type="button" onClick={() => setPlants((current) => current.filter((item) => item.id !== plant.id))}>Rimuovi</button> : null}
                      </div>
                      <div className="field-grid plant-fields">
                        <label className="description">Descrizione<input value={plant.description} onChange={(e) => updatePlant(plant.id, { description: e.target.value })} /></label>
                        <label>Anno<select value={plant.year} onChange={(e) => updatePlant(plant.id, { year: Number(e.target.value) })}>{Object.keys(coefficients).reverse().map((year) => <option key={year}>{year}</option>)}</select></label>
                        <label>Costo/valore iniziale (€)<input type="number" min="0" step="100" value={plant.cost || ""} onChange={(e) => updatePlant(plant.id, { cost: Number(e.target.value) })} /></label>
                        <label>Vita utile (anni)<input type="number" min="1" max="100" value={plant.usefulLife} onChange={(e) => updatePlant(plant.id, { usefulLife: Number(e.target.value) })} /></label>
                        <label>Valore residuo (%)<input type="number" min="0" max="100" value={plant.residual} onChange={(e) => updatePlant(plant.id, { residual: Number(e.target.value) })} /></label>
                        <label>Quota UIU (%)<input type="number" min="0" max="100" value={plant.share} onChange={(e) => updatePlant(plant.id, { share: Number(e.target.value) })} /></label>
                      </div>
                      <label className="included-check"><input type="checkbox" checked={plant.alreadyIncluded} onChange={(e) => updatePlant(plant.id, { alreadyIncluded: e.target.checked })} /> Già considerato nella rendita attuale: escludi dal nuovo incremento</label>
                      <div className="plant-metrics">
                        <span><small>Ragguaglio anno</small><strong>{row?.coefficient.toFixed(4)}</strong></span>
                        <span><small>Deprezzamento infracensuario</small><strong>{percent.format((row?.depreciation ?? 0) * 100)}%</strong></span>
                        <span><small>Valore riferito al 1988–89</small><strong>{euro.format(row?.adjustedValue ?? 0)}</strong></span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="method-section" id="metodo">
            <div className="section-heading compact">
              <span>i</span>
              <div><p>Tracciabilità</p><h2>Come viene costruito il risultato</h2></div>
            </div>
            <div className="method-grid">
              <div><span>01</span><strong>Valore ante operam</strong><p>Rendita attuale × moltiplicatore della categoria ex D.M. 14 dicembre 1991.</p></div>
              <div><span>02</span><strong>Valore degli impianti</strong><p>Costo × quota UIU × deprezzamento × coefficiente di ragguaglio all’epoca 1988–89.</p></div>
              <div><span>03</span><strong>Incidenza</strong><p>Valore ragguagliato dei nuovi impianti ÷ valore catastale ante operam.</p></div>
              <div><span>04</span><strong>Esito graduato</strong><p>Il 15% orienta il solo caso impiantistico; negli altri casi resta necessaria la valutazione comparativa.</p></div>
            </div>
            <details>
              <summary>Fonti e limiti del modello</summary>
              <div className="source-copy">
                <p>Il modello recepisce l’impostazione della Risoluzione AdE 21/E del 5 giugno 2026 e utilizza i coefficienti annuali presenti nel foglio 2026 del Collegio Geometri e Geometri Laureati della Provincia di Trento. La provenienza e l’aggiornamento periodico di questi coefficienti dovranno essere documentati prima della distribuzione pubblica.</p>
                <p><a href="https://www.agenziaentrate.gov.it/portale/documents/20143/10065077/Risoluzione%2Bn.%2B21%2Bdel%2B5%2Bgiugno%2B2026%2B-%2BInterventi%2Bedilizi%2Bche%2Bcomportano%2Bobbligo%2Baggiornamento%2Bcatastale_.pdf/4dc0de4f-d0df-7dbd-9997-9a8ec5746080?t=1780664988508" target="_blank" rel="noreferrer">Risoluzione 21/E/2026</a> · <a href="https://www1.agenziaentrate.gov.it/mt/circolari/circolare_6_2012.pdf" target="_blank" rel="noreferrer">Circolare 6/T/2012</a></p>
              </div>
            </details>
          </section>
        </div>

        <aside className={`result-card result-${result.key}`} id="esito">
          <div className="result-topline"><span>04 · Esito</span><span className="live-dot">calcolo attivo</span></div>
          <p className="result-eyebrow">{result.eyebrow}</p>
          <h2>{result.title}</h2>
          <p className="result-text">{result.text}</p>

          <div className="result-values">
            <div><span>Moltiplicatore</span><strong>{calculation.multiplier ?? "—"}</strong></div>
            <div><span>Valore ante operam</span><strong>{calculation.valueBefore ? euro.format(calculation.valueBefore) : "—"}</strong></div>
            <div><span>Nuovi impianti 1988–89</span><strong>{euro.format(calculation.plantValue)}</strong></div>
            <div className="primary-value"><span>Incidenza stimata</span><strong>{percent.format(calculation.incidence)}%</strong></div>
          </div>

          <div className="threshold" aria-label={`Incidenza ${percent.format(calculation.incidence)} per cento su soglia 15 per cento`}>
            <div className="threshold-track"><span style={{ width: `${Math.min(100, calculation.incidence / 0.3)}%` }} /></div>
            <div><small>0%</small><small className="threshold-mark">15% riferimento</small><small>30%+</small></div>
          </div>

          <div className="result-note">
            <strong>Nota professionale</strong>
            <p>Lo strumento documenta un percorso di verifica e non sostituisce la proposta di classamento, il confronto con le unità tipo né la responsabilità del tecnico.</p>
          </div>
        </aside>
      </div>

      <footer>
        <span>Prototipo tecnico · versione 0.1</span>
        <span>Dati salvati esclusivamente in questo browser</span>
      </footer>
    </main>
  );
}
