import { cn } from '@tf/utils'

export interface ChipsProps {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

/** 单选胶囊筛选器（门户工具栏用） */
export function Chips({ options, value, onChange }: ChipsProps) {
  return (
    <div className="hub__chips-row">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={cn('hub__chip', value === option && 'hub__chip--active')}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
