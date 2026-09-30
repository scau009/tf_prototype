import type { ReactNode } from 'react'
import { cn } from '@tf/utils'

export type TagColor = 'gray' | 'blue' | 'green' | 'orange' | 'red' | 'purple'

export interface TagProps {
  color?: TagColor
  className?: string
  children: ReactNode
}

export function Tag({ color = 'gray', className, children }: TagProps) {
  return <span className={cn('tf-tag', `tf-tag--${color}`, className)}>{children}</span>
}
