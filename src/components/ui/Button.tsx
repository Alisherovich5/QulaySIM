import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'accent'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  /** animated light sweep on hover */
  sheen?: boolean
  fullWidth?: boolean
  /** shows a spinner and disables the button */
  loading?: boolean
  /** when set, renders a react-router <Link> instead of a <button> */
  to?: string
  className?: string
  children: ReactNode
}

/**
 * Single source of truth for every primary/ghost/accent action in the app.
 * Renders a <button> by default, or a <Link> when `to` is provided.
 */
export default function Button({
  variant = 'primary',
  sheen = false,
  fullWidth = false,
  loading = false,
  to,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [VARIANTS[variant], sheen && 'sheen', fullWidth && 'w-full', className]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={cls} onClick={rest.onClick as never}>
        {children}
      </Link>
    )
  }

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}
