import type { InputHTMLAttributes } from 'react'
import { cn } from '@tf/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...rest }: InputProps) {
  return <input className={cn('tf-input', className)} {...rest} />
}
