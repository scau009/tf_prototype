import type { LucideIcon } from 'lucide-react'
import {
  BellRingIcon,
  BookTextIcon,
  CalendarRangeIcon,
  RadarIcon,
  ReceiptTextIcon,
} from 'lucide-react'

/** 中台全部路由路径（字面量联合，供 Link 的 to 做类型检查） */
export type RoutePath =
  | '/schedule'
  | '/visualization'
  | '/invoices'
  | '/tariff-book'
  | '/monitoring'

/**
 * 中台导航配置（唯一数据源）：
 * 侧边栏菜单与顶栏面包屑共用这一份，新增模块只需在此追加。
 */
export interface NavItem {
  /** 路由路径（不含子路径部署的 basepath） */
  path: RoutePath
  /** 菜单显示名 */
  label: string
  /** 一句话说明（顶栏副标题） */
  desc: string
  icon: LucideIcon
  /** 子路由（如详情页）的面包屑文案；无子页面时不设置 */
  detail?: string
}

/** 业务功能模块（顺序 = 侧边栏菜单顺序，首项为默认落地模块） */
export const MODULE_NAV: NavItem[] = [
  {
    path: '/schedule',
    label: '船期运价查询',
    desc: '点对点港的船期表与价格查询：选起讫港查船期、航程与箱型运价',
    icon: CalendarRangeIcon,
  },
  {
    path: '/visualization',
    label: '在途追踪',
    desc: '以一票货为中心，追踪 订舱 → 空箱返还 共 11 个节点的完整生命周期',
    icon: RadarIcon,
    detail: '跟踪详情',
  },
  {
    path: '/invoices',
    label: '发票管理',
    desc: '发票台账：按提单号关联一票货，支持筛选、预览与下载发票原件',
    icon: ReceiptTextIcon,
  },
  {
    path: '/tariff-book',
    label: '港口收费标准',
    desc: 'Port Tariff Book：各港口费用类别的收费标准查询与维护',
    icon: BookTextIcon,
  },
  {
    path: '/monitoring',
    label: '监控节点配置',
    desc: '单票提单生命周期监控：按在途节点配置预警规则与提前量（不含发票 / 费用）',
    icon: BellRingIcon,
  },
]

/** 全部导航项，供顶栏面包屑查找 */
export const ALL_NAV: NavItem[] = MODULE_NAV

/** 默认落地模块：访问 `/` 时重定向到这里（侧边栏首项） */
export const DEFAULT_NAV: NavItem = MODULE_NAV[0]!

/**
 * 去掉子路径部署的 basepath，得到相对路由路径。
 * dev 时 BASE_URL 为 '/'（前缀为空，原样返回）；
 * 线上为 '/ship-console/'，pathname 可能带也可能不带前缀，两种情况都兼容。
 */
export function toRoutePath(pathname: string): string {
  const base = import.meta.env.BASE_URL
  const prefix = base === '/' ? '' : base.replace(/\/+$/, '')
  const rel = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
  return rel === '' ? '/' : rel
}

/**
 * 按当前路径查找导航项：先精确匹配，再按最长前缀匹配子路由
 * （如 `/visualization/TRK-2026-001` 归属 `/visualization`），未匹配到时回落默认落地模块。
 */
export function findNav(pathname: string): NavItem {
  const path = toRoutePath(pathname)
  return (
    ALL_NAV.find((item) => item.path === path) ??
    ALL_NAV.find((item) => path.startsWith(`${item.path}/`)) ??
    DEFAULT_NAV
  )
}

/** 当前路径是否落在某导航项的子路由下（用于顶栏追加子级面包屑） */
export function isSubRouteOf(pathname: string, item: NavItem): boolean {
  const path = toRoutePath(pathname)
  return path !== item.path && path.startsWith(`${item.path}/`)
}