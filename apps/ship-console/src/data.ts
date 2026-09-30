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
// ────────────────────────────── 2. 船务可视化 ──────────────────────────────

export interface OverviewStats {
  /** 在航船舶（艘） */
  vessels: number
  vesselsDelta: number
  /** 执行中航次（个） */
  voyages: number
  voyagesDelta: number
  /** 准班率（%） */
  onTimeRate: number
  onTimeRateDelta: number
  /** 异常节点（个） */
  abnormalNodes: number
  abnormalDelta: number
}

const OVERVIEW: OverviewStats = {
  vessels: 42,
  vesselsDelta: 4.8,
  voyages: 68,
  voyagesDelta: 2.1,
  onTimeRate: 86.4,
  onTimeRateDelta: -1.6,
  abnormalNodes: 7,
  abnormalDelta: 16.7,
}

export async function getOverview(): Promise<OverviewStats> {
  await delay()
  return OVERVIEW
}

// ────────────────────────────── 3. 费用管理 ──────────────────────────────

export type InvoiceStatus = '待审核' | '已通过' | '已驳回'

export interface InvoiceRow {
  id: string
  /** 发票号 */
  invoiceNo: string
  /** 关联航次 */
  voyage: string
  /** 费用类型 */
  category: string
  amount: number
  currency: 'USD' | 'CNY'
  uploader: string
  /** 上传时间 */
  uploadedAt: string
  status: InvoiceStatus
}

const INVOICES: InvoiceRow[] = [
  {
    id: 'INV-2601',
    invoiceNo: 'TF-2026-0912',
    voyage: 'MSC AURORA / 412W',
    category: '海运费',
    amount: 8650,
    currency: 'USD',
    uploader: '张敏 · 深圳',
    uploadedAt: '2026-09-21',
    status: '已通过',
  },
  {
    id: 'INV-2602',
    invoiceNo: 'TF-2026-0913',
    voyage: 'COSCO PRIDE / 088E',
    category: '港杂费',
    amount: 12380,
    currency: 'CNY',
    uploader: '李伟 · 宁波',
    uploadedAt: '2026-09-23',
    status: '待审核',
  },
  {
    id: 'INV-2603',
    invoiceNo: 'TF-2026-0914',
    voyage: 'EVER LIVING / 1102W',
    category: '目的港费用',
    amount: 2460,
    currency: 'USD',
    uploader: '王芳 · 上海',
    uploadedAt: '2026-09-25',
    status: '待审核',
  },
  {
    id: 'INV-2604',
    invoiceNo: 'TF-2026-0915',
    voyage: 'ONE HARMONY / 045W',
    category: '报关费',
    amount: 3200,
    currency: 'CNY',
    uploader: '陈强 · 广州',
    uploadedAt: '2026-09-26',
    status: '已驳回',
  },
  {
    id: 'INV-2605',
    invoiceNo: 'TF-2026-0916',
    voyage: 'MAERSK SENTOSA / 526W',
    category: '海运费',
    amount: 10240,
    currency: 'USD',
    uploader: '张敏 · 深圳',
    uploadedAt: '2026-09-28',
    status: '已通过',
  },
]

export async function getInvoices(): Promise<InvoiceRow[]> {
  await delay()
  return INVOICES
}

export interface PortFeeRow {
  id: string
  /** 港口 */
  port: string
  /** 国家/地区 */
  country: string
  /** 费用类别 */
  category: string
  /** 收费项 */
  item: string
  /** 计费单位 */
  unit: string
  /** 收费标准 */
  price: number
  currency: 'USD' | 'CNY'
  /** 生效日期 */
  effectiveFrom: string
}

