import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { isFeeTab, isValidScheduleDate, type FeeTab } from './data'
import { RootLayout } from './routes/__root'
import { AppShell } from './routes/_layout'
import { SchedulePage } from './routes/schedule'
import { VisualizationPage } from './routes/visualization'
import { FeesPage } from './routes/fees'
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
  component: VisualizationPage,
})
const feesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/fees',
  /** 费用管理页签落在 search params（?tab=invoice|fee），可分享、可回退 */
  validateSearch: (search: Record<string, unknown>): { tab?: FeeTab } => ({
    tab: isFeeTab(search.tab) ? search.tab : 'invoice',
  }),
  component: FeesPage,
})
const monitoringRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/monitoring',
  component: MonitoringPage,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    indexRoute,
    scheduleRoute,
    visualizationRoute,
    feesRoute,
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
