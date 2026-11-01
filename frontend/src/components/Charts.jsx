/** Small dependency-free SVG charts. */
export function AreaChart({ data, height = 180, w = 600, color = "var(--primary)" }) {
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, height - pad - (d.value / max) * (height - pad * 2)]);
  const smooth = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const prev = pts[i - 1], cx = (prev[0] + p[0]) / 2;
    return `C${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }).join(" ");
  const area = `${smooth} L${pts[pts.length - 1][0]},${height - pad} L${pts[0][0]},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="chart" role="img" aria-label="Line chart">
      {[0, 0.5, 1].map((f) => <line key={f} x1={pad} x2={w - pad} y1={height - pad - f * (height - pad * 2)} y2={height - pad - f * (height - pad * 2)} className="grid-line" />)}
      <path d={area} fill={color} opacity=".12" className="chart-area" />
      <path d={smooth} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" pathLength="1" className="chart-line" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--surface)" stroke={color} strokeWidth="2"><title>{data[i].label}: {data[i].value}</title></circle>)}
      {data.map((d, i) => <text key={i} x={pts[i][0]} y={height - 6} textAnchor="middle" className="axis">{d.label}</text>)}
    </svg>
  );
}

export function BarChart({ data, height = 180, w = 360 }) {
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="chart" role="img" aria-label="Bar chart">
      {[0, 0.5, 1].map((f) => <line key={f} x1={pad} x2={w - pad} y1={height - pad - f * (height - pad * 2)} y2={height - pad - f * (height - pad * 2)} className="grid-line" />)}
      {data.map((d, i) => {
        const h = (d.value / max) * (height - pad * 2);
        return (
          <g key={i}>
            <rect x={pad + i * bw + bw * 0.2} y={height - pad - h} width={bw * 0.6} height={Math.max(h, 1)} rx="4" fill="var(--primary)" opacity={i % 2 ? 0.55 : 0.9} className="chart-bar" style={{ "--i": i }}><title>{d.label}: {d.value}</title></rect>
            <text x={pad + i * bw + bw / 2} y={height - 6} textAnchor="middle" className="axis">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ parts, center }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Overview">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
      {parts.map((p) => {
        const len = (p.value / total) * c;
        const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" className="donut-part" />;
        offset += len;
        return el;
      })}
      <text x="70" y="76" textAnchor="middle" className="donut-text">{center}</text>
    </svg>
  );
}
