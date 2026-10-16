import { Link } from 'react-router'
import { formatCount, formatYen } from '../../lib/format/format'
import { formatMonth, formatSignedCount, formatSignedYen } from '../../lib/format/formatSigned'
import { compareMonthly, summarizeMonthly } from '../../lib/reconcile/reconcile'
import { useData } from '../../store/dataContext'
import type { DateRange } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

/** ダッシュボード右下：選んだ期間に含まれる月で、Shopify と GoAffPro を比べる */
export function GoAffProMatchCard({ range }: { range: DateRange }) {
  const { orders, coverage, goaffpro } = useData()

  if (!goaffpro.monthly) {
    return (
      <Card title="GoAffPro との照合">
        <p className="c-empty c-empty--compact">
          GoAffPro の Annual Report を貼り付けると、紹介売上の答え合わせができます。
          <Link to="/import">照合データを取り込む</Link>
        </p>
      </Card>
    )
  }

  // 選んだ期間と重なる月だけを対象にする
  const rows = compareMonthly(orders, goaffpro.monthly.rows, coverage).filter(
    (r) => `${r.month}-01` <= range.end && `${r.month}-31` >= range.start,
  )
  const summary = summarizeMonthly(rows)

  if (!summary) {
    return (
      <Card title="GoAffPro との照合">
        <p className="c-empty c-empty--compact">
          この期間に、Shopify のデータが1か月まるごとそろっている月がないため比較できません。
        </p>
      </Card>
    )
  }

  const isMatch = summary.diffOrders === 0 && summary.diffSales === 0

  return (
    <Card
      title="GoAffPro との照合"
      aside={isMatch ? <Badge tone="success">一致</Badge> : <Badge tone="warning">差あり</Badge>}
    >
      <dl className="p-match">
        <dt className="p-match__head" />
        <dd className="p-match__head">件数</dd>
        <dd className="p-match__head">紹介売上</dd>

        <dt>Shopify（集計）</dt>
        <dd>{formatCount(summary.shopify.orders)}</dd>
        <dd className="p-match__strong">{formatYen(summary.shopify.sales)}</dd>

        <dt>GoAffPro（報告値）</dt>
        <dd>{formatCount(summary.goaffpro.sales)}</dd>
        <dd className="p-match__strong">{formatYen(summary.goaffpro.revenue)}</dd>

        <dt className="p-match__diff">差</dt>
        <dd className="p-match__diff">{formatSignedCount(summary.diffOrders)}</dd>
        <dd className="p-match__diff">{formatSignedYen(summary.diffSales)}</dd>
      </dl>
      <p className="c-card__meta">対象月：{summary.months.map(formatMonth).join('、')}</p>
      <p className="p-match__note">
        GoAffPro
        は承認済みの紹介だけを数えるため、承認待ち・定期購入の扱い・月の区切り方で差が出ることがあります。売上の数値は
        Shopify 側を正としています。
      </p>
      <Link to="/data" className="p-match__link">
        月別・紹介者別の差を確認する
      </Link>
    </Card>
  )
}
