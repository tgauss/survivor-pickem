import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  size = 'md'
}: ToggleProps) {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6'
  }
  
  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5'
  }
  
  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0'
  }

  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            ${sizeClasses[size]}
            bg-charcoal-700 
            rounded-full 
            transition-colors
            focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-charcoal-950
            ${checked ? 'bg-blue-600' : 'bg-charcoal-700'}
            ${disabled ? '' : 'hover:bg-opacity-80'}
          `}
        >
          <div
            className={`
              ${thumbSizeClasses[size]}
              bg-white 
              rounded-full 
              shadow-lg 
              transform 
              transition-transform
              absolute 
              top-0.5 
              left-0.5
              ${translateClasses[size]}
            `}
          />
        </div>
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-charcoal-200">
          {label}
        </span>
      )}
    </label>
  )
}