# Fonti e criteri da presidiare

## Fonti principali

1. **R.D.L. 13 aprile 1939, n. 652**, articoli 17 e 20 — conservazione del Catasto e obbligo di denuncia delle variazioni incidenti su consistenza, categoria e classe.
2. **D.P.R. 1 dicembre 1949, n. 1142**, articolo 61 — classamento per confronto con le unità tipo e con le caratteristiche influenti sul reddito.
3. **D.M. 19 aprile 1994, n. 701** — dichiarazioni di aggiornamento con procedura DOCFA.
4. **Legge 30 dicembre 2023, n. 213**, articolo 1, commi 86–87 — controlli selettivi sugli immobili interessati dal Superbonus; la dichiarazione è verificata “ove prevista”.
5. **Provvedimento AdE prot. 38133/2025 del 7 febbraio 2025** — contenuto e modalità delle comunicazioni di compliance.
6. **Circolare Agenzia del Territorio 6/T del 30 novembre 2012** — approccio di costo, deprezzamento e riferimento all’epoca censuaria 1988–1989.
7. **Circolare AdE 36/E del 19 dicembre 2013** — profili catastali degli impianti fotovoltaici e significatività indicativa del 15%.
8. **Risoluzione AdE 21/E del 5 giugno 2026** — rilevanza catastale degli interventi e criterio operativo per il mero ampliamento impiantistico.
9. **D.M. 14 dicembre 1991, n. 5646** — moltiplicatori applicati alla rendita per la determinazione del valore catastale ante intervento.
10. **D.M. 6 agosto 2020, “Requisiti tecnici”** — tassonomia tecnica e grandezze degli interventi energetici; è usato per descrivere gli impianti, non per attribuire valori catastali.
11. **Vademecum ENEA Ecobonus** — articolazione operativa di pompe di calore, sistemi ibridi, biomassa, solare termico, microcogenerazione e building automation.

## Collegamenti

- Risoluzione 21/E/2026: <https://www.agenziaentrate.gov.it/portale/documents/20143/10065077/Risoluzione%2Bn.%2B21%2Bdel%2B5%2Bgiugno%2B2026%2B-%2BInterventi%2Bedilizi%2Bche%2Bcomportano%2Bobbligo%2Baggiornamento%2Bcatastale_.pdf/4dc0de4f-d0df-7dbd-9997-9a8ec5746080?t=1780664988508>
- Circolare 6/T/2012: <https://www1.agenziaentrate.gov.it/mt/circolari/circolare_6_2012.pdf>
- Circolare 36/E/2013: <https://def.finanze.it/DocTribFrontend/getContent.do?id=%7B3B5AB640-E772-44BB-BB0B-2B9FBA269ED9%7D>
- D.M. 14 dicembre 1991: <https://def.finanze.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getArticolo&articolo=Articolo+1&codiceOrdinamento=200000100000000&id=%7BE1F79F91-9353-4181-BF69-32F33537B66A%7D>
- D.M. 6 agosto 2020: <https://www.efficienzaenergetica.enea.it/media/attachments/2020/10/13/30-decreto_efficienza_energetica_2020_gu.pdf>
- Vademecum ENEA: <https://www.efficienzaenergetica.enea.it/detrazioni-fiscali/ecobonus/vademecum.html>
- Software DOCFA e archivi provinciali: <https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/aggiornamento-catasto-fabbricati-docfa/software-docfa-4004>

## Regole implementate e grado di forza

| Funzione | Trattamento nell’app | Fondamento |
|---|---|---|
| Fotovoltaico ≤ 3 kW per UIU servita | Esclusione documentata dal calcolo | Circolare 36/E/2013 |
| Fotovoltaico a terra con volume convenzionale < 150 m³ | Esclusione documentata dal calcolo | Circolare 36/E/2013 |
| Accumulo e mero ampliamento impiantistico | Confronto economico ante/post | Risoluzione 21/E/2026, criterio di prima approssimazione |
| Vita utile 20 anni e residuo zero | Valore iniziale modificabile, non caratteristica della singola tecnologia | Risoluzione 21/E/2026 e Circolare 6/T/2012 |
| Tipi ENEA e relative grandezze | Classificazione e raccolta dati | D.M. 6 agosto 2020; nessun automatismo catastale |
| Massimali o costi unitari fiscali ENEA | Non utilizzati | Finalità fiscale diversa dalla stima catastale |
| Sostituzione equivalente | Nessun valore incrementale nel modello | Separazione tra ripristino e ampliamento della dotazione |
| Sostituzione migliorativa | Solo differenza documentata | Criterio prudenziale di incrementalità da motivare |

## Elementi da validare prima della distribuzione pubblica

- fonte statistica primaria dei coefficienti annuali di ragguaglio;
- procedura e cadenza di aggiornamento della tabella;
- moltiplicatori applicabili alle diverse categorie nel preciso contesto estimativo richiamato dalla Risoluzione;
- criteri territoriali per verificare le differenze percentuali tra classi contigue;
- casi nei quali la modifica planimetrica non produce autonomamente un nuovo classamento ma richiede comunque la presentazione DOCFA;
- categorie speciali e particolari, escluse dall’attuale MVP;
- contenuti minimi del report tecnico esportabile e formulazione delle avvertenze professionali.
- eventuali vite utili differenziate per tecnologia, ammesse solo quando sorrette da studi di settore documentati e territorialmente pertinenti;
- trattamento congiunto di fotovoltaico e accumulo nei casi in cui il sistema di accumulo possa conservare autonoma incidenza pur ricorrendo un gate fotovoltaico.

La tabella dei coefficienti inclusa nel codice proviene dal file 2026 del Collegio Geometri e Geometri Laureati della Provincia di Trento e non viene presentata, allo stato, come una banca dati ufficiale autonoma.
