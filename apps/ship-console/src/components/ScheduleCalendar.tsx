import { useMemo } from 'react'
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@tf/ui'
import { cn } from '@tf/utils'
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from 'lucide-react'
import {
  addDays,
  CALENDAR_RANGE_DAYS,
  CALENDAR_WINDOW_DAYS,
  DEMO_TODAY,
  diffDays,
  weekdayLabel,
  type ScheduleRow,
} from '../data'
import { CarrierLogo } from './CarrierLogo'

/** 窗口起点最晚 = 今天 +（可查看天数 − 窗口天数），保证窗口末日不超过「今天 + 30 天」 */
const MAX_START_OFFSET = CALENDAR_RANGE_DAYS - (CALENDAR_WINDOW_DAYS - 1)

/** 把任意日期夹到可用的窗口起点范围 [今天, 今天 + 24] */
export function clampWindowStart(date: string): string {
  const offset = diffDays(DEMO_TODAY, date)
  const clamped = Math.min(Math.max(offset, 0), MAX_START_OFFSET)
  return addDays(DEMO_TODAY, clamped)
}

export interface ScheduleCalendarProps {
  /** 全部船期（日历按出发日自行分组，不受结果表筛选影响） */
  rows: ScheduleRow[]
  /** 当前 7 天窗口的起始出发日（YYYY-MM-DD） */
  start: string
  onStartChange: (start: string) => void
  /** 结果表当前选中的出发日；为空表示查看全部 */
  selectedDate?: string
  onSelectDate: (date?: string) => void
  loading?: boolean
}

/**
 * 船期日历：以起运港出发日（ETD）为轴，默认展示未来 7 天，
 * 最多可查看 30 天后；点击某天可将下方结果表筛选至当天船期。
 */
export function ScheduleCalendar({
  rows,
  start,
  onStartChange,
  selectedDate,
  onSelectDate,
  loading = false,
}: ScheduleCalendarProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>()
    for (const row of rows) {
      const list = map.get(row.etd)
      if (list) list.push(row)
      else map.set(row.etd, [row])
    }
    return map
  }, [rows])

  const days = Array.from({ length: CALENDAR_WINDOW_DAYS }, (_, i) => addDays(start, i))
  const startOffset = diffDays(DEMO_TODAY, start)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <CardTitle className="text-base">船期日历</CardTitle>
          <CardDescription className="mt-1 text-xs">
            按起运港出发日（ETD）查看 · 默认未来 7 天，最多可看 {CALENDAR_RANGE_DAYS} 天 · 点击某天筛选下方结果
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="窗口起始出发日"
            className="h-8 w-36 text-xs"
            value={start}
            min={DEMO_TODAY}
            max={addDays(DEMO_TODAY, CALENDAR_RANGE_DAYS)}
            onChange={(e) => {
              if (e.target.value) onStartChange(clampWindowStart(e.target.value))
            }}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="向前 7 天"
              disabled={startOffset <= 0}
              onClick={() => onStartChange(clampWindowStart(addDays(start, -CALENDAR_WINDOW_DAYS)))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="向后 7 天"
              disabled={clampWindowStart(addDays(start, CALENDAR_WINDOW_DAYS)) === start}
              onClick={() => onStartChange(clampWindowStart(addDays(start, CALENDAR_WINDOW_DAYS)))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="xs"
            disabled={startOffset === 0}
            onClick={() => onStartChange(DEMO_TODAY)}
          >
            <RotateCcwIcon /> 回到今天
          </Button>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 gap-px border-t bg-border sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const sailings = byDate.get(day) ?? []
          const isToday = day === DEMO_TODAY
          const selected = day === selectedDate

          return (
            <div
              key={day}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onSelectDate(selected ? undefined : day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectDate(selected ? undefined : day)
                }
              }}
              className={cn(
                'flex min-h-28 cursor-pointer flex-col gap-2 bg-card p-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                selected && 'bg-primary/5 hover:bg-primary/10',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn('text-xs font-medium', selected && 'text-primary')}>
                  {weekdayLabel(day)}
                </span>
                <span className="flex items-center gap-1">
                  {isToday ? (
                    <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">
                      今天
                    </span>
                  ) : null}
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {day.slice(5)}
                  </span>
                </span>
              </div>

              {loading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : sailings.length === 0 ? (
                <p className="mt-3 text-center text-[11px] text-muted-foreground/70">无船期</p>
              ) : (
                <ul className="space-y-1.5">
                  {sailings.map((s) => (
                    <li key={s.id} className="flex items-start gap-1.5">
                      <CarrierLogo
                        carrier={s.carrier}
                        className="mt-0.5 size-5 rounded text-[8px]"
                      />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-[11px] font-medium" title={s.vessel}>
                          {s.vessel}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {s.destination} · {s.transitDays} 天
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}