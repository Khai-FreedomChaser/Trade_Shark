import { useState } from "react";
import { formatPrice } from "../../config";

export default function TradeModal({ mode, symbol: initialSymbol, rows, onClose, onSubmit, busy, error }) {
  const [side, setSide] = useState(mode || "buy");
  const [symbol, setSymbol] = useState(initialSymbol || rows[0]?.symbol || "");
  const [quantity, setQuantity] = useState(1);
  const selected = rows.find((row) => row.symbol === symbol);
  const price = selected?.currentPrice || 100000;

  function submit(event) {
    event.preventDefault();
    onSubmit({ side, symbol: symbol.trim().toUpperCase(), quantity: Number(quantity) });
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-title">
      <div className="section-heading"><h2 id="trade-title">Đặt lệnh</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">×</button></div>
      <div className="segmented-control"><button className={side === "buy" ? "active" : ""} type="button" onClick={() => setSide("buy")}>Mua</button><button className={side === "sell" ? "active" : ""} type="button" onClick={() => setSide("sell")}>Bán</button></div>
      <form className="trade-form" onSubmit={submit}>
        <label>Mã cổ phiếu<input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="VD: VCB" required /></label>
        <label>Số lượng<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
        <div className="trade-estimate"><span>Giá hiện tại</span><strong>{formatPrice(price)} VND</strong><span>Giá trị dự kiến</span><strong>{formatPrice(price * Number(quantity || 0))} VND</strong></div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Đang gửi..." : `Xác nhận ${side === "buy" ? "mua" : "bán"}`}</button>
      </form>
    </section>
  </div>;
}
