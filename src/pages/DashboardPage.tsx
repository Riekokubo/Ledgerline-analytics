import { useMemo, useState } from 'react'
import { AffiliateRankingTable } from '../components/dashboard/AffiliateRankingTable'
import { PeriodFilter, type PeriodChoice } from '../components/dashboard/PeriodFilter'
import { PurchaseTypeBreakdown } from '../components/dashboard/PurchaseTypeBreakdown'
import { PURCHASE_TYPE_COLORS } from '../lib/style/purchaseTypeColors'
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { DemoBanner } from '../components/ui/DemoBanner'
import { KpiCard } from '../components/ui/KpiCard'
import { Legend } from '../components/ui/Legend'
import { TODAY } from '../demo/demoData'
import { DataSourceNote } from '../components/data/DataSourceNote'
import { useData } from '../store/dataContext'
import {
  affiliateRanking,
  breakdownByPurchaseType,
  dailySales,
  filterByRange,
  summarize,
} from '../lib/aggregate/aggregate'
import { formatDate, rangeForPreset } from '../lib/date/date'
import { formatCount, formatPercent, formatYen } from '../lib/format/format'
import { PURCHASE_TYPE_LABELS, type DateRange } from '../types/domain'

export function DashboardPage() {
  // 共有データ（サンプル or 取り込んだ CSV）
  const { source, orders, shopifyImport } = useData()
  const importedRange = shopifyImport?.stats.dateRange ?? null

  // useState：画面が覚えておく値。操作すると値が変わり、画面が描き直される
  // CSV を取り込んだ直後は、そのデータの期間を最初から表示する
  const [choice, setChoice] = useState<PeriodChoice>(importedRange ? 'custom' : 'last-month')
  const [customRange, setCustomRange] = useState<DateRange>(
    () => importedRange ?? rangeForPreset('last-month', TODAY),
  )

  // 選んだ期間を具体的な日付にする（期間指定で開始日 > 終了日のときは集計しない）
  const range: DateRange = choice === 'custom' ? customRange : rangeForPreset(choice, TODAY)
  const isValidRange = range.start <= range.end

  // useMemo：期間が変わったときだけ集計し直す
  const result = useMemo(() => {
    const inRange = isValidRange ? filterByRange(orders, range) : []
    return {
      summary: summarize(inRange),
      daily: isValidRange ? dailySales(inRange, range) : [],
      types: breakdownByPurchaseType(inRange),
      ranking: affiliateRanking(inRange),
    }
    // range はオブジェクトなので、中身の日付で変化を判定する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, range.start, range.end, isValidRange])

  const { summary } = result
  const hasData = summary.orderCount > 0

  const kpis = [
    {
      label: '総売上',
      value: formatYen(summary.totalSales),
      note: 'Shopify ・ キャンセル除外 ・ 返金差引後',
    },
    {
      label: '注文数',
      value: formatCount(summary.orderCount),
      note: `キャンセル ${summary.cancelledCount}件を除く`,
    },
    {
      label: '平均注文額',
      value: summary.averageOrderValue === null ? '—' : formatYen(summary.averageOrderValue),
      note: '総売上 ÷ 注文数',
    },
    {
      label: 'アフィリエイト経由売上',
      value: formatYen(summary.affiliateSales),
      note: `紹介者情報のある注文 ${summary.affiliateOrderCount}件`,
    },
    {
      label: '紹介売上の割合',
      value: formatPercent(summary.affiliateShare),
      note: '全体売上に対する割合',
    },
  ]

  return (
    <div className="p-page">
      {source === 'demo' && <DemoBanner />}

      <PageHeader
        title="ダッシュボード"
        description={`集計期間 ${formatDate(range.start)} – ${formatDate(range.end)} ・ 日本時間 ・ 注文日基準`}
        actions={
          <PeriodFilter
            choice={choice}
            onChoiceChange={setChoice}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        }
      />
      <DataSourceNote />

      <section className="p-kpi-grid" aria-label="主要指標">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            note={kpi.note}
            state={hasData ? 'default' : 'empty'}
          />
        ))}
      </section>

      <Card
        title="売上推移（日別）"
        aside={
          <Legend
            items={[
              { label: '全体売上（紹介売上を含む）', color: '--color-series-total' },
              { label: 'うちアフィリエイト経由', color: '--color-affiliate' },
            ]}
          />
        }
      >
        {hasData ? (
          <SalesTrendChart data={result.daily} />
        ) : (
          <p className="c-empty">この期間の注文はありません</p>
        )}
      </Card>

      <Card
        title="購入タイプ別の内訳"
        description="通常購入と定期購入（初回・継続）に分けた売上"
        aside={
          <Legend
            items={result.types.map((t) => ({
              label: PURCHASE_TYPE_LABELS[t.type],
              color: PURCHASE_TYPE_COLORS[t.type],
            }))}
          />
        }
      >
        {hasData ? (
          <PurchaseTypeBreakdown rows={result.types} />
        ) : (
          <p className="c-empty">この期間の注文はありません</p>
        )}
      </Card>

      <div className="p-dashboard-bottom">
        <Card
          title="アフィリエイター別 売上ランキング"
          aside={<small className="c-card__meta">Shopify 注文の紹介者情報から集計</small>}
        >
          <AffiliateRankingTable rows={result.ranking} />
        </Card>
        <Card title="GoAffPro との照合">
          <p className="p-placeholder">Step 6 で照合結果を表示します</p>
        </Card>
      </div>
    </div>
  )
}
