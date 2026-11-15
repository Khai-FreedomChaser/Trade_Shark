import { useEffect, useState } from "react";
import { api } from "../services/api";
import "./portfolio.css";

/**
 * DANH MỤC & GIAO DỊCH — khung cho FE2 hoàn thiện (xem issue).
 *
 * Chưa có auth nên trang này chỉ là placeholder có cấu trúc sẵn.
 * FE2 làm theo docs/CONTRACT.md mục 3.4:
 *   TODO(FE2-1): Đăng nhập -> lưu accessToken/refreshToken (localStorage)
 *   TODO(FE2-2): GET /api/user/portfolio -> danh mục + lãi/lỗ tạm tính
 *                (giá hiện tại lấy từ ws frame "ticks" theo symbol)
 *   TODO(FE2-3): Modal đặt lệnh Mua/Bán -> POST /api/user/trade/buy | sell
 *   TODO(FE2-4): Lịch sử BalanceHistory -> GET /api/user/balance-history
 *   TODO(FE2-5): Quản lý ngưỡng StockAlert -> GET/POST/DELETE /api/user/alerts
 *   TODO(FE2-6): Nghe frame WS "alert" -> Toast/Notification
 */
export default function PortfolioPage() {
  const [message] = useState(null);

  useEffect(() => {
    // FE2: khi auth xong, thay phần này bằng load portfolio thật
  }, []);

  return (
    <div>
      <h1>Danh mục của tôi</h1>
      {message && <p className="portfolio-note">{message}</p>}

      <div className="portfolio-placeholder">
        <p>
          Phần này của <strong>Frontend 2</strong>: đăng nhập, số dư, danh mục
          <code>StockUser</code>, đặt lệnh Mua/Bán và cài đặt ngưỡng cảnh báo
          <code>StockAlert</code>.
        </p>
        <p>
          Endpoint & payload đã chốt trong <code>docs/CONTRACT.md</code> mục 3.4 —
          code theo đó, không tự đoán field.
        </p>
      </div>
    </div>
  );
}
