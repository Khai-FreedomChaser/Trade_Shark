import { useEffect, useRef, useState } from "react";
import { formatPrice } from "../../config";

export default function TradeModal({ mode, symbol: initialSymbol, rows, marketSymbols = [], onClose, onSubmit, busy, error }) {
  const [side, setSide] = useState(mode || "buy");
  const [symbol, setSymbol] = useState(initialSymbol || "");
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const symbolPickerRef = useRef(null);
  const symbols = Array.from(new Map(
    [...marketSymbols, ...rows].map((item) => [item.symbol, item])
  ).values());
  const query = symbol.trim().toUpperCase();
  const filteredSymbols = symbols.filter((item) => item.symbol.toUpperCase().includes(query));
  const selected = rows.find((row) => row.symbol === symbol) || symbols.find((item) => item.symbol === symbol);
  const price = selected?.currentPrice || selected?.price || 100000;

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (symbolPickerRef.current && !symbolPickerRef.current.contains(event.target)) {
        setSymbolMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, []);

  function chooseSymbol(nextSymbol) {
    setSymbol(nextSymbol);
    setSymbolMenuOpen(false);
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({ side, symbol: symbol.trim().toUpperCase(), quantity: Number(quantity) });
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-title">
      <div className="section-heading"><h2 id="trade-title">Đặt lệnh</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">×</button></div>
      <div className="segmented-control"><button className={side === "buy" ? "active" : ""} type="button" onClick={() => setSide("buy")}>Mua</button><button className={side === "sell" ? "active" : ""} type="button" onClick={() => setSide("sell")}>Bán</button></div>
      <form className="trade-form" onSubmit={submit}>
        <label className="symbol-picker-label" htmlFor="trade-symbol">Mã cổ phiếu
          <div className="symbol-picker" ref={symbolPickerRef}>
            <input
              id="trade-symbol"
              value={symbol}
              onFocus={() => setSymbolMenuOpen(true)}
              onChange={(event) => { setSymbol(event.target.value.toUpperCase()); setSymbolMenuOpen(true); }}
              onKeyDown={(event) => { if (event.key === "Escape") setSymbolMenuOpen(false); }}
              placeholder="Tìm mã, VD: VCB"
              autoComplete="off"
              required
            />
            {symbolMenuOpen && <div className="symbol-menu" role="listbox">
              {filteredSymbols.length === 0 ? <p className="symbol-empty">Không tìm thấy mã phù hợp</p> : filteredSymbols.map((item) => (
                <button
                  className="symbol-option"
                  key={item.symbol}
                  type="button"
                  role="option"
                  aria-selected={item.symbol === symbol}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSymbol(item.symbol)}
                >
                  <strong>{item.symbol}</strong>
                  {item.companyName && <small>{item.companyName}</small>}
                </button>
              ))}
            </div>}
          </div>
        </label>
        <label>Số lượng<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
        <div className="trade-estimate"><span>Giá hiện tại</span><strong>{formatPrice(price)} VND</strong><span>Giá trị dự kiến</span><strong>{formatPrice(price * Number(quantity || 0))} VND</strong></div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Đang gửi..." : `Xác nhận ${side === "buy" ? "mua" : "bán"}`}</button>
      </form>
    </section>
  </div>;
}
