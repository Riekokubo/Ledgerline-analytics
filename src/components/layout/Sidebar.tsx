import { NavLink } from 'react-router'

// メニュー項目の定義。項目を増やすときはここに1行足す
const NAV_ITEMS = [
  { to: '/', label: 'ダッシュボード', icon: 'dashboard' },
  { to: '/import', label: 'データ取り込み', icon: 'import' },
  { to: '/data', label: '読み込み済みデータ', icon: 'table' },
] as const

type IconName = (typeof NAV_ITEMS)[number]['icon']

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    'aria-hidden': true,
  }
  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    )
  }
  if (name === 'import') {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M4 19h16" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v11" />
    </svg>
  )
}

export function Sidebar() {
  return (
    <nav className="l-sidebar" aria-label="メインメニュー">
      <div className="l-sidebar__logo">
        <span className="l-sidebar__mark" aria-hidden="true">
          S
        </span>
        <span className="l-sidebar__wordmark">
          <strong>Ledgerline</strong>
          <small>Analytics</small>
        </span>
      </div>

      <ul className="l-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            {/* NavLink は今いるページのとき自動で .active クラスと aria-current を付けてくれる */}
            <NavLink to={item.to} end className="c-nav-item">
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <p className="l-sidebar__note">
        データはこのブラウザ内だけで処理されます。ページを再読み込みすると消去されます。
      </p>
    </nav>
  )
}
