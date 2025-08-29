// Utility date → frammenti SQL

function year_month(dateExpr) {
  return `FORMAT_DATE('%Y-%m', ${dateExpr})`;
}

function month_start(dateExpr) {
  return `DATE_TRUNC(${dateExpr}, MONTH)`;
}

function month_end(dateExpr) {
  return `DATE_SUB(DATE_ADD(DATE_TRUNC(${dateExpr}, MONTH), INTERVAL 1 MONTH), INTERVAL 1 DAY)`;
}

module.exports = { year_month, month_start, month_end };
