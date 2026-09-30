import type { LucideIcon } from 'lucide-react'
import {
  BellRingIcon,
  CalendarRangeIcon,
  ChartColumnIcon,
  ReceiptIcon,
} from 'lucide-react'

/** 中台全部路由路径（字面量联合，供 Link 的 to 做类型检查） */
export type RoutePath = '/schedule' | '/visualization' | '/fees' | '/monitoring'

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
    label: '船务可视化',
    desc: '船务运行总览：在航船舶、执行中航次、准班率与异常节点',
    icon: ChartColumnIcon,
  },
  {
    path: '/fees',
    label: '费用管理',
    desc: '发票上传管理与港口收费标准查询，支撑进出口费用核对',
    icon: ReceiptIcon,
  },
  {
    path: '/monitoring',
    label: '监控节点配置',
    desc: '关键业务节点的规则与告警阈值配置（ETD、到港、结算等）',
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

/** 按当前路径查找导航项（未匹配到时回落默认落地模块） */
export function findNav(pathname: string): NavItem {
  const path = toRoutePath(pathname)
  return ALL_NAV.find((item) => item.path === path) ?? DEFAULT_NAV
}