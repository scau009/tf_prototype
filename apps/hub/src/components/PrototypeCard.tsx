import { useState } from 'react'
import type { PrototypeMeta } from '@tf/prototype-meta'
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  toast,
} from '@tf/ui'
import { formatDate } from '@tf/utils'
import { STATUS_META } from '../status'

export function PrototypeCard({ meta }: { meta: PrototypeMeta }) {
  const status = STATUS_META[meta.status]
  const [copied, setCopied] = useState(false)

  const devCommand = `pnpm --filter @tf/${meta.id} dev`

  // 开发态指向本地 dev server；构建后指向同站点的子路径 /<id>/
  const href = import.meta.env.DEV ? `http://localhost:${meta.port}` : `/${meta.id}/`

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(devCommand)
      setCopied(true)
      toast.success('启动命令已复制')
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 浏览器不支持剪贴板 API 时忽略 */
    }
  }

  return (
    <Card className="gap-4 py-5 transition-shadow hover:shadow-md">
      <CardHeader className="px-5">
        <div className="flex items-center justify-between">
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground">更新于 {formatDate(meta.updated)}</span>
        </div>
        <CardTitle className="text-lg">{meta.name}</CardTitle>
        <CardDescription className="line-clamp-2">{meta.description}</CardDescription>
      </CardHeader>
      <CardFooter className="justify-between px-5">
        <div className="flex min-w-0 items-center gap-2">
          <code className="truncate text-xs text-muted-foreground">{devCommand}</code>
          <Button variant="ghost" size="icon-sm" onClick={copyCommand} aria-label="复制启动命令">
            {copied ? <CheckIcon className="text-emerald-600" /> : <CopyIcon />}
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href={href}
            target={import.meta.env.DEV ? '_blank' : undefined}
            rel="noreferrer"
          >
            打开原型 <ArrowUpRightIcon />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
