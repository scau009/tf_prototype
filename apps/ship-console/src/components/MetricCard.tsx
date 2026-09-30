import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@tf/ui'
import { cn } from '@tf/utils'

export interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  /** 较上一周期的变化（%），不传则不显示涨跌行 */
  delta?: number
  /** true 时上升视为「差」（如异常节点数），显示为红色 */
  invert?: boolean
}

/** 可视化模块的指标卡 */
export function MetricCard({ label, value, icon: Icon, delta, invert = false }: MetricCardProps) {
  const hasDelta = typeof delta === 'number'
  const up = hasDelta && delta >= 0
  const good = invert ? !up : up

  return (
    <Card className="gap-2 py-4 shadow-xs">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 shrink-0 text-primary/70" />
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {hasDelta ? (
          <p className={cn('mt-1.5 text-xs font-semibold', good ? 'text-emerald-600' : 'text-red-600')}>
            {up ? '▲' : '▼'} {Math.abs(delta)}%
            <span className="ml-1 font-normal text-muted-foreground">较上一周期</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
