/**
 * @tf/ui —— 共享组件库（shadcn/ui 架构）
 *
 * 组件由 shadcn CLI 生成（Radix + Tailwind v4 + cva），存放在
 * src/components/ui/，通过本文件统一导出。新增组件：
 *   cd packages/ui && pnpm dlx shadcn@latest add <name>
 *
 * 样式使用方式（应用入口的 styles.css）：
 *   @import "tailwindcss";
 *   @import "@tf/ui/styles.css";   // 设计令牌（@theme + :root 变量）
 *   @source "../node_modules/@tf/ui/src";  // 扫描共享组件内的工具类
 */
export { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
export { Button, buttonVariants } from './components/ui/button'
export { Badge, badgeVariants } from './components/ui/badge'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
export { Checkbox } from './components/ui/checkbox'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog'
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
export { Input } from './components/ui/input'
export { Label } from './components/ui/label'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
export { Separator } from './components/ui/separator'
export { Skeleton } from './components/ui/skeleton'
export { Toaster } from './components/ui/sonner'
export { toast } from 'sonner'
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
