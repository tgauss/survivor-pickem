import { cva, type VariantProps } from 'class-variance-authority'

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-charcoal-700 font-medium text-charcoal-200 select-none shrink-0',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback: string
  className?: string
}

export function Avatar({ src, alt, fallback, size, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || fallback}
        className={`${avatarVariants({ size })} object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${avatarVariants({ size })} ${className}`}>
      <span className="uppercase">{fallback}</span>
    </div>
  )
}