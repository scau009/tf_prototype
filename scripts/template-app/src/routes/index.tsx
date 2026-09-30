import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tf/ui'

export function IndexPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{{title}}</CardTitle>
            <Badge variant="secondary">draft</Badge>
          </div>
          <CardDescription>新创建的原型 · 编辑 src/routes/index.tsx 开始搭建</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>目录结构与约定：</p>
          <ul className="space-y-1.5">
            <li>· <code>src/routes/</code> —— 页面路由（代码式 TanStack Router，新页面加 Route 后在 <code>src/router.tsx</code> 注册）</li>
            <li>· <code>src/data.ts</code> —— mock 数据（建议配合 TanStack Query 的 useQuery 消费）</li>
            <li>· <code>src/styles.css</code> —— Tailwind 入口（令牌来自 <code>@tf/ui</code>）</li>
            <li>· 组件来自 <code>@tf/ui</code>（shadcn/ui），缺组件时到 <code>packages/ui</code> 用 shadcn CLI 添加</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
