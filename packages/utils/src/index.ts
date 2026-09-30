import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 拼接 className 并合并 Tailwind 冲突类（shadcn/ui 生态标准实现）。
 * 兼容 clsx 的全部入参形态（字符串 / 数组 / 对象 / 假值）。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** 生成简单唯一 id（原型场景够用，非生产级） */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/** ISO 日期字符串 → 2026/09/30 */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`
}

/** 数字夹取 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export { useLocalStorage } from './hooks'
