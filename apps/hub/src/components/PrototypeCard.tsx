import { useState } from 'react'
import type { PrototypeMeta } from '@tf/prototype-meta'
import { Button, Tag } from '@tf/ui'
import { formatDate } from '@tf/utils'
import { STATUS_META } from '../status'

export function PrototypeCard({ meta }: { meta: PrototypeMeta }) {
  const status = STATUS_META[meta.status]
  const [copied, setCopied] = useState(false)

  const devCommand = `pnpm dev --filter @tf/${meta.id}`

  // 开发态指向本地 dev server；构建后指向同站点的子路径 /<id>/
  const href = import.meta.env.DEV
    ? `http://localhost:${meta.port}`
    : `/${meta.id}/`

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(devCommand)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 浏览器不支持剪贴板 API 时忽略 */
    }
  }

  return (
    <article className="proto-card">
      <div className="proto-card__top">
        <Tag color={status.color}>{status.label}</Tag>
        <span className="proto-card__updated">更新于 {formatDate(meta.updated)}</span>
      </div>

      <h2 className="proto-card__title">{meta.name}</h2>
      <p className="proto-card__desc">{meta.description}</p>

      <div className="proto-card__tags">
        {meta.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="proto-card__footer">
        <code>{devCommand}</code>
        <Button size="sm" variant="ghost" onClick={copyCommand}>
          {copied ? '已复制 ✓' : '复制'}
        </Button>
        <a
          className="proto-card__link"
          href={href}
          target={import.meta.env.DEV ? '_blank' : undefined}
          rel="noreferrer"
        >
          打开原型 ↗
        </a>
      </div>
    </article>
  )
}
