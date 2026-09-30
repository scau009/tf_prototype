import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@tf/ui'
import {
  CalendarDaysIcon,
  ClockIcon,
  DownloadIcon,
  InboxIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { CARRIER_OPTIONS, DEMO_TODAY, getSchedules, weekdayLabel } from '../data'
import { CarrierLogo } from '../components/CarrierLogo'
import { PageHeader } from '../components/PageHeader'
import { clampWindowStart, ScheduleCalendar } from '../components/ScheduleCalendar'
import { TableSkeleton } from '../components/TableSkeleton'

const ORIGINS = ['深圳盐田', '宁波北仑', '上海外高桥', '青岛前湾', '广州南沙']
const DESTINATIONS = ['蒙巴萨', '拉各斯', '达累斯萨拉姆', '特马', '阿比让', '吉达', '鹿特丹']
const RANGES = ['未来 2 周', '未来 4 周', '本月全部', '不限']

/** 结果行默认展示的箱型数量，超出部分折叠进 hover 提示 */
const VISIBLE_CONTAINERS = 2

/** 2026-10-05 → 10-05（省略年份，压缩列宽） */
const shortDate = (value: string) => value.slice(5)

/** 查询条件字段（静态演示：可展开选择，暂不与结果联动） */
function Field({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select defaultValue="all">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SchedulePage() {
  const { data: rows, isPending } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  })

  // 日历状态落在 search params，便于分享/回退
  const { date, start } = useSearch({ from: '/_layout/schedule' })
  const navigate = useNavigate({ from: '/schedule' })

  const windowStart = clampWindowStart(start ?? DEMO_TODAY)
  const selectedDate = date
  const allRows = rows ?? []
  const filtered = selectedDate ? allRows.filter((row) => row.etd === selectedDate) : allRows

  const setDate = (next?: string) =>
    navigate({ search: (prev) => ({ ...prev, date: next }), replace: true })
  const setStart = (next: string) =>
    navigate({ search: (prev) => ({ ...prev, start: next }), replace: true })

  const notReady = () => toast.info('原型演示：查询条件暂未与结果联动')

  return (
    <>
      <PageHeader
        title="船期运价查询"
        desc="点对点港的船期表与价格查询：选起讫港，查船期、航程与箱型运价"
      >
        <Button variant="outline" size="sm" onClick={notReady}>
          <DownloadIcon /> 导出结果
        </Button>
      </PageHeader>

      {/* 查询条件 */}
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">查询条件</CardTitle>
          <CardDescription>选择起运港与目的港组合，查询对应船期与运价</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="起运港" options={ORIGINS} />
            <Field label="目的港" options={DESTINATIONS} />
            <Field label="船公司" options={CARRIER_OPTIONS} />
            <Field label="ETD 时间" options={RANGES} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              原型框架：条件与结果为固定演示数据，联动查询待接入
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={notReady}>
                <RefreshCwIcon /> 重置
              </Button>
              <Button size="sm" onClick={notReady}>
                <SearchIcon /> 查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 船期日历：按起运港出发日（ETD）查看未来 7 天，最多 30 天 */}
      <ScheduleCalendar
        rows={allRows}
        start={windowStart}
        onStartChange={setStart}
        selectedDate={selectedDate}
        onSelectDate={setDate}
        loading={isPending}
      />

      {/* 搜索结果 */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle className="text-base">船期与运价</CardTitle>
              <CardDescription className="mt-1 text-xs">
                {isPending
                  ? '加载中…'
                  : selectedDate
                    ? `${selectedDate}（${weekdayLabel(selectedDate)}）出发 · 共 ${filtered.length} 条`
                    : `共 ${filtered.length} 条 · 按 ETD 升序 · 运价为 USD 参考价`}
              </CardDescription>
            </div>
            {selectedDate && !isPending ? (
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2 text-[11px]">
                <CalendarDaysIcon className="size-3" />
                <span className="tabular-nums">{selectedDate.slice(5)} 出发</span>
                <button
                  type="button"
                  aria-label="清除出发日筛选"
                  onClick={() => setDate(undefined)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ) : (
              <p className="hidden text-[11px] text-muted-foreground lg:block">
                一行一条船期，悬停可查看中转与全部箱型
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <div className="p-4">
              <TableSkeleton rows={6} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <InboxIcon className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                {selectedDate ? '该出发日暂无船期' : '没有符合条件的船期'}
              </p>
              {selectedDate ? (
                <Button variant="ghost" size="xs" onClick={() => setDate(undefined)}>
                  查看全部船期
                </Button>
              ) : null}
            </div>
          ) : (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4">船司</TableHead>
                  <TableHead className="h-9">船舶 / 航线</TableHead>
                  <TableHead className="h-9">起运港 / ETD</TableHead>
                  <TableHead className="h-9">中转</TableHead>
                  <TableHead className="h-9">目的港 / ETA</TableHead>
                  <TableHead className="h-9 text-right">时效</TableHead>
                  <TableHead className="h-9">支持箱型 / 运价 (USD)</TableHead>
                  <TableHead className="h-9 pr-4">更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const direct = row.transshipCount === 0
                  const hiddenContainers = row.containers.slice(VISIBLE_CONTAINERS)

                  return (
                    <TableRow key={row.id}>
                      {/* 1. 船司（logo） */}
                      <TableCell className="py-2 pl-4">
                        <div className="flex items-center gap-2">
                          <CarrierLogo
                            carrier={row.carrier}
                            className="size-7 rounded-md text-[9px]"
                          />
                          <span className="font-medium">{row.carrier.code}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {row.carrier.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* 1. 船名 / 航次 / 航线 */}
                      <TableCell>
                        <span className="font-medium">{row.vessel}</span>
                        <span className="ml-1.5 text-muted-foreground">{row.voyage}</span>
                        <span className="mx-1.5 text-muted-foreground/40">|</span>
                        <span className="text-muted-foreground">{row.route}</span>
                      </TableCell>

                      {/* 2. 起运港 / ETD */}
                      <TableCell>
                        <span className="font-medium">{row.origin}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                          {shortDate(row.etd)}
                        </span>
                      </TableCell>

                      {/* 2. 中转次数（悬停展开中转港） */}
                      <TableCell>
                        {direct ? (
                          <span className="text-muted-foreground">直航</span>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="cursor-help rounded-sm font-medium underline decoration-muted-foreground/40 decoration-dashed underline-offset-2 hover:text-primary"
                              >
                                {row.transshipCount} 次中转
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[11px] text-background/70">中转港（按先后）</p>
                              <p className="mt-0.5 font-medium">
                                {row.transshipPorts.join(' → ')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* 2. 目的港 / ETA */}
                      <TableCell>
                        <span className="font-medium">{row.destination}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                          {shortDate(row.eta)}
                        </span>
                      </TableCell>

                      {/* 5. 预计时效 */}
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 font-medium tabular-nums text-primary">
                          <ClockIcon className="size-3" />
                          {row.transitDays} 天
                        </span>
                      </TableCell>

                      {/* 3. 支持箱型：默认 2 个，其余悬停展开 */}
                      <TableCell className="tabular-nums">
                        {row.containers.slice(0, VISIBLE_CONTAINERS).map((c, i) => (
                          <span key={c.type} className="whitespace-nowrap">
                            {i > 0 ? <span className="mx-1.5 text-muted-foreground/40">·</span> : null}
                            <span className="font-medium">{c.type}</span>
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              {c.price.toLocaleString('en-US')}
                            </span>
                          </span>
                        ))}
                        {hiddenContainers.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-1.5 cursor-help rounded border px-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                +{hiddenContainers.length}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[11px] text-background/70">全部支持箱型 (USD)</p>
                              <div className="mt-1 space-y-0.5">
                                {row.containers.map((c) => (
                                  <div
                                    key={c.type}
                                    className="flex items-center justify-between gap-6"
                                  >
                                    <span>{c.type}</span>
                                    <span className="tabular-nums">
                                      {c.price.toLocaleString('en-US')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </TableCell>

                      {/* 4. 更新时间 */}
                      <TableCell
                        className="pr-4 text-[11px] text-muted-foreground tabular-nums"
                        title={row.updatedAt}
                      >
                        {shortDate(row.updatedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}