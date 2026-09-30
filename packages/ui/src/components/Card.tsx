import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@tf/utils'

/** 覆盖原生 title 属性类型：卡片标题允许渲染节点 */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  /** 右上角操作区 */
  extra?: ReactNode
}

export function Card({ title, subtitle, extra, className, children, ...rest }: CardProps) {
  return (
    <section className={cn('tf-card', className)} {...rest}>
      {(title || extra) && (
        <header className="tf-card__header">
          <div>
            <h3 className="tf-card__title">{title}</h3>
            {subtitle && <p className="tf-card__subtitle">{subtitle}</p>}
          </div>
          {extra && <div className="tf-card__extra">{extra}</div>}
        </header>
      )}
      <div className="tf-card__body">{children}</div>
    </section>
  )
}
