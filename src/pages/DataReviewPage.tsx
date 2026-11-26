import { Link } from 'react-router'
import { DataSourceNote } from '../components/data/DataSourceNote'
import { AffiliateCompareTable, MonthlyCompareTable } from '../components/goaffpro/CompareTables'
import { OrdersTable } from '../components/data/OrdersTable'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DemoBanner } from '../components/ui/DemoBanner'
import { KpiCard } from '../components/ui/KpiCard'
import { formatDate } from '../lib/date/date'
import { formatCount } from '../lib/format/format'
import { formatMonth, formatSignedYen } from '../lib/format/formatSigned'
import { compareAffiliates, compareMonthly, summarizeMonthly } from '../lib/reconcile/reconcile'
import { useData } from '../store/dataContext'

export function DataReviewPage() {
  const { source, orders, coverage, shopifyImport, stored, storage, goaffpro, clearData } =
    useData()
  const stats = shopifyImport?.stats

  // GoAffPro との照合（貼り付けたデータがあるときだけ）
  const monthlyRows = goaffpro.monthly
    ? compareMonthly(orders, goaffpro.monthly.rows, coverage)
    : []
  const monthlySummary = summarizeMonthly(monthlyRows)
  const affiliateRows = goaffpro.leaderboard
    ? compareAffiliates(orders, goaffpro.leaderboard.range, goaffpro.leaderboard.rows)
    : []

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
          // GAS 版では消去ボタンを出さない（保存したデータはスプレッドシートで管理する）
          storage ? undefined : (
            <Button variant="danger" onClick={handleClear} disabled={source === 'demo'}>
              読み込んだデータを消去
            </Button>
          )
        }
      />
      <DataSourceNote />

      <section className="p-kpi-grid" aria-label="読み込み状況">
        {/* GAS 版で保存済みのデータがあるときは、シートにある全件を表示する */}
        {stored && coverage ? (
          <KpiCard
            label="Shopify 注文（保存済み）"
            value={formatCount(stored.orderCount)}
            note={`${formatDate(coverage.start)} – ${formatDate(coverage.end)}`}
          />
        ) : stats ? (
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
        {goaffpro.monthly || goaffpro.leaderboard ? (
          <KpiCard
            label="GoAffPro 照合データ"
            value={goaffpro.monthly ? `${goaffpro.monthly.rows.length}か月分` : '紹介者別のみ'}
            note={[goaffpro.monthly && 'Annual Report', goaffpro.leaderboard && 'Leaderboard']
              .filter(Boolean)
              .join('・')}
          />
        ) : (
          <KpiCard label="GoAffPro 照合データ" state="empty" />
        )}
        {monthlySummary ? (
          <KpiCard
            label="紹介売上の差"
            value={formatSignedYen(monthlySummary.diffSales)}
            note={`Shopify − GoAffPro（${monthlySummary.months.map(formatMonth).join('、')}）`}
          />
        ) : (
          <KpiCard label="紹介売上の差" state="empty" />
        )}
      </section>

      <Card
        title="月別の照合"
        description="Shopify のデータが1か月まるごとそろっている月だけを比べます"
      >
        {monthlyRows.length > 0 ? (
          <MonthlyCompareTable rows={monthlyRows} />
        ) : (
          <p className="c-empty c-empty--compact">
            GoAffPro の Annual Report を貼り付けると表示されます。
            <Link to="/import">照合データを取り込む</Link>
          </p>
        )}
      </Card>

      <Card
        title="紹介者ごとの照合"
        description={
          goaffpro.leaderboard
            ? `期間 ${formatDate(goaffpro.leaderboard.range.start)} – ${formatDate(goaffpro.leaderboard.range.end)}`
            : undefined
        }
      >
        {affiliateRows.length > 0 ? (
          <AffiliateCompareTable rows={affiliateRows} />
        ) : (
          <p className="c-empty c-empty--compact">
            GoAffPro の Leaderboard を貼り付けると表示されます。
            <Link to="/import">照合データを取り込む</Link>
          </p>
        )}
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
