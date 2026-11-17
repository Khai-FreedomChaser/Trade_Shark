import { API_URL } from "../config";
import { getAccessToken } from "./authStorage";

async function request(path, options = {}) {
  const accessToken = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || `Lỗi ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.detail = data?.error;
    throw err;
  }

  return data;
}

export const api = {
  // --- Market (RAM, trạng thái hiện tại) ---
  marketState: () => request("/api/market/state"),
  symbolState: (symbol) => request(`/api/market/state/${symbol}`),
  // Số liệu tối ưu hoá runtime (Min-Max ghép cặp, cache cảnh báo)
  marketStats: () => request("/api/market/stats"),

  // --- Stock (DB master data + snapshots) ---
  stocks: () => request("/api/stock"),
  snapshots: (stockId, { limit = 100 } = {}) =>
    request(`/api/stock/${stockId}/snapshots?limit=${limit}`),
  // Đáy/Đỉnh từ chuỗi snapshot đã lưu (backend dùng thuật toán Min-Max ghép cặp)
  snapshotRange: (stockId, { from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return request(`/api/stock/${stockId}/range${query ? `?${query}` : ""}`);
  },

  // --- Benchmark ---
  benchmarkRun: ({ size, pattern, runs }) =>
    request("/api/benchmark/run", {
      method: "POST",
      body: JSON.stringify({ size, pattern, runs })
    }),
  benchmarkLogs: (limit = 50) => request(`/api/benchmark/logs?limit=${limit}`),

  // --- User, wallet, trade and alerts (FE2) ---
  register: (payload) => request("/api/user/register", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  login: (payload) => request("/api/user/login", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  refresh: (refreshToken) => request("/api/user/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  }),
  me: () => request("/api/user/me"),
  deposit: (amount) => request("/api/user/balance/deposit", {
    method: "POST",
    body: JSON.stringify({ amount })
  }),
  withdraw: (amount) => request("/api/user/balance/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount })
  }),
  buy: ({ symbol, quantity }) => request("/api/user/trade/buy", {
    method: "POST",
    body: JSON.stringify({ symbol, quantity })
  }),
  sell: ({ symbol, quantity }) => request("/api/user/trade/sell", {
    method: "POST",
    body: JSON.stringify({ symbol, quantity })
  }),
  portfolio: () => request("/api/user/portfolio"),
  balanceHistory: () => request("/api/user/balance-history"),
  alerts: () => request("/api/user/alerts"),
  saveAlert: (payload) => request("/api/user/alerts", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  // Backend yêu cầu đúng một trong hai: stockId hoặc symbol (đọc từ body, xem service/user deleteUserAlert)
  deleteAlert: ({ stockId, symbol }) => request("/api/user/alerts", {
    method: "DELETE",
    body: JSON.stringify(stockId ? { stockId } : { symbol })
  })
};
