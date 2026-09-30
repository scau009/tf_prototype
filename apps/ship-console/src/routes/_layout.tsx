import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '../components/AppSidebar'
import { Topbar } from '../components/Topbar'

/** 中台外壳：左侧边栏 + 顶栏，子模块内容渲染在 Outlet */
export function AppShell() {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-auto bg-muted/30 p-5">
          <div className="mx-auto w-full max-w-7xl space-y-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
