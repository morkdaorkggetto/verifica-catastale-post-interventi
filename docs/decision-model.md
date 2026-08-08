# Modello decisionale

## 1. Controllo preliminare

Prima di isolare l’effetto dei nuovi lavori occorre verificare che il classamento in atti corrispondesse allo stato di fatto precedente agli interventi. Se la risposta è negativa o incerta, l’applicazione restituisce **“Verificare il classamento ante operam”**.

## 2. Mutazioni oggettive

L’indicazione di una variazione di destinazione, consistenza, distribuzione, conformazione o sagoma prevale sul calcolo economico e conduce all’esito **“Aggiornamento necessario”**.

Questa parte potrà essere ampliata con ulteriori caratteri costruttivi, tipologici e funzionali incidenti su categoria, classe o consistenza.

## 3. Perimetro dell’intervento

Il modello distingue tre situazioni:

1. **Solo ampliamento impiantistico** — è applicabile il confronto economico ante/post indicato, in prima approssimazione, dalla Risoluzione 21/E/2026.
2. **Intervento misto** — impianti insieme a involucro, serramenti, ascensori, finiture o altre migliorie. Il 15% non è usato come soglia generale di esclusione.
3. **Opere edilizie o qualitative** — è richiesta una valutazione tecnico-estimativa complessiva e comparativa.

L’inventario degli interventi determina il percorso raccomandato. La scelta manuale di un metodo diverso resta possibile come deroga professionale, ma richiede una motivazione testuale conservata nella relazione.

### Validazione degli input

Ogni calcolo assume uno dei tre stati `valid`, `warning` o `invalid`:

- `valid` — i dati consentono l’elaborazione;
- `warning` — il calcolo è mostrato come riscontro provvisorio, ma l’esito resta non conclusivo;
- `invalid` — calcolo ed esportazione sono bloccati fino alla correzione.

Anno fuori tabella, categoria non riconosciuta, quota fuori dall’intervallo 0–100%, vita utile o residuo incompatibili, costo negativo e differenza incrementale incoerente non vengono trasformati in zero o corretti silenziosamente.

## 4. Calcolo per i soli impianti

Per ogni impianto:

```text
valore_apprezzabile = valore_a_nuovo − valore_dotazione_equivalente

quota_UIU = valore_apprezzabile × percentuale_riferibile_alla_UIU

deprezzamento = 1 − [(1 − valore_residuo) × 10] / (2 × vita_utile)

valore_1988_89 = quota_UIU × deprezzamento × coefficiente_anno
```

Il valore a nuovo viene prima qualificato come costo delle sole apparecchiature, fornitura e posa/CME, costo di riproduzione chiavi in mano oppure altra base documentata. Un eventuale rialzo dalla fornitura e posa al costo di riproduzione è applicato soltanto se attivato dal tecnico, con fattore e fonte espliciti. Il valore suggerito `1,37`, desunto dalla ricomposizione delle tabelle della prassi FVG, non costituisce un coefficiente nazionale e non viene applicato automaticamente.

Il valore ante operam è:

```text
valore_ante = rendita_attuale × moltiplicatore_categoria
```

L’incidenza stimata è:

```text
incidenza = somma_valori_impianti_1988_89 / valore_ante
```

Il confronto usa `≥ 15%`, coerentemente con l’espressione “pari o superiore” contenuta nella Risoluzione 21/E/2026. Il risultato identifica una fattispecie meritevole di rideterminazione del classamento, non determina autonomamente categoria, classe o rendita definitiva.

Prima del calcolo si applicano i gate pertinenti:

- il fotovoltaico è escluso quando ricorre almeno uno dei criteri di modesta entità della Circolare 36/E/2013;
- una dotazione già riflessa nella rendita è esclusa;
- una sostituzione equivalente non produce valore incrementale;
- per una sostituzione migliorativa è apprezzata soltanto la differenza documentata rispetto alla dotazione equivalente preesistente.

