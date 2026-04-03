'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-3 py-2 text-sm rounded-xl border bg-white text-gray-900 placeholder:text-gray-400',
              'border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-150',
              error && 'border-red-400 focus:ring-red-200',
              icon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
