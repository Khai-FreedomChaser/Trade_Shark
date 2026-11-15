import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { api } from "../services/api";
import { formatPrice } from "../config";
import "./detail.css";

/**
 * CHI TIẾT MÃ CỔ PHIẾU — FE1.
 *
 * Luồng dữ liệu đúng theo contract:
 *   1. symbol từ URL -> /api/market/state/:symbol lấy giá hiện tại (RAM)
 *   2. stockId từ đó -> /api/stock/:stockId/snapshots lấy chuỗi min/max/close (DB)
 *   3. Dữ liệu từ DB được sử dụng để vẽ biểu đồ biến động giá cổ phiếu trong phiên.
 *   4. Khi API chưa sẵn sàng, sẽ hiển thị thông báo (state "api-chưa-sẵn"), không cần sửa gì ở đây sau khi BE1 xong.
 */
export default function StockDetailPage() {
  const { symbol } = useParams();
  const [state, setState] = useState(null);
  const [snapshots, setSnapshots] = useState(null);
  const [snapError, setSnapError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState(null);
    setSnapshots(null);
    setSnapError(null);
    setNotFound(false);

    api
      .symbolState(symbol)
      .then((data) => {
        if (cancelled) return;
        setState(data);

        // Snapshot là dữ liệu DB — đủ để vẽ đường biến động trong phiên
        return api
          .snapshots(data.stockId)
          .then((res) => {
            if (!cancelled) setSnapshots(res.data || []);
          })
          .catch((err) => {
            // 404 = Backend 1 chưa dựng endpoint, hoặc mã chưa có snapshot
            if (!cancelled) setSnapError(err.message);
          });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (notFound) {
    return <p className="detail-error">Mã {symbol} không tồn tại trong trạng thái thị trường.</p>;
  }
  if (!state) {
    return <p className="detail-loading">Đang tải {symbol}…</p>;
  }

  const chartData = (snapshots || []).map((s) => ({
    time: new Date(s.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    min: Number(s.minPrice),
    max: Number(s.maxPrice),
    close: Number(s.closePrice)
  }));

  return (
    <div>
      <div className="detail-head">
        <h1>{state.symbol} <small>{state.companyName} · {state.market}</small></h1>
        <div className="detail-price">
          <span className={`big ${state.price > state.refPrice ? "up" : state.price < state.refPrice ? "down" : "flat"}`}>
            {formatPrice(state.price)}
          </span>
          <span className="ref">ref {formatPrice(state.refPrice)} · trần {formatPrice(state.ceiling)} · sàn {formatPrice(state.floor)}</span>
        </div>
      </div>

      <div className="detail-chart">
        <h2>Biến động phiên (min / max / close theo snapshot)</h2>
        {snapError ? (
          <p className="detail-warn">
            Chưa vẽ được biểu đồ: {snapError} — chờ Backend 1 xong
            <code>GET /api/stock/:id/snapshots</code>.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
              <XAxis dataKey="time" tick={{ fill: "#8b98a5", fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#8b98a5", fontSize: 11 }} tickFormatter={formatPrice} />
              <Tooltip formatter={(v) => formatPrice(v)} />
              <Legend />
              <Line type="monotone" dataKey="max" name="Đỉnh" stroke="#3fb950" dot={false} />
              <Line type="monotone" dataKey="min" name="Đáy" stroke="#f85149" dot={false} />
              <Line type="monotone" dataKey="close" name="Giá đóng" stroke="#4cc2ff" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
