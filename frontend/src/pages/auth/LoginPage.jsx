import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { userService } from "../../services/userService";
import "./login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("manh@example.com");
  const [password, setPassword] = useState("123456");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  function toggleMode() {
    setSearchParams(mode === "login" ? { mode: "register" } : {});
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await userService.register({ email, password, userName });
      } else {
        await userService.login({ email, password });
      }
      navigate(location.state?.from || "/portfolio", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="auth-kicker">TRADE SHARK · FE2</p>
        <h1>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Mở ví và quản lý danh mục của bạn." : "Tạo tài khoản demo để bắt đầu giao dịch."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Tên hiển thị
              <input value={userName} onChange={(event) => setUserName(event.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Mật khẩu
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <button className="link-button" type="button" onClick={toggleMode}>
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
        <p className="auth-hint">Demo: manh@example.com / 123456</p>
      </section>
    </main>
  );
}
