const datasource = require("../../db/data-source");
const { marketState } = require("../market");
const { broadcastAlert } = require("../../ws");

const triggered = new Set();

async function checkAlerts(state) {
  const price = Number(state.price);
  const timestamp = state.updatedAt || Date.now();

  const alerts = await datasource.getRepository("StockAlert").find({
    where: { stockId: state.stockId }
  });

  for (const alert of alerts) {
    const rules = [
      { kind: "min", threshold: alert.alertMin, hit: price <= Number(alert.alertMin) },
      { kind: "max", threshold: alert.alertMax, hit: price >= Number(alert.alertMax) }
    ];

    for (const rule of rules) {
      if (rule.threshold == null) continue;

      const key = `${alert.userId}:${alert.stockId}:${rule.kind}`;

      if (rule.hit && !triggered.has(key)) {
        triggered.add(key);

        broadcastAlert({
          userId: alert.userId,
          symbol: state.symbol,
          price,
          kind: rule.kind,
          message: rule.kind === "min"
            ? `${state.symbol} chạm ngưỡng dưới ${Number(rule.threshold).toLocaleString("vi-VN")}`
            : `${state.symbol} chạm ngưỡng trên ${Number(rule.threshold).toLocaleString("vi-VN")}`,
          timestamp
        });
      } else if (!rule.hit) {
        triggered.delete(key);
      }
    }
  }
}

function startAlertListener() {
  return marketState.onTick((state) => {
    checkAlerts(state).catch((error) => {
      console.error("Alert listener error:", error);
    });
  });
}

module.exports = { startAlertListener };