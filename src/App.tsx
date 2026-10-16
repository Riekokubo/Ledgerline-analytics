import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { DataReviewPage } from './pages/DataReviewPage'
import { ImportPage } from './pages/ImportPage'

// URL と画面の対応表。AppShell（サイドバー付きの枠）の中に各ページを表示する
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="data" element={<DataReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
