import { GoAffProImportCard } from '../components/goaffpro/GoAffProImportCard'
import { ShopifyImportCard } from '../components/import/ShopifyImportCard'
import { StorageStatus } from '../components/import/StorageStatus'
import { PageHeader } from '../components/layout/PageHeader'
import { IS_GAS } from '../config/app'

const DESCRIPTION = IS_GAS
  ? '集計に必要な項目だけをスプレッドシートに保存します。氏名・住所・メールなどは読み込み時に破棄し、保存しません。同じ注文番号は新しい内容で上書きします。'
  : 'ファイルはサーバーに送信されません。集計に必要な項目だけを読み込み、氏名・住所・メールなどは読み込み時に破棄します。'

export function ImportPage() {
  return (
    <div className="p-page">
      <PageHeader title="データ取り込み" description={DESCRIPTION} />
      <StorageStatus />

      <div className="p-two-columns">
        <ShopifyImportCard />
        <GoAffProImportCard />
      </div>
    </div>
  )
}
