export type RangeKey = '7d' | '14d' | '30d'

/** search params 守卫：非法值回落 7d */
export function isRangeKey(v: unknown): v is RangeKey {
  return v === '7d' || v === '14d' || v === '30d'
}

export interface ChannelStat {
  channel: string
  value: number
}

export interface Metrics {
  days: number
  visits: number
  visitsDelta: number
  users: number
  usersDelta: number
  conversion: number
  conversionDelta: number
  errors: number
  errorsDelta: number
  series: number[]
  seriesLabels: string[]
  channels: ChannelStat[]
}

/** 可复现的伪随机数（保证每次刷新图表形态一致） */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSeries(days: number, base: number, seed: number): number[] {
  const rand = mulberry32(seed)
  return Array.from({ length: days }, (_, i) => {
    const trend = (i / Math.max(days - 1, 1)) * base * 0.6
    const weekly = Math.sin((i / 7) * Math.PI * 2) * base * 0.1
    const noise = rand() * base * 0.22
    return Math.round(base + trend + weekly + noise)
  })
}

function labelDates(days: number): string[] {
  const labels: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return labels
}

const CHANNEL_SHARES: Array<[string, number]> = [
  ['直接访问', 0.34],
  ['搜索引擎', 0.27],
  ['社交媒体', 0.18],
  ['外部引荐', 0.13],
  ['邮件营销', 0.08],
]

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const pct = (cur: number, prev: number) => Math.round(((cur - prev) / Math.max(prev, 1)) * 1000) / 10

/** 按 time range 生成本地模拟指标（原型无需真实后端） */
export function getMetrics(range: RangeKey): Metrics {
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30

  const series = buildSeries(days, 1200, 42)
  const prevSeries = buildSeries(days, 980, 7)

  const visits = sum(series)
  const prevVisits = sum(prevSeries)
  const users = Math.round(visits * 0.31)
  const prevUsers = Math.round(prevVisits * 0.29)
  const conversion = +(2.6 + (visits % 23) / 10).toFixed(1)
  const prevConversion = +(2.3 + (prevVisits % 31) / 12).toFixed(1)
  const errors = Math.round(visits * 0.004) + 3
  const prevErrors = Math.round(prevVisits * 0.005) + 2

  return {
    days,
    visits,
    visitsDelta: pct(visits, prevVisits),
    users,
    usersDelta: pct(users, prevUsers),
    conversion,
    conversionDelta: pct(conversion, prevConversion),
    errors,
    errorsDelta: pct(errors, prevErrors),
    series,
    seriesLabels: labelDates(days),
    channels: CHANNEL_SHARES.map(([channel, share]) => ({
      channel,
      value: Math.round(visits * share),
    })),
  }
}

/**
 * 模拟异步数据源：为 TanStack Query 提供 queryFn（带 350ms 延迟，
 * 用于演示 loading 骨架屏与切换 range 时的重新请求）。
 */
export async function getMetricsAsync(range: RangeKey): Promise<Metrics> {
  await new Promise((resolve) => setTimeout(resolve, 350))
  return getMetrics(range)
}
