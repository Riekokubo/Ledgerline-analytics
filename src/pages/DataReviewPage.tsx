import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { KpiCard } from '../components/ui/KpiCard'

export function DataReviewPage() {
  return (
    <div className="p-page">
      <PageHeader
        title="読み込み済みデータ"
        description="集計に使っているデータの中身と、Shopify と GoAffPro の照合結果を確認できます。"
        actions={<Button variant="danger">読み込んだデータを消去</Button>}
      />

      {/* まだ CSV を読み込んでいないので「データなし」の状態で表示 */}
      <section className="p-kpi-grid" aria-label="読み込み状況">
        <KpiCard label="Shopify 注文" state="empty" />
        <KpiCard label="GoAffPro 照合データ" state="empty" />
        <KpiCard label="紹介売上の差" state="empty" />
      </section>

      <Card title="紹介者ごとの照合">
        <p className="p-placeholder">Step 6 で表示します</p>
      </Card>

      <Card title="注文一覧（集計に使った項目のみ）">
        <p className="p-placeholder">Step 5 で表示します</p>
      </Card>
    </div>
  )
}
