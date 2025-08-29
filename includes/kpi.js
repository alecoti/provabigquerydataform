/**
 * @fileoverview This file contains reusable Javascript functions that generate SQL
 * fragments for calculating common business KPIs.
 */

/**
 * Returns a SQL fragment to calculate the fill rate (or on-shelf availability).
 * Formula: qty_sold / (qty_sold + lost_sales)
 * @param {string} qtySoldExpr A SQL expression for the quantity sold.
 * @param {string} lostSalesExpr A SQL expression for the lost sales quantity.
 * @returns {string} A SQL string.
 */
function calc_fill_rate(qtySoldExpr, lostSalesExpr) {
  return `SAFE_DIVIDE(${qtySoldExpr}, (${qtySoldExpr} + ${lostSalesExpr}))`;
}

/**
 * Returns a SQL fragment to create a boolean-like flag (1 or 0) indicating a stockout.
 * @param {string} stockEndExpr A SQL expression for the end-of-period stock quantity.
 * @returns {string} A SQL string that evaluates to 1 if stock is 0, otherwise 0.
 */
function is_stockout(stockEndExpr) {
  return `(CASE WHEN ${stockEndExpr} = 0 THEN 1 ELSE 0 END)`;
}

module.exports = { calc_fill_rate, is_stockout };
