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
import { SearchIcon, UploadIcon } from 'lucide-react'
import {
  getInvoices,
  getPortFees,
  type FeeTab,
  type InvoiceRow,
} from '../data'
import { PageHeader } from '../components/PageHeader'
import { TableSkeleton } from '../components/TableSkeleton'

/** 发票审核状态徽章配色 */
const INVOICE_STATUS_CLASS: Record<InvoiceRow['status'], string> = {
  待审核: 'border-amber-200 bg-amber-50 text-amber-700',
  已通过: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  已驳回: 'border-red-200 bg-red-50 text-red-700',
}

const FEE_PORTS = ['蒙巴萨', '拉各斯', '特马', '达累斯萨拉姆', '阿比让', '吉达', '盐田']
const FEE_CATEGORIES = ['装卸费', '港杂费', '堆存费', '拖轮费']

function FeeField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select defaultValue="all">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FeesPage() {
  /**
   * useSearch 的 `from` 要路由 id（pathless 布局的子路由 id 为 /_layout/fees），
   * useNavigate 的 `from` 要路由 path（/fees）—— 两者口径不同。
   */
  const { tab = 'invoice' } = useSearch({ from: '/_layout/fees' })
  const navigate = useNavigate({ from: '/fees' })

  const invoices = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
    enabled: tab === 'invoice',
  })
  const portFees = useQuery({
    queryKey: ['port-fees'],
    queryFn: getPortFees,
    enabled: tab === 'fee',
  })

  const notReady = () => toast.info('原型演示：该操作暂未接入')

  return (
    <>
      <PageHeader title="费用管理" desc="发票上传管理与港口收费标准查询，支撑进出口费用核对" />

      <Tabs
        value={tab}
        onValueChange={(v) =>
          navigate({ search: { tab: v as FeeTab }, replace: true })
        }
      >
        <TabsList>
          <TabsTrigger value="invoice">发票上传管理</TabsTrigger>
          <TabsTrigger value="fee">港口收费标准查询</TabsTrigger>
        </TabsList>

        {/* ── 发票上传管理 ── */}
        <TabsContent value="invoice" className="space-y-5">
          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="text-base">上传发票</CardTitle>
              <CardDescription>
                {invoices.isPending ? '加载中…' : `共 ${invoices.data!.length} 张 · 待审核 ${invoices.data!.filter((r) => r.status === '待审核').length} 张`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 上传占位区 */}
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 py-7 text-center">
                <UploadIcon className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  拖拽发票文件到此处，或
                  <Button variant="link" size="sm" className="px-1" onClick={notReady}>
                    选择文件
                  </Button>
                </p>
                <p className="text-xs text-muted-foreground/80">
                  支持 PDF / JPG，单文件 ≤ 20MB · 关联航次后进入审核流程
                </p>
              </div>

              {invoices.isPending ? (
                <TableSkeleton rows={4} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>发票号</TableHead>
                      <TableHead>关联航次</TableHead>
                      <TableHead>费用类型</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead>上传人</TableHead>
                      <TableHead>上传时间</TableHead>
                      <TableHead>审核状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.data!.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.invoiceNo}</TableCell>
                        <TableCell className="text-muted-foreground">{row.voyage}</TableCell>
                        <TableCell>{row.category}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 港口收费标准查询 ── */}
        <TabsContent value="fee" className="space-y-5">
          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="text-base">查询条件</CardTitle>
              <CardDescription>按港口与费用类别检索当前执行的收费标准</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FeeField label="港口" options={FEE_PORTS} />
                <FeeField label="费用类别" options={FEE_CATEGORIES} />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button size="sm" onClick={notReady}>
                  <SearchIcon /> 查询
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-5">
            <CardHeader>
              <CardTitle className="text-base">收费标准</CardTitle>
              <CardDescription>
                {portFees.isPending ? '加载中…' : `共 ${portFees.data!.length} 条 · 均为当前生效价`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portFees.isPending ? (
                <TableSkeleton rows={4} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>港口</TableHead>
                      <TableHead>国家/地区</TableHead>
                      <TableHead>费用类别</TableHead>
                      <TableHead>收费项</TableHead>
                      <TableHead>计费单位</TableHead>
                      <TableHead className="text-right">收费标准</TableHead>
                      <TableHead>币种</TableHead>
                      <TableHead>生效日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portFees.data!.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.port}</TableCell>
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
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.effectiveFrom}
                        </TableCell>
                      </TableRow>
                    ))}
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
