/**
 * @fileoverview This file contains reusable Javascript functions that generate SQL
 * fragments for common date manipulations in BigQuery. These functions can be
 * imported and used in any SQLX file.
 */

/**
 * Returns a SQL fragment to format a date expression as 'YYYY-MM'.
 * @param {string} dateExpr A SQL expression that resolves to a DATE or TIMESTAMP.
 * @returns {string} A SQL string.
 */
function year_month(dateExpr) {
  return `FORMAT_DATE('%Y-%m', ${dateExpr})`;
}

/**
 * Returns a SQL fragment to get the first day of the month from a date expression.
 * @param {string} dateExpr A SQL expression that resolves to a DATE or TIMESTAMP.
 * @returns {string} A SQL string.
 */
function month_start(dateExpr) {
  return `DATE_TRUNC(${dateExpr}, MONTH)`;
}

/**
 * Returns a SQL fragment to get the last day of the month from a date expression.
 * @param {string} dateExpr A SQL expression that resolves to a DATE or TIMESTAMP.
 * @returns {string} A SQL string.
 */
function month_end(dateExpr) {
  return `DATE_SUB(DATE_ADD(DATE_TRUNC(${dateExpr}, MONTH), INTERVAL 1 MONTH), INTERVAL 1 DAY)`;
}

module.exports = { year_month, month_start, month_end };
