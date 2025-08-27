import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

const bannerVariants = cva(
  'flex gap-3 rounded p-4 text-sm',
  {
    variants: {
      variant: {
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        success: 'bg-green-500/10 text-green-400 border border-green-500/20',
        error: 'bg-red-500/10 text-red-400 border border-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

const iconMap = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: XCircle,
}

export interface BannerProps extends VariantProps<typeof bannerVariants> {
  children: ReactNode
  className?: string
  showIcon?: boolean
}

export function Banner({ children, variant = 'info', className = '', showIcon = true }: BannerProps) {
  const Icon = iconMap[variant!]
  
  return (
    <div className={`${bannerVariants({ variant })} ${className}`}>
      {showIcon && <Icon className="w-5 h-5 shrink-0 mt-0.5" />}
      <div className="flex-1">{children}</div>
    </div>
  )
}