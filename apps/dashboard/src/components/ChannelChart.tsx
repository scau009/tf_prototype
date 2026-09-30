import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Metrics } from '../data'

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
} as const

/** 渠道分布柱状图（Recharts 实现） */
export function ChannelChart({ metrics }: { metrics: Metrics }) {
  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={metrics.channels} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="channel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            dy={6}
            interval={0}
          />
          <YAxis hide />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
          <Bar dataKey="value" name="访问量" fill="var(--chart-1)" radius={[6, 6, 2, 2]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
