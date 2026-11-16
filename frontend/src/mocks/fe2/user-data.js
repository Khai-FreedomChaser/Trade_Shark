const mockState = {
  user: {
    id: "USR_001",
    email: "manh@example.com",
    userName: "Mạnh",
    dateOfBirth: "2000-01-01",
    balance: 100000000
  },
  portfolio: [
    {
      symbol: "VCB",
      stockId: "STOCK_001",
      quantity: 100,
      averagePrice: 92000,
      currentPrice: 92500,
      marketValue: 9250000,
      profit: 50000,
      profitPercent: 0.54
    },
    {
      symbol: "FPT",
      stockId: "STOCK_002",
      quantity: 50,
      averagePrice: 118000,
      currentPrice: 116500,
      marketValue: 5825000,
      profit: -75000,
      profitPercent: -1.27
    }
  ],
  balanceHistory: [
    {
      id: "BH_001",
      type: "deposit",
      amount: 100000000,
      balanceAfter: 100000000,
      createdAt: "2026-11-16T09:00:00.000Z"
    }
  ],
  alerts: [
    {
      userId: "USR_001",
      symbol: "VCB",
      stockId: "STOCK_001",
      alertMin: 90000,
      alertMax: 95000,
      createdAt: "2026-11-16T09:00:00.000Z",
      updatedAt: "2026-11-16T09:00:00.000Z"
    }
  ]
};

export function cloneMockState() {
  return JSON.parse(JSON.stringify(mockState));
}

export function getMockState() {
  return mockState;
}
