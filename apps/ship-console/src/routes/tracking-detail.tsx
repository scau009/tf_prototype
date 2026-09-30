import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@tf/ui'
import { cn } from '@tf/utils'
import {
  ArrowLeftIcon,
  InboxIcon,
  PackageIcon,
  TriangleAlertIcon,
  ZapIcon,
} from 'lucide-react'
import {
  advanceShipment,
  getShipment,
  NODE_LABEL,
  TRACKING_SOURCE_LABEL,
  type Container,
  type NodeStatus,
} from '../data'
import { PageHeader } from '../components/PageHeader'
import { AttentionPanel } from '../components/AttentionPanel'
import { NODE_STATUS_META, ShipmentStatusBadge } from '../components/ShipmentStatusBadge'
import { ContainerTimeline, ShipmentProgress } from '../components/ShipmentTimeline'
import { DcsaEventLog } from '../components/DcsaEventLog'

/** 图例顺序（由完成到未开始） */
const LEGEND_STATUSES: NodeStatus[] = ['done', 'active', 'warning', 'failed', 'pending']

/** 单箱状态圆点配色 */
function containerDotClass(status: Container['status']) {
  if (status === '异常') return 'bg-red-500'
  if (status === '已完成') return 'bg-emerald-500'
  return 'bg-sky-500'
}

/** 单箱进度条配色 */
function progressBarClass(status: Container['status']) {
  if (status === '异常') return 'bg-red-500'
  if (status === '已完成') return 'bg-emerald-500'
  return 'bg-primary'
}

/** 紧凑信息项：标签 + 值一行，用于信息栅格 */
function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{children}</span>
    </div>
  )
}

/**
 * 单票详情：左右 8:2 布局。
 * 左侧 80%：整票节点进度 + 详细信息 + 逐箱明细 + 事件记录；
 * 右侧 20%：需要关注的异常 / 提醒事项（中转变更、船信息变更、中转港动态等）。
 */
