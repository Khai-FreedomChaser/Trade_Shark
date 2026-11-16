import { useState } from "react";
import { formatPrice } from "../../config";

export default function BalanceModal({ mode, user, busy, error, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState("");
  const isDeposit = mode === "deposit";
  const numericAmount = Number(amount || 0);
  const balanceAfter = user.balance + (isDeposit ? numericAmount : -numericAmount);

  function submit(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setValidationError("Số tiền phải lớn hơn 0");
      return;
    }
    if (!isDeposit && value > user.balance) {
      setValidationError("Số tiền rút vượt quá số dư hiện tại");
      return;
    }
    setValidationError("");
    onSubmit({ mode, amount: value });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="balance-modal" role="dialog" aria-modal="true" aria-labelledby="balance-modal-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">VÍ GIAO DỊCH</p>
            <h2 id="balance-modal-title">{isDeposit ? "Nạp tiền" : "Rút tiền"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="balance-modal-current">
          <span>Số dư hiện tại</span>
          <strong>{formatPrice(user.balance)} VND</strong>
        </div>

        <form className="balance-form" onSubmit={submit}>
          <label htmlFor="balance-amount">Số tiền (VND)</label>
          <input
            id="balance-amount"
            type="number"
            min="1"
            step="1000"
            inputMode="numeric"
            value={amount}
            onChange={(event) => { setAmount(event.target.value); setValidationError(""); }}
            placeholder="Nhập số tiền"
            autoFocus
            required
          />
          <div className="quick-amounts" aria-label="Mức tiền nhanh">
            {[100000, 500000, 1000000, 5000000].map((value) => (
              <button key={value} type="button" onClick={() => { setAmount(String(value)); setValidationError(""); }}>{formatPrice(value)}</button>
            ))}
          </div>
          <div className={`balance-after ${balanceAfter < 0 ? "negative" : ""}`}>
            <span>Số dư sau giao dịch</span>
            <strong>{formatPrice(balanceAfter)} VND</strong>
          </div>
          {(validationError || error) && <p className="form-error">{validationError || error}</p>}
          <div className="modal-actions">
            <button className="outline-button" type="button" onClick={onClose} disabled={busy}>Hủy</button>
            <button className="secondary-button" type="submit" disabled={busy}>{busy ? "Đang xử lý..." : "Xác nhận"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
