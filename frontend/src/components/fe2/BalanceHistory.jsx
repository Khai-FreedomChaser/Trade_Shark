import { formatPrice } from "../../config";

// Backend trả `type` theo enum của bảng balance_history: deposit | withdrawal | trade.
// 'trade' không tách mua/bán trong cột type — dấu của `amount` quyết định (mua âm, bán dương).
function describe(row) {
  const raw = Number(row.amount) || 0;

  if (row.type === "withdrawal") return { label: "Rút tiền", amount: -Math.abs(raw) };
  if (row.type === "deposit") return { label: "Nạp tiền", amount: Math.abs(raw) };

  return { label: raw < 0 ? "Mua cổ phiếu" : "Bán cổ phiếu", amount: raw };
}

export default function BalanceHistory({ rows }) {
  return <section className="workspace-section">
    <div className="section-heading"><div><p className="eyebrow">Dòng tiền</p><h2>Lịch sử số dư</h2></div></div>
    {rows.length === 0 ? <p className="empty-state">Chưa có giao dịch số dư.</p> : <div className="table-scroll"><table className="fe2-table"><thead><tr><th>Loại</th><th className="right">Số tiền</th><th className="right">Số dư sau giao dịch</th><th>Thời gian</th></tr></thead><tbody>{rows.map((row) => {
      const { label, amount } = describe(row);
      return <tr key={row.id}>
        <td>{label}</td>
        <td className={`right ${amount < 0 ? "negative" : "positive"}`}>{amount > 0 ? "+" : ""}{formatPrice(amount)}</td>
        <td className="right">{formatPrice(row.balanceAfter)}</td>
        <td>{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
      </tr>;
    })}</tbody></table></div>}
  </section>;
}
