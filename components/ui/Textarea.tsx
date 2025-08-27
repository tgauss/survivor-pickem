import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ 
  label, 
  error, 
  className = '', 
  ...props 
}: TextareaProps) {
  const baseStyles = `
    w-full px-3 py-2 
    bg-charcoal-800 
    border border-charcoal-700 
    rounded-lg 
    text-charcoal-50 
    placeholder-charcoal-400
    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    focus:outline-none
    resize-vertical
    min-h-[80px]
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
  `

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-charcoal-200">
          {label}
        </label>
      )}
      <textarea
        className={`${baseStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}