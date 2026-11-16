import { formatPrice } from "../../config";

export default function BalanceSummary({ user, onDeposit, onWithdraw, busy }) {
  return (
    <section className="wallet-summary">
      <div>
        <p className="eyebrow">Ví giao dịch</p>
        <h2>{formatPrice(user?.balance)} <small>VND</small></h2>
        <p className="muted">Xin chào, {user?.userName || user?.email}</p>
      </div>
      <div className="wallet-actions">
        <button className="secondary-button" type="button" onClick={onDeposit} disabled={busy}>Nạp tiền</button>
        <button className="outline-button" type="button" onClick={onWithdraw} disabled={busy}>Rút tiền</button>
      </div>
    </section>
  );
}
