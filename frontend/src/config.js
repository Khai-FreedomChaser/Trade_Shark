// Cấu hình chung — đọc từ .env (prefix VITE_). Xem frontend/.env.example
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3636";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3636/ws";
export const FE2_USE_MOCK = import.meta.env.VITE_FE2_USE_MOCK !== "false";

// Định dạng giá kiểu bảng điện VN: 104.400
export function formatPrice(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("vi-VN");
}

// Màu theo quy ước contract: xanh tăng, đỏ giảm, vàng đứng giá so với refPrice
export function priceChangeClass(price, refPrice) {
  if (price > refPrice) return "up";
  if (price < refPrice) return "down";
  return "flat";
}