La vita utile di 20 anni e il residuo zero sono un’impostazione iniziale di prima approssimazione, non una regola tecnologica specifica. Il tecnico può modificarli se dispone di uno studio di settore pertinente.

Il coefficiente 2020 della tabella di origine è marcato come dato sospetto. Il calcolo resta visibile ma assume stato `warning` e non produce un esito conclusivo finché la serie non viene validata su una fonte primaria.

## 5. Confronto con lo scarto tariffario locale

Quando sono disponibili le tariffe della classe in atti e di quella immediatamente successiva, lo scarto effettivo è calcolato come:

```text
scarto_locale = (tariffa_successiva - tariffa_attuale) / tariffa_attuale × 100
```

Il dato è mostrato insieme al benchmark del 15%, non in sua sostituzione. Se entrambi sono superati o entrambi non superati l’app segnala convergenza; se forniscono indicazioni diverse restituisce una **zona di incertezza**. Nessuno dei due sostituisce la comparazione con le unità tipo.

Se la UIU è già nella classe apicale o manca una classe successiva nella zona, il motore non inventa una tariffa contigua e non riconduce automaticamente il caso al solo benchmark del 15%. Richiede riferimenti in un’altra zona censuaria dello stesso Comune o in un Comune analogo della provincia.

## 6. Catalogo degli impianti

Il catalogo distingue tre livelli:

1. **Regola catastale specifica** — al momento implementata per i gate del fotovoltaico.
2. **Analogia estimativa 21/E** — impianti fissi citati o trattabili per analogia, senza valori unitari nazionali predefiniti.
3. **Classificazione tecnica ENEA** — sottotipi e grandezze utili alla descrizione; non produce coefficienti o costi catastali automatici.

Questa separazione impedisce di confondere i requisiti delle detrazioni con la rilevanza reddituale catastale.

## 7. Opere miste e comparazione qualitativa

Per cappotto, infissi, distribuzione, finiture e interventi complessi l’app non somma automaticamente i costi. Il tecnico qualifica ciascun fattore come invariato, allineato all’ordinarietà, superiore all’unità tipo oppure non verificato. La presenza di un fattore superiore genera una richiesta di approfondimento, non un salto automatico di classe.

## 8. Stati restituiti

- **Aggiornamento necessario** — mutazione oggettiva dichiarata.
- **Verifica economica positiva** — soli impianti e incidenza pari o superiore al 15%.
- **Sotto soglia** — soli impianti e incidenza inferiore al 15%, con le cautele indicate nella relazione.
- **Esclusione documentata** — tutte le dotazioni sono fermate da un gate specifico o non presentano valore incrementale.
- **Zona di incertezza** — benchmark e scarto tariffario locale non convergono.
- **Valutazione tecnico-estimativa complessiva** — intervento misto o edilizio.
- **Controllo preliminare** — classamento ante operam non verificato.
- **Dati incompleti** — rendita o valori impiantistici mancanti.
- **Stima specifica richiesta** — categoria speciale o particolare fuori dal perimetro dell’MVP.
- **Ordinarietà dinamica** — fattori invariati o ricondotti allo standard ordinario, con necessità di riscontro locale.
- **Scostamento comparativo** — almeno un fattore dichiarato superiore all’unità tipo, da documentare.

## 9. Relazione esportabile

L’app genera due versioni della relazione, Markdown e RTF. La struttura del testo dipende dal metodo effettivamente applicato:

- per il mero ampliamento impiantistico espone impianti, ragguaglio, valore ante e post, incidenza e riferimento utilizzato;
- per le opere miste espone i fattori comparativi e la base documentale disponibile;
- per le mutazioni oggettive motiva la prevalenza del gate dichiarativo sul calcolo economico.

I valori compilati sono riportati nel documento. I soli dati mancanti vengono sostituiti da segnaposto nel formato `[[DA INSERIRE: ...]]`, così da rendere riconoscibili le integrazioni ancora necessarie prima della firma.
