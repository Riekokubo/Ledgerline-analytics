import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { DemoBanner } from '../components/ui/DemoBanner'
import { KpiCard } from '../components/ui/KpiCard'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { SAMPLE_KPIS } from '../demo/sampleKpis'

type Period = 'this-month' | 'last-month' | 'last-3-months' | 'custom'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'this-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'last-3-months', label: '過去3ヶ月' },
  { value: 'custom', label: '期間指定' },
]

export function DashboardPage() {
  // useState：画面が覚えておく値。ボタンを押すと period が変わり、画面が描き直される
  const [period, setPeriod] = useState<Period>('last-month')

  return (
    <div className="p-page">
      <DemoBanner />

      <PageHeader
        title="ダッシュボード"
        description="集計期間 2026/09/01 – 2026/09/30 ・ 日本時間 ・ 注文日基準"
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
        {SAMPLE_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} note={kpi.note} />
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
