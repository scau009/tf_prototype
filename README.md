# TF Prototype · 多项目 Web 原型仓库

基于 **Vite + React + TypeScript + pnpm Monorepo**。一个仓库承载多个可交互原型，
由 Hub 门户统一导航，跨原型共享组件与工具，新增原型只需一条命令 `pnpm new <name>`。

## 目录结构

```text
tf_prototype/
├── apps/                              # 【原型应用】每个子目录 = 一个独立可运行的原型
│   ├── hub/                           #   原型导航门户（端口 5173）：搜索 / 标签 / 状态筛选
│   ├── todo-list/                     #   示例原型：待办清单（端口 5101）
│   │   ├── index.html                 #   应用入口 HTML
│   │   ├── vite.config.ts             #   Vite 配置（端口在各自文件里分配）
│   │   ├── tsconfig.json              #   继承根 tsconfig.base.json
│   │   ├── package.json               #   包名 @tf/todo-list
│   │   └── src/
│   │       ├── main.tsx               #   应用引导（引入 @tf/ui 样式 + 私有样式）
│   │       ├── App.tsx                #   页面入口
│   │       └── styles.css             #   页面私有样式
│   └── dashboard/                     #   示例原型：数据看板（端口 5102）
│       └── …                          #   （结构同上，另含 components/ 与 data.ts）
├── packages/                          # 【共享包】跨原型复用，只被 apps 依赖
│   ├── prototype-meta/                #   原型注册表（唯一数据源）：名称 / 端口 / 标签 / 状态
│   ├── ui/                            #   共享组件库：Button / Card / Tag / Input / Empty
│   │   └── src/styles.css             #   设计令牌（--tf-*）+ 基础组件样式
│   └── utils/                         #   工具与 Hooks：cn / uid / formatDate / useLocalStorage
├── scripts/
│   ├── new-prototype.mjs              # 脚手架：生成新原型 + 分配端口 + 自动注册
│   └── template-app/                  # 新原型的文件模板（{{id}} / {{port}} 占位）
├── docs/
│   └── conventions.md                 # 开发规范：命名、端口、状态流转、依赖分层
├── pnpm-workspace.yaml                # workspace 定义：apps/* 与 packages/*
├── tsconfig.base.json                 # 全仓 TS 基础配置（各包 extends，改一处生效全局）
├── package.json                       # 根脚本：dev / build / typecheck / new
└── README.md
```

### 依赖分层规则

```text
apps/* ──► packages/ui ──► packages/utils
  ├────────────────────────► packages/utils
  └────────────────────────► packages/prototype-meta   （仅 hub 依赖）

规则：apps 之间禁止互相依赖；packages 不得反向依赖 apps；
     prototype-meta 是纯数据包，不依赖任何包。
```

## 快速开始

```bash
pnpm install      # 安装全部依赖（workspace 联动）
pnpm dev          # 并行启动 Hub 门户 + 全部原型
pnpm dev:hub      # 只启动门户
```

启动后访问 **http://localhost:5173**（Hub 门户），
点击卡片上的「打开原型 ↗」跳转到各原型（5101、5102 …）。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 并行启动门户与全部原型 |
| `pnpm dev --filter @tf/todo-list` | 只启动某个原型（按包名过滤） |
| `pnpm build` | 构建全部原型（产物在各自 `dist/`） |
| `pnpm build:site` | 构建并合并整站产物到 `site/`（部署用） |
| `pnpm preview:site` | wrangler dev 本地模拟线上站点（8787） |
| `pnpm deploy:cf` | 构建整站并发布到 Cloudflare Workers |
| `pnpm typecheck` | 全仓 TypeScript 类型检查 |
| `pnpm new <name> [标题]` | 创建新原型并自动注册到门户 |

## 部署到 Cloudflare（Workers 静态资源）

单项目子路径形态：门户在根路径，各原型在 `/<id>/`，一次部署整站上线。

