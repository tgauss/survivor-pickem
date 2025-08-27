import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'rounded bg-charcoal-900 border border-charcoal-800 p-4 transition-colors',
  {
    variants: {
      variant: {
        default: 'hover:border-charcoal-700',
        interactive: 'hover:border-charcoal-600 hover:bg-charcoal-800/50 cursor-pointer',
      },
      spacing: {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'md',
    },
  }
)

export interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, variant, spacing, className = '', onClick }: CardProps) {
  return (
    <div
      className={`${cardVariants({ variant, spacing })} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}