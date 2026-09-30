import { useCallback, useEffect, useState } from 'react'

/**
 * localStorage 持久化 state（原型演示常用）
 * 存取失败（隐私模式 / 超限）时静默降级为普通 useState。
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* 忽略存储异常 */
    }
  }, [key, value])

  /** 恢复为初始值 */
  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
