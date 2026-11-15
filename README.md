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

- Frontend: React + Vite
- Backend: Node.js + Express

## Cấu trúc project

## Cấu trúc dự án

```text
TradeShark/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── .gitignore
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
