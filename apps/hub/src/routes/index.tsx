import { prototypes } from '@tf/prototype-meta'
import { PrototypeCard } from '../components/PrototypeCard'

export function IndexPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            TF
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">原型导航中心</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              多项目原型仓库 · 共 {prototypes.length} 个原型在册
            </p>
          </div>
        </div>
        <code className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
          $ pnpm dev
        </code>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prototypes.map((meta) => (
          <PrototypeCard key={meta.id} meta={meta} />
        ))}
      </div>

      <footer className="mt-10 space-y-2 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        {import.meta.env.DEV ? (
          <>
            <p>
              <strong className="text-foreground">如何使用：</strong>运行{' '}
              <code>pnpm dev</code> 并行启动门户与全部原型（门户在 <code>5173</code>，原型依次使用{' '}
              <code>5101+</code>），然后点击卡片上的「打开原型」。
            </p>
            <p>
              <strong className="text-foreground">新增原型：</strong>运行{' '}
              <code>pnpm new my-idea</code>，脚手架会自动创建目录、分配端口并注册到本门户。
            </p>
          </>
        ) : (
          <>
            <p>
              <strong className="text-foreground">线上版：</strong>门户与全部原型部署在同一站点，点击卡片上的「打开原型」即访问对应子路径。
            </p>
            <p>
              <strong className="text-foreground">本地开发：</strong>克隆仓库后运行{' '}
              <code>pnpm install &amp;&amp; pnpm dev</code>；新增原型用{' '}
              <code>pnpm new my-idea</code>，发布用 <code>pnpm deploy:cf</code>。
            </p>
          </>
        )}
      </footer>
    </div>
  )
}
