import { useMemo, useState } from 'react'
import { Card } from '@tf/ui'
import { cn } from '@tf/utils'
import { getMetrics, type RangeKey } from './data'
import { BarChart } from './components/BarChart'
import { LineChart } from './components/LineChart'
import { StatCard } from './components/StatCard'

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: '7d', label: '近 7 天' },
  { key: '14d', label: '近 14 天' },
  { key: '30d', label: '近 30 天' },
]

export default function App() {
  const [range, setRange] = useState<RangeKey>('7d')
  const metrics = useMemo(() => getMetrics(range), [range])

  return (
    <main className="page">
      <header className="dash__header">
        <div>
          <h1>数据看板</h1>
          <p>切换时间范围，观察指标卡、趋势图与渠道分布的联动（数据为本地模拟）</p>
        </div>
        <div className="dash__ranges">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={cn('dash__range', range === r.key && 'dash__range--active')}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <section className="dash__stats">
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

      <Card title="访问趋势" subtitle={`近 ${metrics.days} 天 · 每日 PV`}>
        <LineChart data={metrics.series} labels={metrics.seriesLabels} />
      </Card>

      <div className="dash__row">
        <Card title="渠道分布" subtitle="按访问来源">
          <BarChart data={metrics.channels} />
        </Card>
        <Card title="原型说明" subtitle="这个示例演示了什么">
          <ul className="dash__notes">
            <li>时间范围切换驱动全部区块重新计算（useState + useMemo）</li>
            <li>趋势图与柱状图为纯 SVG / CSS 实现，未引入图表库</li>
            <li>指标卡的涨跌语义可反转（如「错误数」上升显示为红色）</li>
            <li>布局与按钮、卡片均来自共享包 @tf/ui</li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
