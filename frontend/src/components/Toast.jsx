import { useEffect, useState } from "react";
import { ws } from "../services/ws";
import "./toast.css";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = ws.on("alert", (data) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 6);
      const newToast = {
        id,
        symbol: data.symbol,
        price: data.price,
        kind: data.kind,
        message: data.message,
        timestamp: data.timestamp || Date.now()
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Giữ tối đa 5 toast gần nhất

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    });

    return unsub;
  }, []);

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.kind === "max" ? "toast-max" : "toast-min"}`}>
          <div className="toast-header">
            <span className="toast-tag">
              {toast.kind === "max" ? "▲ VƯỢT NGƯỠNG TRÊN" : "▼ CHẠM NGƯỠNG DƯỚI"}
            </span>
            <span className="toast-symbol">{toast.symbol}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              ✕
            </button>
          </div>
          <div className="toast-body">{toast.message}</div>
          <div className="toast-time">
            {new Date(toast.timestamp).toLocaleTimeString("vi-VN")}
          </div>
        </div>
      ))}
    </div>
  );
}

