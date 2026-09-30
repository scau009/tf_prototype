import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tf/ui'
import { cn } from '@tf/utils'
import { BellRingIcon, CheckCircle2Icon } from 'lucide-react'
import { NODE_LABEL, type AttentionCategory, type AttentionLevel, type Shipment } from '../data'

/** 关注等级展示口径 */
const LEVEL_META: Record<AttentionLevel, { label: string; badge: string; card: string }> = {
  alert: {
    label: '异常',
    badge: 'border-red-200 bg-red-100 text-red-700',
    card: 'border-red-200 bg-red-50/60',
  },
  warning: {
    label: '提醒',
    badge: 'border-amber-200 bg-amber-100 text-amber-700',
    card: 'border-amber-200 bg-amber-50/50',
  },
}

/** 关注事项类别展示名 */
const CATEGORY_LABEL: Record<AttentionCategory, string> = {
  failure: '节点失败',
  roll: '甩柜改配',
  delay: '节点延误',
  note: '待跟进',
  'transit-change': '中转变更',
  'vessel-change': '船信息变更',
  'transit-port': '中转港动态',
}

/**
 * 需要关注面板（详情页右侧）：汇总本票的异常（alert）与提醒（warning），
 * 如节点失败 / 延误、甩柜改配、中转变更、船信息变更、中转港进港 · 滞留 · 离港等。
 */
export function AttentionPanel({ shipment }: { shipment: Shipment }) {
  const items = shipment.attention
  const alerts = items.filter((i) => i.level === 'alert').length
  const warnings = items.length - alerts

  return (
    <Card className="gap-3 py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRingIcon className="size-4 text-muted-foreground" />
          需要关注
        </CardTitle>
        <CardDescription className="text-xs">
          {items.length === 0
            ? '暂无异常或提醒事项'
            : `异常 ${alerts} 项 · 提醒 ${warnings} 项，按等级与时间排序`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2Icon className="size-7 text-emerald-500" />
            <p className="text-xs text-muted-foreground">本票暂无需要关注的事项</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn('rounded-md border px-2.5 py-2', LEVEL_META[item.level].card)}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-sm border px-1 text-[10px] font-medium',
                      LEVEL_META[item.level].badge,
                    )}
                  >
                    {LEVEL_META[item.level].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                    {item.at.slice(5)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium leading-snug">{item.title}</p>
                {item.desc ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {item.desc}
                  </p>
                ) : null}
                {item.node || item.containerNo ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                    {item.node ? <span>{NODE_LABEL[item.node]}</span> : null}
                    {item.containerNo ? <span className="font-mono">{item.containerNo}</span> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}