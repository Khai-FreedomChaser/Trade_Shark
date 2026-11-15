/**
 * 2 thuật toán tìm đồng thời Min & Max trên mảng giá.
 *
 * Cả hai đều đếm PHÉP SO SÁNH (comparisonCount) — số liệu trung tâm của đề tài:
 *   - Duyệt tuần tự:  2(n-1) phép so sánh  (mỗi phần tử so với min rồi so với max)
 *   - Ghép cặp:       ~3n/2 - 2 phép so sánh (so trong cặp 1 lần, rồi so nhỏ với min,
 *                     lớn với max) — tiết kiệm ~25% phép so sánh.
 */

function findMinMaxSequential(arr) {
  if (arr.length === 0) return { min: null, max: null, comparisons: 0 };

  let min = arr[0];
  let max = arr[0];
  let comparisons = 0;

  for (let i = 1; i < arr.length; i++) {
    const value = arr[i];

    comparisons++;
    if (value < min) {
      min = value;
    }

    comparisons++;
    if (value > max) {
      max = value;
    }
  }

  return { min, max, comparisons };
}

function findMinMaxPairwise(arr) {
  if (arr.length === 0) return { min: null, max: null, comparisons: 0 };

  let min;
  let max;
  let comparisons = 0;
  let i;

  if (arr.length % 2 === 0) {
    comparisons++;
    if (arr[0] < arr[1]) {
      min = arr[0];
      max = arr[1];
    } else {
      min = arr[1];
      max = arr[0];
    }
    i = 2;
  } else {
    min = arr[0];
    max = arr[0];
    i = 1;
  }

  for (; i < arr.length; i += 2) {
    const a = arr[i];
    const b = arr[i + 1];

    comparisons++;
    let smaller;
    let larger;
    if (a < b) {
      smaller = a;
      larger = b;
    } else {
      smaller = b;
      larger = a;
    }

    comparisons++;
    if (smaller < min) {
      min = smaller;
    }

    comparisons++;
    if (larger > max) {
      max = larger;
    }
  }

  return { min, max, comparisons };
}

module.exports = { findMinMaxSequential, findMinMaxPairwise };
