import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { DataReviewPage } from './pages/DataReviewPage'
import { ImportPage } from './pages/ImportPage'
import { DataProvider } from './store/DataProvider'

// DataProvider：取り込んだデータを全画面で共有する
// URL と画面の対応表。AppShell（サイドバー付きの枠）の中に各ページを表示する
function App() {
  return (
    <DataProvider>
      {/* basename：公開先のパス（GitHub Pages ではリポジトリ名）に合わせる */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="data" element={<DataReviewPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
