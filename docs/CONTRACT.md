# 📡 API & WebSocket CONTRACT — v1 (CHỐT CỨNG)

> Tài liệu này là "hợp đồng" giữa 2 Backend và 2 Frontend. Ai muốn thêm/sửa
> endpoint hay frame phải cập nhật file này TRƯỚC khi code, để cả nhóm cùng
> nhìn 1 chuẩn duy nhất.

## 1. Tổng quan kết nối

| Thành phần | Địa chỉ |
| --- | --- |
| REST API | `http://localhost:3636/api/...` |
| WebSocket | `ws://localhost:3636/ws` |
| Frontend (Vite) | `http://localhost:5173` |
| MySQL (Docker) | `127.0.0.1:3306`, DB `tradshark` |

## 2. Quy ước chung REST

- Body/request JSON, response JSON.
- **Shape lỗi thống nhất:**
  ```json
  { "message": "Mô tả lỗi tiếng Việt", "error": "chi tiết kỹ thuật" }
  ```
- Thành công tạo mới → `201`; đọc → `200`; lỗi nghiệp vụ → `400`; thiếu quyền → `401`.
- **Auth:** header `Authorization: Bearer <accessToken>` (Backend 2 phát hành JWT sau khi đăng nhập). Các endpoint chưa auth hiện tại vẫn mở — Backend 2 sẽ gắn middleware sau, FE cứ gửi header từ đầu.

## 3. REST Endpoints

### 3.1 Market — trạng thái RAM (`routes/market`) — *BE1 (Nguyệt)*
| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/api/market/state` | Toàn bộ trạng thái hiện tại (bootstrap bảng điện) → `{ count, data: [TickPayload...] }` |
| GET | `/api/market/state/:symbol` | Trạng thái 1 mã, 404 nếu không có |
| GET | `/api/market/stats` | **Minh chứng thực nghiệm runtime:** số mã trong RAM, thống kê gộp cửa sổ snapshot (`windowAggregation`: số cửa sổ/dòng/giá, phép so sánh tuần tự vs ghép cặp, % tiết kiệm, self-check), cache cảnh báo (`alertCache`: số lần đọc DB, tick đã dò) |

### 3.2 Stock — master data DB (`routes/stock`) — *BE1 (Nguyệt)*
| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/api/stock` | Danh sách mã (đã có) |
| GET | `/api/stock/:id` | Chi tiết 1 mã (đã có) |
| GET | `/api/stock/:id/snapshots` | **Cần viết:** chuỗi snapshot cho biểu đồ, query `?limit=100&from=<ISO>&to=<ISO>`, sort `createdAt ASC` → `{ count, data: [{ id, stockId, minPrice, maxPrice, closePrice, createdAt }] }` |
| GET | `/api/stock/:id/range` | Đáy/Đỉnh cả phiên tính từ **chuỗi snapshot đã lưu** (áp dụng thuật toán Min–Max ghép cặp trên dữ liệu thật), query `?from=<ISO>&to=<ISO>` → `{ symbol, count, low: { value, comparisons: { sequential, pairwise } }, high: {...}, totalComparisons: { sequential, pairwise, saved, savedPercent } }` |
| POST/PUT/DELETE | `/api/stock` | CRUD admin (đã có) |

> Lưu ý: `Stock` nhận diện bằng `id` (varchar 20), không phải `symbol`.

### 3.3 Benchmark (`routes/benchmark`) — *Fullstack*
| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/benchmark/run` | Body `{ "size": 100000, "pattern": "random", "runs": 3 }` → `201` + log + `detail` |
| GET | `/api/benchmark/logs?limit=50` | Lịch sử benchmark → `{ count, data: [BenchmarkLog...] }` |

`pattern ∈ ["random", "sorted", "reversed", "few-unique", "nearly-sorted"]`;
`size ∈ [10, 2.000.000]`; `runs ∈ [1, 10]`.

Response `POST /run` (case khớp cột `benchmark_logs`):
```json
{
  "id": "BM_xxx", "datasetSize": 100000, "dataPattern": "random",
  "seqComparisions": 199998, "pairComparisions": 149998,
  "seqTimeMs": "12.3456", "pairTimeMs": "9.1234", "createdAt": "...",
  "detail": { "runs": 3, "comparisonSavingPercent": 25.0, ... }
}
```

### 3.4 User & Giao dịch (`routes/user`) — *BE2 (Khải)* (chưa viết)
Đề xuất (chốt lại nếu muốn đổi):
| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/user/register` | `{ email, password, userName, dateOfBirth? }` → `{ user, accessToken, refreshToken }` |
| POST | `/api/user/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| POST | `/api/user/refresh` | `{ refreshToken }` → accessToken mới |
| GET | `/api/user/me` | Thông tin + số dư (Bearer) |
| POST | `/api/user/balance/deposit` | `{ amount }` → ghi `BalanceHistory(type=deposit)` |
| POST | `/api/user/balance/withdraw` | `{ amount }` → kiểm tra đủ số dư |
| POST | `/api/user/trade/buy` | `{ symbol, quantity }` → giá = giá RAM hiện tại; trừ balance, cập nhật `StockUser` |
| POST | `/api/user/trade/sell` | `{ symbol, quantity }` → cộng balance |
| GET | `/api/user/portfolio` | Danh mục `StockUser` + lãi/lỗ tạm tính so với giá RAM |
| GET | `/api/user/balance-history` | Lịch sử số dư |
| GET/POST/DELETE | `/api/user/alerts` | Quản lý ngưỡng `StockAlert` `{ stockId hoặc symbol, alertMin?, alertMax? }` |

## 4. WebSocket Protocol (frame JSON)

### Server → Client
```jsonc
// 1. Ngay khi kết nối
{ "type": "hello", "data": { "clients": 3, "broadcastIntervalMs": 500 } }

