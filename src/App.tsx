import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { IS_GAS } from './config/app'
import { DashboardPage } from './pages/DashboardPage'
import { DataReviewPage } from './pages/DataReviewPage'
import { ImportPage } from './pages/ImportPage'
import { DataProvider } from './store/DataProvider'
import { GasRoot } from './store/GasRoot'

// URL と画面の対応表。AppShell（サイドバー付きの枠）の中に各ページを表示する
function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="data" element={<DataReviewPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  // GAS 版：ログイン → スプレッドシートのデータを読み込んでから表示する。
  // GAS の画面は iframe の中で動き URL を変えられないので、MemoryRouter（URL を使わない）にする
  if (IS_GAS) {
    return (
      <GasRoot>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </GasRoot>
    )
  }

  // 公開デモ／ローカル開発。DataProvider：取り込んだデータを全画面で共有する
  return (
    <DataProvider>
      {/* basename：公開先のパス（GitHub Pages ではリポジトリ名）に合わせる */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
