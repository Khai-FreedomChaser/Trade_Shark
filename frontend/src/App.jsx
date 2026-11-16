import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import BoardPage from "./pages/board/BoardPage";
import StockDetailPage from "./pages/stock-detail/StockDetailPage";
import BenchmarkPage from "./pages/benchmark/BenchmarkPage";
import PortfolioPage from "./pages/portfolio/PortfolioPage";
import "./App.css";

/**
 * Router gốc. Phân chia trang theo issue:
 *   - BoardPage + StockDetailPage: FE 1
 *   - PortfolioPage (+ /login, /trade... FE2 tự thêm route vào đây): FE 2
 *   - BenchmarkPage: Lead (đã hoàn thành)
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* FE1-4: toast dùng chung cho frame WS "alert" — mount ở App (không sửa Layout) */}
      <Toast />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BoardPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
          <Route path="/benchmark" element={<BenchmarkPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
