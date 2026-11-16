import { formatPrice } from "../../config";

export default function PortfolioTable({ rows, onTrade }) {
  const totalValue = rows.reduce((sum, row) => sum + row.currentPrice * row.quantity, 0);
  const totalProfit = rows.reduce((sum, row) => sum + (row.currentPrice - row.averagePrice) * row.quantity, 0);

  return (
    <section className="workspace-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Danh mục</p>
          <h2>Tài sản đang nắm giữ</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => onTrade("buy")}>Đặt lệnh</button>
      </div>
      <div className="portfolio-metrics">
        <span>Giá trị thị trường <strong>{formatPrice(totalValue)} VND</strong></span>
        <span className={totalProfit >= 0 ? "positive" : "negative"}>Lãi/lỗ tạm tính <strong>{totalProfit >= 0 ? "+" : ""}{formatPrice(totalProfit)} VND</strong></span>
      </div>
      {rows.length === 0 ? <p className="empty-state">Danh mục đang trống.</p> : (
        <div className="table-scroll">
          <table className="fe2-table">
            <thead><tr><th>Mã</th><th className="right">SL</th><th className="right">Giá vốn</th><th className="right">Giá hiện tại</th><th className="right">Lãi/lỗ</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => {
                const profit = (row.currentPrice - row.averagePrice) * row.quantity;
                return <tr key={row.symbol}>
                  <td><strong>{row.symbol}</strong><small className="table-sub">{row.stockId}</small></td>
                  <td className="right">{row.quantity.toLocaleString("vi-VN")}</td>
                  <td className="right">{formatPrice(row.averagePrice)}</td>
                  <td className="right">{formatPrice(row.currentPrice)}</td>
                  <td className={`right ${profit >= 0 ? "positive" : "negative"}`}>{profit >= 0 ? "+" : ""}{formatPrice(profit)}</td>
                  <td className="trade-actions"><button type="button" onClick={() => onTrade("buy", row.symbol)}>Mua</button><button type="button" onClick={() => onTrade("sell", row.symbol)}>Bán</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
