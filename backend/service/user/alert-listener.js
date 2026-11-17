const datasource = require("../../db/data-source");
const { marketState } = require("../market");
const { broadcastAlert } = require("../../ws");

/**
 * ALERT LISTENER — dò ngưỡng alertMin/alertMax mỗi khi giá thay đổi.
 *
 * Cũ: mỗi tick gọi 1 truy vấn DB (stock_alerts) → với 3.000 mã và tỉ lệ tick 15%
 *     là khoảng 450 truy vấn/giây cho dữ liệu gần như không đổi.
 * Mới: nạp cảnh báo 1 lần vào RAM (Map stockId → alert[]), làm mới định kỳ
 *      (ALERT_REFRESH_MS, mặc định 60s) và làm mới NGAY khi người dùng lưu/xoá
 *      cảnh báo (service/user gọi reloadAlerts()). Đường nóng chỉ còn so sánh RAM.
 */
const REFRESH_INTERVAL_MS = Number(process.env.ALERT_REFRESH_MS) || 60_000;

const triggered = new Set();

let cache = new Map(); // stockId -> alert[]
let cacheReady = false;

const stats = {
  dbReads: 0,        // số lần đọc bảng stock_alerts (không phải mỗi tick)
  cachedAlerts: 0,
  cachedStockIds: 0,
  ticksChecked: 0,   // số tick đã dò ngưỡng (chỉ trong RAM)
  fired: 0           // số lần bắn cảnh báo
};

async function reloadAlerts() {
  stats.dbReads++;

  const alerts = await datasource.getRepository("StockAlert").find();

  const next = new Map();
  for (const alert of alerts) {
    const list = next.get(alert.stockId);
    if (list) list.push(alert);
    else next.set(alert.stockId, [alert]);
  }

  cache = next;
  cacheReady = true;
  stats.cachedAlerts = alerts.length;
  stats.cachedStockIds = next.size;

  return alerts.length;
}

function checkAlerts(state) {
  const price = Number(state.price);
  const timestamp = state.updatedAt || Date.now();
  const alerts = cache.get(state.stockId) || [];

  stats.ticksChecked++;

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
        stats.fired++;

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
  reloadAlerts().catch((error) => {
    console.error("Alert cache: nạp cảnh báo lỗi:", error.message);
  });

  const refreshTimer = setInterval(() => {
    reloadAlerts().catch((error) => {
      console.error("Alert cache: làm mới cảnh báo lỗi:", error.message);
    });
  }, REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();

  const unsubscribe = marketState.onTick((state) => {
    // Chưa có cache (DB lỗi lúc khởi động) thì bỏ qua, không truy vấn DB trong đường nóng
    if (!cacheReady) return;

    try {
      checkAlerts(state);
    } catch (error) {
      console.error("Alert listener error:", error);
    }
  });

  return () => {
    clearInterval(refreshTimer);
    unsubscribe();
  };
}

function getAlertCacheStats() {
  return {
    refreshIntervalMs: REFRESH_INTERVAL_MS,
    ...stats
  };
}

module.exports = { startAlertListener, reloadAlerts, getAlertCacheStats };
