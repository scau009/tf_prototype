import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { isRangeKey, type RangeKey } from './data'
import { RootLayout } from './routes/__root'
import { IndexPage } from './routes'

/** 时间范围落在路由 search params 上（?range=7d），可分享、可回退 */
const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { range?: RangeKey } => ({
    range: isRangeKey(search.range) ? search.range : '7d',
  }),
  component: IndexPage,
})
const routeTree = rootRoute.addChildren([indexRoute])

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
