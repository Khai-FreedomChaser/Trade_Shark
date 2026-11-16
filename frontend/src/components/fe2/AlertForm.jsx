import { useEffect, useRef, useState } from "react";
import { formatPrice } from "../../config";

export default function AlertForm({ alerts, marketSymbols = [], onSave, onDelete, busy }) {
  const [symbol, setSymbol] = useState("");
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [alertMin, setAlertMin] = useState("");
  const [alertMax, setAlertMax] = useState("");
  const [error, setError] = useState("");
  const symbolPickerRef = useRef(null);
  const symbols = Array.from(new Map(marketSymbols.map((item) => [item.symbol, item])).values());
  const filteredSymbols = symbols.filter((item) => item.symbol.toUpperCase().includes(symbol.trim().toUpperCase()));

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (symbolPickerRef.current && !symbolPickerRef.current.contains(event.target)) {
        setSymbolMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!symbol.trim() || (!alertMin && !alertMax)) { setError("Nhập mã và ít nhất một ngưỡng giá"); return; }
    if (alertMin && alertMax && Number(alertMin) >= Number(alertMax)) { setError("Ngưỡng thấp phải nhỏ hơn ngưỡng cao"); return; }
    try {
      const saved = await onSave({ symbol: symbol.trim().toUpperCase(), alertMin: alertMin ? Number(alertMin) : null, alertMax: alertMax ? Number(alertMax) : null });
      if (saved !== false) { setSymbol(""); setAlertMin(""); setAlertMax(""); setSymbolMenuOpen(false); }
    } catch (saveError) { setError(saveError.message); }
  }

  return <section className="workspace-section"><div className="section-heading"><div><p className="eyebrow">Kỷ luật giao dịch</p><h2>Cảnh báo giá</h2></div></div>
    <form className="alert-form" onSubmit={submit}>
      <div className="alert-symbol-picker" ref={symbolPickerRef}>
        <input
          placeholder="Mã, VD: VCB"
          value={symbol}
          onFocus={() => setSymbolMenuOpen(true)}
          onChange={(event) => { setSymbol(event.target.value.toUpperCase()); setSymbolMenuOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") setSymbolMenuOpen(false); }}
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
              onClick={() => { setSymbol(item.symbol); setSymbolMenuOpen(false); }}
            >
              <strong>{item.symbol}</strong>
              {item.companyName && <small>{item.companyName}</small>}
            </button>
          ))}
        </div>}
      </div>
      <input type="number" placeholder="Ngưỡng thấp" value={alertMin} onChange={(event) => setAlertMin(event.target.value)} />
      <input type="number" placeholder="Ngưỡng cao" value={alertMax} onChange={(event) => setAlertMax(event.target.value)} />
      <button className="secondary-button" type="submit" disabled={busy}>Lưu cảnh báo</button>
    </form>
    {error && <p className="form-error">{error}</p>}
    {alerts.length === 0 ? <p className="empty-state">Chưa cài cảnh báo nào.</p> : <div className="alert-list">{alerts.map((alert) => <div className="alert-row" key={`${alert.stockId || alert.symbol}-${alert.createdAt}`}><strong>{alert.symbol}</strong><span>Thấp: {alert.alertMin ? formatPrice(alert.alertMin) : "-"}</span><span>Cao: {alert.alertMax ? formatPrice(alert.alertMax) : "-"}</span><button className="danger-button" type="button" onClick={() => onDelete(alert)} disabled={busy}>Xóa</button></div>)}</div>}
  </section>;
}
