# Trade Shark — Frontend

React 19 + Vite. Kết nối backend theo đúng `docs/CONTRACT.md` (thư mục gốc repo).

## Chạy

```bash
npm install
cp .env.example .env   # mặc định trỏ http://localhost:3636
npm run dev
```

Cần backend đang chạy (`npm run dev` trong thư mục `backend/`) — иначе mọi trang sẽ báo lỗi kết nối.

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
    ├── BoardPage.jsx        # FE1: bảng điện (khung chạy được, issue bên trong file)
    ├── StockDetailPage.jsx  # FE1: chi tiết mã + biểu đồ min/max/close
    ├── BenchmarkPage.jsx    # Lead: HOÀN THÀNH — benchmark đối chiếu 2 thuật toán
    └── PortfolioPage.jsx    # FE2: danh mục/giao dịch/cảnh báo (placeholder)
```

## Ai làm gì (map với issue)

| Trang | Người | Trạng thái |
| --- | --- | --- |
| `BoardPage` | FE1 | Khung chạy được + 4 TODO trong file (highlight trần/sàn, sort, tối ưu render, toast alert) |
| `StockDetailPage` | FE1 | Khung sẵn — tự "sáng" khi Backend 1 xong API snapshots |
| `BenchmarkPage` | Lead | ✅ Hoàn thành (controls + 2 biểu đồ + bảng lịch sử) |
| `PortfolioPage` + auth | FE2 | Placeholder + 6 TODO trong file |

## Quy tắc bắt buộc

- Field/payload **theo CONTRACT.md**, không tự đoán — REST và WS đã được code sẵn theo contract.
- WS: luôn qua `services/ws.js` (có tự reconnect), không tạo `new WebSocket` riêng lẻ.
- Sửa mỗi trang trong nhánh issue của mình, không đụng `Layout`/`services` khi chưa thống nhất.
