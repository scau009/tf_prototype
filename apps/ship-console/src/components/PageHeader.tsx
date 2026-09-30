import type { ReactNode } from 'react'

/** 模块页头：标题 + 说明 + 右侧操作区（children） */
export function PageHeader({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  )
}
