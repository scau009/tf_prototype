import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tf/ui'
import { cn } from '@tf/utils'
import { RadioIcon } from 'lucide-react'
import {
  type DcsaClassifier,
  type DcsaEvent,
  type DcsaEventType,
} from '../data'

/** DCSA 事件大类中文名 */
const TYPE_LABEL: Record<DcsaEventType, string> = {
  SHIPMENT: '船务信息',
  TRANSPORT: '运输',
  EQUIPMENT: '设备',
}

/** DCSA 事件大类配色 */
const TYPE_CLASS: Record<DcsaEventType, string> = {
  SHIPMENT: 'border-sky-200 bg-sky-50 text-sky-700',
  TRANSPORT: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  EQUIPMENT: 'border-teal-200 bg-teal-50 text-teal-700',
}

/** DCSA 时态中文说明 */
const CLASSIFIER_LABEL: Record<DcsaClassifier, string> = {
  ACT: '实际',
  EST: '预计',
  PLN: '计划',
}

const TYPE_FILTERS: Array<{ value: 'all' | DcsaEventType; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'SHIPMENT', label: '船务信息' },
  { value: 'TRANSPORT', label: '运输' },
  { value: 'EQUIPMENT', label: '设备' },
]

/**
 * DCSA 事件流水：船司按 DCSA 事件模型回传的事件记录（按事件时间倒序）。
 * 与「内部动态事件」区分：这里是标准化的船司回传数据，字段与事件码遵循 DCSA 规范。
 */
export function DcsaEventLog({ events }: { events: DcsaEvent[] }) {
  const [type, setType] = useState<'all' | DcsaEventType>('all')

  const filtered = useMemo(
    () => (type === 'all' ? events : events.filter((e) => e.eventType === type)),
    [events, type],
  )

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <RadioIcon className="size-7 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">暂无船司回传的 DCSA 事件</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md border p-0.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setType(f.value)}
              className={cn(
                'rounded-sm px-2 py-1 text-[11px] font-medium transition-colors',
                type === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          共 {events.length} 条 · 当前 {filtered.length} 条 · 按事件时间倒序
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-3">事件时间</TableHead>
              <TableHead className="h-9">事件</TableHead>
              <TableHead className="h-9">事件码</TableHead>
              <TableHead className="h-9">时态</TableHead>
              <TableHead className="h-9">箱号</TableHead>
              <TableHead className="h-9">船名 / 航次</TableHead>
              <TableHead className="h-9">地点</TableHead>
              <TableHead className="h-9 pr-3">回传时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.eventId}>
                <TableCell className="py-2 pl-3 whitespace-nowrap tabular-nums">
                  {e.eventDateTime}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-sm border px-1 text-[10px] font-medium',
                        TYPE_CLASS[e.eventType],
                      )}
                    >
                      {TYPE_LABEL[e.eventType]}
                    </span>
                    <span className="font-medium whitespace-nowrap">{e.eventName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-sm bg-muted px-1 font-mono text-[10px]">
                    {e.eventCode}
                  </span>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {CLASSIFIER_LABEL[e.classifier]}
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">
                    {e.classifier}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                  {e.equipmentReference ?? '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[11px]">
                  {e.vessel ? (
                    <>
                      {e.vessel}
                      <span className="ml-1 text-muted-foreground">{e.voyage}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                  {e.location ?? '—'}
                </TableCell>
                <TableCell className="pr-3 whitespace-nowrap text-[10px] text-muted-foreground tabular-nums">
                  {e.eventCreatedDateTime}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}