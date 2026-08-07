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

## 4. Calcolo per i soli impianti

Per ogni impianto:

```text
quota_UIU = costo × percentuale_riferibile_alla_UIU

deprezzamento = 1 − [(1 − valore_residuo) × 10] / (2 × vita_utile)

valore_1988_89 = quota_UIU × deprezzamento × coefficiente_anno
```

Il valore ante operam è:

```text
valore_ante = rendita_attuale × moltiplicatore_categoria
```

L’incidenza stimata è:

```text
incidenza = somma_valori_impianti_1988_89 / valore_ante
```

Il confronto usa `≥ 15%`, coerentemente con l’espressione “pari o superiore” contenuta nella Risoluzione 21/E/2026. Il risultato identifica una fattispecie meritevole di rideterminazione del classamento, non determina autonomamente categoria, classe o rendita definitiva.

## 5. Confronto con lo scarto tariffario locale

Quando sono disponibili le tariffe della classe in atti e di quella immediatamente successiva, il benchmark fisso del 15% viene sostituito dallo scarto effettivo:

```text
scarto_locale = (tariffa_successiva - tariffa_attuale) / tariffa_attuale × 100
```

Il dato è un riferimento quantitativo territoriale; non sostituisce la comparazione con le unità tipo.

## 6. Opere miste e comparazione qualitativa

Per cappotto, infissi, distribuzione, finiture e interventi complessi l’app non somma automaticamente i costi. Il tecnico qualifica ciascun fattore come invariato, allineato all’ordinarietà, superiore all’unità tipo oppure non verificato. La presenza di un fattore superiore genera una richiesta di approfondimento, non un salto automatico di classe.

## 7. Stati restituiti

- **Aggiornamento necessario** — mutazione oggettiva dichiarata.
- **Verifica economica positiva** — soli impianti e incidenza pari o superiore al 15%.
- **Sotto soglia** — soli impianti e incidenza inferiore al 15%, con le cautele indicate nella relazione.
- **Valutazione tecnico-estimativa complessiva** — intervento misto o edilizio.
- **Controllo preliminare** — classamento ante operam non verificato.
- **Dati incompleti** — rendita o valori impiantistici mancanti.
- **Stima specifica richiesta** — categoria speciale o particolare fuori dal perimetro dell’MVP.
- **Ordinarietà dinamica** — fattori invariati o ricondotti allo standard ordinario, con necessità di riscontro locale.
- **Scostamento comparativo** — almeno un fattore dichiarato superiore all’unità tipo, da documentare.
