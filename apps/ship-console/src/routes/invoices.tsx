import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  DownloadIcon,
  EyeIcon,
  InboxIcon,
  RotateCcwIcon,
  SearchIcon,
  UploadIcon,
} from 'lucide-react'
import {
  FEE_CURRENCIES,
  INVOICE_CATEGORIES,
  INVOICE_STATUSES,
  getInvoices,
  type InvoiceRow,
  type InvoiceSearch,
  type InvoiceStatus,
} from '../data'
import { PageHeader } from '../components/PageHeader'
import { TableSkeleton } from '../components/TableSkeleton'

/** 发票审核状态徽章配色 */
const INVOICE_STATUS_CLASS: Record<InvoiceStatus, string> = {
  待审核: 'border-amber-200 bg-amber-50 text-amber-700',
  已通过: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  已驳回: 'border-red-200 bg-red-50 text-red-700',
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

/** XML 文本转义（发票占位单据用） */
function escapeXml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  )
}

/**
 * 生成发票原件的占位单据（SVG）。
 * 原型不接后端，用即时生成的 SVG 模拟「预览 / 下载发票文件」的完整交互。
 */
function invoiceDocument(row: InvoiceRow): string {
  const fields: Array<[string, string]> = [
    ['发票号', row.invoiceNo],
    ['关联提单号', row.blNo],
    ...(row.containerNo ? ([['关联箱号', row.containerNo]] as Array<[string, string]>) : []),
    ['船名 / 航次', `${row.vessel} / ${row.voyage}`],
    ['进出口', row.direction],
    ['费用类型', row.category],
    ['金额', `${row.amount.toLocaleString('en-US')} ${row.currency}`],
    ['上传人', row.uploader],
    ['上传时间', row.uploadedAt],
    ['审核状态', row.status],
  ]

  const body = fields
    .map(([k, v], i) => {
      const y = 240 + i * 46
      return (
        `<text x="60" y="${y}" font-size="18" fill="#6b7280">${escapeXml(k)}</text>` +
        `<text x="280" y="${y}" font-size="18" font-weight="600" fill="#111827">${escapeXml(v)}</text>` +
        `<line x1="60" y1="${y + 14}" x2="740" y2="${y + 14}" stroke="#e5e7eb" stroke-width="1"/>`
      )
    })
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">` +
    `<rect width="800" height="1000" fill="#ffffff"/>` +
    `<rect x="0" y="0" width="800" height="140" fill="#0f172a"/>` +
    `<text x="60" y="74" font-size="30" font-weight="700" fill="#ffffff">发票 · INVOICE</text>` +
    `<text x="60" y="110" font-size="15" fill="#94a3b8">船务信息中台 · 演示占位单据</text>` +
    `<text x="740" y="74" font-size="16" fill="#cbd5e1" text-anchor="end">${escapeXml(row.invoiceNo)}</text>` +
    body +
    `<text x="60" y="960" font-size="13" fill="#9ca3af">本文件由原型即时生成，仅用于演示发票预览与下载流程。</text>` +
    `</svg>`
  )
}

