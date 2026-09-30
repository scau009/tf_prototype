/**
 * @tf/prototype-meta —— 原型注册表（唯一数据源）
 *
 * Hub 门户的全部展示内容来自这里。
 * 新增原型推荐运行 `pnpm new <name>`，脚本会自动在本文件插入条目；
 * 手动新增时，请插入到 `@prototypes:append-here` 标记处。
 */

export type PrototypeStatus = 'draft' | 'wip' | 'demo' | 'done'

export interface PrototypeMeta {
  /** 原型唯一 id：与 apps/ 目录名、包名 @tf/<id> 保持一致 */
  id: string
  /** 展示名称 */
  name: string
  /** 一句话简介（门户卡片展示） */
  description: string
  /** dev server 端口，约定 5100–5199，由 pnpm new 自动分配 */
  port: number
  /** 状态：draft 草稿 / wip 进行中 / demo 可演示 / done 已完成 */
  status: PrototypeStatus
  /** 最后更新日期 YYYY-MM-DD */
  updated: string
}

export const prototypes: PrototypeMeta[] = [
  // @prototypes:append-here
  {
    id: 'todo-list',
    name: '待办清单',
    description: '最小交互示例：添加、勾选、删除、筛选与 localStorage 持久化。',
    port: 5101,
    status: 'demo',
    updated: '2026-09-30',
  },
  {
    id: 'dashboard',
    name: '数据看板',
    description: '数据可视化示例：时间范围切换、指标卡与趋势图、渠道分布联动。',
    port: 5102,
    status: 'demo',
    updated: '2026-09-30',
  },
]

export function getPrototype(id: string): PrototypeMeta | undefined {
  return prototypes.find((p) => p.id === id)
}
