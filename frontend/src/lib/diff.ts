export type DiffOp = { type: "equal" | "add" | "remove"; text: string };

const MAX_LINES_FOR_EXACT_DIFF = 2000;

/** Line-level diff via a classic LCS dynamic program. Falls back to a coarse
 * "everything changed" result for pathologically large inputs to avoid O(n*m) blowup. */
export function diffLines(a: string, b: string): DiffOp[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const n = aLines.length;
  const m = bLines.length;

  if (n > MAX_LINES_FOR_EXACT_DIFF || m > MAX_LINES_FOR_EXACT_DIFF) {
    const ops: DiffOp[] = [];
    for (const line of aLines) ops.push({ type: "remove", text: line });
    for (const line of bLines) ops.push({ type: "add", text: line });
    return ops;
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      ops.push({ type: "equal", text: aLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "remove", text: aLines[i] });
      i++;
    } else {
      ops.push({ type: "add", text: bLines[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "remove", text: aLines[i] });
    i++;
  }
  while (j < m) {
    ops.push({ type: "add", text: bLines[j] });
    j++;
  }
  return ops;
}
