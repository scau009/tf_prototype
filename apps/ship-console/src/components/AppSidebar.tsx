import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AnchorIcon, type LucideIcon } from 'lucide-react'
import { Badge } from '@tf/ui'
import { MODULE_NAV, type RoutePath } from '../nav'

/**
 * 中台左侧边栏：品牌区 + 业务模块菜单 + 底部信息。
 * 高亮由 TanStack Router 的 activeProps 驱动，无需手写匹配逻辑。
 */
export function AppSidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      {/* 品牌：高度与顶栏一致（h-14），保证底部边框对齐 */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <AnchorIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-semibold">特福国际</p>
          <p className="truncate text-xs text-muted-foreground">船务信息中台</p>
        </div>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        <MenuGroup title="业务功能">
          {MODULE_NAV.map((item) => (
            <MenuLink key={item.path} to={item.path} label={item.label} icon={item.icon} />
          ))}
        </MenuGroup>
      </nav>

      {/* 底部 */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">原型框架</span>
          <Badge variant="outline" className="text-[11px]">
            v0.1
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/80">数据均为本地模拟</p>
      </div>
    </aside>
  )
}

function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/80">
        {title}
      </p>
      <ul className="space-y-1">{children}</ul>
    </div>
  )
}

function MenuLink({
  to,
  label,
  icon: Icon,
}: {
  to: RoutePath
  label: string
  icon: LucideIcon
}) {
  return (
    <li>
      <Link
        to={to}
        activeProps={{ className: 'bg-primary/10 font-medium text-primary' }}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )
}
