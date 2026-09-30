import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tf/ui'
import { InfoIcon, PlusIcon } from 'lucide-react'
import { getRules } from '../data'
import { PageHeader } from '../components/PageHeader'
import { TableSkeleton } from '../components/TableSkeleton'

/** 监控节点说明（框架层的业务口径） */
const NODES: Array<{ node: string; desc: string }> = [
  { node: '订舱确认', desc: '订舱后至舱位确认的环节' },
  { node: 'ETD 船期', desc: '预计开航前后的船期变动' },
  { node: '到港清关', desc: '抵港后至放行提货的环节' },
  { node: '费用结算', desc: '费用发生、发票与结算环节' },
]

export function MonitoringPage() {
  const { data: rules, isPending } = useQuery({
    queryKey: ['rules'],
    queryFn: getRules,
  })

  const notReady = () => toast.info('原型演示：规则编辑表单待接入')

  return (
    <>
      <PageHeader
        title="监控节点配置"
        desc="为关键业务节点配置监控规则：节点 + 触发条件 + 通知方式"
      >
        <Button size="sm" onClick={notReady}>
          <PlusIcon /> 新建规则
        </Button>
      </PageHeader>

      <Alert>
        <InfoIcon />
        <AlertTitle>规则怎么读</AlertTitle>
        <AlertDescription>
          当业务走到某个「监控节点」且满足「触发条件」时，按「通知方式」提醒责任人。下面的规则为演示数据，启停状态刷新后还原。
        </AlertDescription>
      </Alert>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">节点规则</CardTitle>
          <CardDescription>
            {isPending ? '加载中…' : `共 ${rules!.length} 条 · 启用 ${rules!.filter((r) => r.enabled).length} 条`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <TableSkeleton rows={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>监控节点</TableHead>
                  <TableHead>触发条件</TableHead>
                  <TableHead>通知方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后修改</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules!.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.node}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.condition}</TableCell>
                    <TableCell className="text-muted-foreground">{row.notify}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.enabled
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }
                      >
                        {row.enabled ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.updatedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">监控节点口径</CardTitle>
          <CardDescription>当前定义的四类业务节点</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
            {NODES.map((n) => (
              <li key={n.node}>
                · <strong className="text-foreground">{n.node}</strong>：{n.desc}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
