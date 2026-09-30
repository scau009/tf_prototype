import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, Tabs, TabsList, TabsTrigger } from '@tf/ui'
import { getMetricsAsync, type RangeKey } from '../data'
import { ChannelChart } from '../components/ChannelChart'
import { StatCard } from '../components/StatCard'
import { TrendChart } from '../components/TrendChart'

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: '7d', label: '近 7 天' },
  { key: '14d', label: '近 14 天' },
  { key: '30d', label: '近 30 天' },
]

export function IndexPage() {
  const { range = '7d' } = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const { data: metrics, isPending } = useQuery({
    queryKey: ['metrics', range],
    queryFn: () => getMetricsAsync(range),
  })

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">数据看板</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            切换时间范围，观察指标卡、趋势图与渠道分布的联动（数据为本地模拟）
          </p>
        </div>
        <Tabs
          value={range}
          onValueChange={(v) =>
            navigate({ search: { range: v as RangeKey }, replace: true })
          }
        >
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.key} value={r.key}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {isPending || !metrics ? (
        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="gap-2.5 py-4">
              <CardHeader className="px-4">
                <Skeleton className="h-3 w-16" />
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <StatCard label="总访问量 PV" value={metrics.visits.toLocaleString()} delta={metrics.visitsDelta} />
          <StatCard label="活跃用户" value={metrics.users.toLocaleString()} delta={metrics.usersDelta} />
          <StatCard label="转化率" value={`${metrics.conversion}%`} delta={metrics.conversionDelta} />
          <StatCard
            label="错误数"
            value={metrics.errors.toLocaleString()}
            delta={metrics.errorsDelta}
            invert
          />
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>访问趋势</CardTitle>
          <CardDescription>
            {isPending ? '加载中…' : `近 ${metrics!.days} 天 · 每日 PV`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-[210px] w-full" /> : <TrendChart metrics={metrics!} />}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>渠道分布</CardTitle>
            <CardDescription>按访问来源</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[210px] w-full" />
            ) : (
              <ChannelChart metrics={metrics!} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>原型说明</CardTitle>
            <CardDescription>这个示例演示了什么</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <li>· 时间范围写在路由 search params（<code>?range=7d</code>），可分享、可回退</li>
              <li>· 数据层接 TanStack Query：切换范围重新请求，期间渲染骨架屏</li>
              <li>· 趋势图与柱状图由 Recharts 渲染，颜色取 Tailwind 图表令牌</li>
              <li>· 指标卡的涨跌语义可反转（如「错误数」上升显示为红色）</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
