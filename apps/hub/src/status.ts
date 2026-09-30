import type { PrototypeStatus } from '@tf/prototype-meta'

export interface StatusView {
  label: string
  /** shadcn Badge variant */
  variant: 'default' | 'secondary' | 'outline'
  /** 状态专属配色（Tailwind 类） */
  className?: string
}

/** 原型状态的展示语义（门户卡片 / 筛选器共用） */
export const STATUS_META: Record<PrototypeStatus, StatusView> = {
  draft: { label: '草稿', variant: 'secondary' },
  wip: { label: '进行中', variant: 'default' },
  demo: {
    label: '可演示',
    variant: 'outline',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  done: {
    label: '已完成',
    variant: 'outline',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
}

export const STATUS_OPTIONS = Object.values(STATUS_META).map((s) => s.label)
