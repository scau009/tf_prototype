import { useMemo, useState } from 'react'
import { allTags, prototypes } from '@tf/prototype-meta'
import { Empty, Input } from '@tf/ui'
import { Chips } from './components/Chips'
import { PrototypeCard } from './components/PrototypeCard'
import { STATUS_META, STATUS_OPTIONS } from './status'

const TAG_OPTIONS = ['全部', ...allTags()]
const STATUS_FILTERS = ['全部', ...STATUS_OPTIONS]

export default function App() {
  const [keyword, setKeyword] = useState('')
  const [tag, setTag] = useState('全部')
  const [status, setStatus] = useState('全部')

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return prototypes.filter((p) => {
      const hitKeyword =
        !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.id.toLowerCase().includes(kw)
      const hitTag = tag === '全部' || p.tags.includes(tag)
      const hitStatus = status === '全部' || STATUS_META[p.status].label === status
      return hitKeyword && hitTag && hitStatus
    })
  }, [keyword, tag, status])

  return (
    <div className="hub">
      <header className="hub__header">
        <div className="hub__brand">
          <span className="hub__logo">TF</span>
          <div>
            <h1>原型导航中心</h1>
            <p>多项目原型仓库 · 共 {prototypes.length} 个原型在册</p>
          </div>
        </div>
        <code className="hub__cmd">$ pnpm dev</code>
      </header>

      <div className="hub__toolbar">
        <Input
          placeholder="搜索原型名称 / 简介 / id…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="hub__chips">
          <span className="hub__chip-label">标签</span>
          <Chips options={TAG_OPTIONS} value={tag} onChange={setTag} />
        </div>
        <div className="hub__chips">
          <span className="hub__chip-label">状态</span>
          <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="hub__grid">
          {filtered.map((meta) => (
            <PrototypeCard key={meta.id} meta={meta} />
          ))}
        </div>
      ) : (
        <Empty title="没有匹配的原型" description="换个关键词，或清除标签 / 状态筛选试试" />
      )}

      <footer className="hub__footer">
        {import.meta.env.DEV ? (
          <>
            <p>
              <strong>如何使用：</strong>运行 <code>pnpm dev</code> 并行启动门户与全部原型（门户在{' '}
              <code>5173</code>，原型依次使用 <code>5101+</code>），然后点击卡片上的「打开原型 ↗」。
            </p>
            <p>
              <strong>新增原型：</strong>运行 <code>pnpm new my-idea</code>，脚手架会自动创建目录、分配端口并注册到本门户。
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>线上版：</strong>门户与全部原型部署在同一站点，点击卡片上的「打开原型 ↗」即访问对应子路径。
            </p>
            <p>
              <strong>本地开发：</strong>克隆仓库后运行 <code>pnpm install &amp;&amp; pnpm dev</code>
              ；新增原型用 <code>pnpm new my-idea</code>，发布用 <code>pnpm deploy:cf</code>。
            </p>
          </>
        )}
      </footer>
    </div>
  )
}
