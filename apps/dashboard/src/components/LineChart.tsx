export interface LineChartProps {
  data: number[]
  labels: string[]
  height?: number
}

/** 纯 SVG 折线图（不引入图表库，原型够用） */
export function LineChart({ data, labels, height = 210 }: LineChartProps) {
  const W = 720
  const H = height
  const padX = 6
  const padTop = 14
  const padBottom = 10

  const n = data.length
  const max = Math.max(...data, 1) * 1.08
  const x = (i: number) => padX + (i / Math.max(n - 1, 1)) * (W - padX * 2)
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom)

  const points = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)},${H - padBottom} L ${x(0).toFixed(1)},${H - padBottom} Z`

  const gridLines = [0.25, 0.5, 0.75].map((t) => padTop + t * (H - padTop - padBottom))
  const tickEvery = Math.max(1, Math.ceil(n / 6))
  const ticks = labels.filter((_, i) => i % tickEvery === 0 || i === n - 1)

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="访问趋势折线图">
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b6ef6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b6ef6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((gy) => (
          <line
            key={gy}
            x1="0"
            x2={W}
            y1={gy}
            y2={gy}
            stroke="#e6ebf4"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={areaPath} fill="url(#line-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="#3b6ef6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="line-chart__labels">
        {ticks.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}
