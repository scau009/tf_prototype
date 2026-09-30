import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@tf/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('tf-btn', `tf-btn--${variant}`, `tf-btn--${size}`, className)}
      {...rest}
    />
  )
}
