// Funzioni che restituiscono frammenti SQL (stringhe) da iniettare nei .sqlx

function calc_fill_rate(qtySoldExpr, lostSalesExpr) {
  return `SAFE_DIVIDE(${qtySoldExpr}, (${qtySoldExpr} + ${lostSalesExpr}))`;
}

function is_stockout(stockEndExpr) {
  return `(CASE WHEN ${stockEndExpr} = 0 THEN 1 ELSE 0 END)`;
}

module.exports = { calc_fill_rate, is_stockout };