import { useId, type ReactNode } from 'react'

// Gráficos em SVG puro: leves, acessíveis (role="img" + tabela de dados).

function DataTable({ head, rows }: { head: [string, string]; rows: [string, string | number][] }) {
  return (
    <details className="data-table">
      <summary>Ver dados em tabela</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{head[0]}</th>
              <th>{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b]) => (
              <tr key={a}>
                <td>{a}</td>
                <td className="tabular">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Anel de progresso de 270°, inspirado em instrumentos de painel. */
export function Gauge({ value, label, children }: { value: number; label: string; children?: ReactNode }) {
  const id = useId().replace(/:/g, '')
  const size = 300
  const c = size / 2
  const r = 116
  const start = 135
  const sweep = 270
  const v = Math.max(0, Math.min(100, value))
  const polar = (ang: number, rad: number) => {
    const a = ((ang - 90) * Math.PI) / 180
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)]
  }
  const arc = (from: number, to: number, rad: number) => {
    const [x1, y1] = polar(from + 90, rad)
    const [x2, y2] = polar(to + 90, rad)
    const large = to - from > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${rad} ${rad} 0 ${large} 1 ${x2} ${y2}`
  }
  const end = start + (sweep * v) / 100
  const ticks = Array.from({ length: 28 }, (_, i) => start + (sweep * i) / 27)
  return (
    <div className="gauge-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="65%" stopColor="var(--accent-2)" />
            <stop offset="100%" stopColor="var(--cyan)" />
          </linearGradient>
          <filter id={`f${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <circle cx={c} cy={c} r={142} fill="none" stroke="var(--border)" />
        {ticks.map((t, i) => {
          const [x1, y1] = polar(t + 90, 136)
          const [x2, y2] = polar(t + 90, i % 3 === 0 ? 128 : 131)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-3)" strokeOpacity={t <= end ? 0.9 : 0.35} strokeWidth={1.2} />
        })}
        <path d={arc(start, start + sweep, r)} fill="none" stroke="var(--surface-3)" strokeWidth={20} strokeLinecap="round" />
        {v > 0 && (
          <>
            <path d={arc(start, end, r)} fill="none" stroke={`url(#g${id})`} strokeWidth={20} strokeLinecap="round" filter={`url(#f${id})`} opacity={0.55} />
            <path d={arc(start, end, r)} fill="none" stroke={`url(#g${id})`} strokeWidth={20} strokeLinecap="round" />
          </>
        )}
        <circle cx={c} cy={c} r={96} fill="none" stroke="var(--border)" />
      </svg>
      <div className="gauge-center">{children}</div>
    </div>
  )
}

export function AreaChart({ data, label, unit, color = 'var(--accent)' }: { data: { x: string; y: number }[]; label: string; unit: string; color?: string }) {
  const id = useId().replace(/:/g, '')
  const W = 360
  const H = 170
  const pl = 30
  const pb = 22
  const pt = 10
  const max = Math.max(1, ...data.map((d) => d.y))
  const nice = max <= 2 ? 2 : max <= 5 ? 5 : Math.ceil(max / 5) * 5
  const x = (i: number) => pl + (i * (W - pl - 8)) / Math.max(1, data.length - 1)
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / nice)
  const pts = data.map((d, i) => [x(i), y(d.y)] as const)
  const line = pts.reduce((acc, [px, py], i) => {
    if (i === 0) return `M ${px} ${py}`
    const [qx, qy] = pts[i - 1]
    const mx = (qx + px) / 2
    return `${acc} C ${mx} ${qy}, ${mx} ${py}, ${px} ${py}`
  }, '')
  const area = `${line} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. ${data.map((d) => `${d.x}: ${d.y} ${unit}`).join('; ')}`}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="grid-line" x1={pl} x2={W - 4} y1={y(nice * f)} y2={y(nice * f)} />
            <text className="axis" x={pl - 6} y={y(nice * f) + 3} textAnchor="end">
              {Math.round(nice * f * 10) / 10}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.x} className="axis" x={x(i)} y={H - 4} textAnchor="middle">
            {d.x}
          </text>
        ))}
        <path d={area} fill={`url(#a${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        {pts.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={data[i].y > 0 ? 3.6 : 2.2} fill="var(--surface)" stroke={color} strokeWidth={2}>
            <title>{`${data[i].x}: ${data[i].y} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <DataTable head={['Período', unit]} rows={data.map((d) => [d.x, d.y])} />
    </div>
  )
}