export function TrackingDetailPage() {
  const { shipmentId } = useParams({ from: '/_layout/visualization/$shipmentId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeNo, setActiveNo] = useState<string | null>(null)

  const { data: shipment, isPending } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => getShipment(shipmentId),
  })

  const advance = useMutation({
    mutationFn: () => advanceShipment(shipmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] })
      void queryClient.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('已推进到下一节点')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '推进失败')
    },
  })

  const back = (
    <Button variant="outline" size="sm" onClick={() => navigate({ to: '/visualization' })}>
      <ArrowLeftIcon /> 返回列表
    </Button>
  )

  if (isPending) {
    return (
      <>
        <PageHeader title="跟踪详情" desc="正在加载该票的生命周期数据…">
          {back}
        </PageHeader>
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-4">
            <Card className="py-5">
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card className="py-5">
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
          <aside className="lg:col-span-1">
            <Card className="py-5">
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </>
    )
  }

  if (!shipment) {
    return (
      <>
        <PageHeader title="跟踪详情" desc="未找到该跟踪记录">{back}</PageHeader>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <InboxIcon className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              单号 <span className="font-medium text-foreground">{shipmentId}</span> 不存在或已删除
            </p>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/visualization' })}>
              返回跟踪列表
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  const canAdvance = shipment.status === '进行中' || shipment.status === '异常'
  const direct = shipment.transshipPorts.length === 0
  const rollCount = shipment.containers.filter((c) => c.roll).length
  const alertNodes = shipment.nodes.filter((n) => n.status === 'failed' || n.status === 'warning')
  const active = shipment.containers.find((c) => c.no === activeNo) ?? shipment.containers[0]!

  return (
    <>
      <PageHeader
        title={shipment.sourceNo}
        desc={`${shipment.origin} → ${shipment.destination} · ${shipment.carrier.name} ${shipment.vessel}/${shipment.voyage}`}
      >
        {canAdvance ? (
          <Button size="sm" disabled={advance.isPending} onClick={() => advance.mutate()}>
            <ZapIcon /> {advance.isPending ? '推进中…' : '模拟推进节点'}
          </Button>
        ) : null}
        {back}
      </PageHeader>

      {/* 左右 8:2 布局 */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* 左侧 80%：主内容 */}
        <div className="space-y-5 lg:col-span-4">
          {/* 整票节点进度（横向，不含竖向详情） */}
          <Card className="gap-4 py-5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">整票节点进度</CardTitle>
                  <CardDescription className="mt-1">
                    11 个节点：订舱 / 放舱 / 截关为票级，其余按箱聚合（如「箱完成 3/5」）；具体箱况见下方逐箱明细
                  </CardDescription>
                </div>
                <div className="w-44">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>整票进度</span>
                    <span className="tabular-nums">{shipment.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ShipmentProgress shipment={shipment} />

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {LEGEND_STATUSES.map((st) => (
                  <span key={st} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'size-2.5 rounded-full border-2',
                        NODE_STATUS_META[st].dot,
                        st === 'pending' && 'bg-background',
                      )}
                    />
                    {NODE_STATUS_META[st].label}
                  </span>
                ))}
              </div>

              {alertNodes.length > 0 ? (
                <div className="space-y-1.5">
                  {alertNodes.map((n) => (
                    <p
                      key={n.key}
                      className={cn(
                        'rounded-md border px-2 py-1 text-[11px]',
                        n.status === 'failed'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700',
                      )}
                    >
                      <span className="font-medium">{NODE_LABEL[n.key]}</span> ·{' '}
                      {NODE_STATUS_META[n.status].label}
                      {n.failReason ? `：${n.failReason}` : ''}
                      {n.note ? `：${n.note}` : ''}
                    </p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* 详细信息（原票面信息） */}
          <Card className="gap-3 py-4">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">详细信息</CardTitle>
                <ShipmentStatusBadge status={shipment.status} />
                <span className="text-[11px] text-muted-foreground">
                  {TRACKING_SOURCE_LABEL[shipment.source]}创建
                </span>
                {shipment.hasAlert ? (
                  <span className="text-[11px] text-amber-600">存在异常节点</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="单号">{shipment.sourceNo}</InfoItem>
                <InfoItem label="提单号">{shipment.blNo ?? '—'}</InfoItem>
                <InfoItem label="订舱号">{shipment.bookingNo ?? '—'}</InfoItem>
                <InfoItem label="船司">
                  {shipment.carrier.code}
                  <span className="ml-1 font-normal text-muted-foreground">
                    {shipment.carrier.name}
                  </span>
                </InfoItem>
                <InfoItem label="船名 / 航次">
                  {shipment.vessel}
                  <span className="ml-1 font-normal text-muted-foreground tabular-nums">
                    {shipment.voyage}
                  </span>
                </InfoItem>
                <InfoItem label="起运港">{shipment.origin}</InfoItem>
                <InfoItem label="目的港">{shipment.destination}</InfoItem>
                <InfoItem label="中转">
                  {direct ? (
                    <span className="font-normal text-muted-foreground">直航</span>
                  ) : (
                    shipment.transshipPorts.join(' → ')
                  )}
                </InfoItem>
                <InfoItem label="箱型 / 箱量">
                  {shipment.containerType}
                  <span className="ml-1 font-normal text-muted-foreground">
                    × {shipment.containerCount}
                  </span>
                </InfoItem>
                <InfoItem label="ETD">
                  <span className="tabular-nums">{shipment.etd}</span>
                </InfoItem>
                <InfoItem label="ETA">
                  <span className="tabular-nums">{shipment.eta}</span>
                </InfoItem>
                <InfoItem label="最近更新">
                  <span className="tabular-nums">{shipment.updatedAt}</span>
                </InfoItem>
              </dl>
            </CardContent>
          </Card>

          {/* 箱进度明细：左侧箱号 Tab，右侧该箱详情 */}
          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageIcon className="size-4 text-muted-foreground" />
                箱进度明细
                <span className="text-xs font-normal text-muted-foreground">
                  共 {shipment.containerCount} 箱
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                同一票内每箱独立推进，船名航次与时间可不同
                {rollCount > 0 ? ` · ${rollCount} 箱甩柜改配` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                orientation="vertical"
                value={active.no}
                onValueChange={setActiveNo}
                className="gap-4"
              >
                <TabsList className="h-fit w-48 shrink-0 flex-col items-stretch">
                  {shipment.containers.map((c) => (
                    <TabsTrigger
                      key={c.no}
                      value={c.no}
                      className="flex-col items-start gap-0.5 px-2 py-1.5"
                    >
                      <span className="flex w-full min-w-0 items-center gap-1.5">
                        <span
                          className={cn('size-1.5 shrink-0 rounded-full', containerDotClass(c.status))}
                        />
                        <span className="truncate font-mono text-[11px]">{c.no}</span>
                        {c.roll ? (
                          <span className="ml-auto shrink-0 rounded-sm border border-amber-200 bg-amber-50 px-1 text-[9px] font-medium text-amber-700">
                            甩
                          </span>
                        ) : null}
                      </span>
                      <span className="w-full truncate text-[10px] font-normal text-muted-foreground">
                        {c.type} · {NODE_LABEL[c.currentNode]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {shipment.containers.map((c) => (
                  <TabsContent key={c.no} value={c.no} className="mt-0">
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="font-mono text-sm font-medium">{c.no}</span>
                        <span className="rounded-sm border bg-muted/40 px-1 text-[10px] text-muted-foreground">
                          {c.type}
                        </span>
                        {c.roll ? (
                          <span className="rounded-sm border border-amber-200 bg-amber-50 px-1 text-[10px] font-medium text-amber-700">
                            甩柜改配
                          </span>
                        ) : null}
                        <ShipmentStatusBadge status={c.status} />
                        {c.hasAlert && c.status !== '异常' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TriangleAlertIcon className="size-3.5 cursor-help text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[11px]">该箱存在延误节点</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          当前{' '}
                          <span className="font-medium text-foreground">
                            {NODE_LABEL[c.currentNode]}
                          </span>
                        </span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {c.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            progressBarClass(c.status),
                          )}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>

                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoItem label="船名 / 航次">
                          {c.vessel}
                          <span className="ml-1 font-normal text-muted-foreground tabular-nums">
                            {c.voyage}
                          </span>
                          {c.vessel !== shipment.vessel || c.voyage !== shipment.voyage ? (
                            <span className="ml-1 text-amber-600">（已改配）</span>
                          ) : null}
                        </InfoItem>
                        <InfoItem label="ETD">
                          <span className="tabular-nums">{c.etd}</span>
                        </InfoItem>
                        <InfoItem label="ETA">
                          <span className="tabular-nums">{c.eta}</span>
                        </InfoItem>
                        <InfoItem label="ATD / ATA">
                          <span className="tabular-nums">{c.atd ?? '—'}</span>
                          <span className="mx-1 font-normal text-muted-foreground">/</span>
                          <span className="tabular-nums">{c.ata ?? '—'}</span>
                        </InfoItem>
                      </dl>

                      <Separator />
                      <ContainerTimeline container={c} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* 事件记录（表格） */}
          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="text-base">事件记录</CardTitle>
              <CardDescription>
                船司按 DCSA 事件模型回传的事件记录（eventType / eventCode / classifier），按事件时间倒序
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DcsaEventLog events={shipment.dcsaEvents} />
            </CardContent>
          </Card>
        </div>

        {/* 右侧 20%：需要关注的异常 / 提醒 */}
        <aside className="lg:col-span-1">
          <AttentionPanel shipment={shipment} />
        </aside>
      </div>
    </>
  )
}