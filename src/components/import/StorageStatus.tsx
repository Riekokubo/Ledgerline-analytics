import { useData } from '../../store/dataContext'

// スプレッドシートへの保存の状態（GAS 版だけ表示する）
export function StorageStatus() {
  const { storage } = useData()
  if (!storage || storage.status === 'idle') return null

  if (storage.status === 'saving') {
    return (
      <p className="c-alert c-alert--info" role="status">
        スプレッドシートに保存しています…
      </p>
    )
  }
  if (storage.status === 'saved') {
    return (
      <p className="c-alert c-alert--success" role="status">
        {storage.message}
      </p>
    )
  }
  return (
    <div className="c-alert c-alert--error" role="alert">
      <p className="c-alert__title">保存できませんでした</p>
      <p>
        {storage.message}
        画面には表示されていますが、スプレッドシートには残っていません。もう一度取り込んでください。
      </p>
    </div>
  )
}
