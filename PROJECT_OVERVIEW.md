# Riepilogo del Progetto: Pipeline di Demand Planning & Forecasting

## 1. Introduzione

Questo documento fornisce una panoramica completa del progetto Dataform per la pianificazione della domanda e la previsione delle vendite. L'obiettivo primario di questa pipeline è trasformare i dati operativi grezzi in insight azionabili, inclusi KPI, analisi e un sistema di previsione delle vendite potente e scalabile.

Il progetto segue un'architettura a medaglione standard (Bronze -> Silver -> Gold) per garantire la qualità dei dati, la scalabilità e la manutenibilità del codice.

## 2. Architettura del Flusso Dati

I dati fluiscono attraverso i layer nella seguente sequenza. Ogni passo raffina i dati e aggiunge valore di business.

```
[Tabelle Sorgente] -> [Layer Bronze] -> [Layer Silver] -> [Layer ML] -> [Layer Gold]
                         (Ingestion)      (Pulizia e      (Training)   (Analytics,
                                          Conformità)                  KPI, Previsioni)
```

## 3. Analisi Dettagliata per Layer

### 3.1. Layer Bronze: Ingestione dei Dati Grezzi

Il layer Bronze è il punto di ingresso per i dati grezzi provenienti dai sistemi sorgente. Il suo unico scopo è creare una copia fedele dei dati di origine con trasformazioni minime o nulle, garantendo di avere sempre una base di partenza tracciabile.

*   **`bronze.inventory_raw`**: Ingestisce i dati grezzi giornalieri sull'inventario.
*   **`bronze.purchase_orders_raw`**: Ingestisce i dati grezzi degli ordini di acquisto.
*   **`bronze.sales_raw`**: Ingestisce i dati grezzi delle vendite.

### 3.2. Layer Silver: Dati Puliti e Conformati

Il layer Silver prende i dati grezzi, li pulisce, li conforma in un modello dimensionale e crea tabelle di "fatti" e "dimensioni" affidabili. Questo layer rappresenta la "single source of truth" (unica fonte di verità) per tutte le analisi a valle.

#### Dimensioni Silver (Il "Chi, Cosa, Dove, Quando")
*   **`silver.dim_date`**: Tabella di calendario generata programmaticamente, essenziale per analisi temporali flessibili (es. aggregazioni per mese, settimana, anno).
*   **`silver.dim_region`**: Elenco univoco di tutte le regioni di vendita, per garantire coerenza nei filtri e nelle aggregazioni geografiche.
*   **`silver.dim_sku`**: Elenco anagrafico di tutti i prodotti (SKU), il cuore del catalogo prodotti.
*   **`silver.dim_supplier`**: Elenco anagrafico di tutti i fornitori.

#### Fatti Silver (Gli "Eventi" o le "Misure")
*   **`silver.inventory_daily`**: Livelli di inventario giornalieri puliti e pronti per l'analisi.
*   **`silver.purchase_orders_clean`**: Dati degli ordini di acquisto puliti, con l'aggiunta di flag booleani (es. `is_received`) per semplificare le query successive.
*   **`silver.sales_enriched`**: Dati di vendita arricchiti con informazioni sull'inventario, permettendo di contestualizzare le vendite (es. "abbiamo venduto 10 unità, ma avevamo 200 unità a magazzino").
*   **`silver.purchase_order_lead_time`**: Calcola il tempo di consegna (lead time) effettivo per ogni linea di ordine ricevuta, un dato fondamentale per le analisi sulla supply chain.
*   **`silver.demand_features_daily`**: **(Tabella Chiave per ML)** Una tabella di "feature" che prepara i dati per il modello di forecasting. Calcola feature complesse come le vendite dei giorni passati (lag) e le medie mobili, che aiutano il modello a capire trend e stagionalità.

### 3.3. Layer ML: Machine Learning

Questo layer contiene la logica per l'addestramento e il riaddestramento dei modelli di machine learning.

