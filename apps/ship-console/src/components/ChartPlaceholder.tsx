import type { LucideIcon } from 'lucide-react'
import { Badge } from '@tf/ui'

/**
 * 图表占位框：可视化模块在接入 Recharts 前先占位，
 * 标明规划中的图表类型与数据口径。
 */
export function ChartPlaceholder({
  title,
  desc,
  icon: Icon,
  chartType = '待接入 Recharts',
}: {
  title: string
  desc: string
  icon: LucideIcon
  chartType?: string
}) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
      <Badge variant="outline" className="text-[11px] text-muted-foreground">
        {chartType}
      </Badge>
    </div>
  )
}
