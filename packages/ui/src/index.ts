/**
 * @tf/ui —— 原型仓库共享组件库
 *
 * 组件只做轻封装，保证原型开发速度优先。
 * 使用方式：
 *   import { Button, Card } from '@tf/ui'
 *   import '@tf/ui/styles.css'   // 样式需在应用入口引入一次
 */
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
export { Card } from './components/Card'
export type { CardProps } from './components/Card'
export { Input } from './components/Input'
export type { InputProps } from './components/Input'
export { Tag } from './components/Tag'
export type { TagProps, TagColor } from './components/Tag'
export { Empty } from './components/Empty'
export type { EmptyProps } from './components/Empty'
