import { Card, CardContent, CardHeader, CardTitle } from '@tf/ui'
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
    <Card className="gap-2.5 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className={cn('mt-1.5 text-xs font-semibold', good ? 'text-emerald-600' : 'text-red-600')}>
          {up ? '▲' : '▼'} {Math.abs(delta)}%
          <span className="ml-1 font-normal text-muted-foreground">较上一周期</span>
        </p>
      </CardContent>
    </Card>
  )
}
