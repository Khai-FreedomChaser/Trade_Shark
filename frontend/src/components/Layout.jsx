import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ws } from "../services/ws";
import "./layout.css";

/**
 * Khung chung: navbar + trạng thái kết nối WS + content.
 * FE1/FE2 chỉ cần dựng <Outlet/> của mình, đừng sửa cấu trúc này khi chưa thống nhất.
 */
export default function Layout() {
  const [wsStatus, setWsStatus] = useState("disconnected");

  useEffect(() => {
    ws.connect();
    return ws.onStatus(setWsStatus);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-nav">
        <NavLink to="/" className="brand">🦈 Trade Shark</NavLink>
        <nav>
          <NavLink to="/">Bảng điện</NavLink>
          <NavLink to="/portfolio">Danh mục</NavLink>
          <NavLink to="/benchmark">Benchmark</NavLink>
        </nav>
        <span className={`ws-status ${wsStatus}`} title="Kết nối WebSocket">
          {wsStatus === "connected" ? "● LIVE" : "○ MẤT KẾT NỐI"}
        </span>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