const PORT_FEES: PortFeeRow[] = [
  {
    id: 'FEE-01',
    port: '蒙巴萨',
    country: '肯尼亚',
    category: '装卸费',
    item: '集装箱装卸（20GP）',
    unit: '箱',
    price: 145,
    currency: 'USD',
    effectiveFrom: '2026-07-01',
  },
  {
    id: 'FEE-02',
    port: '蒙巴萨',
    country: '肯尼亚',
    category: '堆存费',
    item: '免堆期后堆存',
    unit: '箱/天',
    price: 8,
    currency: 'USD',
    effectiveFrom: '2026-07-01',
  },
  {
    id: 'FEE-03',
    port: '拉各斯',
    country: '尼日利亚',
    category: '港杂费',
    item: '码头操作费 THC',
    unit: '箱',
    price: 210,
    currency: 'USD',
    effectiveFrom: '2026-06-15',
  },
  {
    id: 'FEE-04',
    port: '特马',
    country: '加纳',
    category: '装卸费',
    item: '集装箱装卸（40HQ）',
    unit: '箱',
    price: 268,
    currency: 'USD',
    effectiveFrom: '2026-08-01',
  },
  {
    id: 'FEE-05',
    port: '达累斯萨拉姆',
    country: '坦桑尼亚',
    category: '拖轮费',
    item: '拖轮引航',
    unit: '航次',
    price: 3200,
    currency: 'USD',
    effectiveFrom: '2026-05-01',
  },
  {
    id: 'FEE-06',
    port: '盐田',
    country: '中国',
    category: '港杂费',
    item: '换单费',
    unit: '票',
    price: 350,
    currency: 'CNY',
    effectiveFrom: '2026-01-01',
  },
  {
    id: 'FEE-07',
    port: '吉达',
    country: '沙特阿拉伯',
    category: '堆存费',
    item: '冷藏箱插电费',
    unit: '箱/天',
    price: 12,
    currency: 'USD',
    effectiveFrom: '2026-09-01',
  },
  {
    id: 'FEE-08',
    port: '阿比让',
    country: '科特迪瓦',
    category: '装卸费',
    item: '集装箱装卸（20GP）',
    unit: '箱',
    price: 168,
    currency: 'USD',
    effectiveFrom: '2026-08-15',
  },
]

export async function getPortFees(): Promise<PortFeeRow[]> {
  await delay()
  return PORT_FEES
}

// ────────────────────────────── 4. 监控节点规则 ──────────────────────────────

export type MonitorNode = '订舱确认' | 'ETD 船期' | '到港清关' | '费用结算'

export interface RuleRow {
  id: string
  /** 规则名称 */
  name: string
  /** 监控的业务节点 */
  node: MonitorNode
  /** 触发条件 */
  condition: string
  /** 通知方式 */
  notify: '邮件' | '企业微信' | '短信'
  enabled: boolean
  /** 最后修改 */
  updatedAt: string
}

const RULES: RuleRow[] = [
  {
    id: 'RUL-01',
    name: '开航前未确认舱位',
    node: '订舱确认',
    condition: 'ETD 前 72h 订舱状态仍为「未确认」',
    notify: '企业微信',
    enabled: true,
    updatedAt: '2026-09-18',
  },
  {
    id: 'RUL-02',
    name: 'ETD 延期超 3 天',
    node: 'ETD 船期',
    condition: '实际 ETD 较预计推迟 > 3 天',
    notify: '邮件',
    enabled: true,
    updatedAt: '2026-09-20',
  },
  {
    id: 'RUL-03',
    name: '到港超期未申报',
    node: '到港清关',
    condition: '到港后 48h 内未提交清关资料',
    notify: '短信',
    enabled: true,
    updatedAt: '2026-09-22',
  },
  {
    id: 'RUL-04',
    name: '费用超预算阈值',
    node: '费用结算',
    condition: '单航次费用超预算 10%',
    notify: '邮件',
    enabled: false,
    updatedAt: '2026-09-24',
  },
  {
    id: 'RUL-05',
    name: '发票超期未审核',
    node: '费用结算',
    condition: '发票上传后 5 个工作日仍未审核',
    notify: '企业微信',
    enabled: true,
    updatedAt: '2026-09-27',
  },
  {
    id: 'RUL-06',
    name: '目的港滞港预警',
    node: '到港清关',
    condition: '到港后免堆期剩余 ≤ 2 天',
    notify: '企业微信',
    enabled: false,
    updatedAt: '2026-09-29',
  },
]

export async function getRules(): Promise<RuleRow[]> {
  await delay()
  return RULES
}

// ────────────────────────────── 路由 search params 守卫 ──────────────────────

export type FeeTab = 'invoice' | 'fee'

/** 费用管理页签的 search params 守卫：非法值回落 invoice */
export function isFeeTab(v: unknown): v is FeeTab {
  return v === 'invoice' || v === 'fee'
}
