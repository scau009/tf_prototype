import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
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
} from '@tf/ui'
import {
  ArrowRightIcon,
  InboxIcon,
  RotateCcwIcon,
  SearchIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import {
  CARRIER_OPTIONS,
  getShipments,
  NODE_DEFS,
  NODE_LABEL,
  TRACKING_SOURCE_LABEL,
  type ShipmentStatus,
  type TrackingSearch,
} from '../data'
import { CarrierLogo } from '../components/CarrierLogo'
import { PageHeader } from '../components/PageHeader'
import { ShipmentStatusBadge } from '../components/ShipmentStatusBadge'
import { TableSkeleton } from '../components/TableSkeleton'
import { TrackingCreateDialog } from '../components/TrackingCreateDialog'

const SHIPMENT_STATUSES: ShipmentStatus[] = ['进行中', '异常', '已完成', '已取消']

/** 受控筛选下拉（值 'all' = 不限） */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** 在途追踪列表页：新建记录 + 筛选 + 结果表 */
export function VisualizationPage() {
  const search = useSearch({ from: '/_layout/visualization' })
  const navigate = useNavigate({ from: '/visualization' })
  const { data, isPending } = useQuery({ queryKey: ['shipments'], queryFn: getShipments })

  const all = useMemo(() => data ?? [], [data])

  // 筛选项的可选值取自当前数据，保证与实际内容一致
  const origins = useMemo(() => [...new Set(all.map((s) => s.origin))], [all])
  const destinations = useMemo(() => [...new Set(all.map((s) => s.destination))], [all])

  const filtered = useMemo(() => {
    const q = (search.q ?? '').toLowerCase()
    return all.filter((s) => {
      if (search.status && s.status !== search.status) return false
      if (search.node && s.currentNode !== search.node) return false
      if (search.carrier && s.carrier.code !== search.carrier) return false
      if (search.origin && s.origin !== search.origin) return false
      if (search.destination && s.destination !== search.destination) return false
      if (search.alert && !s.hasAlert) return false
      if (q) {
        const hay = [
          s.sourceNo,
          s.blNo,
          s.bookingNo,
          s.vessel,
          s.voyage,
          s.carrier.code,
          s.carrier.name,
          ...s.containerNos,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [all, search])

  const setSearch = (patch: Partial<TrackingSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const hasFilter =
    Boolean(search.q || search.status || search.node || search.carrier || search.origin || search.destination || search.alert)

  return (
    <>
      <PageHeader
        title="在途追踪"
        desc="以一票货为中心，追踪 订舱 → 空箱返还 共 11 个节点的完整生命周期"
      >
        <TrackingCreateDialog />
      </PageHeader>

      {/* 筛选条件 */}
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
          <CardDescription>按单号 / 节点 / 船司 / 起讫港组合筛选，条件保存在地址栏，可分享与回退</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q ?? ''}
              autoComplete="off"
              placeholder="搜索单号 / 提单号 / 箱号 / 船名航次"
              className="pl-8"
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              label="整票状态"
              value={search.status ?? 'all'}
              onChange={(v) => setSearch({ status: v === 'all' ? undefined : (v as ShipmentStatus) })}
              options={SHIPMENT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <FilterSelect
              label="当前节点"
              value={search.node ?? 'all'}
              onChange={(v) => setSearch({ node: v === 'all' ? undefined : (v as (typeof NODE_DEFS)[number]['key']) })}
              options={NODE_DEFS.map((n) => ({ value: n.key, label: n.label }))}
            />
            <FilterSelect
              label="船司"
              value={search.carrier ?? 'all'}
              onChange={(v) => setSearch({ carrier: v === 'all' ? undefined : v })}
              options={CARRIER_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              label="起运港"
              value={search.origin ?? 'all'}
              onChange={(v) => setSearch({ origin: v === 'all' ? undefined : v })}
              options={origins.map((o) => ({ value: o, label: o }))}
            />
            <FilterSelect
              label="目的港"
              value={search.destination ?? 'all'}
              onChange={(v) => setSearch({ destination: v === 'all' ? undefined : v })}
              options={destinations.map((d) => ({ value: d, label: d }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              共 {all.length} 票 · 当前筛选 {filtered.length} 票
            </p>
            <div className="flex gap-2">
              <Button
                variant={search.alert ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearch({ alert: search.alert ? undefined : true })}
              >
                <TriangleAlertIcon /> 仅看异常
              </Button>
              <Button variant="ghost" size="sm" disabled={!hasFilter} onClick={() => navigate({ search: {}, replace: true })}>
                <RotateCcwIcon /> 重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果表 */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-base">跟踪记录</CardTitle>
          <CardDescription className="mt-1 text-xs">
            {isPending ? '加载中…' : `共 ${filtered.length} 票 · 一行一票，点击「查看」进入生命周期详情`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <div className="p-4">
              <TableSkeleton rows={6} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <InboxIcon className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">没有符合条件的跟踪记录</p>
              {hasFilter ? (
                <Button variant="ghost" size="xs" onClick={() => navigate({ search: {}, replace: true })}>
                  清除筛选条件
                </Button>
              ) : null}
            </div>
          ) : (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4">单号 / 来源</TableHead>
                  <TableHead className="h-9">船司</TableHead>
                  <TableHead className="h-9">航线</TableHead>
                  <TableHead className="h-9">当前节点</TableHead>
                  <TableHead className="h-9">状态</TableHead>
                  <TableHead className="h-9">ETD / ETA</TableHead>
                  <TableHead className="h-9">中转</TableHead>
                  <TableHead className="h-9">箱型 / 箱量</TableHead>
                  <TableHead className="h-9">更新</TableHead>
                  <TableHead className="h-9 pr-4 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const direct = s.transshipPorts.length === 0
                  const doneContainers = s.containers.filter((c) => c.status === '已完成').length
                  const rollCount = s.containers.filter((c) => c.roll).length
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="py-2 pl-4">
                        <div className="font-medium">{s.sourceNo}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {TRACKING_SOURCE_LABEL[s.source]}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier={s.carrier} className="size-6 rounded-md text-[8px]" />
                          <span className="font-medium">{s.carrier.code}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium">{s.origin}</span>
                        <ArrowRightIcon className="mx-1 inline size-3 text-muted-foreground/60" />
                        <span className="font-medium">{s.destination}</span>
                        <div className="text-[10px] text-muted-foreground">
                          {s.vessel} {s.voyage}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{NODE_LABEL[s.currentNode]}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {s.progress}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ShipmentStatusBadge status={s.status} />
                          {s.hasAlert && s.status !== '异常' ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TriangleAlertIcon className="size-3.5 cursor-help text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[11px]">存在延误节点</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="tabular-nums text-[11px]">
                        <div>ETD {s.etd.slice(5)}</div>
                        <div className="text-muted-foreground">ETA {s.eta.slice(5)}</div>
                      </TableCell>

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
                                {s.transshipPorts.length} 次中转
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[11px] text-background/70">中转港（按先后）</p>
                              <p className="mt-0.5 font-medium">{s.transshipPorts.join(' → ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell className="tabular-nums">
                        <div>
                          <span className="font-medium">{s.containerType}</span>
                          <span className="ml-1 text-muted-foreground">× {s.containerCount}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            完成 {doneContainers}/{s.containerCount} 箱
                          </span>
                          {rollCount > 0 ? (
                            <span className="rounded-sm border border-amber-200 bg-amber-50 px-1 text-[10px] text-amber-700">
                              甩柜 {rollCount}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                        {s.updatedAt.slice(5)}
                      </TableCell>

                      <TableCell className="pr-4 text-right">
                        <Button variant="ghost" size="xs" asChild>
                          <Link to="/visualization/$shipmentId" params={{ shipmentId: s.id }}>
                            查看
                          </Link>
                        </Button>
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