'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

type Props = {
  value:       string
  onChange:    (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?:  string
  required?:   boolean
  minLength?:  number
  name?:       string
  autoComplete?: string
}

export default function PasswordInput({
  value, onChange, placeholder = '••••••••',
  className, required, minLength, name, autoComplete,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        name={name}
        autoComplete={autoComplete}
        className={cn('pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-navy transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
