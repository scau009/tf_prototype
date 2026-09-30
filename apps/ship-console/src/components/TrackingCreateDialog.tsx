import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Button,
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
  toast,
} from '@tf/ui'
import { PlusIcon, RadarIcon } from 'lucide-react'
import {
  CARRIERS,
  CARRIER_OPTIONS,
  createShipment,
  TRACKING_SOURCE_LABEL,
  TRACKING_SOURCES,
  type TrackingSource,
} from '../data'

/** 各输入方式的示例单号（占位提示） */
const SOURCE_PLACEHOLDER: Record<TrackingSource, string> = {
  booking: '如 BK261208',
  bl: '如 TFBL26001',
  container: '如 MSCU7123456',
}

/**
 * 新建跟踪记录：选择输入方式（预约号 / 提单号 / 箱号）→ 填单号 → 创建。
 * 创建成功后关闭弹窗并跳转到详情页（记录落在「订舱」进行中）。
 */
export function TrackingCreateDialog() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<TrackingSource>('booking')
  const [no, setNo] = useState('')
  const [carrier, setCarrier] = useState<string>(CARRIER_OPTIONS[0] ?? '')
  const navigate = useNavigate({ from: '/visualization' })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createShipment({ source, sourceNo: no, carrier }),
    onSuccess: (shipment) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      setOpen(false)
      setNo('')
      toast.success(`已创建跟踪记录 ${shipment.sourceNo}`)
      navigate({
        to: '/visualization/$shipmentId',
        params: { shipmentId: shipment.id },
      })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '创建失败')
    },
  })

  const submit = () => {
    if (!no.trim()) {
      toast.error('请输入单号')
      return
    }
    if (!carrier) {
      toast.error('请选择船司')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> 新建跟踪记录
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RadarIcon className="size-4 text-primary" />
            新建跟踪记录
          </DialogTitle>
          <DialogDescription>
            输入预约号、提单号或箱号并选择船司，创建后按「一票货」追踪 11 个节点的完整生命周期。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">输入方式</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRACKING_SOURCES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={source === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSource(s)}
                >
                  {TRACKING_SOURCE_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-no" className="text-xs text-muted-foreground">
              {TRACKING_SOURCE_LABEL[source]}
            </Label>
            <Input
              id="tracking-no"
              value={no}
              autoComplete="off"
              placeholder={SOURCE_PLACEHOLDER[source]}
              onChange={(e) => setNo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">船司（航司）</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择船司" />
              </SelectTrigger>
              <SelectContent>
                {CARRIER_OPTIONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code} · {CARRIERS[code]?.name ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              原型演示：创建后自动匹配该船司的一个未来航次，数据仅存于内存，刷新页面即还原。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button size="sm" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? '创建中…' : '创建并查看'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}