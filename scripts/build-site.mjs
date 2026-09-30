#!/usr/bin/env node
/**
 * 构建整个原型站点并合并到 site/：
 *   - hub     → 根路径（base = /）
 *   - 其他原型 → 子路径（vite build --base=/<id>/，产物合并到 site/<id>/）
 *
 * 产物供 `wrangler deploy`（Workers 静态资源）使用，见根目录 wrangler.jsonc。
 * 原型 id 与 apps/ 目录名一致是链接正确的前提（仓库约定）。
 */
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPS_DIR = join(ROOT, 'apps')
const SITE_DIR = join(ROOT, 'site')
const HUB_ID = 'hub'

const apps = readdirSync(APPS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

if (!apps.includes(HUB_ID)) {
  console.error('✖ 未找到 apps/hub，门户是站点根路径的必要组成')
  process.exit(1)
}

const prototypes = apps.filter((name) => name !== HUB_ID)

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: ROOT,
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.error(`✖ 命令失败：${cmd} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

/* 1. 构建门户（根路径） */
run('pnpm', ['--filter', `@tf/${HUB_ID}`, 'exec', 'vite', 'build'])

/* 2. 构建各原型（子路径 base） */
for (const id of prototypes) {
  run('pnpm', ['--filter', `@tf/${id}`, 'exec', 'vite', 'build', `--base=/${id}/`])
}

/* 3. 合并产物：hub → site 根，原型 → site/<id> */
rmSync(SITE_DIR, { recursive: true, force: true })
mkdirSync(SITE_DIR, { recursive: true })
cpSync(join(APPS_DIR, HUB_ID, 'dist'), SITE_DIR, { recursive: true })
for (const id of prototypes) {
  cpSync(join(APPS_DIR, id, 'dist'), join(SITE_DIR, id), { recursive: true })
}

console.log(`✔ 站点已构建：site/（门户 ×1 + 原型 ×${prototypes.length}）`)
console.log('  本地预览：pnpm preview:site（http://localhost:8787）')
console.log('  发布上线：pnpm deploy:cf')
