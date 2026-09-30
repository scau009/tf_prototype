import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@tf/ui'
import {
  ChartColumnIcon,
  ChartPieIcon,
  ClockIcon,
  GlobeIcon,
  RouteIcon,
  ShipIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { getOverview } from '../data'
import { ChartPlaceholder } from '../components/ChartPlaceholder'
import { MetricCard } from '../components/MetricCard'
import { PageHeader } from '../components/PageHeader'

/** 船务可视化：运行总览指标 + 规划中的图表区 */
export function VisualizationPage() {
  const { data: stats, isPending } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
  })

  return (
    <>
      <PageHeader
        title="船务可视化"
        desc="船务运行总览：船舶、航次、准班率与异常节点一屏掌握"
      />

      {/* 运行指标 */}
      {isPending || !stats ? (
        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="gap-2 py-4">
              <CardHeader>
                <Skeleton className="h-3 w-16" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <MetricCard
            label="在航船舶"
            value={`${stats.vessels} 艘`}
            icon={ShipIcon}
            delta={stats.vesselsDelta}
          />
          <MetricCard
            label="执行中航次"
            value={`${stats.voyages} 个`}
            icon={RouteIcon}
            delta={stats.voyagesDelta}
          />
          <MetricCard
            label="准班率"
            value={`${stats.onTimeRate}%`}
            icon={ClockIcon}
            delta={stats.onTimeRateDelta}
          />
          <MetricCard
            label="异常节点"
            value={`${stats.abnormalNodes} 个`}
            icon={TriangleAlertIcon}
            delta={stats.abnormalDelta}
            invert
          />
        </section>
      )}

      {/* 图表区（占位，规划中） */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-4 py-5">
          <CardHeader>
            <CardTitle className="text-base">准班率趋势</CardTitle>
            <CardDescription>按日统计 ETD 准班比例，识别延误高发期</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title="近 30 天船期准班率趋势"
              desc="纵轴准班率（%） · 横轴日期 · 支持按航线切换"
              icon={ChartColumnIcon}
              chartType="折线图 · Recharts"
            />
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader>
            <CardTitle className="text-base">目的港分布</CardTitle>
            <CardDescription>按目的港统计箱量，识别热点港口</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title="目的港箱量分布 TOP 10"
              desc="按 20GP / 40HQ 拆分堆叠 · 支持按月份切换"
              icon={ChartPieIcon}
              chartType="柱状图 · Recharts"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">航线与船舶位置</CardTitle>
          <CardDescription>点对点航线的船舶动态与在途状态</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartPlaceholder
            title="全球航线视图"
            desc="航线轨迹 + 船舶实时位置 + 抵港倒计时，点击船舶下钻航次详情"
            icon={GlobeIcon}
            chartType="地图 · 待选型"
          />
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">模块规划</CardTitle>
          <CardDescription>这个模块将怎么做</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
            <li>· 指标卡已接 TanStack Query，涨跌语义可反转（异常节点上升显示为红色）</li>
            <li>· 图表区将接 Recharts，颜色沿用 @tf/ui 的图表令牌（chart-1 ~ chart-5）</li>
            <li>· 图表与指标联动：点击港口/航线下钻到船期运价查询（?origin=&amp;destination=）</li>
            <li>· 异常节点明细接到监控节点配置页，形成「发现 → 配规则」闭环</li>
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
