/**
 * 船务信息中台 · mock 数据（自包含，不连后端）
 *
 * 约定：页面统一经 TanStack Query 消费，异步函数带 300ms 延迟，
 * 用于演示骨架屏；数据为固定演示数据（可复现，不随刷新变化）。
 */

/** 模拟异步延迟 */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ────────────────────────────── 1. 船期运价查询 ──────────────────────────────

// ── 日期工具（船期日历） ──

/**
 * 演示用的「今天」：mock 船期以它为基准生成，保证日历始终有数据、形态可复现。
 * 对接真实数据时，把这里换成 `new Date()` 即可。
 */
export const DEMO_TODAY = '2026-09-30'

/** 日历最多可查看的天数（今天 → 今天 + 30 天） */
export const CALENDAR_RANGE_DAYS = 30

/** 日历默认窗口天数（未来 7 天） */
export const CALENDAR_WINDOW_DAYS = 7

/** ISO 日期加减天数（UTC，避免时区偏移） */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** to − from 的天数差 */
export function diffDays(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** 是否为可查看区间内的出发日（今天 ~ 30 天后） */
export function isValidScheduleDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const offset = diffDays(DEMO_TODAY, value)
  return offset >= 0 && offset <= CALENDAR_RANGE_DAYS
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 星期几（中文） */
export function weekdayLabel(date: string): string {
  return WEEKDAY_LABELS[new Date(`${date}T00:00:00Z`).getUTCDay()]!
}

// ── 数据模型 ──

/** 支持的箱型（柜型） */
export type ContainerType = '20GP' | '40GP' | '40HQ' | '45HQ' | '40RF'

/** 箱型 + 参考运价（USD / 箱） */
export interface ContainerRate {
  type: ContainerType
  price: number
}

/** 船公司（含 logo 展示所需的品牌信息） */
export interface Carrier {
  /** 英文代码（列表展示） */
  code: string
  /** 中文名称 */
  name: string
  /** logo 缩写（不超过 3 个字符） */
  short: string
  /** 品牌色，作为 logo 底色 */
  color: string
}

/** 船公司字典：新增船司在此登记，船期数据统一引用这一份 */
export const CARRIERS: Record<string, Carrier> = {
  MSC: { code: 'MSC', name: '地中海航运', short: 'MSC', color: '#12395f' },
  COSCO: { code: 'COSCO', name: '中远海运', short: 'COS', color: '#0b4ea2' },
  EVERGREEN: { code: 'EVERGREEN', name: '长荣海运', short: 'EMC', color: '#00834e' },
  ONE: { code: 'ONE', name: '海洋网联', short: 'ONE', color: '#ee2e4b' },
  MAERSK: { code: 'MAERSK', name: '马士基', short: 'MSK', color: '#3ea7cc' },
  'CMA CGM': { code: 'CMA CGM', name: '达飞轮船', short: 'CMA', color: '#e11b22' },
  HMM: { code: 'HMM', name: '现代商船', short: 'HMM', color: '#11488c' },
}

/** 船公司筛选下拉的选项（保持字典顺序） */
export const CARRIER_OPTIONS: string[] = Object.values(CARRIERS).map((c) => c.code)

export interface ScheduleRow {
  id: string
  /** 船公司（含 logo 品牌信息） */
  carrier: Carrier
  /** 船名 */
  vessel: string
  /** 所属航线 */
  route: string
  /** 航次号 */
  voyage: string
  /** 起运港 */
  origin: string
  /** 预计开航日 ETD（= 起运港出发日期，日历以它为准） */
  etd: string
  /** 中转次数，0 = 直航 */
  transshipCount: number
  /** 中转港（按先后顺序，直航为空数组） */
  transshipPorts: string[]
  /** 目的港 */
  destination: string
  /** 预计到港日 ETA */
  eta: string
  /** 支持箱型与参考运价 */
  containers: ContainerRate[]
  /** 预计时效（天） */
  transitDays: number
  /** 订舱截止 */
  cutoff: string
  /** 数据更新时间 */
  updatedAt: string
  /** 舱位状态 */
  status: '正常' | '爆舱' | '价格更新'
}

/** 用「距今天的出发天数」生成船期，ETA / 订舱截止自动推导，避免手写不一致 */
function makeSchedule(input: {
  id: string
  carrier: Carrier
  vessel: string
  route: string
  voyage: string
  origin: string
  /** 出发日相对 DEMO_TODAY 的天数（0 = 今天） */
  departIn: number
  /** 中转港（省略即直航） */
  via?: string[]
  destination: string
  transitDays: number
  containers: ContainerRate[]
  /** 订舱截止 = 出发日前 N 天，默认 2 天 */
  cutoffDays?: number
  updatedAt: string
  status?: ScheduleRow['status']
}): ScheduleRow {
  const etd = addDays(DEMO_TODAY, input.departIn)
  const via = input.via ?? []
  return {
    id: input.id,
    carrier: input.carrier,
    vessel: input.vessel,
    route: input.route,
    voyage: input.voyage,
    origin: input.origin,
    etd,
    transshipCount: via.length,
    transshipPorts: via,
    destination: input.destination,
    eta: addDays(etd, input.transitDays),
    containers: input.containers,
    transitDays: input.transitDays,
    cutoff: addDays(etd, -(input.cutoffDays ?? 2)),
    updatedAt: input.updatedAt,
    status: input.status ?? '正常',
  }
}

/** 船期表：覆盖未来 30 天内的起运港出发日（部分日期无船期） */
const SCHEDULES: ScheduleRow[] = [
  makeSchedule({
    id: 'SCH-2608',
    carrier: CARRIERS.MSC,
    vessel: 'MSC ISABELLA',
    route: '亚洲 — 东非',
    voyage: '418W',
    origin: '深圳盐田',
    departIn: 0,
    destination: '蒙巴萨',
    transitDays: 25,
    containers: [
      { type: '20GP', price: 1820 },
      { type: '40GP', price: 2560 },
      { type: '40HQ', price: 2620 },
      { type: '40RF', price: 3950 },
    ],
    updatedAt: '2026-09-29 18:30',
  }),
  makeSchedule({
    id: 'SCH-2609',
    carrier: CARRIERS.COSCO,
    vessel: 'COSCO ARIES',
    route: '亚洲 — 西非',
    voyage: '092E',
    origin: '上海外高桥',
    departIn: 1,
    via: ['新加坡'],
    destination: '拉各斯',
    transitDays: 33,
    containers: [
      { type: '20GP', price: 2480 },
      { type: '40GP', price: 3520 },
      { type: '40HQ', price: 3600 },
      { type: '45HQ', price: 3780 },
    ],
    updatedAt: '2026-09-29 16:12',
  }),
  makeSchedule({
    id: 'SCH-2610',
    carrier: CARRIERS.EVERGREEN,
    vessel: 'EVER SUMMIT',
    route: '亚洲 — 红海',
    voyage: '1108W',
    origin: '宁波北仑',
    departIn: 3,
    destination: '吉达',
    transitDays: 22,
    containers: [
      { type: '20GP', price: 1660 },
      { type: '40GP', price: 2380 },
      { type: '40HQ', price: 2420 },
      { type: '45HQ', price: 2600 },
    ],
    updatedAt: '2026-09-30 09:40',
    status: '价格更新',
  }),
  makeSchedule({
    id: 'SCH-2601',
    carrier: CARRIERS.MSC,
    vessel: 'MSC AURORA',
    route: '亚洲 — 东非',
    voyage: '412W',
    origin: '深圳盐田',
    departIn: 5,
    destination: '蒙巴萨',
    transitDays: 26,
    containers: [
      { type: '20GP', price: 1850 },
      { type: '40GP', price: 2600 },
      { type: '40HQ', price: 2650 },
      { type: '40RF', price: 3980 },
    ],
    updatedAt: '2026-09-30 09:12',
  }),
  makeSchedule({
    id: 'SCH-2611',
    carrier: CARRIERS.MAERSK,
    vessel: 'MAERSK EMDEN',
    route: '亚洲 — 东非',
    voyage: '531W',
    origin: '广州南沙',
    departIn: 6,
    via: ['科伦坡'],
    destination: '达累斯萨拉姆',
    transitDays: 27,
    containers: [
      { type: '20GP', price: 2060 },
      { type: '40GP', price: 2980 },
      { type: '40HQ', price: 3040 },
    ],
    updatedAt: '2026-09-29 20:25',
  }),
  makeSchedule({
    id: 'SCH-2602',
    carrier: CARRIERS.COSCO,
    vessel: 'COSCO PRIDE',
    route: '亚洲 — 西非',
    voyage: '088E',
    origin: '宁波北仑',
    departIn: 8,
    via: ['新加坡'],
    destination: '拉各斯',
    transitDays: 32,
    containers: [
      { type: '20GP', price: 2450 },
      { type: '40GP', price: 3500 },
      { type: '40HQ', price: 3580 },
      { type: '45HQ', price: 3760 },
    ],
    updatedAt: '2026-09-30 08:40',
    status: '爆舱',
  }),
  makeSchedule({
    id: 'SCH-2612',
    carrier: CARRIERS['CMA CGM'],
    vessel: 'CMA CGM LYRA',
    route: '亚洲 — 西非',
    voyage: '0FTE',
    origin: '深圳盐田',
    departIn: 9,
    via: ['新加坡', '洛美'],
    destination: '特马',
    transitDays: 31,
    containers: [
      { type: '20GP', price: 2400 },
      { type: '40GP', price: 3420 },
      { type: '40HQ', price: 3480 },
      { type: '45HQ', price: 3670 },
    ],
    updatedAt: '2026-09-30 08:05',
  }),
  makeSchedule({
    id: 'SCH-2603',
    carrier: CARRIERS.EVERGREEN,
    vessel: 'EVER LIVING',
    route: '亚洲 — 东非',
    voyage: '1102W',
    origin: '上海外高桥',
    departIn: 11,
    via: ['新加坡'],
    destination: '达累斯萨拉姆',
    transitDays: 28,
    containers: [
      { type: '20GP', price: 2100 },
      { type: '40GP', price: 3050 },
      { type: '40HQ', price: 3100 },
    ],
    updatedAt: '2026-09-29 17:26',
  }),
  makeSchedule({
    id: 'SCH-2613',
    carrier: CARRIERS.HMM,
    vessel: 'HMM GDANSK',
    route: '亚洲 — 欧洲',
    voyage: '035W',
    origin: '上海外高桥',
    departIn: 12,
    destination: '鹿特丹',
    transitDays: 30,
    containers: [
      { type: '20GP', price: 3120 },
      { type: '40GP', price: 4420 },
      { type: '40HQ', price: 4500 },
      { type: '45HQ', price: 4760 },
      { type: '40RF', price: 6150 },
    ],
    updatedAt: '2026-09-29 19:48',
    status: '爆舱',
  }),
  makeSchedule({
    id: 'SCH-2604',
    carrier: CARRIERS.ONE,
    vessel: 'ONE HARMONY',
    route: '亚洲 — 西非',
    voyage: '045W',
    origin: '广州南沙',
    departIn: 13,
    via: ['新加坡', '洛美'],
    destination: '特马',
    transitDays: 30,
    containers: [
      { type: '20GP', price: 2380 },
      { type: '40GP', price: 3400 },
      { type: '40HQ', price: 3460 },
      { type: '45HQ', price: 3650 },
    ],
    updatedAt: '2026-09-30 07:55',
    status: '价格更新',
  }),
  makeSchedule({
    id: 'SCH-2605',
    carrier: CARRIERS.MAERSK,
    vessel: 'MAERSK SENTOSA',
    route: '亚洲 — 西非',
    voyage: '526W',
    origin: '青岛前湾',
    departIn: 15,
    via: ['丹吉尔'],
    destination: '阿比让',
    transitDays: 34,
    containers: [
      { type: '20GP', price: 2560 },
      { type: '40GP', price: 3650 },
      { type: '40HQ', price: 3720 },
      { type: '40RF', price: 4880 },
    ],
    updatedAt: '2026-09-29 21:03',
  }),
  makeSchedule({
    id: 'SCH-2614',
    carrier: CARRIERS.MSC,
    vessel: 'MSC TIANJIN',
    route: '亚洲 — 西非',
    voyage: '423W',
    origin: '青岛前湾',
    departIn: 16,
    via: ['丹吉尔'],
    destination: '阿比让',
    transitDays: 35,
    containers: [
      { type: '20GP', price: 2580 },
      { type: '40GP', price: 3660 },
      { type: '40HQ', price: 3740 },
      { type: '40RF', price: 4900 },
    ],
    updatedAt: '2026-09-30 10:02',
  }),
  makeSchedule({
    id: 'SCH-2606',
    carrier: CARRIERS['CMA CGM'],
    vessel: 'CMA CGM RIVOLI',
    route: '亚洲 — 红海',
    voyage: '0FTA',
    origin: '深圳盐田',
    departIn: 17,
    destination: '吉达',
    transitDays: 21,
    containers: [
      { type: '20GP', price: 1620 },
      { type: '40GP', price: 2340 },
      { type: '40HQ', price: 2380 },
      { type: '45HQ', price: 2560 },
    ],
    updatedAt: '2026-09-30 10:18',
  }),
  makeSchedule({
    id: 'SCH-2607',
    carrier: CARRIERS.HMM,
    vessel: 'HMM ALGECIRAS',
    route: '亚洲 — 欧洲',
    voyage: '031W',
    origin: '上海外高桥',
    departIn: 19,
    destination: '鹿特丹',
    transitDays: 31,
    containers: [
      { type: '20GP', price: 3180 },
      { type: '40GP', price: 4480 },
      { type: '40HQ', price: 4560 },
      { type: '45HQ', price: 4820 },
      { type: '40RF', price: 6200 },
    ],
    updatedAt: '2026-09-29 15:47',
    status: '爆舱',
  }),
  makeSchedule({
    id: 'SCH-2615',
    carrier: CARRIERS.ONE,
    vessel: 'ONE COLUMBA',
    route: '亚洲 — 东非',
    voyage: '049W',
    origin: '广州南沙',
    departIn: 20,
    via: ['新加坡'],
    destination: '达累斯萨拉姆',
    transitDays: 29,
    containers: [
      { type: '20GP', price: 2140 },
      { type: '40GP', price: 3080 },
      { type: '40HQ', price: 3140 },
    ],
    updatedAt: '2026-09-29 21:37',
  }),
  makeSchedule({
    id: 'SCH-2616',
    carrier: CARRIERS.EVERGREEN,
    vessel: 'EVER ACE',
    route: '亚洲 — 西非',
    voyage: '1113W',
    origin: '青岛前湾',
    departIn: 22,
    via: ['丹吉尔'],
    destination: '阿比让',
    transitDays: 34,
    containers: [
      { type: '20GP', price: 2600 },
      { type: '40GP', price: 3700 },
      { type: '40HQ', price: 3780 },
      { type: '40RF', price: 4920 },
    ],
    updatedAt: '2026-09-30 11:15',
    status: '价格更新',
  }),
  makeSchedule({
    id: 'SCH-2617',
    carrier: CARRIERS.COSCO,
    vessel: 'COSCO HARMONY',
    route: '亚洲 — 红海',
    voyage: '096E',
    origin: '广州南沙',
    departIn: 25,
    destination: '吉达',
    transitDays: 21,
    containers: [
      { type: '20GP', price: 1640 },
      { type: '40GP', price: 2360 },
      { type: '40HQ', price: 2400 },
      { type: '45HQ', price: 2580 },
    ],
    updatedAt: '2026-09-29 17:52',
  }),
  makeSchedule({
    id: 'SCH-2618',
    carrier: CARRIERS.MSC,
    vessel: 'MSC PALOMA',
    route: '亚洲 — 东非',
    voyage: '428W',
    origin: '青岛前湾',
    departIn: 28,
    destination: '蒙巴萨',
    transitDays: 26,
    containers: [
      { type: '20GP', price: 1880 },
      { type: '40GP', price: 2620 },
      { type: '40HQ', price: 2680 },
      { type: '40RF', price: 4010 },
    ],
    updatedAt: '2026-09-30 09:58',
  }),
]

export async function getSchedules(): Promise<ScheduleRow[]> {
  await delay()
  return SCHEDULES
}
// ────────────────────────────── 2. 在途追踪 ──────────────────────────────

/**
 * 在途追踪：以「一票货」为中心，覆盖 订舱 → 放舱 → 提柜 → 装柜 → 进港 → 截关
 * → 开船在途 → 到港 → 卸船 → 提柜派送 → 空箱返还 共 11 个节点。
 *
 * 节点分两级：
 *   · 票级（一票共享）：订舱 / 放舱 / 截关
 *   · 箱级（逐箱独立）：提柜 / 装柜 / 进港 / 开船 / 到港 / 卸船 / 提柜派送 / 空箱返还
 * 实物操作中同一票的箱子可能进度不同（甩柜改配、未赶上原航次、查验未放行等），
 * 因此顶部进度条按票聚合（如 3/5 箱），箱进度明细逐箱展开各自的节点时间轴。
 *
 * 另附「DCSA 事件流水」：模拟船司按 DCSA 事件模型回传的事件记录
 * （eventType / eventCode / classifier / equipmentReference / transportCall）。
 */

/** 演示用的「当前时刻」（与 DEMO_TODAY 同基准，保证推进事件时间可复现） */
export const DEMO_NOW = `${DEMO_TODAY} 15:00`

// ── 输入方式 ──

/** 创建跟踪记录的输入方式 */
export type TrackingSource = 'booking' | 'bl' | 'container'

/** 输入方式的展示名（表单与列表复用） */
export const TRACKING_SOURCE_LABEL: Record<TrackingSource, string> = {
  booking: '预约号',
  bl: '提单号',
  container: '箱号',
}

/** 可选输入方式（表单分段选择） */
export const TRACKING_SOURCES: TrackingSource[] = ['booking', 'bl', 'container']

// ── 节点定义 ──

/** 节点状态：未开始 / 进行中 / 已完成 / 延误 / 失败 */
export type NodeStatus = 'pending' | 'active' | 'done' | 'warning' | 'failed'

/** 整票状态 */
export type ShipmentStatus = '进行中' | '异常' | '已完成' | '已取消'

/** 单箱状态（整箱不会「已取消」） */
export type ContainerStatus = Exclude<ShipmentStatus, '已取消'>

/** 生命周期节点 key（NODE_DEFS 的顺序即一票的生命周期顺序） */
export type NodeKey =
  | 'booking'
  | 'so'
  | 'pickupEmpty'
  | 'stuffing'
  | 'gateIn'
  | 'cutoff'
  | 'departed'
  | 'arrived'
  | 'discharged'
  | 'pickupFull'
  | 'emptyReturn'

/** 节点归集粒度：票级（一票一个状态）/ 箱级（逐箱独立推进） */
export type NodeScope = 'shipment' | 'container'

export interface NodeDef {
  key: NodeKey
  label: string
  scope: NodeScope
  /** 一句话说明（详情页时间轴展示） */
  desc: string
}

/** 一票货的完整生命周期（11 个节点，顺序固定） */
export const NODE_DEFS: NodeDef[] = [
  { key: 'booking', label: '订舱', scope: 'shipment', desc: '提交订舱申请并等待舱位确认，可能失败' },
  { key: 'so', label: '放舱', scope: 'shipment', desc: '船司放舱（SO），确认舱位与箱型' },
  { key: 'pickupEmpty', label: '提柜', scope: 'container', desc: '到堆场提取空箱' },
  { key: 'stuffing', label: '装柜', scope: 'container', desc: '工厂装柜、封箱' },
  { key: 'gateIn', label: '进港', scope: 'container', desc: '重柜进港，码头闸口放行' },
  { key: 'cutoff', label: '截关', scope: 'shipment', desc: '截关 / 截单，赶截或顺延' },
  { key: 'departed', label: '开船在途运输', scope: 'container', desc: '开船（ATD），在途运输，中转信息可能变化' },
  { key: 'arrived', label: '到港', scope: 'container', desc: '抵达目的港（ATA）' },
  { key: 'discharged', label: '目的港卸船', scope: 'container', desc: '目的港卸船、码头放箱' },
  { key: 'pickupFull', label: '提柜派送', scope: 'container', desc: '提取重柜并派送、签收' },
  { key: 'emptyReturn', label: '空箱返还', scope: 'container', desc: '归还空箱至指定堆场' },
]

/** 票级节点（订舱 / 放舱 / 截关） */
export const TICKET_NODE_DEFS: NodeDef[] = NODE_DEFS.filter((n) => n.scope === 'shipment')

/** 箱级节点（逐箱独立推进） */
export const CONTAINER_NODE_DEFS: NodeDef[] = NODE_DEFS.filter((n) => n.scope === 'container')

const NODE_KEYS: NodeKey[] = NODE_DEFS.map((n) => n.key)
const TICKET_KEYS: NodeKey[] = TICKET_NODE_DEFS.map((n) => n.key)
const CONTAINER_KEYS: NodeKey[] = CONTAINER_NODE_DEFS.map((n) => n.key)

/** 节点中文名（列表 / 时间轴 / 事件文案复用） */
export const NODE_LABEL = Object.fromEntries(
  NODE_DEFS.map((n) => [n.key, n.label]),
) as Record<NodeKey, string>

/** 订舱失败原因字典 */
export const BOOKING_FAIL_REASONS = [
  '舱位已满（爆舱）',
  '船期取消 / 停航',
  '运价未确认',
  '特种柜申请未通过',
  '超过截单时间',
  '客户取消订舱',
]

// ── 节点 / 事件模型 ──

export interface ShipmentNode {
  key: NodeKey
  status: NodeStatus
  /** 计划时间（YYYY-MM-DD HH:mm） */
  plannedAt?: string
  /** 实际时间（YYYY-MM-DD HH:mm） */
  actualAt?: string
  /** 失败原因（status = failed） */
  failReason?: string
  /** 备注（延误说明、甩柜改配说明等） */
  note?: string
  /** 聚合明细（票级视图用，如「箱完成 3/5 箱」） */
  details?: Array<{ label: string; value: string }>
}

export type ShipmentEventType =
  | 'progress'
  | 'transit-change'
  | 'vessel-change'
  | 'transit-port'
  | 'failure'
  | 'note'

export interface ShipmentEvent {
  id: string
  /** 发生时间（YYYY-MM-DD HH:mm） */
  at: string
  node: NodeKey
  type: ShipmentEventType
  title: string
  desc?: string
  /** 关联箱号（箱级事件） */
  containerNo?: string
  /** 中转变更前 / 船信息变更前 */
  from?: string
  /** 中转变更后 / 船信息变更后 */
  to?: string
  /** 关注等级（默认按事件类型推断） */
  level?: AttentionLevel
}

// ── 关注事项（详情页右侧「需要关注」面板） ──

/** 关注等级：异常（需立即处理）/ 提醒（需留意） */
export type AttentionLevel = 'alert' | 'warning'

/** 关注事项类别 */
export type AttentionCategory =
  | 'failure'
  | 'roll'
  | 'delay'
  | 'note'
  | 'transit-change'
  | 'vessel-change'
  | 'transit-port'

/** 一条需要关注的异常 / 提醒事项 */
export interface AttentionItem {
  id: string
  /** 发生时间（YYYY-MM-DD HH:mm） */
  at: string
  level: AttentionLevel
  category: AttentionCategory
  /** 一句话标题 */
  title: string
  /** 补充说明 */
  desc?: string
  /** 关联箱号（箱级事项） */
  containerNo?: string
  /** 关联节点 */
  node?: NodeKey
}

/** 演示推进时待应用的中转变更（详情页「模拟推进节点」用） */
export interface PendingTransitChange {
  /** 该节点完成后应用变更 */
  afterNode: NodeKey
  from: string
  to: string
  desc?: string
}

// ── DCSA 事件模型 ──

/** DCSA 事件大类：船务信息 / 运输 / 设备 */
export type DcsaEventType = 'SHIPMENT' | 'TRANSPORT' | 'EQUIPMENT'

/** DCSA 事件时态：ACT 实际 / EST 预计 / PLN 计划 */
export type DcsaClassifier = 'ACT' | 'EST' | 'PLN'

export interface DcsaEvent {
  /** 事件 ID */
  eventId: string
  eventType: DcsaEventType
  /** 事件代码（BKG / SHI / GTOT / GTIN / STUF / DEPA / ARRI / DISC / ROUT） */
  eventCode: string
  /** 事件中文说明 */
  eventName: string
  classifier: DcsaClassifier
  /** 事件发生时间 */
  eventDateTime: string
  /** 事件记录时间（船司回传时间） */
  eventCreatedDateTime: string
  /** 关联箱号（票级事件为空） */
  equipmentReference?: string
  /** 运输工具船名 */
  vessel?: string
  /** 航次 */
  voyage?: string
  /** 发生地点（港口 / 堆场 / 闸口） */
  location?: string
}

/** 各节点对应的 DCSA 事件代码（演示用；代码取自 DCSA 事件模型） */
const DCSA_EVENT_DEF: Record<NodeKey, { type: DcsaEventType; code: string; name: string }> = {
  booking: { type: 'SHIPMENT', code: 'BKG', name: '订舱受理' },
  so: { type: 'SHIPMENT', code: 'SHI', name: '放舱确认' },
  pickupEmpty: { type: 'EQUIPMENT', code: 'GTOT', name: '空箱出场（提空箱）' },
  stuffing: { type: 'EQUIPMENT', code: 'STUF', name: '装柜完成' },
  gateIn: { type: 'EQUIPMENT', code: 'GTIN', name: '重箱进闸（进港）' },
  cutoff: { type: 'TRANSPORT', code: 'DEPA', name: '截关（预计开船）' },
  departed: { type: 'TRANSPORT', code: 'DEPA', name: '实际开船' },
  arrived: { type: 'TRANSPORT', code: 'ARRI', name: '抵达目的港' },
  discharged: { type: 'TRANSPORT', code: 'DISC', name: '目的港卸船' },
  pickupFull: { type: 'EQUIPMENT', code: 'GTOT', name: '重箱出场（提柜派送）' },
  emptyReturn: { type: 'EQUIPMENT', code: 'GTIN', name: '空箱还场' },
}

// ── 箱 / 票模型 ──

/** 甩柜（未赶上原航次）信息 */
export interface ContainerRoll {
  /** 甩柜原因 */
  reason: string
  /** 甩柜记录时间 */
  at: string
  /** 原配船名 */
  originalVessel: string
  /** 原配航次 */
  originalVoyage: string
  /** 原计划开船 */
  originalEtd: string
}

/** 单箱：拥有独立的船名 / 航次 / 时间与 8 个箱级节点 */
export interface Container {
  /** 箱号 */
  no: string
  type: ContainerType
  /** 该箱实际装载的船名（甩柜改配后与票面不同） */
  vessel: string
  /** 该箱实际航次 */
  voyage: string
  /** 该箱开船计划 */
  etd: string
  /** 该箱到港计划 */
  eta: string
  /** 实际开船 */
  atd?: string
  /** 实际到港 */
  ata?: string
  /** 甩柜信息（未赶上原航次） */
  roll?: ContainerRoll
  status: ContainerStatus
  /** 该箱当前节点 */
  currentNode: NodeKey
  /** 该箱进度（0–100，按已完成箱级节点占比） */
  progress: number
  /** 该箱存在失败或延误 */
  hasAlert: boolean
  /** 该箱的箱级节点（CONTAINER_NODE_DEFS 顺序） */
  nodes: ShipmentNode[]
}

/** 一票货（列表一行 / 详情一页） */
export interface Shipment {
  id: string
  /** 创建来源 */
  source: TrackingSource
  /** 创建时输入的单号（预约号 / 提单号 / 箱号） */
  sourceNo: string
  /** 订舱号 */
  bookingNo?: string
  /** 提单号 */
  blNo?: string
  carrier: Carrier
  /** 票面主船名 */
  vessel: string
  /** 票面主航次 */
  voyage: string
  origin: string
  destination: string
  /** 中转港（按先后，可能随运输变化；空数组 = 直航） */
  transshipPorts: string[]
  /** 票面主箱型 */
  containerType: ContainerType
  /** 箱量（= containers.length） */
  containerCount: number
  /** 全部箱号（列表 / 搜索用） */
  containerNos: string[]
  /** 预计开船 */
  etd: string
  /** 预计到港 */
  eta: string
  status: ShipmentStatus
  /** 当前节点（票级聚合） */
  currentNode: NodeKey
  /** 整体进度（0–100，按 11 个聚合节点已完成占比） */
  progress: number
  /** 存在失败或延误 */
  hasAlert: boolean
  /** 是否已取消 */
  canceled: boolean
  /** 数据更新时间 */
  updatedAt: string
  /** 票级节点（订舱 / 放舱 / 截关） */
  ticketNodes: ShipmentNode[]
  /** 票级聚合后的 11 个节点（顶部进度条） */
  nodes: ShipmentNode[]
  /** 每箱明细 */
  containers: Container[]
  /** 内部动态事件 */
  events: ShipmentEvent[]
  /** 需要关注的异常 / 提醒事项（详情页右侧面板） */
  attention: AttentionItem[]
  /** DCSA 事件流水（船司回传） */
  dcsaEvents: DcsaEvent[]
  /** 演示推进用的待应用中转变更 */
  pendingTransitChange?: PendingTransitChange
}

/** 在途追踪列表页的 search params（可分享 / 可回退） */
export interface TrackingSearch {
  /** 关键词：单号 / 船名 / 航次 / 箱号 */
  q?: string
  /** 整票状态 */
  status?: ShipmentStatus
  /** 当前节点 */
  node?: NodeKey
  /** 船司 code */
  carrier?: string
  origin?: string
  destination?: string
  /** 仅看异常（失败 / 延误） */
  alert?: boolean
}

// ── 守卫（search params 与表单校验复用） ──

export function isNodeKey(v: unknown): v is NodeKey {
  return typeof v === 'string' && (NODE_KEYS as string[]).includes(v)
}

/** 关注 / 预警等级守卫 */
export function isAttentionLevel(v: unknown): v is AttentionLevel {
  return v === 'alert' || v === 'warning'
}

export function isShipmentStatus(v: unknown): v is ShipmentStatus {
  return v === '进行中' || v === '异常' || v === '已完成' || v === '已取消'
}

export function isTrackingSource(v: unknown): v is TrackingSource {
  return v === 'booking' || v === 'bl' || v === 'container'
}

function truthy(v: unknown): boolean {
  return v === true || v === '1' || v === 'true'
}

/** 列表页 search params 守卫：非法值一律回落为 undefined（不筛选） */
export function validateTrackingSearch(search: Record<string, unknown>): TrackingSearch {
  const q = typeof search.q === 'string' ? search.q.trim().slice(0, 40) : ''
  return {
    q: q || undefined,
    status: isShipmentStatus(search.status) ? search.status : undefined,
    node: isNodeKey(search.node) ? search.node : undefined,
    carrier: typeof search.carrier === 'string' && search.carrier ? search.carrier : undefined,
    origin: typeof search.origin === 'string' && search.origin ? search.origin : undefined,
    destination:
      typeof search.destination === 'string' && search.destination ? search.destination : undefined,
    alert: truthy(search.alert) ? true : undefined,
  }
}

// ── 时间工具 ──

/** `${date} ${hh}:${mm}` */
function at(date: string, hour: number, minute = 0): string {
  return `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** 时间字符串加分钟（用于模拟 DCSA 回传时间） */
function addMinutes(time: string, minutes: number): string {
  const d = new Date(`${time.replace(' ', 'T')}:00Z`)
  d.setUTCMinutes(d.getUTCMinutes() + minutes)
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

/** 稳定的字符串哈希（用于生成箱号 / 单号，保证可复现） */
function hashId(s: string): number {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 10_000_000
  return h
}

/** 票级节点的计划时间（相对 ETD） */
function ticketPlannedAt(key: NodeKey, etd: string): string {
  const map: Partial<Record<NodeKey, string>> = {
    booking: at(addDays(etd, -12), 10, 30),
    so: at(addDays(etd, -11), 17, 0),
    cutoff: at(addDays(etd, -2), 18, 0),
  }
  return map[key] ?? at(etd, 0, 0)
}

/** 箱级节点的计划时间（相对该箱的 ETD / ETA） */
function containerPlannedAt(key: NodeKey, etd: string, eta: string): string {
  const map: Partial<Record<NodeKey, string>> = {
    pickupEmpty: at(addDays(etd, -6), 9, 0),
    stuffing: at(addDays(etd, -4), 14, 0),
    gateIn: at(addDays(etd, -3), 11, 30),
    departed: at(etd, 20, 0),
    arrived: at(eta, 8, 0),
    discharged: at(eta, 15, 0),
    pickupFull: at(addDays(eta, 3), 10, 0),
    emptyReturn: at(addDays(eta, 22), 16, 0),
  }
  return map[key] ?? at(etd, 0, 0)
}

/** DCSA 事件发生地点 */
function locationFor(key: NodeKey, origin: string, destination: string): string {
  switch (key) {
    case 'pickupEmpty':
      return `${origin}堆场`
    case 'gateIn':
      return `${origin}闸口`
    case 'stuffing':
      return `${origin}工厂`
    case 'pickupFull':
      return `${destination}堆场`
    case 'emptyReturn':
      return `${destination}堆场`
    case 'arrived':
    case 'discharged':
      return destination
    default:
      return origin
  }
}

// ── 派生工具 ──

function nodeOf(container: Container, key: NodeKey): ShipmentNode {
  return container.nodes.find((n) => n.key === key)!
}

function hasAlertOf(nodes: ShipmentNode[]): boolean {
  return nodes.some((n) => n.status === 'failed' || n.status === 'warning')
}

/** 当前节点 + 整体进度（按已完成节点占比） */
function progressOf(nodes: ShipmentNode[]): { currentNode: NodeKey; progress: number } {
  const started = nodes.filter((n) => n.status !== 'pending')
  const last = started[started.length - 1]
  const done = nodes.filter((n) => n.status === 'done').length
  return {
    currentNode: last ? last.key : nodes[0]!.key,
    progress: Math.round((done / nodes.length) * 100),
  }
}

function deriveContainerStatus(nodes: ShipmentNode[]): ContainerStatus {
  if (nodes.some((n) => n.status === 'failed')) return '异常'
  if (nodes.every((n) => n.status === 'done')) return '已完成'
  return '进行中'
}

function deriveShipmentStatus(s: Shipment): ShipmentStatus {
  if (s.canceled) return '已取消'
  const all = [...s.ticketNodes, ...s.containers.flatMap((c) => c.nodes)]
  if (all.some((n) => n.status === 'failed')) return '异常'
  if (all.every((n) => n.status === 'done')) return '已完成'
  return '进行中'
}

/** 重算单箱派生字段（状态 / 当前节点 / 进度 / 实际开船到港） */
function refreshContainer(container: Container): void {
  const { currentNode, progress } = progressOf(container.nodes)
  container.currentNode = currentNode
  container.progress = progress
  container.status = deriveContainerStatus(container.nodes)
  container.hasAlert = hasAlertOf(container.nodes)
  const departed = nodeOf(container, 'departed')
  const arrived = nodeOf(container, 'arrived')
  container.atd = departed.status === 'done' ? departed.actualAt : undefined
  container.ata = arrived.status === 'done' ? arrived.actualAt : undefined
}

/** 箱级节点按箱聚合为票级节点（如「箱完成 3/5」） */
function aggregateNode(def: NodeDef, containers: Container[]): ShipmentNode {
  const nodes = containers.map((c) => nodeOf(c, def.key))
  const done = nodes.filter((n) => n.status === 'done').length
  const failedNode = nodes.find((n) => n.status === 'failed')
  const warnNode = nodes.find((n) => n.status === 'warning')
  const actualAt = nodes
    .map((n) => n.actualAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)

  let status: NodeStatus
  if (failedNode) status = 'failed'
  else if (warnNode) status = 'warning'
  else if (done === nodes.length) status = 'done'
  else if (nodes.some((n) => n.status !== 'pending')) status = 'active'
  else status = 'pending'

  const out: ShipmentNode = { key: def.key, status, plannedAt: nodes[0]?.plannedAt }
  if (actualAt) out.actualAt = actualAt
  const partiallyStarted = done > 0 || nodes.some((n) => n.status !== 'pending')
  if (partiallyStarted && done < nodes.length) {
    out.details = [{ label: '箱完成', value: `${done}/${nodes.length}` }]
  }
  if (failedNode?.failReason) out.failReason = failedNode.failReason
  if (warnNode?.note) out.note = warnNode.note
  return out
}

/** 重算整票派生字段（聚合节点 / 状态 / 进度 / DCSA 流水 / 关注事项） */
function recompute(s: Shipment): void {
  for (const c of s.containers) refreshContainer(c)
  s.nodes = NODE_DEFS.map((def) =>
    def.scope === 'shipment'
      ? s.ticketNodes.find((n) => n.key === def.key)!
      : aggregateNode(def, s.containers),
  )
  const { currentNode, progress } = progressOf(s.nodes)
  s.currentNode = currentNode
  s.progress = progress
  s.status = deriveShipmentStatus(s)
  s.hasAlert = !s.canceled && (hasAlertOf(s.ticketNodes) || s.containers.some((c) => c.hasAlert))
  s.dcsaEvents = buildDcsaEvents(s)
  s.attention = buildAttentionItems(s)
}

/** 节点级关注事项的等级 / 类别（失败 = 异常，延误与备注 = 提醒） */
const NODE_ATTENTION: Partial<
  Record<NodeStatus, { level: AttentionLevel; category: AttentionCategory; suffix: string }>
> = {
  failed: { level: 'alert', category: 'failure', suffix: '失败' },
  warning: { level: 'warning', category: 'delay', suffix: '延误' },
}

/**
 * 汇总「需要关注」事项：票级 / 箱级节点异常与延误、甩柜改配、
 * 中转变更、船信息变更、中转港动态（进港 / 滞留 / 离港）以及待生效变更。
 * 已取消的票不再提示。
 */
function buildAttentionItems(s: Shipment): AttentionItem[] {
  if (s.canceled) return []

  const items: AttentionItem[] = []

  // 票级节点
  for (const n of s.ticketNodes) {
    const meta = NODE_ATTENTION[n.status]
    const at = n.actualAt ?? n.plannedAt
    if (meta && at) {
      items.push({
        id: `${s.id}-${n.key}-${n.status}`,
        at,
        level: meta.level,
        category: meta.category,
        title: `${NODE_LABEL[n.key]}${meta.suffix}`,
        desc: n.status === 'failed' ? n.failReason : n.note,
        node: n.key,
      })
    } else if (n.status === 'active' && n.note) {
      items.push({
        id: `${s.id}-${n.key}-note`,
        at: n.plannedAt ?? s.updatedAt,
        level: 'warning',
        category: 'note',
        title: `${NODE_LABEL[n.key]}待跟进`,
        desc: n.note,
        node: n.key,
      })
    }
  }

  // 箱级节点 + 甩柜改配
  for (const c of s.containers) {
    if (c.roll) {
      items.push({
        id: `${s.id}-${c.no}-roll`,
        at: c.roll.at,
        level: 'alert',
        category: 'roll',
        title: '甩柜改配',
        desc: `${c.roll.reason}；原 ${c.roll.originalVessel}/${c.roll.originalVoyage}（${c.roll.originalEtd} 开船）→ 现 ${c.vessel}/${c.voyage}（${c.etd} 开船）`,
        containerNo: c.no,
        node: 'departed',
      })
    }
    for (const n of c.nodes) {
      const meta = NODE_ATTENTION[n.status]
      const at = n.actualAt ?? n.plannedAt
      if (meta && at) {
        items.push({
          id: `${s.id}-${c.no}-${n.key}-${n.status}`,
          at,
          level: meta.level,
          category: meta.category,
          title: `${c.no} · ${NODE_LABEL[n.key]}${meta.suffix}`,
          desc: n.status === 'failed' ? n.failReason : n.note,
          containerNo: c.no,
          node: n.key,
        })
      } else if (n.status === 'active' && n.note) {
        items.push({
          id: `${s.id}-${c.no}-${n.key}-note`,
          at: n.plannedAt ?? s.updatedAt,
          level: 'warning',
          category: 'note',
          title: `${c.no} · ${NODE_LABEL[n.key]}待跟进`,
          desc: n.note,
          containerNo: c.no,
          node: n.key,
        })
      }
    }
  }

  // 中转变更 / 船信息变更 / 中转港动态
  for (const e of s.events) {
    if (e.type !== 'transit-change' && e.type !== 'vessel-change' && e.type !== 'transit-port') continue
    items.push({
      id: e.id,
      at: e.at,
      level: e.level ?? 'warning',
      category: e.type,
      title: e.title,
      desc: e.desc ?? (e.from && e.to ? `原 ${e.from} → 现 ${e.to}` : undefined),
      containerNo: e.containerNo,
      node: e.node,
    })
  }

  // 待生效的中转变更
  if (s.pendingTransitChange) {
    const ch = s.pendingTransitChange
    items.push({
      id: `${s.id}-pending-transit`,
      at: s.updatedAt,
      level: 'warning',
      category: 'transit-change',
      title: '中转港变更（待生效）',
      desc: ch.desc ?? `原计划经 ${ch.from}，将改为 ${ch.to} 中转`,
      node: ch.afterNode,
    })
  }

  // 异常在前，同级按时间倒序
  const rank = (l: AttentionLevel) => (l === 'alert' ? 0 : 1)
  return items.sort(
    (a, b) => rank(a.level) - rank(b.level) || (a.at < b.at ? 1 : a.at > b.at ? -1 : 0),
  )
}

// ── 构建（mock 与创建共用同一套生成逻辑，保证形态一致） ──

interface TicketSeed {
  /** 已推进到的票级节点 */
  reached: NodeKey
  /** 该节点状态（默认 进行中） */
  reachedStatus?: NodeStatus
  failReason?: string
  /** 备注（延误说明等） */
  note?: string
}

interface ContainerRollSeed {
  reason: string
  at?: string
  originalVessel?: string
  originalVoyage?: string
  originalEtd?: string
}

interface ContainerSeed {
  /** 箱型（默认取票面箱型） */
  type?: ContainerType
  /** 甩柜改配后的 ETD 偏移（天，正数 = 更晚） */
  etdOffsetDays?: number
  /** 甩柜改配后的船名 / 航次（默认取票面） */
  vessel?: string
  voyage?: string
  /** 已推进到的箱级节点 */
  reached: NodeKey
  /** 该节点状态（默认 进行中） */
  reachedStatus?: NodeStatus
  /** 整箱已完成 */
  completed?: boolean
  /** 失败原因 */
  failReason?: string
  /** 甩柜信息 */
  roll?: ContainerRollSeed
  /** 覆盖单节点的状态 / 时间 / 备注 */
  overrides?: Partial<Record<NodeKey, Partial<ShipmentNode>>>
}

interface ShipmentSeed {
  id: string
  source: TrackingSource
  sourceNo: string
  /** CARRIERS 字典的 key */
  carrier: string
  vessel: string
  voyage: string
  origin: string
  destination: string
  /** 中转港（省略 = 直航） */
  via?: string[]
  containerType: ContainerType
  /** ETD 相对 DEMO_TODAY 的天数（负 = 已开船 / 已到港） */
  etdIn: number
  transitDays: number
  ticket: TicketSeed
  containers: ContainerSeed[]
  /** 整票已取消 */
  canceled?: boolean
  /** 追加内部事件（节点事件自动生成） */
  events?: Array<Omit<ShipmentEvent, 'id'>>
  /** 推进到某节点后应用的中转变更 */
  transitChange?: PendingTransitChange
  updatedAt: string
}

function buildTicketNodes(seed: TicketSeed, etd: string): ShipmentNode[] {
  const reachedIdx = TICKET_KEYS.indexOf(seed.reached)
  return TICKET_KEYS.map((key, idx) => {
    const status: NodeStatus =
      idx < reachedIdx ? 'done' : idx === reachedIdx ? (seed.reachedStatus ?? 'active') : 'pending'
    const node: ShipmentNode = { key, status, plannedAt: ticketPlannedAt(key, etd) }
    if (status === 'done' || status === 'active' || status === 'warning') node.actualAt = node.plannedAt
    if (status === 'failed' && seed.failReason) node.failReason = seed.failReason
    if (seed.note) node.note = seed.note
    return node
  })
}

interface ContainerBuildCtx {
  shipmentId: string
  carrierShort: string
  containerType: ContainerType
  vessel: string
  voyage: string
  baseEtd: string
  baseEta: string
}

/** 生成箱号（确定性，保证刷新可复现） */
function containerNo(ctx: ContainerBuildCtx, index: number): string {
  const code = `${ctx.carrierShort}U`.slice(0, 4).toUpperCase()
  return `${code}${String((hashId(`${ctx.shipmentId}-${index}`) + index * 1373) % 10_000_000).padStart(7, '0')}`
}

function buildContainer(seed: ContainerSeed, index: number, ctx: ContainerBuildCtx): Container {
  const offset = seed.etdOffsetDays ?? 0
  const etd = addDays(ctx.baseEtd, offset)
  const eta = addDays(ctx.baseEta, offset)
  const reachedIdx = CONTAINER_KEYS.indexOf(seed.reached)

  const nodes = CONTAINER_KEYS.map((key, idx) => {
    let status: NodeStatus
    if (seed.completed) status = 'done'
    else if (idx < reachedIdx) status = 'done'
    else if (idx === reachedIdx) status = seed.reachedStatus ?? 'active'
    else status = 'pending'

    const node: ShipmentNode = { key, status, plannedAt: containerPlannedAt(key, etd, eta) }
    if (status === 'done' || status === 'active' || status === 'warning') node.actualAt = node.plannedAt
    if (status === 'failed' && seed.failReason) node.failReason = seed.failReason
    const ov = seed.overrides?.[key]
    if (ov) Object.assign(node, ov)
    return node
  })

  const container: Container = {
    no: containerNo(ctx, index),
    type: seed.type ?? ctx.containerType,
    vessel: seed.vessel ?? ctx.vessel,
    voyage: seed.voyage ?? ctx.voyage,
    etd,
    eta,
    status: '进行中',
    currentNode: CONTAINER_KEYS[0]!,
    progress: 0,
    hasAlert: false,
    nodes,
  }

  if (seed.roll) {
    container.roll = {
      reason: seed.roll.reason,
      at: seed.roll.at ?? at(addDays(ctx.baseEtd, -1), 18, 0),
      originalVessel: seed.roll.originalVessel ?? ctx.vessel,
      originalVoyage: seed.roll.originalVoyage ?? ctx.voyage,
      originalEtd: seed.roll.originalEtd ?? ctx.baseEtd,
    }
    const departed = nodeOf(container, 'departed')
    departed.note =
      departed.note ??
      `${seed.roll.reason}，已改配 ${container.vessel}/${container.voyage}（${container.etd} 开船）`
  }

  refreshContainer(container)
  return container
}

/** 内部动态事件（票级节点自动 + 箱级失败 + 自定义） */
function buildEvents(input: {
  id: string
  ticketNodes: ShipmentNode[]
  containers: Container[]
  extra: Array<Omit<ShipmentEvent, 'id'>>
}): ShipmentEvent[] {
  const auto: ShipmentEvent[] = []
  for (const n of input.ticketNodes) {
    const time = n.actualAt ?? n.plannedAt
    if (!time) continue
    if (n.status === 'done') {
      auto.push({ id: `${input.id}-${n.key}-done`, at: time, node: n.key, type: 'progress', title: `${NODE_LABEL[n.key]}完成` })
    } else if (n.status === 'warning') {
      auto.push({ id: `${input.id}-${n.key}-warn`, at: time, node: n.key, type: 'note', title: `${NODE_LABEL[n.key]}延误`, desc: n.note })
    } else if (n.status === 'failed') {
      auto.push({ id: `${input.id}-${n.key}-fail`, at: time, node: n.key, type: 'failure', title: `${NODE_LABEL[n.key]}失败`, desc: n.failReason })
    }
  }
  for (const c of input.containers) {
    for (const n of c.nodes) {
      if (n.status !== 'failed') continue
      auto.push({
        id: `${input.id}-${c.no}-${n.key}-fail`,
        at: n.actualAt ?? n.plannedAt ?? DEMO_NOW,
        node: n.key,
        type: 'failure',
        title: `${NODE_LABEL[n.key]}失败`,
        desc: n.failReason,
        containerNo: c.no,
      })
    }
  }
  const custom = input.extra.map((e, i) => ({ ...e, id: `${input.id}-evt-${i}` }))
  return [...auto, ...custom].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

/** DCSA 事件流水：由节点进度生成，票级事件无箱号，箱级事件带 equipmentReference */
function buildDcsaEvents(s: Shipment): DcsaEvent[] {
  const out: DcsaEvent[] = []

  const push = (
    node: ShipmentNode,
    equipmentReference: string | undefined,
    vessel: string,
    voyage: string,
  ) => {
    if (node.status === 'pending' || node.status === 'failed') return
    const def = DCSA_EVENT_DEF[node.key]
    const time = node.actualAt ?? node.plannedAt
    if (!time) return
    out.push({
      eventId: `DCSA-${s.id}-${equipmentReference ?? 'SHP'}-${node.key}`,
      eventType: def.type,
      eventCode: def.code,
      eventName: def.name,
      classifier: node.status === 'active' ? 'EST' : 'ACT',
      eventDateTime: time,
      eventCreatedDateTime: addMinutes(time, 3 + (hashId(`${s.id}${node.key}`) % 26)),
      equipmentReference,
      vessel,
      voyage,
      location: locationFor(node.key, s.origin, s.destination),
    })
  }

  for (const n of s.ticketNodes) push(n, undefined, s.vessel, s.voyage)
  for (const c of s.containers) for (const n of c.nodes) push(n, c.no, c.vessel, c.voyage)

  for (const c of s.containers) {
    if (!c.roll) continue
    out.push({
      eventId: `DCSA-${s.id}-${c.no}-ROLL`,
      eventType: 'TRANSPORT',
      eventCode: 'ROUT',
      eventName: '甩柜改配',
      classifier: 'ACT',
      eventDateTime: c.roll.at,
      eventCreatedDateTime: addMinutes(c.roll.at, 8),
      equipmentReference: c.no,
      vessel: c.vessel,
      voyage: c.voyage,
      location: s.origin,
    })
  }

  return out.sort((a, b) =>
    a.eventDateTime < b.eventDateTime ? 1 : a.eventDateTime > b.eventDateTime ? -1 : 0,
  )
}

function buildShipment(seed: ShipmentSeed): Shipment {
  const carrier = CARRIERS[seed.carrier]!
  const etd = addDays(DEMO_TODAY, seed.etdIn)
  const eta = addDays(etd, seed.transitDays)
  const seq = 1000 + (hashId(seed.id) % 8999)

  const ctx: ContainerBuildCtx = {
    shipmentId: seed.id,
    carrierShort: carrier.short,
    containerType: seed.containerType,
    vessel: seed.vessel,
    voyage: seed.voyage,
    baseEtd: etd,
    baseEta: eta,
  }
  const containers = seed.containers.map((cs, i) => buildContainer(cs, i, ctx))
  if (seed.source === 'container') containers[0]!.no = seed.sourceNo

  const s: Shipment = {
    id: seed.id,
    source: seed.source,
    sourceNo: seed.sourceNo,
    bookingNo: seed.source === 'booking' ? seed.sourceNo : `BK26${seq}`,
    blNo: seed.source === 'bl' ? seed.sourceNo : `TFBL26${seq}`,
    carrier,
    vessel: seed.vessel,
    voyage: seed.voyage,
    origin: seed.origin,
    destination: seed.destination,
    transshipPorts: seed.via ?? [],
    containerType: seed.containerType,
    containerCount: containers.length,
    containerNos: containers.map((c) => c.no),
    etd,
    eta,
    status: '进行中',
    currentNode: 'booking',
    progress: 0,
    hasAlert: false,
    canceled: Boolean(seed.canceled),
    updatedAt: seed.updatedAt,
    ticketNodes: buildTicketNodes(seed.ticket, etd),
    nodes: [],
    containers,
    events: [],
    attention: [],
    dcsaEvents: [],
    pendingTransitChange: seed.transitChange,
  }

  recompute(s)
  s.events = buildEvents({ id: s.id, ticketNodes: s.ticketNodes, containers: s.containers, extra: seed.events ?? [] })
  s.attention = buildAttentionItems(s)
  return s
}

/** 生成 n 个相同的箱种子 */
function rep(n: number, seed: ContainerSeed): ContainerSeed[] {
  return Array.from({ length: n }, () => ({ ...seed }))
}

/**
 * 跟踪记录库（内存，进程内可创建 / 推进；刷新页面还原演示初始态）。
 * 覆盖：各节点进行中、订舱失败、中转变更、到港延误、已完成、已取消，
 * 以及「同一票内各箱进度不同」（甩柜改配 / 查验未放行）。
 */
const SHIPMENTS: Shipment[] = [
  // ① 已完成：全链路走完
  buildShipment({
    id: 'TRK-2026-001',
    source: 'bl',
    sourceNo: 'TFBL26001',
    carrier: 'MSC',
    vessel: 'MSC ISABELLA',
    voyage: '418W',
    origin: '深圳盐田',
    destination: '蒙巴萨',
    containerType: '40HQ',
    etdIn: -60,
    transitDays: 25,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: rep(3, { reached: 'emptyReturn', completed: true }),
    events: [
      {
        at: at(addDays(DEMO_TODAY, -14), 10, 20),
        node: 'emptyReturn',
        type: 'note',
        title: '客户已签收',
        desc: '收货人确认签收，资料已归档',
      },
    ],
    updatedAt: at(addDays(DEMO_TODAY, -14), 10, 20),
  }),
  // ② 开船在途：已发生中转变更（新加坡 → 巴生港）
  buildShipment({
    id: 'TRK-2026-002',
    source: 'booking',
    sourceNo: 'BK260222',
    carrier: 'COSCO',
    vessel: 'COSCO ARIES',
    voyage: '092E',
    origin: '上海外高桥',
    destination: '拉各斯',
    via: ['巴生港'],
    containerType: '40GP',
    etdIn: -22,
    transitDays: 33,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: rep(4, { reached: 'departed', reachedStatus: 'done' }),
    events: [
      {
        at: at(addDays(DEMO_TODAY, -20), 9, 0),
        node: 'departed',
        type: 'transit-change',
        title: '中转港变更',
        desc: '船司调整挂靠港，原计划经新加坡改为巴生港中转',
        from: '新加坡',
        to: '巴生港',
      },
      {
        at: at(addDays(DEMO_TODAY, -10), 7, 30),
        node: 'departed',
        type: 'transit-port',
        title: '抵达中转港',
        level: 'warning',
        desc: '抵达巴生港（Westports），等待换装支线船',
      },
      {
        at: at(addDays(DEMO_TODAY, -7), 15, 10),
        node: 'departed',
        type: 'transit-port',
        title: '中转港滞留',
        level: 'alert',
        desc: '巴生港支线舱位紧张，换装较计划延迟，预计影响后续到港时间',
      },
    ],
    updatedAt: at(addDays(DEMO_TODAY, -1), 7, 55),
  }),
  // ③ 订舱失败：待「重新订舱」，并预留中转变更
  buildShipment({
    id: 'TRK-2026-003',
    source: 'booking',
    sourceNo: 'BK260315',
    carrier: 'MAERSK',
    vessel: 'MAERSK EMDEN',
    voyage: '531W',
    origin: '广州南沙',
    destination: '达累斯萨拉姆',
    via: ['科伦坡'],
    containerType: '40HQ',
    etdIn: 12,
    transitDays: 27,
    ticket: { reached: 'booking', reachedStatus: 'failed', failReason: '舱位已满（爆舱）' },
    containers: rep(2, { reached: 'pickupEmpty', reachedStatus: 'pending' }),
    transitChange: {
      afterNode: 'so',
      from: '科伦坡',
      to: '巴生港',
      desc: '原经科伦坡，船司改为巴生港中转',
    },
    updatedAt: at(DEMO_TODAY, 9, 12),
  }),
  // ④ 订舱进行中
  buildShipment({
    id: 'TRK-2026-004',
    source: 'container',
    sourceNo: 'CSNU7234510',
    carrier: 'EVERGREEN',
    vessel: 'EVER SUMMIT',
    voyage: '1108W',
    origin: '宁波北仑',
    destination: '吉达',
    containerType: '20GP',
    etdIn: 14,
    transitDays: 22,
    ticket: { reached: 'booking' },
    containers: rep(5, { reached: 'pickupEmpty', reachedStatus: 'pending' }),
    updatedAt: at(DEMO_TODAY, 10, 5),
  }),
  // ⑤ 放舱进行中
  buildShipment({
    id: 'TRK-2026-005',
    source: 'bl',
    sourceNo: 'TFBL26005',
    carrier: 'HMM',
    vessel: 'HMM GDANSK',
    voyage: '035W',
    origin: '上海外高桥',
    destination: '鹿特丹',
    containerType: '40RF',
    etdIn: 12,
    transitDays: 30,
    ticket: { reached: 'so' },
    containers: rep(2, { reached: 'pickupEmpty', reachedStatus: 'pending' }),
    updatedAt: at(DEMO_TODAY, 8, 40),
  }),
  // ⑥ 提柜进行中（2/3 箱已提空箱）；订舱后船司调整船舶
  buildShipment({
    id: 'TRK-2026-006',
    source: 'booking',
    sourceNo: 'BK260606',
    carrier: 'ONE',
    vessel: 'ONE MARVEL',
    voyage: '045W',
    origin: '广州南沙',
    destination: '特马',
    via: ['新加坡', '洛美'],
    containerType: '45HQ',
    etdIn: 7,
    transitDays: 30,
    ticket: { reached: 'so', reachedStatus: 'done' },
    containers: [
      ...rep(2, { reached: 'pickupEmpty', reachedStatus: 'done' }),
      {
        reached: 'pickupEmpty',
        overrides: { pickupEmpty: { note: '堆场放箱排队，预计明日可提' } },
      },
    ],
    events: [
      {
        at: at(addDays(DEMO_TODAY, -4), 16, 20),
        node: 'so',
        type: 'vessel-change',
        title: '船信息变更',
        level: 'warning',
        desc: '放舱后船司调整船舶：ONE HARMONY/045W → ONE MARVEL/045W，截关与开船时间不变',
        from: 'ONE HARMONY / 045W',
        to: 'ONE MARVEL / 045W',
      },
    ],
    updatedAt: at(DEMO_TODAY, 11, 20),
  }),
  // ⑦ 装柜进行中（4/6 箱已装柜）
  buildShipment({
    id: 'TRK-2026-007',
    source: 'container',
    sourceNo: 'TGHU8890123',
    carrier: 'CMA CGM',
    vessel: 'CMA CGM LYRA',
    voyage: '0FTE',
    origin: '深圳盐田',
    destination: '特马',
    via: ['新加坡', '洛美'],
    containerType: '40GP',
    etdIn: 5,
    transitDays: 31,
    ticket: { reached: 'so', reachedStatus: 'done' },
    containers: [
      ...rep(4, { reached: 'stuffing', reachedStatus: 'done' }),
      ...rep(2, { reached: 'stuffing' }),
    ],
    updatedAt: at(DEMO_TODAY, 9, 48),
  }),
  // ⑧ 进港进行中（3/4 箱已进港）
  buildShipment({
    id: 'TRK-2026-008',
    source: 'bl',
    sourceNo: 'TFBL26008',
    carrier: 'COSCO',
    vessel: 'COSCO PRIDE',
    voyage: '088E',
    origin: '宁波北仑',
    destination: '拉各斯',
    via: ['新加坡'],
    containerType: '40HQ',
    etdIn: 4,
    transitDays: 32,
    ticket: { reached: 'so', reachedStatus: 'done' },
    containers: [
      ...rep(3, { reached: 'gateIn', reachedStatus: 'done' }),
      { reached: 'gateIn', overrides: { gateIn: { note: '等闸口放行，尚未进港' } } },
    ],
    updatedAt: at(DEMO_TODAY, 12, 10),
  }),
  // ⑨ 截关延误预警
  buildShipment({
    id: 'TRK-2026-009',
    source: 'booking',
    sourceNo: 'BK260909',
    carrier: 'MSC',
    vessel: 'MSC AURORA',
    voyage: '412W',
    origin: '深圳盐田',
    destination: '蒙巴萨',
    containerType: '20GP',
    etdIn: 3,
    transitDays: 26,
    ticket: {
      reached: 'cutoff',
      reachedStatus: 'warning',
      note: '截关时间临近，尚有 1 票未放行，存在赶截风险',
    },
    containers: rep(2, { reached: 'gateIn', reachedStatus: 'done' }),
    updatedAt: at(DEMO_TODAY, 13, 5),
  }),
  // ⑩ 到港延误
  buildShipment({
    id: 'TRK-2026-010',
    source: 'bl',
    sourceNo: 'TFBL26010',
    carrier: 'MAERSK',
    vessel: 'MAERSK SENTOSA',
    voyage: '526W',
    origin: '青岛前湾',
    destination: '阿比让',
    via: ['丹吉尔'],
    containerType: '40RF',
    etdIn: -40,
    transitDays: 34,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: rep(3, {
      reached: 'arrived',
      reachedStatus: 'warning',
      overrides: {
        arrived: {
          actualAt: at(addDays(DEMO_TODAY, -4), 21, 30),
          note: '目的港拥堵，实际到港较计划晚 2 天',
        },
      },
    }),
    updatedAt: at(DEMO_TODAY, 8, 15),
  }),
  // ⑪ 目的港卸船进行中（3/5 箱已卸船）
  buildShipment({
    id: 'TRK-2026-011',
    source: 'booking',
    sourceNo: 'BK261111',
    carrier: 'MSC',
    vessel: 'MSC TIANJIN',
    voyage: '423W',
    origin: '青岛前湾',
    destination: '阿比让',
    via: ['丹吉尔'],
    containerType: '40HQ',
    etdIn: -38,
    transitDays: 35,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: [...rep(3, { reached: 'discharged', reachedStatus: 'done' }), ...rep(2, { reached: 'discharged' })],
    updatedAt: at(DEMO_TODAY, 7, 40),
  }),
  // ⑫ 提柜派送进行中（2/4 箱已派送）
  buildShipment({
    id: 'TRK-2026-012',
    source: 'container',
    sourceNo: 'EGHU5567123',
    carrier: 'EVERGREEN',
    vessel: 'EVER ACE',
    voyage: '1113W',
    origin: '青岛前湾',
    destination: '阿比让',
    via: ['丹吉尔'],
    containerType: '40GP',
    etdIn: -45,
    transitDays: 34,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: [
      ...rep(2, { reached: 'pickupFull', reachedStatus: 'done' }),
      { reached: 'pickupFull', overrides: { pickupFull: { note: '按预约明日派送' } } },
      { reached: 'discharged', reachedStatus: 'done', overrides: { pickupFull: { note: '客户改约，暂缓派送' } } },
    ],
    updatedAt: at(DEMO_TODAY, 10, 30),
  }),
  // ⑬ 空箱返还进行中（1/3 箱已还箱）
  buildShipment({
    id: 'TRK-2026-013',
    source: 'bl',
    sourceNo: 'TFBL26013',
    carrier: 'ONE',
    vessel: 'ONE COLUMBA',
    voyage: '049W',
    origin: '广州南沙',
    destination: '达累斯萨拉姆',
    via: ['新加坡'],
    containerType: '40HQ',
    etdIn: -52,
    transitDays: 29,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: [
      { reached: 'emptyReturn', reachedStatus: 'done' },
      ...rep(2, { reached: 'emptyReturn', overrides: { emptyReturn: { note: '还箱有效期剩 3 天' } } }),
    ],
    updatedAt: at(DEMO_TODAY, 14, 2),
  }),
  // ⑭ 已取消（订舱失败后客户取消）
  buildShipment({
    id: 'TRK-2026-014',
    source: 'booking',
    sourceNo: 'BK261414',
    carrier: 'COSCO',
    vessel: 'COSCO HARMONY',
    voyage: '096E',
    origin: '广州南沙',
    destination: '吉达',
    containerType: '20GP',
    etdIn: 20,
    transitDays: 21,
    ticket: { reached: 'booking', reachedStatus: 'failed', failReason: '客户取消订舱' },
    containers: rep(1, { reached: 'pickupEmpty', reachedStatus: 'pending' }),
    canceled: true,
    updatedAt: at(addDays(DEMO_TODAY, -1), 17, 30),
  }),
  // ⑮ 一票多箱且各箱进度不同：2 箱在途、2 箱甩柜改配、1 箱查验未放行
  buildShipment({
    id: 'TRK-2026-015',
    source: 'booking',
    sourceNo: 'BK261515',
    carrier: 'MSC',
    vessel: 'MSC ISABELLA',
    voyage: '418W',
    origin: '深圳盐田',
    destination: '蒙巴萨',
    via: ['新加坡'],
    containerType: '40HQ',
    etdIn: -3,
    transitDays: 25,
    ticket: { reached: 'cutoff', reachedStatus: 'done' },
    containers: [
      ...rep(2, { reached: 'arrived' }),
      ...rep(2, {
        reached: 'gateIn',
        reachedStatus: 'done',
        etdOffsetDays: 7,
        vessel: 'MSC AURORA',
        voyage: '430W',
        roll: { reason: '未赶上原航次（甩柜）' },
      }),
      {
        reached: 'gateIn',
        reachedStatus: 'failed',
        failReason: '海关查验未放行（查柜）',
      },
    ],
    updatedAt: at(DEMO_TODAY, 14, 40),
  }),
]

/** 查询全部跟踪记录（列表页） */
export async function getShipments(): Promise<Shipment[]> {
  await delay()
  return structuredClone(SHIPMENTS)
}

/** 按 id 查询单票（详情页）；未找到返回 null */
export async function getShipment(id: string): Promise<Shipment | null> {
  await delay()
  const found = SHIPMENTS.find((s) => s.id === id)
  return found ? structuredClone(found) : null
}

/**
 * 创建一条跟踪记录：选择输入方式 + 船司，落在「订舱」进行中；
 * 航次取自船期表中该船司的未来航次，箱量 1–3 箱。
 */
export async function createShipment(input: {
  source: TrackingSource
  sourceNo: string
  carrier: string
}): Promise<Shipment> {
  await delay()
  const no = input.sourceNo.trim()
  if (!no) throw new Error('请输入单号')
  if (!input.carrier) throw new Error('请选择船司')
  if (SHIPMENTS.some((s) => s.sourceNo === no)) throw new Error('该单号已在跟踪列表中')

  const pool = SCHEDULES.filter((s) => s.carrier.code === input.carrier)
  const candidates = pool.length > 0 ? pool : SCHEDULES
  const schedule = candidates[hashId(no) % candidates.length]!
  const count = 1 + (hashId(no) % 3)
  const via = [...schedule.transshipPorts]

  const shipment = buildShipment({
    id: `TRK-2026-${String(SHIPMENTS.length + 1).padStart(3, '0')}`,
    source: input.source,
    sourceNo: no,
    carrier: schedule.carrier.code,
    vessel: schedule.vessel,
    voyage: schedule.voyage,
    origin: schedule.origin,
    destination: schedule.destination,
    via,
    containerType: schedule.containers[0]!.type,
    etdIn: Math.max(14, diffDays(DEMO_TODAY, schedule.etd)),
    transitDays: schedule.transitDays,
    ticket: { reached: 'booking' },
    containers: Array.from({ length: count }, (_, i) => ({
      type: schedule.containers[i % schedule.containers.length]!.type,
      reached: 'pickupEmpty' as NodeKey,
      reachedStatus: 'pending' as NodeStatus,
    })),
    transitChange:
      via.length > 0
        ? { afterNode: 'so', from: via[0]!, to: '巴生港', desc: '船司调整中转港' }
        : undefined,
    updatedAt: DEMO_NOW,
  })
  SHIPMENTS.unshift(shipment)
  return structuredClone(shipment)
}

/** 推进票级节点（失败 → 重新订舱；放舱完成 → 应用中转变更） */
function advanceTicketNode(s: Shipment, node: ShipmentNode): void {
  const stamp = hashId(`${DEMO_NOW}-${node.key}`)
  if (node.status === 'failed') {
    node.status = 'active'
    node.failReason = undefined
    node.actualAt = DEMO_NOW
    s.events.unshift({
      id: `${s.id}-rebook-${stamp}`,
      at: DEMO_NOW,
      node: node.key,
      type: 'note',
      title: '重新订舱',
      desc: '更换航次后重试，恢复为进行中',
    })
    return
  }

  node.status = 'done'
  node.actualAt = DEMO_NOW
  s.events.unshift({
    id: `${s.id}-${node.key}-${stamp}`,
    at: DEMO_NOW,
    node: node.key,
    type: 'progress',
    title: `${NODE_LABEL[node.key]}完成`,
  })

  if (node.key === 'so' && s.pendingTransitChange) {
    const change = s.pendingTransitChange
    const ports = s.transshipPorts
    const i = ports.indexOf(change.from)
    if (i >= 0) ports[i] = change.to
    else ports.push(change.to)
    s.pendingTransitChange = undefined
    s.events.unshift({
      id: `${s.id}-transit-${stamp}`,
      at: DEMO_NOW,
      node: 'so',
      type: 'transit-change',
      title: '中转港变更',
      desc: change.desc ?? `原计划经 ${change.from}，改为 ${change.to} 中转`,
      from: change.from,
      to: change.to,
    })
  }
}

/** 推进单个箱的某个箱级节点（失败 → 重新处理） */
function advanceContainerNode(s: Shipment, container: Container, key: NodeKey): void {
  const node = nodeOf(container, key)
  const stamp = hashId(`${DEMO_NOW}-${container.no}-${key}`)
  if (node.status === 'failed') {
    node.status = 'active'
    node.failReason = undefined
    node.actualAt = DEMO_NOW
    s.events.unshift({
      id: `${s.id}-${container.no}-retry-${stamp}`,
      at: DEMO_NOW,
      node: key,
      type: 'note',
      title: `${NODE_LABEL[key]}重新处理`,
      desc: `${container.no} 恢复为进行中`,
      containerNo: container.no,
    })
    return
  }

  node.status = 'done'
  node.actualAt = DEMO_NOW
  s.events.unshift({
    id: `${s.id}-${container.no}-${key}-${stamp}`,
    at: DEMO_NOW,
    node: key,
    type: 'progress',
    title: `${NODE_LABEL[key]}完成`,
    desc: container.no,
    containerNo: container.no,
  })
}

/**
 * 演示用：按生命周期顺序推进一个节点。
 * 票级节点直接推进；箱级节点推进「最靠前尚未完成该节点」的那一箱，
 * 因此一票多箱会逐箱推进，进度不一致时优先补齐落后的箱子。
 */
export async function advanceShipment(id: string): Promise<Shipment> {
  await delay(250)
  const s = SHIPMENTS.find((x) => x.id === id)
  if (!s) throw new Error('未找到该跟踪记录')
  if (s.status === '已完成' || s.status === '已取消') return structuredClone(s)

  for (const def of NODE_DEFS) {
    if (def.scope === 'shipment') {
      const node = s.ticketNodes.find((n) => n.key === def.key)!
      if (node.status !== 'done') {
        advanceTicketNode(s, node)
        break
      }
    } else {
      const container = s.containers.find((c) => nodeOf(c, def.key).status !== 'done')
      if (container) {
        advanceContainerNode(s, container, def.key)
        break
      }
    }
  }

  s.updatedAt = DEMO_NOW
  recompute(s)
  return structuredClone(s)
}

// ────────────────────────────── 3. 发票管理 ──────────────────────────────

/** 发票审核状态 */
export type InvoiceStatus = '待审核' | '已通过' | '已驳回'

/** 进出口方向 */
export type InvoiceDirection = '出口' | '进口'

/** 币种 */
export type FeeCurrency = 'USD' | 'CNY'

export const FEE_CURRENCIES: FeeCurrency[] = ['USD', 'CNY']

/** 发票附件（演示用元数据，对应上传的原件） */
export interface InvoiceFile {
  /** 文件名 */
  name: string
  /** MIME 类型 */
  mime: string
  /** 文件大小（字节） */
  size: number
}

/**
 * 一张发票：必须关联一个提单号（一票货），
 * 用于把费用归集到具体的进出口票上做核对。
 */
export interface InvoiceRow {
  id: string
  /** 发票号 */
  invoiceNo: string
  /** 关联提单号 */
  blNo: string
  /** 关联箱号（一票多箱时可指向具体箱） */
  containerNo?: string
  /** 关联船名 */
  vessel: string
  /** 关联航次 */
  voyage: string
  /** 进出口方向 */
  direction: InvoiceDirection
  /** 费用类型 */
  category: string
  amount: number
  currency: FeeCurrency
  uploader: string
  /** 上传时间 */
  uploadedAt: string
  status: InvoiceStatus
  /** 发票附件 */
  file: InvoiceFile
}

/** 发票审核状态（筛选下拉取值；顺序即流转顺序） */
export const INVOICE_STATUSES: InvoiceStatus[] = ['待审核', '已通过', '已驳回']

/** 发票费用类型 */
export const INVOICE_CATEGORIES = ['海运费', '港杂费', '目的港费用', '报关费', '拖车费', '仓储费']

/** 构造发票附件元数据 */
function invoiceFile(invoiceNo: string, kb: number): InvoiceFile {
  return { name: `${invoiceNo}.pdf`, mime: 'application/pdf', size: kb * 1024 }
}

const INVOICES: InvoiceRow[] = [
  {
    id: 'INV-2601',
    invoiceNo: 'TF-2026-0912',
    blNo: 'TFBL26013',
    vessel: 'ONE COLUMBA',
    voyage: '049W',
    direction: '出口',
    category: '海运费',
    amount: 8650,
    currency: 'USD',
    uploader: '张敏 · 深圳',
    uploadedAt: '2026-09-21',
    status: '已通过',
    file: invoiceFile('TF-2026-0912', 328),
  },
  {
    id: 'INV-2602',
    invoiceNo: 'TF-2026-0913',
    blNo: 'TFBL26008',
    vessel: 'COSCO PRIDE',
    voyage: '088E',
    direction: '出口',
    category: '港杂费',
    amount: 12380,
    currency: 'CNY',
    uploader: '李伟 · 宁波',
    uploadedAt: '2026-09-23',
    status: '待审核',
    file: invoiceFile('TF-2026-0913', 214),
  },
  {
    id: 'INV-2603',
    invoiceNo: 'TF-2026-0914',
    blNo: 'TFBL26005',
    containerNo: 'TGHU8890123',
    vessel: 'HMM GDANSK',
    voyage: '035W',
    direction: '出口',
    category: '目的港费用',
    amount: 2460,
    currency: 'USD',
    uploader: '王芳 · 上海',
    uploadedAt: '2026-09-25',
    status: '待审核',
    file: invoiceFile('TF-2026-0914', 452),
  },
  {
    id: 'INV-2604',
    invoiceNo: 'TF-2026-0915',
    blNo: 'TFBL26010',
    vessel: 'MAERSK SENTOSA',
    voyage: '526W',
    direction: '进口',
    category: '报关费',
    amount: 3200,
    currency: 'CNY',
    uploader: '陈强 · 广州',
    uploadedAt: '2026-09-26',
    status: '已驳回',
    file: invoiceFile('TF-2026-0915', 176),
  },
  {
    id: 'INV-2605',
    invoiceNo: 'TF-2026-0916',
    blNo: 'TFBL26001',
    containerNo: 'MSCU7123456',
    vessel: 'MSC ISABELLA',
    voyage: '418W',
    direction: '出口',
    category: '海运费',
    amount: 10240,
    currency: 'USD',
    uploader: '张敏 · 深圳',
    uploadedAt: '2026-09-28',
    status: '已通过',
    file: invoiceFile('TF-2026-0916', 391),
  },
  {
    id: 'INV-2606',
    invoiceNo: 'TF-2026-0917',
    blNo: 'TFBL26002',
    vessel: 'COSCO ARIES',
    voyage: '092E',
    direction: '出口',
    category: '拖车费',
    amount: 5600,
    currency: 'CNY',
    uploader: '赵磊 · 青岛',
    uploadedAt: '2026-09-28',
    status: '待审核',
    file: invoiceFile('TF-2026-0917', 205),
  },
  {
    id: 'INV-2607',
    invoiceNo: 'TF-2026-0918',
    blNo: 'TFBL26007',
    vessel: 'EVER LIVING',
    voyage: '1102W',
    direction: '出口',
    category: '仓储费',
    amount: 1860,
    currency: 'CNY',
    uploader: '孙倩 · 上海',
    uploadedAt: '2026-09-29',
    status: '已通过',
    file: invoiceFile('TF-2026-0918', 158),
  },
  {
    id: 'INV-2608',
    invoiceNo: 'TF-2026-0919',
    blNo: 'TFBL26004',
    vessel: 'CMA CGM LYRA',
    voyage: '0FTE',
    direction: '进口',
    category: '目的港费用',
    amount: 3120,
    currency: 'USD',
    uploader: '周航 · 深圳',
    uploadedAt: '2026-09-29',
    status: '待审核',
    file: invoiceFile('TF-2026-0919', 287),
  },
  {
    id: 'INV-2609',
    invoiceNo: 'TF-2026-0920',
    blNo: 'TFBL26006',
    vessel: 'EVER SUMMIT',
    voyage: '1108W',
    direction: '进口',
    category: '港杂费',
    amount: 2280,
    currency: 'USD',
    uploader: '吴敏 · 宁波',
    uploadedAt: '2026-09-30',
    status: '待审核',
    file: invoiceFile('TF-2026-0920', 243),
  },
  {
    id: 'INV-2610',
    invoiceNo: 'TF-2026-0921',
    blNo: 'TFBL26009',
    vessel: 'HMM ALGECIRAS',
    voyage: '031W',
    direction: '出口',
    category: '海运费',
    amount: 9780,
    currency: 'USD',
    uploader: '郑爽 · 广州',
    uploadedAt: '2026-09-30',
    status: '已驳回',
    file: invoiceFile('TF-2026-0921', 366),
  },
]

export async function getInvoices(): Promise<InvoiceRow[]> {
  await delay()
  return structuredClone(INVOICES)
}

// ────────────────────── 4. 监控节点配置（单票提单生命周期） ──────────────────────
//
// 监控范围：仅「单票提单（一票货）」的在途生命周期，即 NODE_DEFS 的 11 个节点
// （订舱 → 空箱返还）。不包含发票管理 / 费用结算等财务环节。

/** 生命周期节点的监控开关与提前量 */
export interface MonitorNodeRow {
  key: NodeKey
  /** 是否启用该节点监控 */
  enabled: boolean
  /** 提前预警时长（小时）：早于节点计划时间多少小时开始关注，0 = 到点后提醒 */
  leadHours: number
  /** 最后修改 */
  updatedAt: string
}

/** 预警规则：一条规则 = 监控节点 + 触发条件 + 预警等级 */
export interface RuleRow {
  id: string
  /** 规则名称 */
  name: string
  /** 监控节点（在途生命周期节点） */
  node: NodeKey
  /** 触发条件 */
  condition: string
  /** 预警等级（复用关注等级：异常 / 提醒） */
  level: AttentionLevel
  enabled: boolean
  /** 最后修改 */
  updatedAt: string
}

/** 各生命周期节点的初始监控配置（顺序 = 生命周期顺序） */
const MONITOR_NODES: MonitorNodeRow[] = [
  { key: 'booking', enabled: true, leadHours: 24, updatedAt: '2026-09-18' },
  { key: 'so', enabled: true, leadHours: 48, updatedAt: '2026-09-18' },
  { key: 'pickupEmpty', enabled: true, leadHours: 12, updatedAt: '2026-09-18' },
  { key: 'stuffing', enabled: true, leadHours: 12, updatedAt: '2026-09-18' },
  { key: 'gateIn', enabled: true, leadHours: 24, updatedAt: '2026-09-19' },
  { key: 'cutoff', enabled: true, leadHours: 6, updatedAt: '2026-09-19' },
  { key: 'departed', enabled: true, leadHours: 0, updatedAt: '2026-09-20' },
  { key: 'arrived', enabled: true, leadHours: 24, updatedAt: '2026-09-20' },
  { key: 'discharged', enabled: true, leadHours: 12, updatedAt: '2026-09-20' },
  { key: 'pickupFull', enabled: true, leadHours: 24, updatedAt: '2026-09-21' },
  { key: 'emptyReturn', enabled: false, leadHours: 48, updatedAt: '2026-09-21' },
]

/** 初始预警规则库（只覆盖在途生命周期节点，不含发票 / 费用） */
const RULES: RuleRow[] = [
  {
    id: 'RUL-01',
    name: '订舱失败告警',
    node: 'booking',
    condition: '订舱节点状态变为「失败」',
    level: 'alert',
    enabled: true,
    updatedAt: '2026-09-18',
  },
  {
    id: 'RUL-02',
    name: '放舱超期未放舱',
    node: 'so',
    condition: '距 ETD ≤ 3 天仍未放舱（SO 未确认）',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-18',
  },
  {
    id: 'RUL-03',
    name: '订舱后船信息变更',
    node: 'so',
    condition: '放舱后船名 / 航次发生变更',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-19',
  },
  {
    id: 'RUL-04',
    name: '提柜超期',
    node: 'pickupEmpty',
    condition: '放舱后 48h 仍未提空箱',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-19',
  },
  {
    id: 'RUL-05',
    name: '装柜超期',
    node: 'stuffing',
    condition: '提柜后 72h 仍未完成装柜封箱',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-19',
  },
  {
    id: 'RUL-06',
    name: '进港赶截预警',
    node: 'gateIn',
    condition: '截关前 24h 重柜仍未进港',
    level: 'alert',
    enabled: true,
    updatedAt: '2026-09-20',
  },
  {
    id: 'RUL-07',
    name: '截关未放行',
    node: 'cutoff',
    condition: '截关时仍有箱未放行（赶截 / 顺延风险）',
    level: 'alert',
    enabled: true,
    updatedAt: '2026-09-20',
  },
  {
    id: 'RUL-08',
    name: '开船延误',
    node: 'departed',
    condition: '实际 ATD 较预计 ETD 推迟 > 3 天',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-20',
  },
  {
    id: 'RUL-09',
    name: '中转港滞留',
    node: 'departed',
    condition: '在中转港停留 > 5 天仍未离港',
    level: 'alert',
    enabled: true,
    updatedAt: '2026-09-21',
  },
  {
    id: 'RUL-10',
    name: '中转变更提醒',
    node: 'departed',
    condition: '在途过程中中转港信息发生变更',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-21',
  },
  {
    id: 'RUL-11',
    name: '甩柜改配提醒',
    node: 'departed',
    condition: '任一箱未赶上原航次被甩柜 / 改配',
    level: 'alert',
    enabled: true,
    updatedAt: '2026-09-21',
  },
  {
    id: 'RUL-12',
    name: '到港延误',
    node: 'arrived',
    condition: '实际 ATA 较预计 ETA 晚 > 2 天',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-22',
  },
  {
    id: 'RUL-13',
    name: '目的港卸船滞留',
    node: 'discharged',
    condition: '到港后 72h 仍未卸船放箱',
    level: 'warning',
    enabled: false,
    updatedAt: '2026-09-22',
  },
  {
    id: 'RUL-14',
    name: '提柜派送超期',
    node: 'pickupFull',
    condition: '卸船后 5 天仍未提重柜派送',
    level: 'warning',
    enabled: true,
    updatedAt: '2026-09-23',
  },
  {
    id: 'RUL-15',
    name: '空箱返还到期预警',
    node: 'emptyReturn',
    condition: '还箱有效期剩余 ≤ 3 天仍未还箱',
    level: 'warning',
    enabled: false,
    updatedAt: '2026-09-23',
  },
]

export async function getMonitorNodes(): Promise<MonitorNodeRow[]> {
  await delay()
  return structuredClone(MONITOR_NODES)
}

/** 更新某节点的监控配置（开关 / 提前量） */
export async function updateMonitorNode(
  key: NodeKey,
  patch: { enabled?: boolean; leadHours?: number },
): Promise<MonitorNodeRow> {
  await delay(150)
  const row = MONITOR_NODES.find((n) => n.key === key)
  if (!row) throw new Error('未找到该生命周期节点')
  if (patch.enabled !== undefined) row.enabled = patch.enabled
  if (patch.leadHours !== undefined) {
    row.leadHours = Math.max(0, Math.min(720, Math.round(patch.leadHours)))
  }
  row.updatedAt = DEMO_TODAY
  return structuredClone(row)
}

export async function getRules(): Promise<RuleRow[]> {
  await delay()
  return structuredClone(RULES)
}

/** 启用 / 停用一条预警规则 */
export async function updateRuleEnabled(id: string, enabled: boolean): Promise<RuleRow> {
  await delay(150)
  const row = RULES.find((r) => r.id === id)
  if (!row) throw new Error('未找到该规则')
  row.enabled = enabled
  row.updatedAt = DEMO_TODAY
  return structuredClone(row)
}

/** 新建预警规则入参 */
export interface RuleInput {
  name: string
  node: NodeKey
  condition: string
  level: AttentionLevel
}

let ruleSeq = RULES.length

export async function createRule(input: RuleInput): Promise<RuleRow> {
  await delay(250)
  const name = input.name.trim()
  const condition = input.condition.trim()
  if (!name) throw new Error('请填写规则名称')
  if (!condition) throw new Error('请填写触发条件')
  if (!isNodeKey(input.node)) throw new Error('请选择监控节点')
  ruleSeq += 1
  const row: RuleRow = {
    id: `RUL-${String(ruleSeq).padStart(2, '0')}`,
    name,
    node: input.node,
    condition,
    level: input.level,
    enabled: true,
    updatedAt: DEMO_TODAY,
  }
  RULES.unshift(row)
  return structuredClone(row)
}


// ────────────────────────────── 路由 search params 守卫 ──────────────────────

/** 发票管理列表页的 search params */
export interface InvoiceSearch {
  q?: string
  status?: InvoiceStatus
  category?: string
  currency?: FeeCurrency
}

/** 监控节点配置页的 search params */
export interface MonitoringSearch {
  q?: string
  node?: NodeKey
  level?: AttentionLevel
  status?: 'on' | 'off'
}

/** 发票审核状态守卫 */
export function isInvoiceStatus(v: unknown): v is InvoiceStatus {
  return v === '待审核' || v === '已通过' || v === '已驳回'
}

/** 币种守卫 */
export function isFeeCurrency(v: unknown): v is FeeCurrency {
  return v === 'USD' || v === 'CNY'
}

/** 文本型 search 参数：去空白、限长，空串回落 undefined */
function cleanText(v: unknown, max = 40): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim().slice(0, max)
  return s || undefined
}

/** 发票管理列表页 search params 守卫：非法值一律回落为「不限」 */
export function validateInvoiceSearch(search: Record<string, unknown>): InvoiceSearch {
  return {
    q: cleanText(search.q),
    status: isInvoiceStatus(search.status) ? search.status : undefined,
    category: cleanText(search.category, 20),
    currency: isFeeCurrency(search.currency) ? search.currency : undefined,
  }
}

/** 监控节点配置页 search params 守卫：非法值一律回落为「不限」 */
export function validateMonitoringSearch(search: Record<string, unknown>): MonitoringSearch {
  return {
    q: cleanText(search.q),
    node: isNodeKey(search.node) ? search.node : undefined,
    level: isAttentionLevel(search.level) ? search.level : undefined,
    status: search.status === 'on' || search.status === 'off' ? search.status : undefined,
  }
}