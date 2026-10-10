# TF Prototype · 多项目 Web 原型仓库

[![CI](https://github.com/scau009/tf_prototype/actions/workflows/ci.yml/badge.svg)](https://github.com/scau009/tf_prototype/actions/workflows/ci.yml)
[![Deploy](https://github.com/scau009/tf_prototype/actions/workflows/deploy.yml/badge.svg)](https://github.com/scau009/tf_prototype/actions/workflows/deploy.yml)

基于 **Vite + React + TypeScript + pnpm Monorepo** 的原型工厂：一个仓库承载多个可交互原型，
Hub 门户统一导航，共享组件与工具跨原型复用，`pnpm new` 一条命令拉起新原型，
push `prod` 分支自动构建部署到 Cloudflare。

**线上地址：<https://tf-prototype.taoism.gz.cn>**
（门户在根路径，各原型在 `/<id>/` 子路径，如 [/todo-list/](https://tf-prototype.taoism.gz.cn/todo-list/)）

备用地址 <https://tf-prototype.bearinspring1996.workers.dev>（`*.workers.dev` 在中国境内被整体封锁，故改用自定义域名）

## 核心特性

- **原型即目录**：`apps/` 下每个子目录是独立可运行的 React 应用，互不依赖、互不阻塞
- **一键新原型**：`pnpm new <name>` 自动生成脚手架（TanStack Router + Query + Tailwind）、分配端口、注册到门户
- **导航门户**：Hub 以项目卡片为单位汇总全部原型，卡片含状态、启动命令与直达链接
- **统一技术底座**：TanStack Router（路由）+ TanStack Query（数据层）+ Tailwind v4（样式）+ shadcn/ui（`@tf/ui` 现成组件，不手写基础组件）
- **共享层沉淀**：`@tf/ui` 组件库 + `@tf/utils` 工具库 + `@tf/prototype-meta` 注册表，避免复制粘贴
- **一条发布链**：`pnpm build:site` 合并整站（门户→根，原型→子路径）→ `wrangler deploy` 上线
- **CI/CD**：PR / main 走质量检查，prod 合并自动部署，typecheck 作为发布闸门

## 目录结构

```text
tf_prototype/
├── apps/                              # 【原型应用】每个子目录 = 一个独立可运行的原型
│   ├── hub/                           #   原型导航门户（dev 端口 5173）
│   ├── todo-list/                     #   示例原型：待办清单（dev 端口 5101）
│   ├── dashboard/                     #   示例原型：数据看板（dev 端口 5102）
│   └── ship-console/                  #   船务信息中台（dev 端口 5103，左栏中台外壳 + 三模块）
├── packages/                          # 【共享包】跨原型复用，只被 apps 依赖
│   ├── prototype-meta/                #   原型注册表（唯一数据源）：id / 端口 / 状态
│   ├── ui/                            #   共享组件：shadcn/ui（Radix + Tailwind v4）+ 设计令牌
│   └── utils/                         #   工具与 Hooks：cn / uid / formatDate / useLocalStorage
├── scripts/
│   ├── new-prototype.mjs              # pnpm new：生成新原型 + 分配端口 + 自动注册门户
│   ├── build-site.mjs                 # pnpm build:site：整站构建合并（hub→根，原型→/<id>/）
│   └── template-app/                  # 新原型文件模板（TanStack + Tailwind，{{id}} / {{port}} 占位）
├── .github/workflows/
│   ├── ci.yml                         # CI：PR / push main → typecheck + build
│   └── deploy.yml                     # CD：push prod → 构建整站 → 部署 Cloudflare Workers
├── docs/
│   └── conventions.md                 # 开发规范：命名 / 端口 / 状态流转 / 依赖分层
├── wrangler.jsonc                     # Cloudflare Workers 静态资源配置（配置即代码）
├── pnpm-workspace.yaml                # workspace 定义：apps/* 与 packages/*
├── tsconfig.base.json                 # 全仓 TS 基础配置（各包 extends，改一处生效全局）
└── package.json                       # 根脚本：dev / build / typecheck / new / deploy:cf
```

单个原型（以 `apps/todo-list` 为例）的内部结构：

```text
apps/todo-list/
├── index.html                 # 应用入口 HTML
├── vite.config.ts             # Vite 配置（Tailwind 插件 + dev 端口写死在此）
├── tsconfig.json              # 继承根 tsconfig.base.json
├── package.json               # 包名 @tf/todo-list
└── src/
    ├── main.tsx               # 应用引导（QueryClient + RouterProvider）
    ├── router.tsx             # TanStack Router 实例（basepath 自适应 dev / 子路径部署）
    ├── routes/
    │   ├── __root.tsx         # 应用外壳（背景/字体/全局浮层）
    │   └── index.tsx          # 首页（新页面 = 新 Route，挂到 router.tsx）
    └── styles.css             # Tailwind 入口（引 @tf/ui 令牌 + @source 扫共享组件）
```

### 依赖分层规则

```text
apps/* ──► packages/ui ──► packages/utils
  ├────────────────────────► packages/utils
  └────────────────────────► packages/prototype-meta   （仅 hub 依赖）

规则：apps 之间禁止互相依赖；packages 不得反向依赖 apps；
     prototype-meta 是纯数据包，不依赖任何包。
```

## 快速开始（本地）

```bash
git clone git@github.com:scau009/tf_prototype.git
cd tf_prototype
pnpm install        # 安装全部依赖（workspace 联动）
pnpm dev            # 并行启动 Hub 门户 + 全部原型
```

访问 **http://localhost:5173**（门户），点卡片「打开原型 ↗」直达各原型（5101、5102 …）。
只启动单个原型：`pnpm --filter @tf/todo-list dev`。

## 日常工作流

### 新增一个原型

```bash
pnpm new order-flow 订单流程演示
```

脚本自动完成：从 `scripts/template-app/` 生成 `apps/order-flow/`、分配下一个空闲端口
（5101–5199）、在原型注册表写入一条 `draft` 记录。随后：

```bash
pnpm --filter @tf/order-flow dev   # 启动并访问 http://localhost:<分配的端口>
```

在 `src/routes/` 搭建交互（新页面挂到 `src/router.tsx`）；成型后更新注册表的 `description` / `status`
（`draft → wip → demo → done`），门户卡片即时同步。

### 发布上线

```bash
git checkout main && git pull
git checkout prod && git merge main && git push   # 推送后 GitHub Actions 自动部署
```

约 1–2 分钟后线上更新（Deploy 徽章 / Actions 页可看进度），新原型自动出现在线上门户。
紧急绕过 CI 时可本地直发：`pnpm deploy:cf`（需本地 export Cloudflare 凭据）。

## 命令速查

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 并行启动门户与全部原型（hub 5173，原型 5101+） |
| `pnpm --filter @tf/<id> dev` | 只启动某个原型 |
| `pnpm new <name> [标题]` | 创建新原型：脚手架 + 分配端口 + 注册门户 |
| `pnpm typecheck` | 全仓 TypeScript 类型检查 |
| `pnpm build` | 构建全部应用（产物在各自 `dist/`） |
| `pnpm build:site` | 构建并合并整站产物到 `site/`（hub→根，原型→`/<id>/`） |
| `pnpm preview:site` | `wrangler dev` 本地模拟线上站点（http://localhost:8787，无需认证） |
| `pnpm deploy:cf` | 本地直发：build:site + wrangler deploy（CI 之外的手动通道） |

> 脚本名用 `deploy:cf` 而非 `deploy`，避开 pnpm 内置的 `deploy` 命令（workspace 单包发布用）。

## 部署架构（Cloudflare Workers 静态资源）

**单项目子路径**形态：门户在根路径、各原型在 `/<id>/`，一次部署整站上线。

```text
pnpm build:site                          wrangler deploy
┌─────────────────────┐    ┌─────────────────────────────────┐
│ hub      → 根路径    │    │ https://tf-prototype.            │
│ 原型 A   → /a/      ├───►│    taoism.gz.cn/                 │
│ 原型 B   → /b/      │    │   /todo-list/  /dashboard/ …     │
└─────────────────────┘    └─────────────────────────────────┘
        site/                       Cloudflare Workers
```

- 站点结构声明在 `wrangler.jsonc`（配置即代码，进 git）；自定义域名写在其 `routes` 里（`custom_domain: true`），
  DNS 记录由 `wrangler deploy` 自动建好——前提是该域名已加到 Worker 所在 Cloudflare 账号且 zone 状态 Active，
  且 `CLOUDFLARE_API_TOKEN` 对这个 zone 有编辑权限，否则部署会在挂域名这一步报错（旧版本继续在线）
- Hub 卡片链接按环境自动切换：本地 dev → `localhost:<端口>`，线上 → `/<id>/`
- 每次部署生成可回滚的版本；无尾斜杠路径 307 自动补全（如 `/todo-list` → `/todo-list/`）

## CI / CD（GitHub Actions）

分支模型：**`main` 开发分支**（PR 合入，CI 检查）；**`prod` 生产分支**（合并后自动部署）。
原型开发分支命名 `proto/<id>`（如 `proto/order-flow`）。

| 工作流 | 触发 | 动作 |
| --- | --- | --- |
| [CI](.github/workflows/ci.yml) | PR、push `main` | install → typecheck → build（全部应用） |
| [Deploy](.github/workflows/deploy.yml) | push `prod`、手动触发 | install → typecheck → build:site → `wrangler deploy` |

- 凭据走 GitHub Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（**已配置**）
- `concurrency` 控制：新的 prod 推送自动取消进行中的旧部署
- typecheck 是发布闸门，类型错误阻断上线
- pnpm 版本由 `package.json` 的 `packageManager` 字段锁定，CI 与本地一致

## 约定速览（详见 [docs/conventions.md](docs/conventions.md)）

- **命名**：原型目录与 id 用 kebab-case（如 `order-flow`），包名 `@tf/<id>`，两者一致
- **端口**：Hub 固定 5173；原型 5101–5199，由 `pnpm new` 顺序分配
- **样式**：Tailwind v4 工具类；设计令牌（`@theme` + `:root` 变量）统一在 `@tf/ui/styles.css`，页面入口引一次
- **组件**：基础组件一律用 `@tf/ui`（shadcn/ui 生成），不手写；缺的组件在 `packages/ui` 跑 shadcn CLI 补
- **数据**：mock 数据写在原型内，经 TanStack Query（useQuery）消费；列表用 TanStack Table
- **沉没规则**：新组件先问 shadcn registry 有没有；只有业务组件才写在原型 `src/components/`
- **状态流转**：`draft`（刚创建）→ `wip`（搭建中）→ `demo`（可演示）→ `done`（结论已沉淀）
- **凭据**：Cloudflare 令牌只存在于环境变量 / GitHub Secrets，禁止写入代码与配置

## 技术栈版本

- Node ≥ 20 · pnpm 12（workspace 协议，版本由 `packageManager` 锁定）
- React 19 · TypeScript 5.9 · Vite 7（@vitejs/plugin-react + @tailwindcss/vite）
- TanStack Router（代码式路由，basepath 自适应子路径部署）· TanStack Query · TanStack Table（按需）
- Tailwind CSS v4 · shadcn/ui（Radix + cva + lucide-react）· Recharts（dashboard 图表）
- wrangler 4（Workers 静态资源托管）
- 原则：基础组件交给 shadcn/ui，业务组件写在原型内，保持原型轻量可控
