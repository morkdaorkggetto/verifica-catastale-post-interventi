# Verifica catastale post-interventi

MVP di una webapp di supporto alla verifica dell’obbligo di aggiornamento catastale dopo interventi edilizi e impiantistici.

Il progetto nasce dall’analisi del foglio **“Verifica necessità Accatastamento 2026”** del Collegio Geometri e Geometri Laureati della Provincia di Trento. Non replica il foglio: ne conserva gli elementi utili, corregge le dipendenze di calcolo e separa il criterio economico del 15% dalla valutazione tecnico-estimativa complessiva.

## Cosa fa

- identifica le mutazioni oggettive che rendono necessario il riesame catastale;
- distingue il mero ampliamento impiantistico dagli interventi misti o edilizi;
- applica il moltiplicatore coerente con la categoria catastale ordinaria;
- calcola il deprezzamento infracensuario in funzione di vita utile e valore residuo;
- ragguaglia il valore degli impianti all’epoca censuaria 1988–1989;
- ripartisce impianti comuni per quota riferibile alla singola UIU;
- esclude gli impianti già considerati nella rendita in atti;
- separa tre livelli: mutazioni oggettive, mero ampliamento impiantistico e comparazione qualitativa;
- permette di sostituire il benchmark del 15% con lo scarto reale fra tariffe di classi contigue;
- organizza il confronto con unità tipo e immobili comparabili senza trasformarlo in un punteggio arbitrario;
- dichiara per ogni esito metodo applicato, attendibilità, limiti e passaggi successivi;
- restituisce un esito graduato e motivato, non un automatismo privo di contesto;
- salva i dati soltanto nel browser e produce una scheda stampabile.

## Avvio locale

Requisiti: Node.js 20.9 o successivo.

```bash
npm ci
npm run dev
```

## Test

```bash
npm test
npm run lint
npm run build
```

## Distribuzione

La webapp è un normale progetto Next.js e non richiede ChatGPT né servizi proprietari. Può essere pubblicata su Vercel, Netlify o su qualunque infrastruttura compatibile con Next.js.

I dati inseriti restano nel `localStorage` del browser: il progetto non include autenticazione, database o servizi esterni.

## Struttura

- `app/` — interfaccia e stili;
- `lib/cadastral.mjs` — motore di calcolo indipendente dall’interfaccia;
- `tests/calculation.test.mjs` — casi numerici e controlli sui moltiplicatori;
- `docs/decision-model.md` — albero decisionale e significato degli esiti;
- `docs/sources.md` — fonti normative e punti ancora da validare;
- `docs/roadmap.md` — percorso verso la prima versione distribuibile.

## Stato del progetto

Versione 0.2, destinata a verifica tecnica. La tabella annuale dei coefficienti deriva dal foglio 2026 del Collegio di Trento: la fonte statistica primaria e il processo di aggiornamento devono essere formalizzati prima della pubblicazione generalizzata.

Il software è uno strumento di supporto e non sostituisce il giudizio del professionista, la simulazione DOCFA o il confronto con le unità tipo e il quadro tariffario della zona censuaria.
