import { API_URL } from "../config";

async function request(path, options = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers
    },
    ...options
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

  // --- Stock (DB master data + snapshots) ---
  stocks: () => request("/api/stock"),
  snapshots: (stockId, { limit = 100 } = {}) =>
    request(`/api/stock/${stockId}/snapshots?limit=${limit}`),

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
  deleteAlert: ({ stockId, symbol }) => request(
    `/api/user/alerts?${stockId ? `stockId=${encodeURIComponent(stockId)}` : `symbol=${encodeURIComponent(symbol)}`}`,
    { method: "DELETE" }
  )
};
