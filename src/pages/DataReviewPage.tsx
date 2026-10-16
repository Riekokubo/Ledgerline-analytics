import { DataSourceNote } from '../components/data/DataSourceNote'
import { OrdersTable } from '../components/data/OrdersTable'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DemoBanner } from '../components/ui/DemoBanner'
import { KpiCard } from '../components/ui/KpiCard'
import { formatDate } from '../lib/date/date'
import { formatCount } from '../lib/format/format'
import { useData } from '../store/dataContext'

export function DataReviewPage() {
  const { source, orders, shopifyImport, clearData } = useData()
  const stats = shopifyImport?.stats

  function handleClear() {
    // window.confirm：ブラウザ標準の確認ダイアログ
    if (window.confirm('読み込んだデータを消去して、サンプル表示に戻しますか？')) clearData()
  }

  return (
    <div className="p-page">
      {source === 'demo' && <DemoBanner />}

      <PageHeader
        title="読み込み済みデータ"
        description="集計に使っているデータの中身と、Shopify と GoAffPro の照合結果を確認できます。"
        actions={
          <Button variant="danger" onClick={handleClear} disabled={source === 'demo'}>
            読み込んだデータを消去
          </Button>
        }
      />
      <DataSourceNote />

      <section className="p-kpi-grid" aria-label="読み込み状況">
        {stats ? (
          <KpiCard
            label="Shopify 注文"
            value={formatCount(stats.orderCount)}
            note={
              stats.dateRange
                ? `${formatDate(stats.dateRange.start)} – ${formatDate(stats.dateRange.end)}`
                : ''
            }
          />
        ) : (
          <KpiCard label="Shopify 注文" state="empty" />
        )}
        <KpiCard label="GoAffPro 照合データ" state="empty" />
        <KpiCard label="紹介売上の差" state="empty" />
      </section>

      <Card title="紹介者ごとの照合">
        <p className="p-placeholder">Step 6 で表示します</p>
      </Card>

      <Card
        title="注文一覧（集計に使った項目のみ）"
        description={source === 'demo' ? '架空のサンプルデータです' : undefined}
      >
        <OrdersTable orders={orders} />
      </Card>
    </div>
  )
}