*   **`ml.train_demand_forecast_model`**: Questo script addestra un modello di forecasting potente e scalabile.
    *   **Tipo di Modello**: `ARIMA_PLUS_XREG`, un modello di serie temporali avanzato che supporta l'uso di feature esterne (regressori esogeni) per migliorare l'accuratezza.
    *   **Scalabilità**: È addestrato su **tutti gli SKU e regioni** contemporaneamente, istruendo BigQuery a creare migliaia di micro-modelli in parallelo.
    *   **Features**: Utilizza le feature ingegnerizzate da `silver.demand_features_daily` per migliorare drasticamente l'accuratezza rispetto a una semplice analisi univariata.

### 3.4. Layer Gold: Business Intelligence & Analytics

Il layer Gold fornisce i dataset finali, aggregati e pronti per il business, utilizzati per report, dashboard e analisi strategiche.

*   **`gold.supplier_performance`**: Fornisce KPI mensili per ogni fornitore, come il lead time medio e il tasso di puntualità. Aiuta a rispondere a domande come: "Qual è il nostro fornitore più affidabile?".
*   **`gold.kpi_service_level`**: Calcola KPI giornalieri sul livello di servizio, come il "fill rate" (tasso di riempimento). Mostra la capacità dell'azienda di soddisfare la domanda dei clienti.
*   **`gold.stock_position`**: Calcola il valore finanziario dello stock a magazzino ogni giorno, un dato cruciale per la gestione finanziaria.
*   **`gold.sku_demand_classification`**: Classifica tutti gli SKU usando l'analisi ABC/XYZ, un potente strumento per differenziare le strategie di gestione stock in base al volume di vendita e alla volatilità della domanda.
*   **`gold.dynamic_safety_stock`**: Un modello prescrittivo che non si limita a descrivere il passato, ma **suggerisce un'azione**: il livello ottimale di stock di sicurezza da mantenere per ogni SKU per raggiungere un livello di servizio del 95%.
*   **`gold.demand_forecast`**: **(Output Chiave)** La previsione di vendita finale, multi-orizzonte (30, 90, 180 giorni), per tutti gli SKU.
*   **`gold.forecast_evaluation`**: **(Chiave per il Monitoraggio)** Contiene le metriche di errore (MAPE, MAE, etc.) per ogni singolo SKU, consentendo un monitoraggio dettagliato dell'accuratezza del modello e creando le basi per un processo di "auto-correzione" guidato dai dati.

## 4. Codice Riutilizzabile (`includes/`)

Questa cartella contiene funzioni Javascript che generano frammenti di codice SQL, per evitare duplicazioni e mantenere il codice pulito (principio DRY).
*   **`date.js`**: Funzioni per manipolazioni comuni di date.
*   **`kpi.js`**: Funzioni per calcolare KPI di business standard.

## 5. Il Framework di Forecasting Scalabile

Il cuore dell'evoluzione di questo progetto è il nuovo sistema di forecasting. Funziona così:

1.  **Feature Engineering (`demand_features_daily`)**: Per prima cosa, creiamo un dataset ricco di feature che aiutano a prevedere le vendite, come il giorno della settimana, i trend recenti (medie mobili) e la stagionalità (lag features).
2.  **Training Scalabile (`train_demand_forecast_model`)**: Un singolo modello `ARIMA_PLUS_XREG` viene addestrato su questo dataset. Specificando `sku_id` e `region` come identificatori delle serie temporali, BigQuery ML addestra in modo efficiente centinaia o migliaia di micro-modelli in parallelo.
3.  **Previsione Multi-Orizzonte (`demand_forecast`)**: Il modello addestrato viene usato per generare previsioni a 30, 90 e 180 giorni nel futuro. Questo viene fatto fornendo al modello una tabella con le date future e le loro corrispondenti feature di calendario.
4.  **Monitoraggio delle Performance (`forecast_evaluation`)**: Il sistema valuta automaticamente l'accuratezza del modello per ogni singolo SKU. Questo crea un ciclo di feedback che permette di capire quali previsioni sono affidabili e quali no, fondando le basi per un processo di "auto-correzione" in cui le decisioni di business sono guidate dalle performance del modello stesso.
