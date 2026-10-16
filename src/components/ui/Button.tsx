import type { ButtonHTMLAttributes } from 'react'

// Figma の Button コンポーネント（Type=Primary / Secondary / Danger）に対応
type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`c-button c-button--${variant} ${className}`.trim()} {...rest} />
  )
}
