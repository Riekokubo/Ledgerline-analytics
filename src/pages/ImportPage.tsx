import { PageHeader } from '../components/layout/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function ImportPage() {
  return (
    <div className="p-page">
      <PageHeader
        title="データ取り込み"
        description="ファイルはサーバーに送信されません。集計に必要な項目だけを読み込み、氏名・住所・メールなどは読み込み時に破棄します。"
      />

      <div className="p-two-columns">
        <Card
          title="① Shopify 注文データ"
          description="管理画面 › 注文管理 › エクスポート（CSV）"
          aside={<Badge tone="neutral">未読み込み</Badge>}
        >
          <p className="p-placeholder">Step 5 でファイルの取り込みを作ります</p>
        </Card>

        <Card
          title="② GoAffPro 照合用データ（任意）"
          description="集計には使わず、Shopify 側の紹介売上との答え合わせだけに使います"
          aside={<Badge tone="neutral">未読み込み</Badge>}
        >
          <p className="p-placeholder">Step 6 で貼り付け取り込みを作ります</p>
          <div className="p-actions">
            <Button variant="secondary">クリア</Button>
            <Button variant="primary">照合データとして取り込む</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
