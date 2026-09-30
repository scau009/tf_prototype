import { cn } from '@tf/utils'
import type { Carrier } from '../data'

/**
 * 船公司 logo 标识（原型内用品牌色 + 缩写模拟船司标志）。
 * 底色取自数据层的品牌色，悬停显示完整中英文名称。
 */
export function CarrierLogo({ carrier, className }: { carrier: Carrier; className?: string }) {
  return (
    <span
      title={`${carrier.code} · ${carrier.name}`}
      className={cn(
        'flex size-11 shrink-0 select-none items-center justify-center rounded-lg text-[11px] font-bold tracking-tight text-white ring-1 ring-black/5',
        className,
      )}
      style={{ backgroundColor: carrier.color }}
    >
      {carrier.short}
    </span>
  )
}