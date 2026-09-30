import { Outlet } from '@tanstack/react-router'
import { Toaster } from '@tf/ui'

/** 应用外壳：全局背景/字体 + 通知容器 */
export function RootLayout() {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground">
      <Outlet />
      <Toaster position="top-center" richColors />
    </div>
  )
}
