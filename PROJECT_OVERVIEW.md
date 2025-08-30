# Project Overview: Demand Planning & Forecasting Pipeline

## 1. Introduction

This document provides a comprehensive overview of the Dataform project for demand planning and sales forecasting. The primary goal of this pipeline is to transform raw operational data into actionable insights, including KPIs, analytics, and a powerful, scalable sales forecasting system.

The project follows a standard medallion architecture (Bronze -> Silver -> Gold) to ensure data quality, scalability, and maintainability.

## 2. Data Flow Architecture

The data flows through the layers in the following sequence. Each step refines the data and adds business value.

```
[Source Tables] -> [Bronze Layer] -> [Silver Layer] -> [ML Layer] -> [Gold Layer]
                       (Ingestion)      (Cleaning &     (Training)     (Analytics,
                                         Conforming)                    KPIs, Forecasts)
```

## 3. Layer-by-Layer Breakdown

### 3.1. Bronze Layer: Raw Data Ingestion

The Bronze layer is the entry point for raw data from source systems. Its only purpose is to create a copy of the source data with minimal to no transformations.

*   **`bronze.inventory_raw`**: Ingests raw daily inventory data.
*   **`bronze.purchase_orders_raw`**: Ingests raw purchase order data.
*   **`bronze.sales_raw`**: Ingests raw sales data.

### 3.2. Silver Layer: Cleaned & Conformed Data

The Silver layer takes the raw data, cleans it, conforms it into a dimensional model, and creates reliable "fact" and "dimension" tables. This is the single source of truth for all downstream analytics.

#### Silver Dimensions (The "Who, What, Where, When")
*   **`silver.dim_date`**: A generated calendar table for time-based analysis.
*   **`silver.dim_region`**: A unique list of all sales regions.
*   **`silver.dim_sku`**: A unique list of all products (SKUs).
*   **`silver.dim_supplier`**: A unique list of all suppliers.

#### Silver Facts (The "Events" or "Measurements")
*   **`silver.inventory_daily`**: Cleaned daily inventory levels.
*   **`silver.purchase_orders_clean`**: Cleaned purchase order data with boolean flags.
*   **`silver.sales_enriched`**: Sales data joined with inventory data to provide context (e.g., stock levels at time of sale).
*   **`silver.purchase_order_lead_time`**: Calculates the actual lead time for every received PO line.
*   **`silver.demand_features_daily`**: **(Key Table for ML)** A rich feature table that prepares data for the forecasting model. It calculates lag features, rolling averages, and joins calendar data.

### 3.3. ML Layer: Machine Learning Models

This layer contains the logic for training and retraining machine learning models.

*   **`ml.train_demand_forecast_model`**: This script trains a powerful and scalable forecasting model.
    *   **Model Type**: `ARIMA_PLUS_XREG`, which supports external features.
    *   **Scalability**: It's trained on **all SKUs and regions** simultaneously by using `time_series_id_col`.
    *   **Features**: It uses the rich features from `silver.demand_features_daily` to drastically improve forecast accuracy beyond simple time series analysis.

### 3.4. Gold Layer: Business Intelligence & Analytics

The Gold layer provides the final, aggregated, business-ready datasets for reporting, dashboards, and high-level analysis.

*   **`gold.supplier_performance`**: Monthly KPIs for each supplier (e.g., average lead time).
*   **`gold.kpi_service_level`**: Daily service level KPIs like fill rate.
*   **`gold.stock_position`**: Calculates the daily financial value of on-hand stock.
*   **`gold.sku_demand_classification`**: Classifies all SKUs using ABC/XYZ analysis based on sales volume and volatility.
*   **`gold.dynamic_safety_stock`**: A prescriptive model that recommends the optimal safety stock level for each SKU.
*   **`gold.demand_forecast`**: **(Key Output)** The final, multi-horizon sales forecast for all SKUs (30, 90, and 180 days).
*   **`gold.forecast_evaluation`**: **(Key for Monitoring)** Contains error metrics (MAPE, MAE, etc.) for every single SKU, allowing for detailed monitoring of forecast accuracy.

## 4. Reusable Code (`includes/`)

This directory contains Javascript helper functions to ensure code is DRY (Don't Repeat Yourself).
*   **`date.js`**: Functions for common date manipulations in SQL.
*   **`kpi.js`**: Functions for calculating common business KPIs.

## 5. The Scalable Forecasting Framework

The core of this project's evolution is the new forecasting system. It works as follows:

1.  **Feature Engineering (`demand_features_daily`)**: We first create a rich dataset with features that help predict sales, such as day of the week, recent sales trends (moving averages), and seasonality (lag features).
2.  **Scalable Training (`train_demand_forecast_model`)**: A single `ARIMA_PLUS_XREG` model is trained on this rich dataset. By specifying `sku_id` and `region` as time series identifiers, BigQuery ML efficiently trains hundreds or thousands of micro-models in parallel.
3.  **Multi-Horizon Forecasting (`demand_forecast`)**: The trained model is used to generate forecasts for 30, 90, and 180 days into the future. This is done by providing the model with a table of future dates and their corresponding calendar features.
4.  **Performance Monitoring (`forecast_evaluation`)**: The system automatically evaluates the model's accuracy for every single SKU, providing a tight feedback loop to understand which forecasts are reliable and which are not. This is the foundation for a "self-correcting" process, where business decisions can be made based on model performance.
