import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { api } from "../../services/api";
import "./benchmark.css";

/**
 * MODULE BENCHMARK — Trang biểu đồ đối chiếu thực nghiệm (phần việc của Lead).
 *
 * Luồng: chọn size/pattern/runs -> POST /api/benchmark/run -> nhận kết quả
 * (số phép so sánh + thời gian CPU của 2 thuật toán) -> vẽ biểu đồ + lưu lịch sử.
 *
 * Câu chuyện thuyết trình:
 *   - Duyệt tuần tự:  2(n-1) phép so sánh
 *   - Ghép cặp:       3n/2 - 2 phép so sánh (~25% ít hơn)
 *   Kết quả thực nghiệm lưu trong benchmark_logs, biểu đồ dưới đây chính là
 *   "minh chứng" cho luận điểm hiệu năng của đề tài.
 */
const SIZES = [10_000, 50_000, 100_000, 500_000, 1_000_000, 2_000_000];
const PATTERNS = ["random", "sorted", "reversed", "few-unique", "nearly-sorted"];

export default function BenchmarkPage() {
  const [size, setSize] = useState(100_000);
  const [pattern, setPattern] = useState("random");
  const [runs, setRuns] = useState(3);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [latest, setLatest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [live, setLive] = useState(null);

  // Lịch sử thực nghiệm cũ (đã lưu trong DB) — vẽ được ngay khi mở trang
  useEffect(() => {
    api
      .benchmarkLogs(50)
      .then((res) => setLogs(res.data || []))
      .catch(() => {});
  }, []);

  // Minh chứng thực nghiệm của CHÍNH hệ thống đang chạy: số phép so sánh mà
  // snapshot-writer tiết kiệm nhờ ghép cặp + cache cảnh báo (GET /api/market/stats)
  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .marketStats()
        .then((data) => { if (!cancelled) setLive(data); })
        .catch(() => { if (!cancelled) setLive(null); });
    }

    load();
    const timer = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  async function runBenchmark() {
    setRunning(true);
    setError(null);
    try {
      const result = await api.benchmarkRun({ size, pattern, runs });
      setLatest(result);
      // Làm mới lịch sử để bảng luôn đồng bộ với DB
      const res = await api.benchmarkLogs(50);
      setLogs(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  // Dữ liệu biểu đồ so sánh 2 thuật toán cho 1 bản ghi
  function toChartData(log) {
    return [
      {
        name: "Duyệt tuần tự",
        comparisons: Number(log.seqComparisions),
        timeMs: Number(log.seqTimeMs)
      },
      {
        name: "Ghép cặp",
        comparisons: Number(log.pairComparisions),
        timeMs: Number(log.pairTimeMs)
      }
    ];
  }

  return (
    <div>
      <h1>Benchmark — Duyệt tuần tự vs Ghép cặp</h1>

      <div className="bench-controls">
        <label>
          Kích thước dữ liệu
          <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s.toLocaleString("vi-VN")} phần tử</option>
            ))}
          </select>
        </label>

        <label>
          Mẫu dữ liệu
          <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
            {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label>
          Số lần chạy
          <select value={runs} onChange={(e) => setRuns(Number(e.target.value))}>
            {[1, 2, 3, 5, 10].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <button onClick={runBenchmark} disabled={running}>
          {running ? "Đang chạy…" : "▶ Chạy benchmark"}
        </button>
      </div>

      {error && <p className="bench-error">Lỗi: {error}</p>}

      {latest && (
        <div className="bench-result">
          <h2>
            Kết quả mới nhất — {latest.datasetSize.toLocaleString("vi-VN")} phần tử,
            mẫu "{latest.dataPattern}"
            <span className="bench-saving">
              Tiết kiệm {latest.detail?.comparisonSavingPercent ?? "—"}% phép so sánh
            </span>
          </h2>

          <div className="bench-charts">
            <div className="bench-chart">
              <h3>Số phép so sánh (ít hơn = tốt hơn)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={toChartData(latest)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#8b98a5", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#8b98a5", fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("vi-VN")} />
                  <Tooltip formatter={(v) => v.toLocaleString("vi-VN")} />
                  <Bar dataKey="comparisons" name="Phép so sánh" fill="#4cc2ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bench-chart">
              <h3>Thời gian chạy trung bình (ms, nhanh hơn = tốt hơn)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={toChartData(latest)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#8b98a5", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#8b98a5", fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(4)} ms`} />
                  <Bar dataKey="timeMs" name="Thời gian (ms)" fill="#d29922" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="bench-note">
            Lý thuyết: tuần tự = 2(n−1) = {latest.detail ? (2 * (latest.datasetSize - 1)).toLocaleString("vi-VN") : "—"} phép so ·
            ghép cặp = 3n/2 − 2 = {latest.detail ? (1.5 * latest.datasetSize - 2).toLocaleString("vi-VN") : "—"} phép so.
          </p>
          <p className="bench-note">
            Nhanh nhất trong {latest.detail?.runs ?? "?"} lượt: tuần tự {latest.detail?.seqBestTimeMs ?? "—"} ms ·
            ghép cặp {latest.detail?.pairBestTimeMs ?? "—"} ms. Số phép so sánh không đổi giữa các lượt và giữa các máy;
            thời gian đo bằng đồng hồ đơn điệu (không phải CPU time) nên phụ thuộc máy, JIT và mẫu dữ liệu.
          </p>
        </div>
      )}

      {live && (
        <div className="bench-history">
          <h2>Số liệu từ hệ thống đang chạy (đo thật, không phải dữ liệu sinh để đo)</h2>
          <p className="bench-note">
            Snapshot-writer gom giá của mỗi cửa sổ rồi tìm đồng thời Min–Max bằng <strong>kỹ thuật ghép cặp</strong> thay
            cho việc so sánh từng tick với min/max. Bảng dưới là số liệu tích luỹ kể từ lúc backend khởi động.
          </p>
          <table className="bench-table">
            <thead>
              <tr>
                <th>Chỉ số</th>
                <th className="right">Giá trị</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Mã cổ phiếu trong RAM</td><td className="right">{live.symbols.toLocaleString("vi-VN")}</td><td>đang được theo dõi realtime</td></tr>
              <tr><td>Cửa sổ snapshot đã gộp</td><td className="right">{live.windowAggregation.windows.toLocaleString("vi-VN")}</td><td>mỗi {Math.round(live.windowAggregation.intervalMs / 1000)}s một cửa sổ</td></tr>
              <tr><td>Dòng snapshot đã ghi</td><td className="right">{live.windowAggregation.rows.toLocaleString("vi-VN")}</td><td>{live.windowAggregation.ticks.toLocaleString("vi-VN")} giá đã gộp</td></tr>
              <tr>
                <td>Phép so sánh nếu duyệt tuần tự (2(n−1))</td>
                <td className="right">{live.windowAggregation.sequentialComparisons.toLocaleString("vi-VN")}</td>
                <td>cách cũ, so từng tick với min rồi với max</td>
              </tr>
              <tr>
                <td>Phép so sánh thực tế khi ghép cặp</td>
                <td className="right">{live.windowAggregation.pairwiseComparisons.toLocaleString("vi-VN")}</td>
                <td>đếm trực tiếp trong lúc chạy</td>
              </tr>
              <tr>
                <td>Tiết kiệm</td>
                <td className="right">{live.windowAggregation.savedComparisons.toLocaleString("vi-VN")} ({live.windowAggregation.savedPercent}%)</td>
                <td>cùng dữ liệu, cùng kết quả Min–Max</td>
              </tr>
              <tr>
                <td>Tự kiểm chứng 2 thuật toán</td>
                <td className="right">{live.windowAggregation.mismatches === 0 ? "0 lệch" : `${live.windowAggregation.mismatches} lệch`}</td>
                <td>{live.windowAggregation.selfCheck ? "đang chạy thuật toán tuần tự song song để so kết quả" : "bật MINMAX_SELFCHECK=true để chạy song song"}</td>
              </tr>
              <tr>
                <td>Cập nhật đáy/đỉnh phiên mỗi tick</td>
                <td className="right">{live.streamUpdate.comparisonsPerTick} phép/tick</td>
                <td>chặn dưới khi chỉ có 1 giá trị mới (không quét mảng)</td>
              </tr>
              <tr>
                <td>Cache cảnh báo trong RAM</td>
                <td className="right">{live.alertCache.cachedAlerts.toLocaleString("vi-VN")} cảnh báo</td>
                <td>{live.alertCache.dbReads} lần đọc DB · {live.alertCache.ticksChecked.toLocaleString("vi-VN")} tick đã dò trong RAM</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="bench-history">
        <h2>Lịch sử thực nghiệm (benchmark_logs)</h2>
        {logs.length === 0 ? (
          <p className="bench-empty">Chưa có dữ liệu — bấm "Chạy benchmark" để tạo lượt thực nghiệm đầu tiên.</p>
        ) : (
          <table className="bench-table">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th className="right">Kích thước</th>
                <th>Mẫu</th>
                <th className="right">Tuần tự (so sánh)</th>
                <th className="right">Ghép cặp (so sánh)</th>
                <th className="right">Tuần tự (ms)</th>
                <th className="right">Ghép cặp (ms)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setLatest(log)} title="Bấm để xem biểu đồ của lượt này">
                  <td>{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="right">{log.datasetSize.toLocaleString("vi-VN")}</td>
                  <td>{log.dataPattern}</td>
                  <td className="right">{Number(log.seqComparisions).toLocaleString("vi-VN")}</td>
                  <td className="right">{Number(log.pairComparisions).toLocaleString("vi-VN")}</td>
                  <td className="right">{Number(log.seqTimeMs).toFixed(4)}</td>
                  <td className="right">{Number(log.pairTimeMs).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