```bash
pnpm build:site    # 构建并合并产物到 site/（hub → 根，原型 → /<id>/）
pnpm preview:site  # 本地模拟线上（http://localhost:8787，无需认证）
pnpm deploy:cf     # = build:site + wrangler deploy
```

首次部署前设置认证环境变量（令牌需 **Workers Scripts:Edit** 权限，在
Dashboard → My Profile → API Tokens 创建；Account ID 见 Dashboard 概览页）：

```bash
export CLOUDFLARE_API_TOKEN=xxx        # 或写入 shell profile
export CLOUDFLARE_ACCOUNT_ID=xxx
```

> 脚本名用 `deploy:cf` 而非 `deploy`，避开 pnpm 内置的 `deploy` 命令（那是 workspace 单包发布用的）。

- 站点结构声明在根目录 `wrangler.jsonc`（配置即代码，进 git）
- 部署地址：`tf-prototype.<账号子域>.workers.dev`；自定义域名在 `wrangler.jsonc` 加 `routes`
- Hub 卡片链接自动按环境切换：本地 dev 指向 `localhost:<端口>`，线上指向 `/<id>/`

## 新增一个原型（推荐流程）

```bash
pnpm new order-flow 订单流程演示
```

脚本会自动：

1. 从 `scripts/template-app/` 生成 `apps/order-flow/`；
2. 分配下一个空闲端口（5101–5199）；
3. 在 `packages/prototype-meta/src/index.ts` 注册一条 `draft` 记录。

然后：

```bash
pnpm dev --filter @tf/order-flow   # 启动并打开 http://localhost:<分配的端口>
```

在 `src/App.tsx` 里搭建交互；原型成型后，更新注册表中的 `description` / `tags` /
`status`（`draft → wip → demo → done`），Hub 门户卡片即时同步。

## 约定速览（详见 docs/conventions.md）

- **命名**：原型目录与 id 用 kebab-case（如 `order-flow`），包名 `@tf/<id>`，两者保持一致。
- **端口**：Hub 固定 5173；原型使用 5101–5199，由 `pnpm new` 顺序分配，写死在各自 `vite.config.ts`。
- **样式**：设计令牌统一在 `@tf/ui/styles.css`（`--tf-*` 变量），页面私有样式放各自 `src/styles.css`，原型内可覆盖令牌换肤。
- **沉没规则**：组件被第 2 个原型用到时，才从原型提升到 `packages/ui`；数据 mock 留在各原型内，不引入真实后端。
- **状态流转**：`draft`（刚创建）→ `wip`（搭建中）→ `demo`（可对外演示）→ `done`（原型结论已沉淀）。

## CI / CD（GitHub Actions）

分支模型：**`main` 开发分支**（PR 合入，CI 检查）；**`prod` 生产分支**（合并 main 后自动部署上线）。

| 工作流 | 触发 | 动作 |
| --- | --- | --- |
| CI（`.github/workflows/ci.yml`） | PR、push `main` | install → typecheck → build（全部应用） |
| Deploy（`.github/workflows/deploy.yml`） | push `prod`、手动触发 | install → typecheck → build:site → `wrangler deploy` |

发布上线：

```bash
git checkout main && git pull
git checkout prod && git merge main && git push   # 推送后自动部署
```

首次使用需在 GitHub 仓库 **Settings → Secrets and variables → Actions** 添加两个 Secret：

- `CLOUDFLARE_API_TOKEN` —— 建议单独创建一个仅含 Workers Scripts:Edit 权限的令牌
- `CLOUDFLARE_ACCOUNT_ID` —— 账号 ID（Dashboard 概览页）

> 部署并发控制：新的 prod 推送会自动取消进行中的旧部署（`concurrency` 配置），
> 部署前的 typecheck 作为闸门，类型错误会阻断发布。

## 技术栈版本

- Node ≥ 20 · pnpm 12（workspace 协议）
- React 19 · TypeScript 5.9 · Vite 7（@vitejs/plugin-react）
- 无 UI 框架、无图表库 —— 共享组件与图表均为手写轻实现，保证原型轻量可控
