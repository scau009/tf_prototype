import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import {
  isValidScheduleDate,
  validateInvoiceSearch,
  validateMonitoringSearch,
  validateTrackingSearch,
} from './data'
import { RootLayout } from './routes/__root'
import { AppShell } from './routes/_layout'
import { SchedulePage } from './routes/schedule'
import { VisualizationPage } from './routes/visualization'
import { TrackingDetailPage } from './routes/tracking-detail'
import { InvoicesPage } from './routes/invoices'
import { MonitoringPage } from './routes/monitoring'
import { DEFAULT_NAV } from './nav'

const rootRoute = createRootRoute({ component: RootLayout })

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
const invoicesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/invoices',
  /** 列表筛选条件落在 search params：?q=&status=&category=&currency= */
  validateSearch: validateInvoiceSearch,
  component: InvoicesPage,
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
    invoicesRoute,
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
