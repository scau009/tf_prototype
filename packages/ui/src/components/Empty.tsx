import type { ReactNode } from 'react'

export interface EmptyProps {
  title?: ReactNode
  description?: ReactNode
}

export function Empty({ title = '暂无内容', description }: EmptyProps) {
  return (
    <div className="tf-empty">
      <div className="tf-empty__icon">◎</div>
      <p className="tf-empty__title">{title}</p>
      {description && <p className="tf-empty__description">{description}</p>}
    </div>
  )
}
