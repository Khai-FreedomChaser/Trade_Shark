import { api } from "./api";
import { clearTokens, getRefreshToken, hasAccessToken, saveTokens } from "./authStorage";

/**
 * Lớp nghiệp vụ người dùng — gọi thẳng backend thật (routes/user của BE2),
 * không còn nhánh mock. Shape nào backend chưa khớp contract thì chuẩn hoá tại đây:
 *   - GET /api/user/portfolio -> { positions, totals } (FE chỉ cần positions)
 *   - GET /api/market/state   -> { count, data: [...] }
 *   - GET /api/user/balance-history | /alerts -> mảng phẳng
 */
function listData(response) {
  return Array.isArray(response) ? response : response?.data ?? [];
}

export const userService = {
  register: async (payload) => {
    const result = await api.register(payload);
    saveTokens(result);
    return result;
  },
  login: async (payload) => {
    const result = await api.login(payload);
    saveTokens(result);
    return result;
  },
  refresh: async () => {
    const result = await api.refresh(getRefreshToken());
    saveTokens(result);
    return result;
  },
  me: () => api.me(),
  marketSymbols: async () => listData(await api.marketState()),
  deposit: (amount) => api.deposit(amount),
  withdraw: (amount) => api.withdraw(amount),
  buy: (payload) => api.buy(payload),
  sell: (payload) => api.sell(payload),
  portfolio: async () => (await api.portfolio())?.positions ?? [],
  balanceHistory: async () => listData(await api.balanceHistory()),
  alerts: async () => listData(await api.alerts()),
  saveAlert: (payload) => api.saveAlert(payload),
  deleteAlert: (payload) => api.deleteAlert(payload),
  logout: () => clearTokens(),
  isAuthenticated: () => hasAccessToken()
};
