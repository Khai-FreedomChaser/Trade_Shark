import { WS_URL } from "../config";

/**
 * WEBSOCKET CLIENT dùng chung (protocol: docs/CONTRACT.md mục 4).
 *
 * Cách dùng trong component:
 *   useEffect(() => {
 *     ws.connect();
 *     const off = ws.on("ticks", (frame) => setData(frame.data));
 *     return off; // hủy đăng ký khi unmount
 *   }, []);
 *
 * Frame từ server: "hello" | "snapshot" | "ticks" | "alert" | "pong"
 * Gửi lên server: subscribe/unsubscribe { symbols: [...] }, ping
 */
class WsClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.listeners = new Map(); // type -> Set<handler>
    this.statusListeners = new Set();
    this.reconnectDelay = 1000;
    this.manualClose = false;
    this.pendingSubscribe = null;
  }

  connect() {
    if (this.socket && (this.socket.readyState === 0 || this.socket.readyState === 1)) {
      return;
    }

    this.manualClose = false;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.reconnectDelay = 1000;
      this._emitStatus("connected");
      if (this.pendingSubscribe) {
        this._send(this.pendingSubscribe);
      }
    };

    this.socket.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      this._emit(frame.type, frame.data ?? frame);
    };

    this.socket.onclose = () => {
      this._emitStatus("disconnected");
      if (!this.manualClose) {
        // Tự reconnect — hoặc server restart hoặc mất mạng
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10_000);
      }
    };

    this.socket.onerror = () => this.socket?.close();
  }

  close() {
    this.manualClose = true;
    this.socket?.close();
    this.socket = null;
    this._emitStatus("closed");
  }

  /** Chỉ nhận các mã chỉ định. Gọi không tham số (hoặc mảng rỗng) = nhận tất cả. */
  subscribe(symbols = []) {
    const frame = { type: "subscribe", symbols };
    if (this.socket?.readyState === 1) {
      this._send(frame);
    }
    this.pendingSubscribe = frame;
  }

  ping() {
    this._send({ type: "ping" });
  }

  /** Đăng ký handler cho 1 loại frame. Trả về hàm hủy. */
  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
    return () => this.listeners.get(type)?.delete(handler);
  }

  /** Đăng ký callback thay đổi trạng thái kết nối ("connected" | "disconnected" | "closed"). */
  onStatus(handler) {
    this.statusListeners.add(handler);
    handler(this.socket?.readyState === 1 ? "connected" : "disconnected");
    return () => this.statusListeners.delete(handler);
  }

  _send(frame) {
    if (this.socket?.readyState === 1) {
      this.socket.send(JSON.stringify(frame));
    }
  }

  _emit(type, data) {
    this.listeners.get(type)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`WS handler lỗi cho frame "${type}"`, err);
      }
    });
  }

  _emitStatus(status) {
    this.statusListeners.forEach((handler) => handler(status));
  }
}

export const ws = new WsClient(WS_URL);
