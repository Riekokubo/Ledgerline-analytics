import { formatDateTime } from '../../lib/format/formatDateTime'
import { useData } from '../../store/dataContext'

// 今どのデータを表示しているか（ファイル名と最終更新日時）を示す
export function DataSourceNote() {
  const { shopifyImport } = useData()
  if (!shopifyImport) return null
  return (
    <p className="c-data-source">
      データ：{shopifyImport.fileName} ・ 最終更新 {formatDateTime(shopifyImport.importedAt)}
    </p>
  )
}
