# 原型仓库开发规范

> 目标：多人/多项目并行出原型时，目录、命名、行为保持一致，让任何人拿到仓库都能 30 秒上手。

## 1. 分层与职责

| 层 | 目录 | 职责 | 禁止事项 |
| --- | --- | --- | --- |
| 应用层 | `apps/*` | 一个独立可运行的交互原型 | 互相依赖；引用其他 app 的源码 |
| 共享组件 | `packages/ui` | shadcn/ui 生成的现成组件 + Tailwind 设计令牌 | 引用 `apps/*`；手写基础组件（先查 shadcn registry） |
| 共享工具 | `packages/utils` | 纯函数与通用 Hooks | 引用 `packages/ui`（保持 utils 最底层） |
| 注册表 | `packages/prototype-meta` | 全部原型的元数据（唯一数据源） | 依赖任何其他包（保持纯数据） |
| 脚手架 | `scripts/` | 新原型生成器与模板 | —— |

依赖方向只允许自上而下：`apps → packages`。

## 2. 命名规范

- 原型 id / 目录名：**kebab-case**，如 `order-flow`、`user-profile`。
- 包名：`@tf/<id>`，与目录名严格一致（Hub 卡片的「复制启动命令」依赖这一映射）。
- 显示名（`name` 字段）：中文短语，如「订单流程演示」。
- 组件文件：`PascalCase.tsx`；工具/数据文件：`camelCase.ts` 或 `data.ts`。

## 3. 端口分配

- Hub 门户固定 `5173`。
- 原型使用 `5101–5199`，由 `pnpm new` 自动分配当前最小空闲端口。
- 端口写死在各应用的 `vite.config.ts`，不用 `--port` 覆盖，避免多人并行时漂移。
- 超过 99 个原型时再引入端口段规划（预留 `5200–5299`）。

## 4. 原型状态流转

```text
draft（草稿）──► wip（进行中）──► demo（可演示）──► done（已完成）
```

| 状态 | 语义 | 触发 |
| --- | --- | --- |
| draft | 刚由脚手架生成，占位 | `pnpm new` 自动写入 |
| wip | 正在搭建交互 | 手动更新 |
| demo | 可以对外演示，卡片上「打开原型」应可用 | 手动更新 |
| done | 结论已沉淀（文档/截图），进入维护期 | 手动更新 |

每次实质性更新时，同步修改注册表中的 `updated` 字段（`YYYY-MM-DD`）。

## 5. 样式约定（Tailwind v4）

- 页面布局与视觉一律用 **Tailwind 工具类**，不再维护页面级手写 CSS。
- 设计令牌（颜色 / 圆角 / 字体 / 图表色）统一定义在 `packages/ui/src/styles.css`：
  `@theme inline` 映射 + `:root` 变量（品牌主色为蓝，延续旧版视觉）。
- 应用入口 `src/styles.css` 固定三行：

  ```css
  @import "tailwindcss";
  @import "@tf/ui/styles.css";       /* 共享令牌 */
  @source "../node_modules/@tf/ui/src"; /* 扫描共享组件内的工具类 */
  ```

- 覆盖令牌做换肤：在应用 `styles.css` 里覆盖 `:root` 的 `--primary` / `--radius` 等变量，
  不要改动 `packages/ui` 中组件的类名。
- 少量动画/特殊效果可写自定义 CSS，但优先 Tailwind 内置工具与 `tw-animate-css`。

## 6. 组件规则（shadcn/ui 优先，不自建）

- **基础组件**（按钮、卡片、表单、弹层、表格……）一律来自 `@tf/ui` 的 shadcn 组件，
  仓库内**不手写**基础组件。
- 缺组件时在 `packages/ui` 目录执行：

  ```bash
  pnpm dlx shadcn@latest add <component>   # 生成到 src/components/ui/
  ```

  生成后：把 `from "cn"` 改为 `from "../../lib/utils"`、`@/components/ui/*` 改为相对路径，
  并在 `src/index.ts` 补导出（`toast` 等 runtime API 统一从 `@tf/ui` 导出）。
- **业务组件**（如 StatCard、PrototypeCard）写在各原型 `src/components/`，
  被第 2 个原型需要时提升到 `@tf/ui`（作为 shadcn 风格导出，API 以两个原型的并集为准）。

## 7. 数据与交互约定

- 原型的 mock 数据自包含（写在 `src/data.ts` 或组件内），不连接真实后端、不新增网络层依赖。
- 数据消费统一走 **TanStack Query**：`useQuery({ queryKey, queryFn })`，
  mock 函数用 `async + setTimeout` 模拟延迟，loading 态用 `@tf/ui` 的 Skeleton。
- 列表 / 台账类 UI 用 **TanStack Table**（`@tanstack/react-table`，按需在 app 内安装）。
- 路由状态优先落在 search params（如 `?range=7d`），可分享、可回退。
- 需要持久化的演示状态用 `@tf/utils` 的 `useLocalStorage`，key 以 `tf.` 前缀命名（如 `tf.todo-list`）。
- 演示用随机数据一律使用可复现的伪随机（参考 `apps/dashboard/src/data.ts` 的 `mulberry32`），保证每次刷新形态一致。

## 8. 新增第三方依赖

- 只加在具体 app 的 `package.json`；被 ≥2 个原型需要时才提升到 packages。
- shadcn 组件的运行时依赖（radix-ui / cva / lucide-react / sonner 等）由 CLI 装进 `packages/ui`，不要在 app 内重复安装。
- 提交前运行 `pnpm typecheck && pnpm build`，保证全仓绿灯。
- 原则：基础组件交给 shadcn/ui，图表用 Recharts；能用现成方案就不引新库，保持原型轻量、秒级冷启动。

## 9. Git 与发布约定

- 分支模型：`main` 开发分支；`prod` 生产分支；原型开发用 `proto/<id>`（如 `proto/order-flow`）。
- 合并流：`proto/<id>` → `main`（CI 自动跑类型检查与构建）→ 需要上线时 `main` → `prod`。
- push 到 `prod` 触发 GitHub Actions 自动部署到 Cloudflare Workers（见根目录 `.github/workflows/deploy.yml`）。
- 认证凭据走 GitHub Secrets（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`），禁止写进代码或配置文件。
- 单个原型的迭代不阻塞其他原型——各 app 相互隔离，正是 monorepo 分层的意义。
- 本地直发（绕过 CI）仍可用 `pnpm deploy:cf`，但团队协作时建议统一走 prod 分支。
