import { formatYen } from './lib/format/formatYen'

// Step 0 の動作確認用の画面。Step 1 でダッシュボードの骨組みに置き換える。
function App() {
  return (
    <main style={{ padding: 'var(--space-32)' }}>
      <h1>Ledgerline Analytics</h1>
      <p style={{ color: 'var(--color-text-3)', marginTop: 'var(--space-8)' }}>
        環境構築ができました。デザイントークンと金額の表示：{formatYen(3584000)}
      </p>
    </main>
  )
}

export default App
