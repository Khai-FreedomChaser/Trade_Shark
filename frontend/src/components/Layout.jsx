import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ws } from "../services/ws";
import { userService } from "../services/userService";
import "./layout.css";

/**
 * Khung chung: navbar + trạng thái kết nối WS + content.
 * FE1/FE2 chỉ cần dựng <Outlet/> của mình, đừng sửa cấu trúc này khi chưa thống nhất.
 */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [user, setUser] = useState(null);

  useEffect(() => {
    ws.connect();
    return ws.onStatus(setWsStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userService.isAuthenticated()) {
      return undefined;
    }

    userService.me()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => { cancelled = true; };
  }, [location.pathname]);

  function logout() {
    userService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <NavLink to="/" className="brand">🦈 Trade Shark</NavLink>
        <nav>
          <NavLink to="/">Bảng điện</NavLink>
          <NavLink to="/portfolio">Danh mục</NavLink>
          <NavLink to="/benchmark">Benchmark</NavLink>
        </nav>
        <div className="nav-account">
          {user ? (
            <>
              <NavLink className="account-chip" to="/portfolio" title="Mở danh mục">
                <span className="account-avatar">{(user.userName || user.email || "U").charAt(0).toUpperCase()}</span>
                <span className="account-name">{user.userName || user.email}</span>
              </NavLink>
              <button className="nav-auth-button nav-logout" type="button" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <NavLink className="nav-auth-button nav-login" to="/login">Đăng nhập</NavLink>
              <NavLink className="nav-auth-button nav-register" to="/login?mode=register">Đăng ký</NavLink>
            </>
          )}
        </div>
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
