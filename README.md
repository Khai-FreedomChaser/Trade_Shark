# Trade Shark

<div align="center">
  <h1>🦈 Trade Shark</h1>
  <p><i>Theo dõi "đáy - đỉnh" cổ phiếu bằng khoa học tối ưu dữ liệu, thay vì hệ tâm linh.</i></p>
</div>

---

Giữa đại dương mã chứng khoán khổng lồ, **Trade Shark** là bảng điều khiển (dashboard) giúp bạn bám sát biến động giá trong ngày với tốc độ và sự sắc bén của một sát thủ đại dương.

**Bí quyết dưới nắp capo?** Hệ thống tuyệt đối không ngốn tài nguyên mù quáng. Thay vì lối duyệt tuần tự cổ điển, lõi xử lý của Trade Shark áp dụng thuật toán tìm đồng thời Min-Max qua kỹ thuật ghép cặp. Sự tinh gọn mang tính học thuật này cắt giảm triệt để số lượng phép so sánh – mang lại hiệu năng xử lý dữ liệu vượt trội đã được minh chứng qua thực nghiệm.

Mọi luồng số liệu phức tạp sau đó được bọc gọn trong một giao diện trực quan, mượt mà. Trade Shark mang đến trải nghiệm theo dõi thị trường nhanh, chính xác và hoàn toàn không có một động tác thừa.
## Công nghệ sử dụng

- Frontend: React 19 + Vite + React Router + Recharts
- Backend: Node.js + Express + WebSocket (ws) + TypeORM + MySQL

## Cấu trúc dự án

```text
TradeShark/
├── docs/
│   └── CONTRACT.md        # API + WebSocket contract — NGUỒN SỰ THẬT của cả nhóm
│
├── backend/
│   ├── server.js          # entry: REST /api + WS /ws + simulator + snapshot writer
│   ├── routes/            # market | stock | user(~BE2) | benchmark
│   ├── controller/
│   ├── service/
│   │   ├── market/        # marketState (RAM) + simulator + snapshot-writer (~BE1)
│   │   ├── user/          # auth, trade, alerts (~BE2)
│   │   └── benchmark/     # 2 thuật toán min-max + đo CPU (~Bảo)
│   ├── ws/                # WS server: broadcast ticks + broadcastAlert (hook BE2)
│   ├── db/                # entities + migrations (TypeORM + MySQL)
│   ├── scripts/           # seed-stocks | db-reset | migration-generate
│   └── package.json
│
├── frontend/
│   ├── src/pages/         # BoardPage(FE1) | StockDetailPage(FE1) | BenchmarkPage(Bảo) | PortfolioPage(FE2)
│   ├── src/services/      # api.js + ws.js dùng chung — đừng tự tạo client riêng
│   └── package.json
│
└── README.md
```

## Cách chạy project

### 1. Database (Docker)

```bash
docker compose up -d mysql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # điền mật khẩu MySQL
npm run db:reset            # drop + migration + seed 3000 mã (1 lệnh duy nhất)
npm run dev
```

- REST API: `http://localhost:3636/api/...`
- WebSocket: `ws://localhost:3636/ws`
- Chi tiết endpoint & payload: **docs/CONTRACT.md**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Phân chia công việc

| Thành viên | Vai trò | Sở hữu chính | Nhánh |
| --- | --- | --- | --- |
| **Bảo** | Fullstack (Lead) | Kiến trúc, `docs/CONTRACT.md`, module Benchmark (BE+FE), review | `feat/benchmark` |
| **Nguyệt** | Backend 1 | `service/market` (simulator, snapshot-writer), `GET /api/stock/:id/snapshots`, luồng tick qua WS | `feat/simulator-ws` |
| **Khải** | Backend 2 | `routes/user` (auth, error, trade, alerts), alert listener: `marketState.onTick` → `ws.broadcastAlert` | `feat/user-trading` |
| **Quang Anh** | Frontend 1 | `BoardPage` (bảng điện real-time), `StockDetailPage` (biểu đồ mã) | `feat/ui-board` |
| **Mạnh** | Frontend 2 | `PortfolioPage` (danh mục, mua/bán), auth UI, cài ngưỡng + toast | `feat/ui-portfolio` |

**Quy tắc phối hợp:**
- Mỗi người làm trên nhánh của mình, checkout từ `main`.
- Payload/endpoint phải khớp `docs/CONTRACT.md` — muốn đổi gì thì sửa contract TRƯỚC rồi hẵng code.
- File của người khác chỉ đọc; cần sửa thì thống nhất trước. Chỗ cần hoàn thiện được đánh dấu sẵn bằng comment `// TODO: ... ~ <vai>` trong từng file.