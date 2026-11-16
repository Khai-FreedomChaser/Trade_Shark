import { formatPrice } from "../../config";

const labels = { deposit: "Nạp tiền", withdraw: "Rút tiền", buy: "Mua cổ phiếu", sell: "Bán cổ phiếu" };

export default function BalanceHistory({ rows }) {
  return <section className="workspace-section">
    <div className="section-heading"><div><p className="eyebrow">Dòng tiền</p><h2>Lịch sử số dư</h2></div></div>
    {rows.length === 0 ? <p className="empty-state">Chưa có giao dịch số dư.</p> : <div className="table-scroll"><table className="fe2-table"><thead><tr><th>Loại</th><th className="right">Số tiền</th><th className="right">Số dư sau giao dịch</th><th>Thời gian</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{labels[row.type] || row.type}</td><td className={`right ${row.type === "withdraw" || row.type === "buy" ? "negative" : "positive"}`}>{row.type === "withdraw" || row.type === "buy" ? "-" : "+"}{formatPrice(row.amount)}</td><td className="right">{formatPrice(row.balanceAfter)}</td><td>{new Date(row.createdAt).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div>}
  </section>;
}
