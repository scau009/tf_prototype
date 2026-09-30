import { useMemo, useState } from 'react'
import { Button, Card, Empty, Input } from '@tf/ui'
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

export default function App() {
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
    <main className="page">
      <Card
        title="待办清单"
        subtitle="最小交互原型 · 数据保存在 localStorage"
        extra={
          <Button size="sm" variant="ghost" onClick={resetTodos}>
            重置
          </Button>
        }
      >
        <div className="todo__form">
          <Input
            placeholder="想做点什么？回车快速添加"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Button variant="primary" onClick={add} disabled={!text.trim()}>
            添加
          </Button>
        </div>

        <div className="todo__filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={cn('todo__filter', filter === f.key && 'todo__filter--active')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <span className="todo__count">{remaining} 项未完成</span>
        </div>

        <ul className="todo__list">
          {shown.length === 0 && (
            <li>
              <Empty title="这里空空如也" description="添加一条待办试试" />
            </li>
          )}
          {shown.map((t) => (
            <li key={t.id} className={cn('todo__item', t.done && 'todo__item--done')}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                <span>{t.text}</span>
              </label>
              <button
                type="button"
                className="todo__remove"
                aria-label={`删除：${t.text}`}
                onClick={() => remove(t.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {todos.some((t) => t.done) && (
          <div className="todo__footer">
            <Button size="sm" variant="ghost" onClick={clearDone}>
              清除已完成
            </Button>
          </div>
        )}
      </Card>

      <p className="page__hint">
        示例原型 · 共享组件来自 <code>@tf/ui</code>，持久化 Hook 来自 <code>@tf/utils</code>
      </p>
    </main>
  )
}
