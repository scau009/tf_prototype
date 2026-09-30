import { Tooltip, TooltipContent, TooltipTrigger } from '@tf/ui'
import { cn } from '@tf/utils'
import { AlertTriangleIcon } from 'lucide-react'
import {
  CONTAINER_NODE_DEFS,
  NODE_DEFS,
  NODE_LABEL,
  type Container,
  type ContainerRoll,
  type NodeDef,
  type NodeKey,
  type Shipment,
  type ShipmentNode,
} from '../data'
import { NODE_STATUS_META, NodeStatusTag } from './ShipmentStatusBadge'

/**
 * 横向迷你进度：节点圆点 + 连接线，颜色表示状态，悬停看时间。
 * 票级进度传 11 个聚合节点，单箱进度传 8 个箱级节点。
 */
export function NodeProgress({
  nodes,
  defs,
  currentKey,
}: {
  nodes: ShipmentNode[]
  defs: NodeDef[]
  currentKey: NodeKey
}) {
  const currentIdx = defs.findIndex((d) => d.key === currentKey)

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-start">
        {nodes.map((node, i) => {
          const meta = NODE_STATUS_META[node.status]
          const last = i === nodes.length - 1
          const done = node.status === 'done'
          return (
            <li key={node.key} className="flex items-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex w-16 cursor-default flex-col items-center gap-1.5 rounded-md px-0.5 py-1',
                      i === currentIdx && 'bg-muted/60',
                    )}
                  >
                    <span
                      className={cn(
                        'size-3 rounded-full border-2',
                        meta.dot,
                        node.status === 'pending' && 'bg-background',
                      )}
                    />
                    <span
                      className={cn(
                        'text-center text-[10px] leading-tight',
                        i === currentIdx
                          ? 'font-medium text-foreground'
                          : done
                            ? 'text-foreground/70'
                            : 'text-muted-foreground',
                      )}
                    >
                      {NODE_LABEL[node.key]}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">
                    {NODE_LABEL[node.key]} · {meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-background/70 tabular-nums">
                    {node.actualAt
                      ? `实际 ${node.actualAt}`
                      : node.plannedAt
                        ? `计划 ${node.plannedAt}`
                        : '暂无时间'}
                  </p>
                  {node.details?.map((d) => (
                    <p key={d.label} className="mt-0.5 text-[11px] text-background/70 tabular-nums">
                      {d.label} {d.value}
                    </p>
                  ))}
                  {node.failReason ? (
                    <p className="mt-0.5 text-[11px] text-red-300">失败原因：{node.failReason}</p>
                  ) : null}
                  {node.note ? <p className="mt-0.5 text-[11px] text-amber-300">{node.note}</p> : null}
                </TooltipContent>
              </Tooltip>
              {!last ? (
                <span
                  className={cn('mt-[13px] h-0.5 w-3 shrink-0', done ? 'bg-emerald-500' : 'bg-border')}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** 整票进度：11 个聚合节点 */
export function ShipmentProgress({ shipment }: { shipment: Shipment }) {
  return <NodeProgress nodes={shipment.nodes} defs={NODE_DEFS} currentKey={shipment.currentNode} />
}

/** 纵向时间轴：逐节点展开状态 / 计划与实际 / 聚合明细 / 失败与备注 */
export function NodeTimeline({ nodes, defs }: { nodes: ShipmentNode[]; defs: NodeDef[] }) {
  return (
    <ol>
      {nodes.map((node, i) => {
        const def = defs[i]!
        const last = i === nodes.length - 1
        const started = node.status !== 'pending'
        return (
          <li key={node.key} className="flex gap-3">
            {/* 轴：节点圆点 + 竖线 */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'z-10 mt-1.5 size-3 shrink-0 rounded-full border-2',
                  NODE_STATUS_META[node.status].dot,
                  node.status === 'pending' && 'bg-background',
                )}
              />
              {!last ? (
                <span
                  className={cn('w-px flex-1', node.status === 'done' ? 'bg-emerald-300' : 'bg-border')}
                />
              ) : null}
            </div>

            {/* 内容 */}
            <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-4')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-sm font-medium', !started && 'text-muted-foreground')}>
                  {def.label}
                </span>
                <NodeStatusTag status={node.status} />
                <span className="text-[11px] text-muted-foreground">{def.desc}</span>
              </div>

              {(node.plannedAt || node.actualAt || node.details?.length) && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  {node.plannedAt ? (
                    <span>
                      计划 <span className="text-foreground/80 tabular-nums">{node.plannedAt}</span>
                    </span>
                  ) : null}
                  {node.actualAt ? (
                    <span>
                      实际 <span className="text-foreground/80 tabular-nums">{node.actualAt}</span>
                    </span>
                  ) : null}
                  {node.details?.map((d) => (
                    <span key={d.label}>
                      {d.label} <span className="text-foreground/80 tabular-nums">{d.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {node.failReason ? (
                <p className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                  失败原因：{node.failReason}
                </p>
              ) : null}
              {node.note ? (
                <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                  {node.note}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** 甩柜改配提示条：原船名航次 → 改配后船名航次 */
export function RollBanner({ roll, container }: { roll: ContainerRoll; container: Container }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
      <p className="flex items-center gap-1.5 font-medium">
        <AlertTriangleIcon className="size-3.5" />
        甩柜改配：{roll.reason}
      </p>
      <p className="mt-1 tabular-nums">
        原 {roll.originalVessel}/{roll.originalVoyage}（{roll.originalEtd} 开船）
        <span className="mx-1.5 text-amber-500">→</span>
        <span className="font-medium">
          现 {container.vessel}/{container.voyage}（{container.etd} 开船）
        </span>
      </p>
      <p className="mt-0.5 text-amber-600/80">改配记录时间 {roll.at}</p>
    </div>
  )
}

/** 单箱时间轴：8 个箱级节点 +（如有）甩柜改配提示 */
export function ContainerTimeline({ container }: { container: Container }) {
  return (
    <div className="space-y-3">
      {container.roll ? <RollBanner roll={container.roll} container={container} /> : null}
      <NodeTimeline nodes={container.nodes} defs={CONTAINER_NODE_DEFS} />
    </div>
  )
}