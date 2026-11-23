'use client'

import { 
  SelectHTMLAttributes, 
  forwardRef, 
  createContext, 
  useContext, 
  useState,
  ReactNode 
} from 'react'
import { cn } from '@/lib/utils'

const SelectContext = createContext<{ value: string; onValueChange: (value: string) => void } | null>(null)

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
}

const Select = ({ value, onValueChange, children, className, ...props }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      >
        {children}
      </select>
    </SelectContext.Provider>
  )
}
Select.displayName = 'Select'

interface SelectTriggerProps {
  children: ReactNode
  className?: string
}

const SelectTrigger = ({ children, className }: SelectTriggerProps) => {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('SelectTrigger must be used within Select')
  }
  
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded="false"
      aria-haspopup="listbox"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <span className="text-muted-foreground">▼</span>
    </button>
  )
}

interface SelectContentProps {
  children: ReactNode
  className?: string
}

const SelectContent = ({ children, className }: SelectContentProps) => {
  return (
    <div className={cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md', className)}>
      <div className="max-h-96 overflow-y-auto">{children}</div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

const SelectItem = ({ value, children, className, disabled }: SelectItemProps) => {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('SelectItem must be used within Select')
  }
  
  const isSelected = context.value === value
  
  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-disabled={disabled}
      data-state={isSelected ? 'checked' : 'unchecked'}
      onClick={() => !disabled && context.onValueChange(value)}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground',
        className
      )}
    >
      {isSelected && <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">✓</span>}
      {children}
    </div>
  )
}

interface SelectValueProps {
  placeholder?: string
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('SelectValue must be used within Select')
  }
  
  return (
    <span className={cn('truncate', context.value ? '' : 'text-muted-foreground')}>
      {context.value || placeholder}
    </span>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }