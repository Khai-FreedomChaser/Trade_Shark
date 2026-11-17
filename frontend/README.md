# Trade Shark — Frontend

React 19 + Vite. Kết nối backend theo đúng `docs/CONTRACT.md` (thư mục gốc repo).

## Chạy

```bash
npm install
cp .env.example .env   # mặc định trỏ http://localhost:3636
npm run dev
```

Cần backend đang chạy (`npm run dev` trong thư mục `backend/`) — иначе mọi trang sẽ báo lỗi kết nối.

Không còn lớp mock: mọi trang (bảng điện, chi tiết mã, benchmark, danh mục/giao dịch/cảnh báo) đọc
và ghi trực tiếp vào backend thật qua `services/api.js` + `services/ws.js` theo `docs/CONTRACT.md`.
Tài khoản phải đăng ký trước ở `/login?mode=register` rồi nạp tiền để giao dịch.

## Cấu trúc

```text
src/
├── config.js          # URL API/WS + format giá + quy tắc màu tăng/giảm
├── services/
│   ├── api.js         # REST client (thêm endpoint user/trade của BE2 vào đây)
│   └── ws.js          # WS client dùng chung: ws.on("ticks"|"snapshot"|"alert"|"hello")
├── components/
│   └── Layout.jsx     # Navbar + đèn LIVE/MẤT KẾT NỐI (đừng đổi khi chưa thống nhất)
└── pages/
    ├── board/               # FE1 (Quang Anh): bảng điện — khung chạy được + 4 TODO trong file
    ├── stock-detail/        # FE1 (Quang Anh): chi tiết mã + biểu đồ min/max/close
    ├── benchmark/           # Lead (Bảo): HOÀN THÀNH — đối chiếu 2 thuật toán
    └── portfolio/           # FE2 (Mạnh): danh mục/giao dịch/cảnh báo (placeholder + 6 TODO)
```

## Ai làm gì (map với issue)

| Trang | Người | Trạng thái |
| --- | --- | --- |
| `BoardPage` | FE1 — Quang Anh | Khung chạy được + 4 TODO trong file (highlight trần/sàn, sort, tối ưu render, toast alert) |
| `StockDetailPage` | FE1 — Quang Anh | Khung sẵn — tự "sáng" khi Backend 1 (Nguyệt) xong API snapshots |
| `BenchmarkPage` | Lead — Bảo | Hoàn thành (controls + 2 biểu đồ + bảng lịch sử) |
| `PortfolioPage` + auth | FE2 — Mạnh | Placeholder + 6 TODO trong file |

## Quy tắc bắt buộc

- Field/payload **theo CONTRACT.md**, không tự đoán — REST và WS đã được code sẵn theo contract.
- WS: luôn qua `services/ws.js` (có tự reconnect), không tạo `new WebSocket` riêng lẻ.
- Sửa mỗi trang trong nhánh issue của mình, không đụng `Layout`/`services` khi chưa thống nhất.
