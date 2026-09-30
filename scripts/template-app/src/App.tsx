import { Card, Tag } from '@tf/ui'

export default function App() {
  return (
    <main className="page">
      <Card
        title="{{title}}"
        subtitle="新创建的原型 · 编辑 src/App.tsx 开始搭建"
        extra={<Tag color="blue">draft</Tag>}
      >
        <p className="starter__hint">
          目录结构：
          <br />
          • <code>src/App.tsx</code> —— 页面入口，从这里开始写交互
          <br />
          • <code>src/styles.css</code> —— 页面私有样式
          <br />
          • 共享组件来自 <code>@tf/ui</code>（Button / Card / Tag / Input / Empty），工具与 Hooks 来自{' '}
          <code>@tf/utils</code>
        </p>
      </Card>
    </main>
  )
}
