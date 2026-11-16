import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { api } from "../../services/api";
import { ws } from "../../services/ws";
import { formatPrice, priceChangeClass } from "../../config";
import "./detail.css";

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [snapshots, setSnapshots] = useState(null);
  const [snapError, setSnapError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [prevSymbol, setPrevSymbol] = useState(symbol);

  // Reset trạng thái khi đổi mã (pattern "adjust state during render" của React)
  if (prevSymbol !== symbol) {
    setPrevSymbol(symbol);
    setState(null);
    setSnapshots(null);
    setSnapError(null);
    setNotFound(false);
    setLoadingSnap(false);
  }

  const loadSnapshots = useCallback((stockId) => {
    if (!stockId) return;
    setLoadingSnap(true);
    setSnapError(null);

    api
      .snapshots(stockId, { limit: 100 })
      .then((res) => {
        setSnapshots(res.data || []);
      })
      .catch((err) => {
        setSnapError(err.message);
      })
      .finally(() => {
        setLoadingSnap(false);
      });
  }, []);

  // 1) Lấy thông tin mã từ RAM
  useEffect(() => {
    let cancelled = false;

    api
      .symbolState(symbol)
      .then((data) => {
        if (cancelled) return;
        setState(data);
        loadSnapshots(data.stockId);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, loadSnapshots]);

  // 2) Lắng nghe tick real-time của mã này để cập nhật giá trên header
  useEffect(() => {
    ws.connect();
    // Đăng ký nhận tick của mã này
    ws.subscribe([symbol]);

    const offTicks = ws.on("ticks", (ticks) => {
      const currentTick = ticks.find((t) => t.symbol === symbol);
      if (currentTick) {
        setState((prev) => (prev ? { ...prev, ...currentTick } : currentTick));
      }
    });

    return () => {
      offTicks();
      ws.subscribe([]); // reset nhận tất cả
    };
  }, [symbol]);

  if (notFound) {
    return (
      <div className="detail-error-box">
        <p className="detail-error">Mã cổ phiếu "{symbol}" không tồn tại trong hệ thống.</p>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          ← Quay lại bảng điện
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="detail-loading-box">
        <p className="detail-loading">Đang tải dữ liệu mã {symbol}…</p>
      </div>
    );
  }

  const change = state.price - state.refPrice;
  const changePct = state.refPrice ? ((change / state.refPrice) * 100).toFixed(2) : "0";
  const isCeiling = state.ceiling && state.price >= state.ceiling;
  const isFloor = state.floor && state.price <= state.floor;

  const chartData = (snapshots || []).map((s) => ({
    time: new Date(s.createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    min: Number(s.minPrice),
    max: Number(s.maxPrice),
    close: Number(s.closePrice)
  }));

  return (
    <div className="stock-detail-container">
      <div className="detail-nav-bar">
        <button className="btn-back" onClick={() => navigate("/")}>
          ← Bảng điện
        </button>
        <span className="live-indicator">● Cập nhật trực tiếp</span>
      </div>

      <div className="detail-head">
        <div className="detail-title-group">
          <h1>
            {state.symbol}{" "}
            <small>
              {state.companyName} · Sàn {state.market}
            </small>
          </h1>
          <div className="tags">
            {isCeiling && <span className="badge-ceiling">CHẠM TRẦN</span>}
            {isFloor && <span className="badge-floor">CHẠM SÀN</span>}
          </div>
        </div>

        <div className="detail-price">
          <div
            className={`big ${
              isCeiling
                ? "ceiling"
                : isFloor
                ? "floor"
                : priceChangeClass(state.price, state.refPrice)
            }`}
          >
            {formatPrice(state.price)}
          </div>
          <div
            className={`sub-change ${
              isCeiling
                ? "ceiling"
                : isFloor
                ? "floor"
                : priceChangeClass(state.price, state.refPrice)
            }`}
          >
            {change > 0 ? "+" : ""}
            {formatPrice(change)} ({changePct}%)
          </div>
        </div>
      </div>

      {/* Grid thông số kỹ thuật trong phiên */}
      <div className="detail-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Giá tham chiếu</span>
          <span className="stat-value flat">{formatPrice(state.refPrice)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Giá trần (+7%)</span>
          <span className="stat-value ceiling">{formatPrice(state.ceiling)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Giá sàn (-7%)</span>
          <span className="stat-value floor">{formatPrice(state.floor)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cao nhất phiên</span>
          <span className="stat-value">{formatPrice(state.high)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Thấp nhất phiên</span>
          <span className="stat-value">{formatPrice(state.low)}</span>
        </div>
      </div>

      {/* Biểu đồ biến động từ Snapshots DB */}
      <div className="detail-chart">
        <div className="chart-header">
          <h2>Biến động phiên (Đỉnh - Đáy - Đóng theo chu kỳ snapshot)</h2>
          <button
            className="btn-refresh"
            onClick={() => loadSnapshots(state.stockId)}
            disabled={loadingSnap}
          >
            {loadingSnap ? "Đang tải…" : "↻ Làm mới biểu đồ"}
          </button>
        </div>

        {snapError ? (
          <p className="detail-warn">
            Chưa tải được snapshot: {snapError} — vui lòng kiểm tra backend.
          </p>
        ) : chartData.length === 0 ? (
          <div className="chart-empty">
            <p>Chưa có dữ liệu snapshot cho mã {state.symbol}.</p>
            <small>
              Snapshot writer ghi dữ liệu theo chu kỳ 60 giây. Hãy đợi vài phút để hệ thống tích lũy các chu kỳ snapshot đầu tiên.
            </small>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="time" tick={{ fill: "#8b98a5", fontSize: 12 }} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#8b98a5", fontSize: 12 }}
                tickFormatter={formatPrice}
              />
              <Tooltip
                contentStyle={{ background: "#121d2f", borderColor: "#1e2a3a", borderRadius: "8px" }}
                formatter={(v) => [formatPrice(v) + " VND", ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="max"
                name="Đỉnh (Max)"
                stroke="#3fb950"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="min"
                name="Đáy (Min)"
                stroke="#f85149"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="close"
                name="Giá đóng (Close)"
                stroke="#4cc2ff"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
