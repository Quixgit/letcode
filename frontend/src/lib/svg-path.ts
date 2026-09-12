/** Catmull-Rom-to-Bezier smoothing: turns a polyline of points into a smooth SVG path `d`. */
export function smoothLinePath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Maps a series of 0-100 values onto an evenly spaced x axis of the given width/height, with a top/bottom margin. */
export function toChartCoords(values: number[], width = 100, height = 50, margin = 4): [number, number][] {
  if (values.length === 0) return [];
  const usable = height - margin * 2;
  return values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : (i * width) / (values.length - 1);
    const y = height - margin - (Math.max(0, Math.min(100, v)) / 100) * usable;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  });
}