export function Radar({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const id = useId().replace(/:/g, '')
  const S = 300
  const c = S / 2
  const R = 92
  const n = data.length
  const pt = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [c + R * f * Math.cos(a), c + R * f * Math.sin(a)] as const
  }
  const poly = (f: (i: number) => number) => data.map((_, i) => pt(i, f(i)).join(',')).join(' ')
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${S} ${S - 30}`} role="img" aria-label={`${label}. ${data.map((d) => `${d.label}: ${d.value}%`).join('; ')}`} style={{ maxWidth: 360, margin: '0 auto' }}>
        <defs>
          <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <g transform="translate(0,-14)">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon key={f} points={poly(() => f)} fill="none" stroke="var(--border-strong)" strokeOpacity={f === 1 ? 1 : 0.6} />
          ))}
          {data.map((_, i) => {
            const [x, y] = pt(i, 1)
            return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--border)" />
          })}
          <polygon points={poly((i) => Math.max(0.04, data[i].value / 100))} fill={`url(#r${id})`} stroke="var(--cyan)" strokeWidth={1.6} strokeLinejoin="round" />
          {data.map((d, i) => {
            const [x, y] = pt(i, Math.max(0.04, d.value / 100))
            return <circle key={i} cx={x} cy={y} r={3.4} fill={i % 2 ? 'var(--accent-2)' : 'var(--cyan)'} />
          })}
          {data.map((d, i) => {
            const [x, y] = pt(i, 1.28)
            return (
              <text key={d.label} x={x} y={y} className="axis" textAnchor={Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end'} dominantBaseline="middle" style={{ fontFamily: 'var(--font)', fontSize: 10.5 }}>
                {d.label}
                <tspan fill="var(--text)" dx={4}>
                  {d.value}%
                </tspan>
              </text>
            )
          })}
        </g>
      </svg>
      <DataTable head={['Categoria', '% estimado']} rows={data.map((d) => [d.label, `${d.value}%`])} />
    </div>
  )
}

export function Sparkline({ values, color = 'var(--accent)', label }: { values: number[]; color?: string; label: string }) {
  const id = useId().replace(/:/g, '')
  const W = 140
  const H = 34
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => [(i * W) / Math.max(1, values.length - 1), H - 3 - (v / max) * (H - 8)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${W} ${H} L 0 ${H} Z`} fill={`url(#s${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />}
    </svg>
  )
}

export function Bars({ data, label, unit, color = 'var(--accent)' }: { data: { x: string; y: number }[]; label: string; unit: string; color?: string }) {
  const W = 420
  const H = 170
  const pb = 22
  const max = Math.max(1, ...data.map((d) => d.y))
  const bw = (W - 10) / data.length
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. ${data.map((d) => `${d.x}: ${d.y} ${unit}`).join('; ')}`}>
        <line className="grid-line" x1={0} x2={W} y1={H - pb} y2={H - pb} />
        {data.map((d, i) => {
          const h = ((H - pb - 16) * d.y) / max
          return (
            <g key={d.x}>
              <rect x={5 + i * bw + bw * 0.18} y={H - pb - h} width={bw * 0.64} height={Math.max(h, 1)} rx={5} fill={color} opacity={d.y ? 0.9 : 0.25}>
                <title>{`${d.x}: ${d.y} ${unit}`}</title>
              </rect>
              {d.y > 0 && (
                <text className="axis" x={5 + i * bw + bw / 2} y={H - pb - h - 4} textAnchor="middle" fill="var(--text-2)">
                  {d.y}
                </text>
              )}
              <text className="axis" x={5 + i * bw + bw / 2} y={H - 6} textAnchor="middle">
                {d.x}
              </text>
            </g>
          )
        })}
      </svg>
      <DataTable head={['Período', unit]} rows={data.map((d) => [d.x, d.y])} />
    </div>
  )
}
