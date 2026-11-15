import { API_URL } from "../config";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
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
  benchmarkLogs: (limit = 50) => request(`/api/benchmark/logs?limit=${limit}`)

  // TODO: Thêm call auth/trade/alerts ~ FE2
  // register | login | refresh | me | deposit | withdraw | buy | sell
  // | portfolio | balance-history | alerts
};
