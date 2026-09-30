import { useMemo, useState } from 'react'
import { PlusIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@tf/ui'
import { cn, uid, useLocalStorage } from '@tf/utils'

interface TodoItem {
  id: string
  text: string
  done: boolean
}

type Filter = 'all' | 'active' | 'done'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'done', label: '已完成' },
]

const INITIAL_TODOS: TodoItem[] = [
  { id: uid('t'), text: '浏览 Hub 门户，了解仓库结构', done: true },
  { id: uid('t'), text: '体验待办清单的增删与筛选', done: false },
  { id: uid('t'), text: '运行 pnpm new my-idea 创建自己的原型', done: false },
]

export function IndexPage() {
  const [todos, setTodos, resetTodos] = useLocalStorage<TodoItem[]>('tf.todo-list', INITIAL_TODOS)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const shown = useMemo(
    () => todos.filter((t) => filter === 'all' || (filter === 'done') === t.done),
    [todos, filter],
  )
  const remaining = todos.filter((t) => !t.done).length

  function add() {
    const value = text.trim()
    if (!value) return
    setTodos((prev) => [{ id: uid('t'), text: value, done: false }, ...prev])
    setText('')
  }

  function toggle(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearDone() {
    setTodos((prev) => prev.filter((t) => !t.done))
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>待办清单</CardTitle>
          <CardDescription>最小交互原型 · 数据保存在 localStorage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="想做点什么？回车快速添加"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <Button onClick={add} disabled={!text.trim()}>
              <PlusIcon /> 添加
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.key} value={f.key}>
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-sm text-muted-foreground">{remaining} 项未完成</span>
          </div>

          <ul className="divide-y">
            {shown.length === 0 && (
              <li className="py-10 text-center">
                <p className="text-sm font-medium">这里空空如也</p>
                <p className="mt-1 text-xs text-muted-foreground">添加一条待办试试</p>
              </li>
            )}
            {shown.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 py-2.5">
                <Checkbox
                  id={`todo-${t.id}`}
                  checked={t.done}
                  onCheckedChange={() => toggle(t.id)}
                  aria-label={`勾选：${t.text}`}
                />
                <label
                  htmlFor={`todo-${t.id}`}
                  className={cn(
                    'min-w-0 flex-1 cursor-pointer text-sm',
                    t.done && 'text-muted-foreground line-through',
                  )}
                >
                  {t.text}
                </label>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => remove(t.id)}
                  aria-label={`删除：${t.text}`}
                >
                  <Trash2Icon className="text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={resetTodos}>
              <RotateCcwIcon /> 重置
            </Button>
            {todos.some((t) => t.done) && (
              <Button variant="ghost" size="sm" onClick={clearDone}>
                清除已完成
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        示例原型 · 组件来自 <code>@tf/ui</code>（shadcn/ui），持久化 Hook 来自{' '}
        <code>@tf/utils</code>
      </p>
    </main>
  )
}
