import { cn } from '@tf/utils'

export interface StatCardProps {
  label: string
  value: string
  /** 较上一周期的百分比变化 */
  delta: number
  /** true 时上升视为“差”（如错误数），显示为红色 */
  invert?: boolean
}

export function StatCard({ label, value, delta, invert = false }: StatCardProps) {
  const up = delta >= 0
  const good = invert ? !up : up
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      <p className={cn('stat__delta', good ? 'stat__delta--up' : 'stat__delta--down')}>
        {up ? '▲' : '▼'} {Math.abs(delta)}%
        <span> 较上一周期</span>
      </p>
    </div>
  )
}
