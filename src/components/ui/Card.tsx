import type { ReactNode } from 'react'

// 白い面の枠。見出し・補足・右側の要素（凡例やバッジ）をまとめて渡せる
type CardProps = {
  title?: string
  description?: string
  aside?: ReactNode
  children: ReactNode
}

export function Card({ title, description, aside, children }: CardProps) {
  return (
    <section className="c-card">
      {title && (
        <header className="c-card__header">
          <div>
            <h2 className="c-card__title">{title}</h2>
            {description && <p className="c-card__description">{description}</p>}
          </div>
          {aside && <div className="c-card__aside">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
