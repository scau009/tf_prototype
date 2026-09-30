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
  toast,
} from '@tf/ui'
import {
  InboxIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react'
import {
  DEMO_TODAY,
  FEE_CURRENCIES,
  TARIFF_CATEGORIES,
  createPortFee,
  getPortFees,
  type FeeCurrency,
  type PortFeeRow,
  type TariffSearch,
} from '../data'
import { PageHeader } from '../components/PageHeader'
import { TableSkeleton } from '../components/TableSkeleton'

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

/** 新增收费标准的表单空值 */
const EMPTY_FORM = {
  port: '',
  country: '',
  category: TARIFF_CATEGORIES[0]!,
  item: '',
  unit: '箱',
  price: '',
  currency: 'USD' as FeeCurrency,
  effectiveFrom: DEMO_TODAY,
}

/** 手动新增一条港口收费标准 */
function NewPortFeeDialog({ ports }: { ports: string[] }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      createPortFee({
        port: form.port,
        country: form.country,
        category: form.category,
        item: form.item,
        unit: form.unit,
        price: Number(form.price),
        currency: form.currency,
        effectiveFrom: form.effectiveFrom,
      }),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ['port-fees'] })
      setOpen(false)
      setForm(EMPTY_FORM)
      toast.success(`已新增收费标准：${row.port} · ${row.item}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '新增失败')
    },
  })

  const patch = (next: Partial<typeof EMPTY_FORM>) => setForm((prev) => ({ ...prev, ...next }))

  const submit = () => {
    if (!form.port.trim()) {
      toast.error('请填写港口')
      return
    }
    if (!form.item.trim()) {
      toast.error('请填写收费项')
      return
    }
    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      toast.error('请填写正确的收费标准')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> 新增记录
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增港口收费标准</DialogTitle>
          <DialogDescription>
            手动维护 Port Tariff Book 中的一条收费标准；新增后立即出现在列表顶部（仅存于内存）。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fee-port" className="text-xs text-muted-foreground">
              港口
            </Label>
            <Input
              id="fee-port"
              list="tariff-port-options"
              value={form.port}
              autoComplete="off"
              placeholder="如 蒙巴萨"
              onChange={(e) => patch({ port: e.target.value })}
            />
            <datalist id="tariff-port-options">
              {ports.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee-country" className="text-xs text-muted-foreground">
              国家/地区
            </Label>
            <Input
              id="fee-country"
              value={form.country}
              autoComplete="off"
              placeholder="如 肯尼亚"
              onChange={(e) => patch({ country: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">费用类别</Label>
            <Select value={form.category} onValueChange={(v) => patch({ category: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARIFF_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee-item" className="text-xs text-muted-foreground">
              收费项
            </Label>
            <Input
              id="fee-item"
              value={form.item}
              autoComplete="off"
              placeholder="如 码头操作费 THC"
              onChange={(e) => patch({ item: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee-unit" className="text-xs text-muted-foreground">
              计费单位
            </Label>
            <Input
              id="fee-unit"
              value={form.unit}
              autoComplete="off"
              placeholder="如 箱 / 箱/天 / 票"
              onChange={(e) => patch({ unit: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee-price" className="text-xs text-muted-foreground">
              收费标准
            </Label>
            <div className="flex gap-2">
              <Input
                id="fee-price"
                type="number"
                min={0}
                value={form.price}
                placeholder="0"
                onChange={(e) => patch({ price: e.target.value })}
              />
              <Select
                value={form.currency}
                onValueChange={(v) => patch({ currency: v as FeeCurrency })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEE_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fee-date" className="text-xs text-muted-foreground">
              生效日期
            </Label>
            <Input
              id="fee-date"
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => patch({ effectiveFrom: e.target.value })}
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

/** 港口收费标准（Port Tariff Book）列表页：筛选 + 搜索 + 手动新增 */
export function TariffBookPage() {
  const search = useSearch({ from: '/_layout/tariff-book' })
  const navigate = useNavigate({ from: '/tariff-book' })
  const { data, isPending } = useQuery({ queryKey: ['port-fees'], queryFn: getPortFees })

  const all = useMemo(() => data ?? [], [data])
  const ports = useMemo(() => [...new Set(all.map((r) => r.port))], [all])

  const filtered = useMemo(() => {
    const q = (search.q ?? '').toLowerCase()
    return all.filter((r) => {
      if (search.port && r.port !== search.port) return false
      if (search.category && r.category !== search.category) return false
      if (search.currency && r.currency !== search.currency) return false
      if (q) {
        const hay = [r.port, r.country, r.category, r.item, r.unit].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [all, search])

  const setSearch = (patch: Partial<TariffSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const hasFilter = Boolean(search.q || search.port || search.category || search.currency)

  return (
    <>
      <PageHeader
        title="港口收费标准"
        desc="Port Tariff Book：各港口费用类别的收费标准查询与维护，支撑进出口费用核对"
      >
        <NewPortFeeDialog ports={ports} />
      </PageHeader>

      {/* 筛选条件 */}
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
          <CardDescription>
            按港口 / 费用类别 / 币种组合筛选，支持关键字搜索，条件保存在地址栏
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q ?? ''}
              autoComplete="off"
              placeholder="搜索港口 / 国家 / 收费项"
              className="pl-8"
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="港口"
              value={search.port ?? 'all'}
              onChange={(v) => setSearch({ port: v === 'all' ? undefined : v })}
              options={ports.map((p) => ({ value: p, label: p }))}
            />
            <FilterSelect
              label="费用类别"
              value={search.category ?? 'all'}
              onChange={(v) => setSearch({ category: v === 'all' ? undefined : v })}
              options={TARIFF_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              label="币种"
              value={search.currency ?? 'all'}
              onChange={(v) => setSearch({ currency: v === 'all' ? undefined : (v as FeeCurrency) })}
              options={FEE_CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              共 {all.length} 条 · 当前筛选 {filtered.length} 条
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

      {/* 收费标准列表 */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-base">收费标准</CardTitle>
          <CardDescription className="mt-1 text-xs">
            {isPending ? '加载中…' : `共 ${filtered.length} 条 · 可手动新增记录`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <div className="p-4">
              <TableSkeleton rows={6} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <InboxIcon className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">没有符合条件的收费标准</p>
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
                  <TableHead className="h-9 pl-4">港口</TableHead>
                  <TableHead className="h-9">国家/地区</TableHead>
                  <TableHead className="h-9">费用类别</TableHead>
                  <TableHead className="h-9">收费项</TableHead>
                  <TableHead className="h-9">计费单位</TableHead>
                  <TableHead className="h-9 text-right">收费标准</TableHead>
                  <TableHead className="h-9">币种</TableHead>
                  <TableHead className="h-9 pr-4">生效日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row: PortFeeRow) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2 pl-4 font-medium">{row.port}</TableCell>
                    <TableCell className="text-muted-foreground">{row.country}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.item}</TableCell>
                    <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.price.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.currency}</TableCell>
                    <TableCell className="pr-4 tabular-nums text-muted-foreground">
                      {row.effectiveFrom}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}