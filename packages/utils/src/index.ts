/** 拼接 className，自动跳过假值（配合组件库的 class 组合使用） */
export function cn(...parts: Array<string | number | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
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
