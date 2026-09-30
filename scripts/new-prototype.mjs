#!/usr/bin/env node
/**
 * 创建新原型：pnpm new <name>
 *
 * 做三件事：
 *  1. 基于 scripts/template-app 生成 apps/<name>/（自动替换 id / 端口 / 标题）
 *  2. 自动分配端口（5101–5199 中未占用的最小值）
 *  3. 自动注册到 packages/prototype-meta/src/index.ts（@prototypes:append-here 处插入）
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPS_DIR = join(ROOT, 'apps')
const TEMPLATE_DIR = join(ROOT, 'scripts', 'template-app')
const META_FILE = join(ROOT, 'packages', 'prototype-meta', 'src', 'index.ts')
const MARKER = '  // @prototypes:append-here'
const PORT_MIN = 5101
const PORT_MAX = 5199

const [rawName, ...titleParts] = process.argv.slice(2)
if (!rawName) {
  console.error('用法：pnpm new <name> [标题]\n示例：pnpm new order-flow 订单流程演示')
  process.exit(1)
}

const name = rawName.toLowerCase()
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error(`✖ 名称不合法："${rawName}"，请使用 kebab-case（小写字母/数字/中划线），如 order-flow`)
  process.exit(1)
}

const appDir = join(APPS_DIR, name)
if (existsSync(appDir)) {
  console.error(`✖ 原型已存在：apps/${name}`)
  process.exit(1)
}

/* ---- 收集已占用端口：原型注册表 + 各应用 vite.config ---- */
const usedPorts = new Set()
const metaSrc = readFileSync(META_FILE, 'utf8')
for (const m of metaSrc.matchAll(/port:\s*(\d+)/g)) usedPorts.add(Number(m[1]))
for (const entry of readdirSync(APPS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const viteConfig = join(APPS_DIR, entry.name, 'vite.config.ts')
  if (existsSync(viteConfig)) {
    for (const m of readFileSync(viteConfig, 'utf8').matchAll(/port:\s*(\d+)/g)) {
      usedPorts.add(Number(m[1]))
    }
  }
}

let port = PORT_MIN
while (usedPorts.has(port)) port++
if (port > PORT_MAX) {
  console.error(`✖ 端口 ${PORT_MIN}–${PORT_MAX} 已用尽，请检查 apps/* 的端口分配`)
  process.exit(1)
}

/* ---- 从模板生成文件 ---- */
const title = titleParts.length > 0 ? titleParts.join(' ') : name

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else files.push({ abs: full, rel: full.slice(TEMPLATE_DIR.length + 1) })
  }
  return files
}

for (const file of walk(TEMPLATE_DIR)) {
  const target = join(appDir, file.rel)
  mkdirSync(dirname(target), { recursive: true })
  const content = readFileSync(file.abs, 'utf8')
    .replaceAll('{{id}}', name)
    .replaceAll('{{port}}', String(port))
    .replaceAll('{{title}}', title)
  writeFileSync(target, content)
}

/* ---- 注册到原型注册表 ---- */
if (!metaSrc.includes(MARKER)) {
  console.error(`✖ 注册表缺少插入点标记：${MARKER}（请勿删除该注释）`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const entry = [
  '  {',
  `    id: '${name}',`,
  `    name: '${title}',`,
  `    description: 'TODO：一句话描述这个原型',`,
  `    port: ${port},`,
  `    status: 'draft',`,
  `    updated: '${today}',`,
  '  },',
].join('\n')

writeFileSync(META_FILE, metaSrc.replace(MARKER, `${entry}\n${MARKER}`))

console.log(`✔ 已创建 apps/${name}（包名 @tf/${name}，dev 端口 ${port}）`)
console.log('✔ 已注册到 packages/prototype-meta/src/index.ts（状态 draft）')
console.log('')
console.log('下一步：')
console.log(`  1. 启动：pnpm dev --filter @tf/${name}`)
console.log(`  2. 访问：http://localhost:${port}`)
console.log('  3. 完善 packages/prototype-meta 中的描述，Hub 卡片会同步展示')
