import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ws } from "../services/ws";
import { api } from "../services/api";
import { formatPrice, priceChangeClass } from "../config";
import "./board.css";

/**
 * BẢNG ĐIỆN REAL-TIME — khung chạy được, FE1 sở hữu và hoàn thiện nốt (xem issue).
 *
 * Đã có sẵn (không cần làm lại):
 *  - Bootstrap từ REST /api/market/state, rồi sống bằng frame WS "ticks" (batch 500ms)
 *  - Tô màu tăng/giảm/đứng giá, tìm kiếm theo mã
 *  - Nhấn vào 1 hàng -> sang trang chi tiết mã
 *
 * Issue cho FE1 (TODO đánh dấu sẵn trong file):
 *  1. Highlight chạm trần/sàn (price == ceiling/floor -> đổi nền hàng)
 *  2. Sắp xếp theo cột (giá, % thay đổi, high/low)
 *  3. Tối ưu render khi nghìn mã nhảy số (virtualize table, memo hóa hàng)
 *  4. Nhận frame "alert" -> toast (phối hợp với FE2 nếu toast là component chung)
 */
export default function BoardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  // Map symbol -> row nằm trong ref để update từ WS không phụ thuộc re-render
  const rowMapRef = useRef(new Map());

  // 1) Bootstrap: lấy trạng thái toàn thị trường từ REST một lần
  useEffect(() => {
    let cancelled = false;
    api
      .marketState()
      .then((res) => {
        if (cancelled) return;
        for (const state of res.data) {
          rowMapRef.current.set(state.symbol, state);
        }
        setRows(Array.from(rowMapRef.current.values()));
        setStatus("live");
      })
      .catch(() => setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Luồng nóng: patch các mã THAY ĐỔI từ frame ticks
  useEffect(() => {
    ws.connect();
    const offTicks = ws.on("ticks", (data) => {
      for (const tick of data) {
        rowMapRef.current.set(tick.symbol, { ...rowMapRef.current.get(tick.symbol), ...tick });
      }
      // ticks đã được server batch 500ms/lần nên setState trực tiếp vẫn ổn ở mức khung;
      // FE1 có thể throttle thêm ở đây khi tối ưu (issue 3).
      setRows(Array.from(rowMapRef.current.values()));
    });
    return offTicks;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter(
      (r) => !q || r.symbol.includes(q) || (r.companyName || "").toUpperCase().includes(q)
    );
    // Giới hạn 100 hàng hiển thị — đủ demo, tránh render nghìn hàng (FE1 tối ưu issue 3)
  }, [rows, query]);

  if (status === "error") {
    return <p className="board-error">Không lấy được trạng thái thị trường — backend đang chạy chưa? (`npm run dev` trong backend)</p>;
  }

  return (
    <div>
      <div className="board-toolbar">
        <h1>Bảng điện</h1>
        <input
          className="board-search"
          placeholder="Tìm mã hoặc công ty…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="board-count">{filtered.length} / {rows.length} mã</span>
      </div>

      <table className="board-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th className="right">Giá</th>
            <th className="right">± refPrice</th>
            <th className="right">Cao nhất</th>
            <th className="right">Thấp nhất</th>
            <th className="right">Trần</th>
            <th className="right">Sàn</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 100).map((r) => {
            const change = r.price - r.refPrice;
            const changePct = r.refPrice ? ((change / r.refPrice) * 100).toFixed(2) : "0";
            return (
              <tr
                key={r.symbol}
                onClick={() => navigate(`/stock/${r.symbol}`)}
                // TODO(FE1-1): thêm class "hit-ceiling"/"hit-floor" khi r.price === r.ceiling/r.floor
              >
                <td className="symbol">{r.symbol}</td>
                <td className={`right price ${priceChangeClass(r.price, r.refPrice)}`}>
                  {formatPrice(r.price)}
                </td>
                <td className={`right ${priceChangeClass(r.price, r.refPrice)}`}>
                  {change > 0 ? "+" : ""}{formatPrice(change)} ({changePct}%)
                </td>
                <td className="right">{formatPrice(r.high)}</td>
                <td className="right">{formatPrice(r.low)}</td>
                <td className="right ceiling">{formatPrice(r.ceiling)}</td>
                <td className="right floor">{formatPrice(r.floor)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
