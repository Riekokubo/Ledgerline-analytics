import type { ReactNode } from 'react'

// ページの見出し。右側（actions）に期間フィルターやボタンを置ける
type PageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="l-page-header">
      <div>
        <h1 className="l-page-header__title">{title}</h1>
        <p className="l-page-header__description">{description}</p>
      </div>
      {actions && <div className="l-page-header__actions">{actions}</div>}
    </header>
  )
}
