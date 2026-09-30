import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@tf/ui'
import { cn } from '@tf/utils'
import { InboxIcon, PlusIcon, RotateCcwIcon, SearchIcon } from 'lucide-react'
import {
  NODE_DEFS,
  NODE_LABEL,
  createRule,
  getMonitorNodes,
  getRules,
  updateMonitorNode,
  updateRuleEnabled,
  type AttentionLevel,
  type MonitoringSearch,
  type MonitorNodeRow,
  type NodeKey,
  type RuleRow,
} from '../data'
import { PageHeader } from '../components/PageHeader'
import { TableSkeleton } from '../components/TableSkeleton'

/** 预警等级展示口径（与在途追踪「需要关注」一致） */
const LEVEL_META: Record<AttentionLevel, { label: string; cls: string }> = {
  alert: { label: '异常', cls: 'border-red-200 bg-red-50 text-red-700' },
  warning: { label: '提醒', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
}

/** 节点归集粒度展示名 */
const SCOPE_LABEL = { shipment: '票级', container: '箱级' } as const

/** 提前预警时长可选值（小时） */
const LEAD_OPTIONS = [0, 6, 12, 24, 48, 72]

const leadLabel = (h: number) => (h === 0 ? '不提前' : `提前 ${h}h`)

/** 开关（原生 button 实现，避免额外依赖） */
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-emerald-300 bg-emerald-500' : 'border-border bg-muted',
      )}
    >
      <span
        className={cn('size-3.5 rounded-full bg-white shadow-sm transition-all', checked && 'ml-auto')}
      />
    </button>
  )
}

/** 受控筛选下拉（值 'all' = 不限） */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** 新建预警规则表单空值 */
const EMPTY_RULE = {
  name: '',
  node: 'booking' as NodeKey,
  condition: '',
  level: 'warning' as AttentionLevel,
}

