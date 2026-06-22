export function Sparkline({ points, color, width = 64, height = 20 }: { points: number[]; color: string; width?: number; height?: number }) {
  if (points.length === 0) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const coords = points
    .map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(' ');

  return (
    <svg className="spark" width={width} height={height}>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
