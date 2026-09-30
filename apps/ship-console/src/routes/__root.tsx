import { Outlet } from '@tanstack/react-router'
import { Toaster, TooltipProvider } from '@tf/ui'

/** 应用根外壳：全局背景/字体 + Tooltip 容器 + Toast 浮层 */
export function RootLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background font-sans text-foreground">
        <Outlet />
        <Toaster position="top-center" />
      </div>
    </TooltipProvider>
  )
}