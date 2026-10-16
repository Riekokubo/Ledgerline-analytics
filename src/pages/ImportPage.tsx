import { GoAffProImportCard } from '../components/goaffpro/GoAffProImportCard'
import { ShopifyImportCard } from '../components/import/ShopifyImportCard'
import { PageHeader } from '../components/layout/PageHeader'

export function ImportPage() {
  return (
    <div className="p-page">
      <PageHeader
        title="データ取り込み"
        description="ファイルはサーバーに送信されません。集計に必要な項目だけを読み込み、氏名・住所・メールなどは読み込み時に破棄します。"
      />

      <div className="p-two-columns">
        <ShopifyImportCard />
        <GoAffProImportCard />
      </div>
    </div>
  )
}
