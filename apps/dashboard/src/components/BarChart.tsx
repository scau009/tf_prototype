import type { ChannelStat } from '../data'

/** 纯 CSS 柱状图 */
export function BarChart({ data }: { data: ChannelStat[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.channel} className="bar-chart__item" title={`${d.channel}：${d.value.toLocaleString()}`}>
          <span className="bar-chart__value">{d.value.toLocaleString()}</span>
          <div className="bar-chart__track">
            <div
              className="bar-chart__bar"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="bar-chart__label">{d.channel}</span>
        </div>
      ))}
    </div>
  )
}
