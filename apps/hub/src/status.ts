import type { PrototypeStatus } from '@tf/prototype-meta'
import type { TagColor } from '@tf/ui'

export interface StatusView {
  label: string
  color: TagColor
}

/** 原型状态的展示语义（门户卡片 / 筛选器共用） */
export const STATUS_META: Record<PrototypeStatus, StatusView> = {
  draft: { label: '草稿', color: 'gray' },
  wip: { label: '进行中', color: 'blue' },
  demo: { label: '可演示', color: 'green' },
  done: { label: '已完成', color: 'purple' },
}

export const STATUS_OPTIONS = Object.values(STATUS_META).map((s) => s.label)
