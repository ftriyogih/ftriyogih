'use client'

import { 
  Fragment, 
  ReactNode, 
  useRef, 
  useState, 
  useEffect,
  ElementType
} from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: ReactNode
}

interface DropdownMenuTriggerProps {
  children: ReactNode
  className?: string
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'end'
}

interface DropdownMenuItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  asChild?: boolean
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <Fragment>{children}</Fragment>
}

const DropdownMenuTrigger = ({ children, className, asChild, ...props }: DropdownMenuTriggerProps) => {
  const Comp = asChild ? ((props as any).as as ElementType) || 'button' : 'button'
  const triggerProps = asChild ? { ...props } : { 
    className: cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      className
    ),
    ...props 
  }

  return (
    <Comp {...triggerProps}>
      {children}
    </Comp>
  )
}

const DropdownMenuContent = ({ children, className, align = 'start' }: DropdownMenuContentProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            'fixed z-50 min-w-[8rem] origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const DropdownMenuItem = ({ children, className, onClick, disabled, danger, asChild, ...props }: DropdownMenuItemProps) => {
  const Comp = asChild ? ((props as any).as as ElementType) || 'button' : 'button'
  const itemProps = asChild ? { ...props, onClick: () => !disabled && onClick?.() } : {
    onClick: () => !disabled && onClick?.(),
    disabled,
    className: cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      danger && 'text-red-600 focus:text-red-600',
      className
    ),
    ...props
  }

  return (
    <Comp {...itemProps}>
      {children}
    </Comp>
  )
}

const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => {
  return <hr className={cn('-mx-1 my-1 h-px bg-border', className)} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }