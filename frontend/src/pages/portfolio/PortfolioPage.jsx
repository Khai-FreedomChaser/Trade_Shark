import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ws } from "../../services/ws";
import { userService } from "../../services/userService";
import BalanceHistory from "../../components/fe2/BalanceHistory";
import BalanceModal from "../../components/fe2/BalanceModal";
import BalanceSummary from "../../components/fe2/BalanceSummary";
import AlertForm from "../../components/fe2/AlertForm";
import PortfolioTable from "../../components/fe2/PortfolioTable";
import ToastNotification from "../../components/fe2/ToastNotification";
import TradeModal from "../../components/fe2/TradeModal";
import "./portfolio.css";

function patchPrices(rows, ticks) {
  const prices = new Map(ticks.map((tick) => [tick.symbol, tick.price]));
  return rows.map((row) => prices.has(row.symbol) ? { ...row, currentPrice: prices.get(row.symbol) } : row);
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [trade, setTrade] = useState(null);
  const [balanceModal, setBalanceModal] = useState(null);

  async function loadWorkspace() {
    setError("");
    const [me, holdings, balanceHistory, userAlerts] = await Promise.all([
      userService.me(),
      userService.portfolio(),
      userService.balanceHistory(),
      userService.alerts()
    ]);
    setUser(me);
    setPortfolio(holdings);
    setHistory(balanceHistory);
    setAlerts(userAlerts);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.me(),
      userService.portfolio(),
      userService.balanceHistory(),
      userService.alerts()
    ])
      .then(([me, holdings, balanceHistory, userAlerts]) => {
        if (cancelled) return;
        setUser(me);
        setPortfolio(holdings);
        setHistory(balanceHistory);
        setAlerts(userAlerts);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    ws.connect();
    const offTicks = ws.on("ticks", (ticks) => setPortfolio((rows) => patchPrices(rows, ticks)));
    const offAlerts = ws.on("alert", (alert) => {
      if (user?.id && alert.userId && alert.userId !== user.id) return;
      setToast({ title: `Cảnh báo ${alert.symbol}`, message: alert.message || `Giá ${alert.symbol} đã chạm ngưỡng ${alert.kind || ""}.` });
    });
    return () => { offTicks(); offAlerts(); };
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function runAction(action, successMessage) {
    setBusy(true);
    setError("");
    try { await action(); await loadWorkspace(); setToast({ title: "Đã cập nhật", message: successMessage }); return true; }
    catch (actionError) { setError(actionError.message); return false; }
    finally { setBusy(false); }
  }

  async function submitBalance({ mode, amount }) {
    const label = mode === "deposit" ? "Nạp tiền" : "Rút tiền";
    const success = await runAction(
      () => mode === "deposit" ? userService.deposit(amount) : userService.withdraw(amount),
      `${label} thành công.`
    );
    if (success) setBalanceModal(null);
  }

  function logout() { userService.logout(); navigate("/login", { replace: true }); }

  async function submitTrade({ side, symbol, quantity }) {
    const success = await runAction(() => side === "buy" ? userService.buy({ symbol, quantity }) : userService.sell({ symbol, quantity }), `${side === "buy" ? "Mua" : "Bán"} ${symbol} thành công.`);
    if (success) setTrade(null);
  }

  if (loading) return <p className="portfolio-state">Đang tải ví và danh mục...</p>;
  if (!user) return <p className="portfolio-state">Không tải được tài khoản. {error}</p>;

  return <div className="portfolio-page">
    <header className="portfolio-header"><div><p className="eyebrow">TÀI KHOẢN CÁ NHÂN</p><h1>Danh mục của tôi</h1></div><button className="outline-button" type="button" onClick={logout}>Đăng xuất</button></header>
    {error && <div className="page-error">{error}</div>}
    <BalanceSummary user={user} busy={busy} onDeposit={() => setBalanceModal("deposit")} onWithdraw={() => setBalanceModal("withdraw")} />
    <PortfolioTable rows={portfolio} onTrade={(side, symbol) => setTrade({ mode: side, symbol })} />
    <div className="portfolio-grid"><BalanceHistory rows={history} /><AlertForm alerts={alerts} busy={busy} onSave={(payload) => runAction(() => userService.saveAlert(payload), `Đã lưu cảnh báo ${payload.symbol}.`)} onDelete={(alert) => runAction(() => userService.deleteAlert(alert), `Đã xóa cảnh báo ${alert.symbol}.`)} /></div>
    <ToastNotification toast={toast} onClose={() => setToast(null)} />
    {balanceModal && <BalanceModal mode={balanceModal} user={user} busy={busy} error={error} onClose={() => setBalanceModal(null)} onSubmit={submitBalance} />}
    {trade && <TradeModal {...trade} rows={portfolio} busy={busy} error={error} onClose={() => setTrade(null)} onSubmit={submitTrade} />}
  </div>;
}
