import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ws } from "../../services/ws";
import { api } from "../../services/api";
import { formatPrice, priceChangeClass } from "../../config";
import "./board.css";

const ROW_HEIGHT = 42; // Chiều cao mỗi hàng (px)
const OVERSCAN = 10;   // Số hàng dự phòng trên/dưới viewport

export default function BoardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");

  // FE1-2: Sắp xếp theo cột
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Map symbol -> row nằm trong ref để cập nhật từ WS không phụ thuộc re-render
  const rowMapRef = useRef(new Map());

  // FE1-3: Virtualization state
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

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

  // 2) Luồng nóng: patch các mã THAY ĐỔI từ frame ticks (batch 500ms)
  useEffect(() => {
    ws.connect();
    let animFrame = null;

    const offTicks = ws.on("ticks", (data) => {
      for (const tick of data) {
        const prev = rowMapRef.current.get(tick.symbol);
        if (prev) {
          rowMapRef.current.set(tick.symbol, { ...prev, ...tick });
        } else {
          rowMapRef.current.set(tick.symbol, tick);
        }
      }

      // FE1-3: Throttle cập nhật state theo requestAnimationFrame
      if (!animFrame) {
        animFrame = requestAnimationFrame(() => {
          setRows(Array.from(rowMapRef.current.values()));
          animFrame = null;
        });
      }
    });

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      offTicks();
    };
  }, []);

  // Đo chiều cao viewport của container cuộn
  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        setViewportHeight(containerRef.current.clientHeight || 600);
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // FE1-2: Xử lý đổi cột sắp xếp
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: key === "symbol" ? "asc" : "desc" };
      }
      if (prev.direction === (key === "symbol" ? "asc" : "desc")) {
        return { key, direction: key === "symbol" ? "desc" : "asc" };
      }
      return { key: null, direction: null };
    });
  };

  // 3) Lọc và sắp xếp dữ liệu
  const sortedAndFiltered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let result = rows;

    if (q) {
      result = result.filter(
        (r) => r.symbol.includes(q) || (r.companyName || "").toUpperCase().includes(q)
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig;
      const factor = direction === "asc" ? 1 : -1;

      result = [...result].sort((a, b) => {
        if (key === "symbol") {
          return factor * a.symbol.localeCompare(b.symbol);
        }
        if (key === "change" || key === "changePct") {
          const changeA = a.refPrice ? (a.price - a.refPrice) / a.refPrice : 0;
          const changeB = b.refPrice ? (b.price - b.refPrice) / b.refPrice : 0;
          return factor * (changeA - changeB);
        }
        const valA = Number(a[key] ?? 0);
        const valB = Number(b[key] ?? 0);
        return factor * (valA - valB);
      });
    }

    return result;
  }, [rows, query, sortConfig]);

  // FE1-3: Virtual Table calculations
  const totalCount = sortedAndFiltered.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);

  const topPadding = startIndex * ROW_HEIGHT;
  const bottomPadding = Math.max(0, (totalCount - endIndex) * ROW_HEIGHT);
  const visibleRows = sortedAndFiltered.slice(startIndex, endIndex);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  if (status === "error") {
    return (
      <div className="board-error-box">
        <p className="board-error">
          Không lấy được trạng thái thị trường — hãy kiểm tra backend đã chạy chưa (`npm run dev` trong backend)
        </p>
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-toolbar">
        <h1>Bảng điện</h1>
        <input
          className="board-search"
          placeholder="Tìm mã hoặc công ty…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="board-count">
          {sortedAndFiltered.length.toLocaleString("vi-VN")} / {rows.length.toLocaleString("vi-VN")} mã
        </span>
      </div>

      {/* FE1-3: Khung cuộn Virtualized Table */}
      <div className="board-table-scroll" ref={containerRef} onScroll={handleScroll}>
        <table className="board-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("symbol")}>
                Mã <span className={`sort-icon ${sortConfig.key === "symbol" ? "active" : ""}`}>{getSortIcon("symbol")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("price")}>
                Giá <span className={`sort-icon ${sortConfig.key === "price" ? "active" : ""}`}>{getSortIcon("price")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("change")}>
                ± refPrice <span className={`sort-icon ${sortConfig.key === "change" ? "active" : ""}`}>{getSortIcon("change")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("high")}>
                Cao nhất <span className={`sort-icon ${sortConfig.key === "high" ? "active" : ""}`}>{getSortIcon("high")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("low")}>
                Thấp nhất <span className={`sort-icon ${sortConfig.key === "low" ? "active" : ""}`}>{getSortIcon("low")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("ceiling")}>
                Trần <span className={`sort-icon ${sortConfig.key === "ceiling" ? "active" : ""}`}>{getSortIcon("ceiling")}</span>
              </th>
              <th className="right sortable" onClick={() => handleSort("floor")}>
                Sàn <span className={`sort-icon ${sortConfig.key === "floor" ? "active" : ""}`}>{getSortIcon("floor")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Đệm trên */}
            {topPadding > 0 && (
              <tr style={{ height: `${topPadding}px` }} className="virtual-spacer">
                <td colSpan={7} />
              </tr>
            )}

            {visibleRows.map((r) => {
              const change = r.price - r.refPrice;
              const changePct = r.refPrice ? ((change / r.refPrice) * 100).toFixed(2) : "0";

              // FE1-1: Highlight hàng chạm trần/sàn (price === ceiling/floor -> đổi nền hàng)
              const hitClass =
                r.price === r.ceiling ? "hit-ceiling" : r.price === r.floor ? "hit-floor" : "";

              // CONTRACT mục 4: Màu chữ chuẩn xanh/đỏ/vàng so với refPrice
              const colorClass = priceChangeClass(r.price, r.refPrice);

              return (
                <tr
                  key={r.symbol}
                  className={hitClass}
                  onClick={() => navigate(`/stock/${r.symbol}`)}
                >
                  <td className="symbol">{r.symbol}</td>
                  {/* Cột Giá: màu theo CONTRACT mục 4 (xanh > refPrice, đỏ < refPrice, vàng == refPrice) */}
                  <td className={`right price ${colorClass}`}>
                    {formatPrice(r.price)}
                  </td>
                  {/* Cột ± refPrice: màu theo CONTRACT mục 4 */}
                  <td className={`right ${colorClass}`}>
                    {change > 0 ? "+" : ""}{formatPrice(change)} ({changePct}%)
                  </td>
                  <td className="right">{formatPrice(r.high)}</td>
                  <td className="right">{formatPrice(r.low)}</td>
                  {/* Cột Trần luôn có màu tím, Cột Sàn luôn có màu xanh lơ theo đúng bảng điện */}
                  <td className="right ceiling">{formatPrice(r.ceiling)}</td>
                  <td className="right floor">{formatPrice(r.floor)}</td>
                </tr>
              );
            })}

            {/* Đệm dưới */}
            {bottomPadding > 0 && (
              <tr style={{ height: `${bottomPadding}px` }} className="virtual-spacer">
                <td colSpan={7} />
              </tr>
            )}

            {sortedAndFiltered.length === 0 && (
              <tr>
                <td colSpan={7} className="board-empty">
                  Không tìm thấy mã cổ phiếu phù hợp với từ khóa "{query}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