/** 发票占位单据的 data URL */
function invoiceDataUrl(row: InvoiceRow): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(invoiceDocument(row))}`
}

/** 下载发票原件（原型：下载即时生成的 SVG 占位单据） */
function downloadInvoice(row: InvoiceRow) {
  const a = document.createElement('a')
  a.href = invoiceDataUrl(row)
  a.download = `${row.invoiceNo}.svg`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 发票管理列表页：按提单号关联的发票台账 + 筛选 + 原件预览 / 下载 */
export function InvoicesPage() {
  const search = useSearch({ from: '/_layout/invoices' })
  const navigate = useNavigate({ from: '/invoices' })
  const { data, isPending } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices })
  const [preview, setPreview] = useState<InvoiceRow | null>(null)

  const all = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const q = (search.q ?? '').toLowerCase()
    return all.filter((r) => {
      if (search.status && r.status !== search.status) return false
      if (search.category && r.category !== search.category) return false
      if (search.currency && r.currency !== search.currency) return false
      if (q) {
        const hay = [r.invoiceNo, r.blNo, r.containerNo, r.vessel, r.voyage, r.uploader, r.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [all, search])

  const setSearch = (patch: Partial<InvoiceSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const hasFilter = Boolean(search.q || search.status || search.category || search.currency)
  const pendingCount = all.filter((r) => r.status === '待审核').length

  return (
    <>
      <PageHeader
        title="发票管理"
        desc="发票台账：每张发票关联一个提单号，支持按状态 / 费用类型 / 币种筛选，并预览或下载原件"
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.info('原型演示：发票上传暂未接入')}
        >
          <UploadIcon /> 上传发票
        </Button>
      </PageHeader>

      {/* 筛选条件 */}
      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
          <CardDescription>
            按发票号 / 提单号 / 箱号 / 船名组合筛选，条件保存在地址栏，可分享与回退
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q ?? ''}
              autoComplete="off"
              placeholder="搜索发票号 / 提单号 / 箱号 / 船名航次 / 上传人"
              className="pl-8"
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="审核状态"
              value={search.status ?? 'all'}
              onChange={(v) => setSearch({ status: v === 'all' ? undefined : (v as InvoiceStatus) })}
              options={INVOICE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <FilterSelect
              label="费用类型"
              value={search.category ?? 'all'}
              onChange={(v) => setSearch({ category: v === 'all' ? undefined : v })}
              options={INVOICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              label="币种"
              value={search.currency ?? 'all'}
              onChange={(v) => setSearch({ currency: v === 'all' ? undefined : (v as 'USD' | 'CNY') })}
              options={FEE_CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              共 {all.length} 张 · 待审核 {pendingCount} 张 · 当前筛选 {filtered.length} 张
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

      {/* 发票列表 */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-base">发票台账</CardTitle>
          <CardDescription className="mt-1 text-xs">
            {isPending
              ? '加载中…'
              : `共 ${filtered.length} 张 · 一行一张，每张关联一个提单号`}
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
              <p className="text-sm text-muted-foreground">没有符合条件的发票</p>
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
                  <TableHead className="h-9 pl-4">发票号</TableHead>
                  <TableHead className="h-9">关联提单号</TableHead>
                  <TableHead className="h-9">船名 / 航次</TableHead>
                  <TableHead className="h-9">费用类型</TableHead>
                  <TableHead className="h-9 text-right">金额</TableHead>
                  <TableHead className="h-9">上传人</TableHead>
                  <TableHead className="h-9">上传时间</TableHead>
                  <TableHead className="h-9">审核状态</TableHead>
                  <TableHead className="h-9 pr-4 text-right">发票原件</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2 pl-4 font-medium">{row.invoiceNo}</TableCell>
                    <TableCell>
                      <div className="font-mono font-medium">{row.blNo}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {row.direction}
                        {row.containerNo ? ` · ${row.containerNo}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{row.vessel}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {row.voyage}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.amount.toLocaleString('en-US')} {row.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.uploader}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.uploadedAt}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={INVOICE_STATUS_CLASS[row.status]}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => setPreview(row)}>
                          <EyeIcon /> 预览
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            downloadInvoice(row)
                            toast.success(`已下载 ${row.invoiceNo}.svg`)
                          }}
                        >
                          <DownloadIcon /> 下载
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 发票原件预览 */}
      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>发票原件预览</DialogTitle>
            <DialogDescription>
              {preview
                ? `${preview.file.name} · ${(preview.file.size / 1024).toFixed(0)} KB · 关联提单号 ${preview.blNo}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="max-h-[65vh] overflow-auto rounded-md border bg-muted/20 p-2">
              <img
                src={invoiceDataUrl(preview)}
                alt={`发票原件 ${preview.invoiceNo}`}
                className="mx-auto block w-full max-w-lg rounded-sm shadow-sm"
              />
            </div>
          ) : null}
          <DialogFooter>
            <p className="mr-auto text-[11px] text-muted-foreground">
              原型演示：预览与下载均为即时生成的占位单据
            </p>
            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
              关闭
            </Button>
            {preview ? (
              <Button
                size="sm"
                onClick={() => {
                  downloadInvoice(preview)
                  toast.success(`已下载 ${preview.invoiceNo}.svg`)
                }}
              >
                <DownloadIcon /> 下载原件
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}