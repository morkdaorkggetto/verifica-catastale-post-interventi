# Roadmap verso la versione distribuibile

## 0.1 — MVP verificabile

- albero decisionale essenziale;
- calcolo autonomo per i soli impianti;
- moltiplicatori per categorie ordinarie;
- deprezzamento infracensuario effettivamente applicato;
- quote condominiali e impianti già censiti;
- salvataggio locale e stampa;
- test unitari del motore.

## 0.2 — Base normativa versionata

- schede-fonte con data, ambito e forza del riferimento;
- coefficienti con provenienza, data di aggiornamento e checksum;
- distinzione fra regola normativa, criterio di prassi ed euristica tecnica;
- test di regressione ricavati da casi professionali anonimi.

## 0.3 — Report professionale

- intestazione del tecnico e identificativi catastali nazionali/tavolari;
- riepilogo degli input e sviluppo completo dei calcoli;
- motivazione dell’esito e cautele residue;
- esportazione PDF e JSON del caso;
- numero di versione del motore e delle fonti applicate.

## 0.4 — Catalogo e gate impiantistici

- categorie tecniche coerenti con D.M. 6 agosto 2020 e vademecum ENEA;
- gate fotovoltaici della Circolare 36/E/2013;
- natura dell’intervento e valorizzazione incrementale delle sostituzioni;
- separazione fra classificazione energetica e criterio catastale;
- doppio riscontro fra benchmark del 15% e scarto tariffario locale;
- motivazione delle esclusioni nella relazione esportabile.

## 0.5 — Affidabilità minima del motore

- validazione bloccante e tri-stato `valid` / `warning` / `invalid`;
- inventario obbligatorio degli interventi e instradamento automatico del metodo;
- deroga professionale ammessa soltanto se motivata e tracciata;
- base economica qualificata e rialzo al costo di riproduzione sempre esplicito;
- categorie normalizzate, senza moltiplicatore predefinito per valori sconosciuti;
- gate dedicato alla classe apicale;
- coefficiente 2020 segnalato come non validato e incapace di produrre un esito conclusivo.

## 0.6 — Fonti e tracciabilità

- registro esterno e versionato delle fonti;
- tracciabilità completa di dati, formule, trasformazioni e arrotondamenti;
- ricostruzione e validazione primaria dell’intera serie dei coefficienti.

## 0.7 — Fascicolo comparativo

- evidenze comparative strutturate per fonte e pertinenza;
- livelli di robustezza dell’esito qualitativo;
- relazione DOCFA estesa senza punteggi decisori artificiali.

## 1.0 — Distribuzione

- revisione tecnico-legale indipendente;
- accessibilità e test sui principali browser;
- repository pubblico con licenza da definire;
- hosting pubblico senza autenticazione ChatGPT;
- policy privacy: nessun dato trasmesso salvo scelta esplicita dell’utente;
- eventuale modalità installabile PWA e funzionamento offline.
