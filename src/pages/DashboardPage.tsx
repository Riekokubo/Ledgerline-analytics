import { useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { DemoBanner } from '../components/ui/DemoBanner'
import { KpiCard } from '../components/ui/KpiCard'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { DEMO_ORDERS, TODAY } from '../demo/demoData'
import { filterByRange, summarize } from '../lib/aggregate/aggregate'
import { formatDate, rangeForPreset, type PeriodPreset } from '../lib/date/date'
import { formatCount, formatPercent, formatYen } from '../lib/format/format'

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'this-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'last-3-months', label: '過去3ヶ月' },
  // 「期間指定」は Step 4 で日付入力と一緒に追加する
]

export function DashboardPage() {
  // useState：画面が覚えておく値。ボタンを押すと period が変わり、画面が描き直される
  const [period, setPeriod] = useState<PeriodPreset>('last-month')

  // 選んだ期間を具体的な日付にする
  const range = useMemo(() => rangeForPreset(period, TODAY), [period])

  // useMemo：期間が変わったときだけ集計し直す（毎回の再描画で無駄に計算しない）
  const summary = useMemo(() => summarize(filterByRange(DEMO_ORDERS, range)), [range])

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
      <DemoBanner />

      <PageHeader
        title="ダッシュボード"
        description={`集計期間 ${formatDate(range.start)} – ${formatDate(range.end)} ・ 日本時間 ・ 注文日基準`}
        actions={
          <SegmentedControl
            label="期間"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
        }
      />

      <section className="p-kpi-grid" aria-label="主要指標">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            note={kpi.note}
            state={summary.orderCount === 0 ? 'empty' : 'default'}
          />
        ))}
      </section>

      <Card title="売上推移（日別）">
        <p className="p-placeholder">Step 4 でグラフを表示します</p>
      </Card>

      <Card title="購入タイプ別の内訳" description="通常購入と定期購入（初回・継続）に分けた売上">
        <p className="p-placeholder">Step 4 で内訳を表示します</p>
      </Card>

      <div className="p-dashboard-bottom">
        <Card title="アフィリエイター別 売上ランキング">
          <p className="p-placeholder">Step 4 でランキングを表示します</p>
        </Card>
        <Card title="GoAffPro との照合">
          <p className="p-placeholder">Step 6 で照合結果を表示します</p>
        </Card>
      </div>
    </div>
  )
}
