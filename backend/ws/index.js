const { WebSocketServer } = require("ws");
const { marketState } = require("../service/market");

/**
 * RAW WEBSOCKET SERVER (skeleton — Backend 1 sở hữu luồng tick, Backend 2 gắn alert).
 *
 * - Chạy chung port HTTP (mặc định 3636), path: /ws
 * - Mỗi frame tick là MẢNG các thay đổi (batch mỗi BROADCAST_INTERVAL_MS),
 *   không gửi từng tick lẻ — tránh nghẽn khi có hàng nghìn mã.
 * - Kết nối mới nhận ngay frame "snapshot" (trạng thái hiện tại) rồi mới nghe "ticks".
 *
 * Frame server -> client:
 *   { type: "hello",    data: { clients, broadcastIntervalMs } }
 *   { type: "snapshot", data: [TickPayload...] }
 *   { type: "ticks",    data: [TickPayload...] }  // chỉ các mã THAY ĐỔI trong chu kỳ
 *   { type: "alert",    data: { ...do Backend 2 gửi } }
 *   { type: "pong",     data: {} }
 *
 * Frame client -> server:
 *   { type: "subscribe",   symbols: ["VCB", "FPT"] }  // rỗng/ không gửi = nhận tất cả
 *   { type: "unsubscribe", symbols: ["VCB"] }
 *   { type: "ping" }
 */
const BROADCAST_INTERVAL_MS = Number(process.env.BROADCAST_INTERVAL_MS) || 500;

let wss = null;
const dirty = new Set(); // symbol thay đổi kể từ lần broadcast trước
let unsubTick = null;

function toTickPayload(state) {
  return {
    symbol: state.symbol,
    price: state.price,
    high: state.high,
    low: state.low,
    refPrice: state.refPrice,
    ceiling: state.ceiling,
    floor: state.floor,
    timestamp: state.updatedAt
  };
}

function safeSend(socket, frame) {
  if (socket.readyState === 1) {
    try {
      socket.send(JSON.stringify(frame));
    } catch {
      socket.terminate();
    }
  }
}

function attachWsServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Lắng nghe luồng tick từ RAM: chỉ đánh dấu "bẩn", thật sự gửi theo chu kỳ.
  unsubTick = marketState.onTick((state) => dirty.add(state.symbol));

  setInterval(() => {
    if (wss.clients.size === 0 || dirty.size === 0) {
      dirty.clear();
      return;
    }
    const payload = Array.from(dirty)
      .map((symbol) => marketState.get(symbol))
      .filter(Boolean)
      .map(toTickPayload);
    dirty.clear();

    for (const socket of wss.clients) {
      if (socket.readyState !== 1) continue;
      const symbols = socket.subscribedSymbols;
      const data = symbols && symbols.size > 0
        ? payload.filter((t) => symbols.has(t.symbol))
        : payload;
      if (data.length > 0) safeSend(socket, { type: "ticks", data });
    }
  }, BROADCAST_INTERVAL_MS);

  wss.on("connection", (socket, req) => {
    socket.subscribedSymbols = null; // null = nhận tất cả
    console.log(`WS: client kết nối từ ${req.socket.remoteAddress} (tổng: ${wss.clients.size})`);

    safeSend(socket, {
      type: "hello",
      data: { clients: wss.clients.size, broadcastIntervalMs: BROADCAST_INTERVAL_MS }
    });
    safeSend(socket, { type: "snapshot", data: marketState.getAll().map(toTickPayload) });

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "subscribe") {
        socket.subscribedSymbols = new Set(msg.symbols || []);
      } else if (msg.type === "unsubscribe") {
        socket.subscribedSymbols = null;
      } else if (msg.type === "ping") {
        safeSend(socket, { type: "pong", data: {} });
      }
    });

    socket.on("close", () => {
      console.log(`WS: client ngắt kết nối (tổng: ${wss.clients.size})`);
    });
  });

  console.log(`WS server: ws://localhost:${process.env.PORT || 3636}/ws (batch ${BROADCAST_INTERVAL_MS}ms)`);
  return wss;
}

/**
 * Điểm gắn cho Backend 2: listener alert gọi hàm này để bắn sự kiện
 * chạm ngưỡng tới TẤT CẢ client. Payload tự do nhưng khuyến nghị:
 * { userId, symbol, price, kind: "min" | "max", message, timestamp }
 */
function broadcastAlert(payload) {
  if (!wss) return;
  const frame = { type: "alert", data: payload };
  for (const socket of wss.clients) {
    safeSend(socket, frame);
  }
}

module.exports = { attachWsServer, broadcastAlert, marketState };
