import { useEffect } from 'react'
import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { isValidScheduleDate, validateMonitoringSearch, validateTrackingSearch } from './data'
import { RootLayout } from './routes/__root'
import { AppShell } from './routes/_layout'
import { SchedulePage } from './routes/schedule'
import { VisualizationPage } from './routes/visualization'
import { TrackingDetailPage } from './routes/tracking-detail'
import { MonitoringPage } from './routes/monitoring'
import { DEFAULT_NAV } from './nav'

/**
 * 未匹配路由的 notFound 兜底：历史链接（如已移除模块的 /invoices、/tariff-book）
 * 不再落到 TanStack 默认 404 文案，而是 replace 跳转到默认落地模块（/schedule），
 * replace 保证坏链接不留在浏览器历史里。
 */
function NotFoundFallback() {
  useEffect(() => {
    void router.navigate({ to: DEFAULT_NAV.path, replace: true })
  }, [])
  return null
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundFallback,
})

/** 无路径布局路由（id 路由）：中台外壳（侧边栏 + 顶栏），子模块渲染在 Outlet */
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_layout',
  component: AppShell,
})

/** 已无工作台首页：访问 `/` 直接重定向到默认落地模块 */
const indexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: DEFAULT_NAV.path })
  },
})
const scheduleRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/schedule',
  /**
   * 船期日历状态落在 search params：?date=出发日（结果表筛选）、?start=窗口起始日，
   * 非法值自动回落为「未筛选 / 今天」，保证可分享、可回退。
   */
  validateSearch: (search: Record<string, unknown>): { date?: string; start?: string } => ({
    date: isValidScheduleDate(search.date) ? search.date : undefined,
    start: isValidScheduleDate(search.start) ? search.start : undefined,
  }),
  component: SchedulePage,
})
const visualizationRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/visualization',
  /** 列表筛选条件落在 search params：?q=&status=&node=&carrier=&origin=&destination=&alert=1 */
  validateSearch: validateTrackingSearch,
  component: VisualizationPage,
})
const trackingDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/visualization/$shipmentId',
  component: TrackingDetailPage,
})
const monitoringRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/monitoring',
  /** 规则筛选条件落在 search params：?q=&node=&level=&status= */
  validateSearch: validateMonitoringSearch,
  component: MonitoringPage,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    indexRoute,
    scheduleRoute,
    visualizationRoute,
    trackingDetailRoute,
    monitoringRoute,
  ]),
])

/**
 * dev 时 BASE_URL 为 '/'；子路径部署时 build-site.mjs 会以 `--base=/<id>/`
 * 注入，此处归一化为无尾斜杠的 basepath，路由自动适配两种环境。
 */
const base = import.meta.env.BASE_URL
const basepath = base === '/' ? '/' : base.replace(/\/+$/, '')

export const router = createRouter({ routeTree, basepath })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
