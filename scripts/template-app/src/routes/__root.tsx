import { Outlet } from '@tanstack/react-router'

/** 应用外壳：全局背景/字体（新页面统一挂在这里） */
export function RootLayout() {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground">
      <Outlet />
    </div>
  )
}
