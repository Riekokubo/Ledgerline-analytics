import { formatDateTime } from '../../lib/format/formatDateTime'
import { useData } from '../../store/dataContext'

// 今どのデータを表示しているか（ファイル名と最終更新日時）を示す
export function DataSourceNote() {
  const { shopifyImport, stored } = useData()

  // GAS 版：スプレッドシートに保存されている全期間のデータ
  if (stored) {
    const last = stored.lastImport
    return (
      <p className="c-data-source">
        データ：スプレッドシート（保存済み {stored.orderCount.toLocaleString('ja-JP')}件）
        {last && ` ・ 最終取り込み ${last.fileName}（${formatDateTime(last.importedAt)}）`}
      </p>
    )
  }

  if (!shopifyImport) return null
  return (
    <p className="c-data-source">
      データ：{shopifyImport.fileName} ・ 最終更新 {formatDateTime(shopifyImport.importedAt)}
    </p>
  )
}
