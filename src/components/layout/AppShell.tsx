import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'

// 全画面共通の枠：左にサイドバー、右に各ページ（Outlet の位置に表示される）
export function AppShell() {
  return (
    <div className="l-app-shell">
      <Sidebar />
      <main className="l-app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
