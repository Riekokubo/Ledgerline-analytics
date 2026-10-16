import type { ReactNode } from 'react'

// Figma の Badge コンポーネント（Tone=Success / Warning / Error / Neutral）に対応
export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral'

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`c-badge c-badge--${tone}`}>{children}</span>
}
