import { Outlet } from '@tanstack/react-router'

/** 应用外壳：全局背景/字体 */
export function RootLayout() {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground">
      <Outlet />
    </div>
  )
}
