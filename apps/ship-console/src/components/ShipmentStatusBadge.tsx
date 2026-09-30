import { Badge } from '@tf/ui'
import { cn } from '@tf/utils'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  LoaderIcon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react'
import type { NodeStatus, ShipmentStatus } from '../data'

/** 整票状态徽章配色 */
const SHIPMENT_STATUS_CLASS: Record<ShipmentStatus, string> = {
  进行中: 'border-sky-200 bg-sky-50 text-sky-700',
  异常: 'border-red-200 bg-red-50 text-red-700',
  已完成: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  已取消: 'border-slate-200 bg-slate-50 text-slate-600',
}

export function ShipmentStatusBadge({
  status,
  className,
}: {
  status: ShipmentStatus
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(SHIPMENT_STATUS_CLASS[status], className)}>
      {status}
    </Badge>
  )
}

/** 节点状态元数据：文案 + 圆点 / 标签 / 图标配色（时间轴与进度条共用） */
export const NODE_STATUS_META: Record<
  NodeStatus,
  { label: string; dot: string; tag: string; icon: LucideIcon }
> = {
  pending: {
    label: '未开始',
    dot: 'border-border bg-background',
    tag: 'border-border text-muted-foreground',
    icon: CircleDashedIcon,
  },
  active: {
    label: '进行中',
    dot: 'border-sky-500 bg-sky-500',
    tag: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: LoaderIcon,
  },
  done: {
    label: '已完成',
    dot: 'border-emerald-500 bg-emerald-500',
    tag: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2Icon,
  },
  warning: {
    label: '延误',
    dot: 'border-amber-500 bg-amber-500',
    tag: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: AlertTriangleIcon,
  },
  failed: {
    label: '失败',
    dot: 'border-red-500 bg-red-500',
    tag: 'border-red-200 bg-red-50 text-red-700',
    icon: XCircleIcon,
  },
}

/** 小号节点状态标签 */
export function NodeStatusTag({ status }: { status: NodeStatus }) {
  const meta = NODE_STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        meta.tag,
      )}
    >
      <Icon className={cn('size-3', status === 'active' && 'animate-spin')} />
      {meta.label}
    </span>
  )
}