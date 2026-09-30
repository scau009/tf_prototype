import { useLocation } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { Badge } from '@tf/ui'
import { findNav } from '../nav'

/**
 * 中台顶栏：左侧按当前路由渲染面包屑（模块名 + 说明），
 * 右侧为演示标识、日期与用户位。
 */
export function Topbar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const current = findNav(pathname)

  const today = new Date()
  const dateText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card/60 px-5">
      {/* 面包屑 */}
      <nav aria-label="面包屑" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">船务信息中台</span>
        <ChevronRightIcon className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-medium">{current.label}</span>
        <span className="ml-1 hidden truncate text-xs text-muted-foreground md:inline">
          · {current.desc}
        </span>
      </nav>

      {/* 右侧信息 */}
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" className="text-muted-foreground">
          演示数据
        </Badge>
        <span className="hidden text-xs text-muted-foreground lg:inline">{dateText}</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          TF
        </span>
      </div>
    </header>
  )
}
