import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Metrics } from '../data'

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(23, 34, 59, 0.08)',
} as const

/** 访问趋势面积图（Recharts 实现） */
export function TrendChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.series.map((value, i) => ({
    day: metrics.seriesLabels[i],
    pv: value,
  }))
  const ticks = data.filter((_, i) => i % Math.max(1, Math.ceil(data.length / 6)) === 0)

  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            ticks={ticks.map((t) => t.day)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            dy={6}
          />
          <YAxis hide />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
          <Area
            type="monotone"
            dataKey="pv"
            name="PV"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#pvFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
