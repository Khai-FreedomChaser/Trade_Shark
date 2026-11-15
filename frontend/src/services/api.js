import { API_URL } from "../config";

/**
 * REST client dùng chung — response và lỗi theo docs/CONTRACT.md mục 2:
 * lỗi trả về { message, error }. Backend 2 thêm Authorization header khi có JWT.
 */

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
  // Backend 2 bổ sung tiếp các endpoint user/trade/alert ở đây (contract mục 3.4)
};