/** 新建一条预警规则 */
function NewRuleDialog({ nodes }: { nodes: MonitorNodeRow[] }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_RULE)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createRule(form),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ['rules'] })
      setOpen(false)
      setForm(EMPTY_RULE)
      // 节点监控关闭时新规则落库但不生效，提示一下，避免误以为已生效
      const nodeOpen = nodes.find((n) => n.key === row.node)?.enabled ?? true
      if (nodeOpen) toast.success(`已新增规则：${row.name}`)
      else toast.info(`已新增规则：${row.name}（该节点监控已关闭，暂不生效）`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '新增失败')
    },
  })

  const patch = (next: Partial<typeof EMPTY_RULE>) => setForm((prev) => ({ ...prev, ...next }))

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('请填写规则名称')
      return
    }
    if (!form.condition.trim()) {
      toast.error('请填写触发条件')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> 新建规则
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新建预警规则</DialogTitle>
          <DialogDescription>
            针对单票提单生命周期中的某个节点配置预警；新增后立即出现在列表顶部（仅存于内存）。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rule-name" className="text-xs text-muted-foreground">
              规则名称
            </Label>
            <Input
              id="rule-name"
              value={form.name}
              autoComplete="off"
              placeholder="如 中转港滞留超 5 天"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">监控节点</Label>
            <Select value={form.node} onValueChange={(v) => patch({ node: v as NodeKey })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_DEFS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">预警等级</Label>
            <Select
              value={form.level}
              onValueChange={(v) => patch({ level: v as AttentionLevel })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">提醒</SelectItem>
                <SelectItem value="alert">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rule-condition" className="text-xs text-muted-foreground">
              触发条件
            </Label>
            <Input
              id="rule-condition"
              value={form.condition}
              autoComplete="off"
              placeholder="如 在中转港停留 > 5 天仍未离港"
              onChange={(e) => patch({ condition: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button size="sm" disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending ? '新增中…' : '确认新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 监控节点配置：仅面向「单票提单（一票货）」的在途生命周期。
 * 上层配置 11 个生命周期节点的监控开关与提前量，下层配置各节点的预警规则。
 */
export function MonitoringPage() {
  const search = useSearch({ from: '/_layout/monitoring' })
  const navigate = useNavigate({ from: '/monitoring' })
  const queryClient = useQueryClient()

  const { data: nodes, isPending: nodesPending } = useQuery({
    queryKey: ['monitor-nodes'],
    queryFn: getMonitorNodes,
  })
  const { data: rules, isPending: rulesPending } = useQuery({
    queryKey: ['rules'],
    queryFn: getRules,
  })

  const toggleNode = useMutation({
    mutationFn: ({ key, patch }: { key: NodeKey; patch: { enabled?: boolean; leadHours?: number } }) =>
      updateMonitorNode(key, patch),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ['monitor-nodes'] })
      toast.success(`${NODE_LABEL[row.key]}监控已${row.enabled ? '开启' : '关闭'}`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '更新失败'),
  })

  const toggleRule = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateRuleEnabled(id, enabled),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ['rules'] })
      toast.success(`规则「${row.name}」已${row.enabled ? '启用' : '停用'}`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '更新失败'),
  })

  const allNodes = useMemo(() => nodes ?? [], [nodes])
  const allRules = useMemo(() => rules ?? [], [rules])

  /** 节点监控开启的节点集合 */
  const openNodeKeys = useMemo(
    () => new Set<NodeKey>(allNodes.filter((n) => n.enabled).map((n) => n.key)),
    [allNodes],
  )

  /** 生效 = 节点监控开启 且 规则启用（节点关闭对该节点下规则一票否决） */
  const isEffective = (r: RuleRow) => openNodeKeys.has(r.node) && r.enabled

  const enabledNodes = allNodes.filter((n) => n.enabled).length
  const effectiveRules = allRules.filter(isEffective).length
  const ruleCountOf = (key: NodeKey) => allRules.filter((r) => r.node === key).length
  /** 节点下「生效 / 全部」规则数（节点关闭时生效数恒为 0） */
  const effectiveRuleCountOf = (key: NodeKey) =>
    openNodeKeys.has(key) ? allRules.filter((r) => r.node === key && r.enabled).length : 0

  const filtered = useMemo(() => {
    const q = (search.q ?? '').toLowerCase()
    return allRules.filter((r) => {
      if (search.node && r.node !== search.node) return false
      if (search.level && r.level !== search.level) return false
      const effective = openNodeKeys.has(r.node) && r.enabled
      if (search.status === 'on' && !effective) return false
      if (search.status === 'off' && effective) return false
      if (q) {
        const hay = [r.name, NODE_LABEL[r.node], r.condition].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allRules, openNodeKeys, search])

  const setSearch = (patch: Partial<MonitoringSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const hasFilter = Boolean(search.q || search.node || search.level || search.status)

  return (
    <>
      <PageHeader
        title="监控节点配置"
        desc="以一票提单（一票货）为单位，配置在途生命周期节点的监控与预警规则"
      />

      <Tabs defaultValue={hasFilter ? 'rules' : 'nodes'} className="gap-5">
        <TabsList>
          <TabsTrigger value="nodes">
            生命周期节点监控
            <span className="text-[11px] tabular-nums opacity-70">
              {nodesPending ? '—' : `${enabledNodes} / ${allNodes.length}`}
            </span>
          </TabsTrigger>
          <TabsTrigger value="rules">
            规则配置
            <span className="text-[11px] tabular-nums opacity-70">
              {rulesPending ? '—' : `生效 ${effectiveRules} / ${allRules.length}`}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* 生命周期节点监控 */}
        <TabsContent value="nodes" className="mt-0">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-base">生命周期节点监控</CardTitle>
              <CardDescription className="mt-1 text-xs">
                逐个节点开关监控并设置提前预警时长；节点顺序即一票货的在途推进顺序。「提前预警」是该节点的默认提前扫描窗口，
                规则条件中已写明阈值时以条件为准。节点关闭后其下规则不生效
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {nodesPending ? (
                <div className="p-4">
                  <TableSkeleton rows={6} />
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 w-10 pl-4">#</TableHead>
                      <TableHead className="h-9">节点</TableHead>
                      <TableHead className="h-9">粒度</TableHead>
                      <TableHead className="h-9">节点说明</TableHead>
                      <TableHead className="h-9">提前预警</TableHead>
                      <TableHead className="h-9 text-right">生效规则</TableHead>
                      <TableHead className="h-9">监控</TableHead>
                      <TableHead className="h-9 pr-4">最后修改</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allNodes.map((row, idx) => {
                      const def = NODE_DEFS.find((d) => d.key === row.key)!
                      return (
                        <TableRow key={row.key} className={cn(!row.enabled && 'text-muted-foreground')}>
                          <TableCell className="py-2 pl-4 tabular-nums text-muted-foreground">
                            {String(idx + 1).padStart(2, '0')}
                          </TableCell>
                          <TableCell className="font-medium">{def.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {SCOPE_LABEL[def.scope]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[26rem] text-muted-foreground">
                            {def.desc}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(row.leadHours)}
                              disabled={!row.enabled || toggleNode.isPending}
                              onValueChange={(v) =>
                                toggleNode.mutate({ key: row.key, patch: { leadHours: Number(v) } })
                              }
                            >
                              <SelectTrigger size="sm" className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_OPTIONS.map((h) => (
                                  <SelectItem key={h} value={String(h)}>
                                    {leadLabel(h)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            <span className={cn(row.enabled && 'font-medium text-foreground')}>
                              {effectiveRuleCountOf(row.key)}
                            </span>
                            {' / '}
                            {ruleCountOf(row.key)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Toggle
                                checked={row.enabled}
                                disabled={toggleNode.isPending}
                                label={`${def.label}监控开关`}
                                onChange={(next) =>
                                  toggleNode.mutate({ key: row.key, patch: { enabled: next } })
                                }
                              />
                              <span className="text-[11px] text-muted-foreground">
                                {row.enabled ? '已开启' : '已关闭'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 tabular-nums text-muted-foreground">
                            {row.updatedAt}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 规则配置：筛选条件 + 预警规则 */}
        <TabsContent value="rules" className="mt-0 space-y-5">
          {/* 筛选条件 */}
          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="text-base">筛选条件</CardTitle>
              <CardDescription>
                按监控节点 / 预警等级 / 状态组合筛选，支持关键字搜索，条件保存在地址栏
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search.q ?? ''}
                  autoComplete="off"
                  placeholder="搜索规则名称 / 触发条件"
                  className="pl-8"
                  onChange={(e) => setSearch({ q: e.target.value || undefined })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSelect
                  label="监控节点"
                  value={search.node ?? 'all'}
                  onChange={(v) => setSearch({ node: v === 'all' ? undefined : (v as NodeKey) })}
                  options={NODE_DEFS.map((d) => ({ value: d.key, label: d.label }))}
                />
                <FilterSelect
                  label="预警等级"
                  value={search.level ?? 'all'}
                  onChange={(v) =>
                    setSearch({ level: v === 'all' ? undefined : (v as AttentionLevel) })
                  }
                  options={[
                    { value: 'alert', label: '异常' },
                    { value: 'warning', label: '提醒' },
                  ]}
                />
                <FilterSelect
                  label="状态"
                  value={search.status ?? 'all'}
                  onChange={(v) =>
                    setSearch({
                      status: v === 'all' ? undefined : (v as MonitoringSearch['status']),
                    })
                  }
                  options={[
                    { value: 'on', label: '已生效' },
                    { value: 'off', label: '未生效' },
                  ]}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  共 {allRules.length} 条 · 当前筛选 {filtered.length} 条
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!hasFilter}
                  onClick={() => navigate({ search: {}, replace: true })}
                >
                  <RotateCcwIcon /> 重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 预警规则 */}
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base">预警规则</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {rulesPending
                      ? '加载中…'
                      : `共 ${filtered.length} 条 · 生效 ${filtered.filter(isEffective).length} 条 · 节点关闭时其规则不生效`}
                  </CardDescription>
                </div>
                <NewRuleDialog nodes={allNodes} />
              </div>
            </CardHeader>

            <CardContent className="px-0">
              {rulesPending ? (
                <div className="p-4">
                  <TableSkeleton rows={6} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <InboxIcon className="size-8 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">没有符合条件的预警规则</p>
                  {hasFilter ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate({ search: {}, replace: true })}
                    >
                      清除筛选条件
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4">规则名称</TableHead>
                      <TableHead className="h-9">监控节点</TableHead>
                      <TableHead className="h-9">触发条件</TableHead>
                      <TableHead className="h-9">预警等级</TableHead>
                      <TableHead className="h-9">状态</TableHead>
                      <TableHead className="h-9 pr-4">最后修改</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row: RuleRow) => {
                      const nodeOpen = openNodeKeys.has(row.node)
                      return (
                      <TableRow key={row.id} className={cn(!nodeOpen && 'bg-muted/30')}>
                        <TableCell className="py-2 pl-4 font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {NODE_LABEL[row.node]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[24rem] text-muted-foreground">
                          {row.condition}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-normal', LEVEL_META[row.level].cls)}>
                            {LEVEL_META[row.level].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={row.enabled}
                              disabled={toggleRule.isPending}
                              label={`规则「${row.name}」开关`}
                              onChange={(next) => toggleRule.mutate({ id: row.id, enabled: next })}
                            />
                            <span
                              className={cn(
                                'text-[11px]',
                                nodeOpen ? 'text-muted-foreground' : 'font-medium text-amber-600',
                              )}
                            >
                              {nodeOpen ? (row.enabled ? '启用' : '停用') : '未生效 · 节点已关闭'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-4 tabular-nums text-muted-foreground">
                          {row.updatedAt}
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}