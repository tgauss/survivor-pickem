import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const chipVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-charcoal-800 text-charcoal-200',
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-charcoal-700 text-charcoal-100',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        destructive: 'bg-red-600 text-white',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ChipProps extends VariantProps<typeof chipVariants> {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function Chip({ children, icon, variant, size, className = '' }: ChipProps) {
  return (
    <span className={`${chipVariants({ variant, size })} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}