// 2. Trạng thái đầy đủ (bootstrap bảng điện)
{ "type": "snapshot", "data": [TickPayload...] }

// 3. Luồng tick theo LÔ mỗi 500ms — chỉ các mã THAY ĐỔI
{ "type": "ticks", "data": [TickPayload...] }

// 4. Sự kiện chạm ngưỡng (Backend 2 bắn qua ws.broadcastAlert)
{ "type": "alert", "data": { "userId": "...", "symbol": "VCB",
  "price": 92500, "kind": "max", "message": "VCB vượt ngưỡng trên 92.000", "timestamp": 1731... } }
```

### TickPayload (schema chốt cứng)
```jsonc
{
  "symbol": "VCB",     // string
  "price": 92500,      // number, bước 100 VND
  "high": 93800,       // đỉnh phiên (tích lũy trong RAM)
  "low": 91100,        // đáy phiên
  "refPrice": 92000,   // giá tham chiếu đầu phiên
  "ceiling": 98440,    // trần = refPrice * 1.07 (2 chữ số)
  "floor": 85560,      // sàn = refPrice * 0.93
  "timestamp": 1731699600123  // epoch ms
}
```

Quy ước tô màu bảng điện: `price > refPrice` xanh, `price < refPrice` đỏ, `==` vàng. Trần/sàn tính từ `refPrice`, KHÔNG lưu DB.

### Client → Server
```jsonc
{ "type": "subscribe",   "symbols": ["VCB", "FPT"] }  // rỗng = nhận tất cả
{ "type": "unsubscribe", "symbols": [] }               // trở lại nhận tất cả
{ "type": "ping" }  →  server trả { "type": "pong" }
```

## 5. Kiến trúc luồng dữ liệu (ai nối vào đâu)

```
Simulator (BE1, random walk)
      │  gọi marketState.tick(symbol, price)
      ▼
marketState (RAM, service/market/market-state.js)  ← NGUỒN SỰ THẬT CỦA PHIÊN
      │  emit "tick"
      ├──▶ ws/index.js ──batch 500ms──▶ {type:"ticks"} → Bảng điện (FE1)
      ├──▶ alert listener (BE2) ──đọc cảnh báo từ RAM──▶ ws.broadcastAlert() → FE2  (Toast)
      └──▶ snapshot-writer ──gom giá 60s + GHÉP CẶP Min–Max──▶ DB.stock_snapshots → Biểu đồ mã (FE1)
                                                                └──▶ GET /api/stock/:id/range (đáy/đỉnh đã lưu)
```

- **Áp dụng thuật toán:** thay vì 2 phép so sánh mỗi tick, `snapshot-writer` gom các giá
  của cửa sổ rồi tìm đồng thời Min–Max bằng **ghép cặp** (`service/benchmark/algorithms.js`),
  tức `3n/2 − 2` (n chẵn) hoặc `3(n−1)/2` (n lẻ) ~ **giảm 25% phép so sánh** cho cùng công việc báo cáo.
- Số liệu đối chiếu của cả hai cách được đếm thật và phơi ra ở `GET /api/market/stats`.
- Đáy/đỉnh **phiên** hiển thị tức thời vẫn là cập nhật tăng dần 2 phép so sánh/tick
  (chặn dưới khi chỉ có 1 giá trị mới) — không phải quét mảng, nên không thay bằng ghép cặp được.

- **Không module nào tự ghi giá vào DB.** DB chỉ nhận snapshot theo lô + nghiệp vụ.
- Restart server: RAM được nạp lại từ `stocks` (refPrice) — dữ liệu snapshot cũ dùng để vẽ lịch sử, không phục hồi giá phiên.

## 6. Sở hữu bảng/endpoint (tránh đụng nhau)

| Bảng | Người ghi |
| --- | --- |
| `stocks` | Seed script (Bảo) — BE1 chỉ đọc |
| `stock_snapshots` | BE1 (Nguyệt) — snapshot-writer |
| `benchmark_logs` | Bảo (module benchmark) |
| `users`, `balance_history`, `stock_users`, `stock_alerts` | BE2 (Khải) |
| Frontend gọi REST + WS theo đúng contract này, không tự đoán field |

## 7. Cấu hình (.env — backend/.env)

`PORT=3636` · `SIM_ENABLED` · `TICK_INTERVAL_MS` · `TICK_RATIO` · `SIM_VOLATILITY` ·
`BROADCAST_INTERVAL_MS` · `SNAPSHOT_INTERVAL_MS` · `SEED_COUNT`
