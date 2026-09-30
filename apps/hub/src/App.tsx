import { prototypes } from '@tf/prototype-meta'
import { PrototypeCard } from './components/PrototypeCard'

export default function App() {
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

      <div className="hub__grid">
        {prototypes.map((meta) => (
          <PrototypeCard key={meta.id} meta={meta} />
        ))}
      </div>

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
