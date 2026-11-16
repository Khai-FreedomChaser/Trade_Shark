import { FE2_USE_MOCK } from "../config";
import { api } from "./api";
import { cloneMockState, getMockState } from "../mocks/fe2/user-data";
import {
  clearTokens,
  getRefreshToken,
  hasAccessToken,
  mockLogin,
  mockRefresh,
  mockRegister,
  saveTokens
} from "../mocks/fe2/auth.mock";

function collectionData(response) {
  return response?.data ?? response ?? [];
}

function mockTrade(type, { symbol, quantity }) {
  const state = getMockState();
  const amount = Number(quantity);
  const holding = state.portfolio.find((item) => item.symbol === symbol);
  const price = holding?.currentPrice || 100000;

  if (!symbol || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Mã cổ phiếu và số lượng không hợp lệ");
  }

  if (type === "buy" && state.user.balance < price * amount) {
    throw new Error("Số dư không đủ để mua cổ phiếu");
  }

  if (type === "sell" && (!holding || holding.quantity < amount)) {
    throw new Error("Số lượng cổ phiếu bán vượt quá danh mục");
  }

  const value = price * amount;
  state.user.balance += type === "buy" ? -value : value;

  if (type === "buy") {
    if (holding) {
      const totalCost = holding.averagePrice * holding.quantity + value;
      holding.quantity += amount;
      holding.averagePrice = totalCost / holding.quantity;
    } else {
      state.portfolio.push({
        symbol,
        stockId: `STOCK_${symbol}`,
        quantity: amount,
        averagePrice: price,
        currentPrice: price,
        marketValue: value,
        profit: 0,
        profitPercent: 0
      });
    }
  } else {
    holding.quantity -= amount;
    if (holding.quantity === 0) {
      state.portfolio = state.portfolio.filter((item) => item.symbol !== symbol);
    }
  }

  const historyEntry = {
    id: `BH_${Date.now()}`,
    type,
    amount: value,
    balanceAfter: state.user.balance,
    createdAt: new Date().toISOString()
  };
  state.balanceHistory.unshift(historyEntry);

  return {
    user: cloneMockState().user,
    portfolio: cloneMockState().portfolio,
    transaction: historyEntry
  };
}

const mockService = {
  register: async (payload) => mockRegister(payload),
  login: async (payload) => mockLogin(payload),
  refresh: async (refreshToken) => mockRefresh(refreshToken),
  me: async () => cloneMockState().user,
  marketSymbols: async () => cloneMockState().portfolio.map((item) => ({
    symbol: item.symbol,
    price: item.currentPrice
  })),
  deposit: async (amount) => {
    const state = getMockState();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw new Error("Số tiền nạp không hợp lệ");
    state.user.balance += value;
    const entry = {
      id: `BH_${Date.now()}`,
      type: "deposit",
      amount: value,
      balanceAfter: state.user.balance,
      createdAt: new Date().toISOString()
    };
    state.balanceHistory.unshift(entry);
    return { user: cloneMockState().user, transaction: entry };
  },
  withdraw: async (amount) => {
    const state = getMockState();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > state.user.balance) {
      throw new Error("Số tiền rút không hợp lệ hoặc vượt quá số dư");
    }
    state.user.balance -= value;
    const entry = {
      id: `BH_${Date.now()}`,
      type: "withdraw",
      amount: value,
      balanceAfter: state.user.balance,
      createdAt: new Date().toISOString()
    };
    state.balanceHistory.unshift(entry);
    return { user: cloneMockState().user, transaction: entry };
  },
  buy: async (payload) => mockTrade("buy", payload),
  sell: async (payload) => mockTrade("sell", payload),
  portfolio: async () => cloneMockState().portfolio,
  balanceHistory: async () => cloneMockState().balanceHistory,
  alerts: async () => cloneMockState().alerts,
  saveAlert: async (payload) => {
    const state = getMockState();
    const existing = state.alerts.find(
      (alert) => alert.stockId === payload.stockId || alert.symbol === payload.symbol
    );
    const alert = {
      userId: state.user.id,
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    state.alerts = existing
      ? state.alerts.map((item) => (item === existing ? alert : item))
      : [alert, ...state.alerts];
    return cloneMockState().alerts.find(
      (item) => item.stockId === alert.stockId || item.symbol === alert.symbol
    );
  },
  deleteAlert: async ({ stockId, symbol }) => {
    const state = getMockState();
    state.alerts = state.alerts.filter(
      (alert) => alert.stockId !== stockId && alert.symbol !== symbol
    );
    return { success: true };
  }
};

const apiService = {
  register: async (payload) => api.register(payload),
  login: async (payload) => api.login(payload),
  refresh: async (refreshToken) => api.refresh(refreshToken),
  me: async () => api.me(),
  marketSymbols: async () => collectionData(await api.marketState()),
  deposit: async (amount) => api.deposit(amount),
  withdraw: async (amount) => api.withdraw(amount),
  buy: async (payload) => api.buy(payload),
  sell: async (payload) => api.sell(payload),
  portfolio: async () => collectionData(await api.portfolio()),
  balanceHistory: async () => collectionData(await api.balanceHistory()),
  alerts: async () => collectionData(await api.alerts()),
  saveAlert: async (payload) => api.saveAlert(payload),
  deleteAlert: async (payload) => api.deleteAlert(payload)
};

export const userService = {
  register: async (payload) => {
    const result = await (FE2_USE_MOCK ? mockService : apiService).register(payload);
    saveTokens(result);
    return result;
  },
  login: async (payload) => {
    const result = await (FE2_USE_MOCK ? mockService : apiService).login(payload);
    saveTokens(result);
    return result;
  },
  refresh: async () => {
    const refreshToken = getRefreshToken();
    const result = await (FE2_USE_MOCK ? mockService : apiService).refresh(refreshToken);
    saveTokens(result);
    return result;
  },
  me: () => (FE2_USE_MOCK ? mockService : apiService).me(),
  marketSymbols: () => (FE2_USE_MOCK ? mockService : apiService).marketSymbols(),
  deposit: (amount) => (FE2_USE_MOCK ? mockService : apiService).deposit(amount),
  withdraw: (amount) => (FE2_USE_MOCK ? mockService : apiService).withdraw(amount),
  buy: (payload) => (FE2_USE_MOCK ? mockService : apiService).buy(payload),
  sell: (payload) => (FE2_USE_MOCK ? mockService : apiService).sell(payload),
  portfolio: () => (FE2_USE_MOCK ? mockService : apiService).portfolio(),
  balanceHistory: () => (FE2_USE_MOCK ? mockService : apiService).balanceHistory(),
  alerts: () => (FE2_USE_MOCK ? mockService : apiService).alerts(),
  saveAlert: (payload) => (FE2_USE_MOCK ? mockService : apiService).saveAlert(payload),
  deleteAlert: (payload) => (FE2_USE_MOCK ? mockService : apiService).deleteAlert(payload),
  logout: () => clearTokens(),
  isAuthenticated: () => hasAccessToken()
};
