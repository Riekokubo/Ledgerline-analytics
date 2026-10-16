import { formatCount, formatYen } from '../../lib/format/format'
import { formatMonth, formatSignedYen } from '../../lib/format/formatSigned'
import type { AffiliateComparison, MonthlyComparison } from '../../lib/reconcile/reconcile'
import { MatchBadge } from './MatchBadge'

function countAndYen(t: { orders: number; sales: number } | null) {
  return t ? `${formatCount(t.orders)} ・ ${formatYen(t.sales)}` : '—'
}

export function MonthlyCompareTable({ rows }: { rows: MonthlyComparison[] }) {
  return (
    <div className="c-table-wrap">
      <table className="c-table c-table--wide">
        <thead>
          <tr>
            <th scope="col">月</th>
            <th scope="col" className="c-table__num">
              Shopify
            </th>
            <th scope="col" className="c-table__num">
              GoAffPro
            </th>
            <th scope="col" className="c-table__num">
              紹介売上の差
            </th>
            <th scope="col">状態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <td className="c-table__strong">{formatMonth(r.month)}</td>
              <td className="c-table__num">{countAndYen(r.shopify)}</td>
              <td className="c-table__num">
                {formatCount(r.goaffpro.sales)} ・ {formatYen(r.goaffpro.revenue)}
              </td>
              <td className="c-table__num c-table__strong">{formatSignedYen(r.diffSales)}</td>
              <td>
                <MatchBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AffiliateCompareTable({ rows }: { rows: AffiliateComparison[] }) {
  return (
    <div className="c-table-wrap">
      <table className="c-table c-table--wide">
        <thead>
          <tr>
            <th scope="col">アフィリエイター</th>
            <th scope="col" className="c-table__num">
              Shopify
            </th>
            <th scope="col" className="c-table__num">
              GoAffPro
            </th>
            <th scope="col" className="c-table__num">
              差
            </th>
            <th scope="col">状態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="c-table__strong">{r.name}</td>
              <td className="c-table__num">{countAndYen(r.shopify)}</td>
              <td className="c-table__num">
                {r.goaffpro
                  ? `${formatCount(r.goaffpro.sales)} ・ ${formatYen(r.goaffpro.revenue)}`
                  : '—'}
              </td>
              <td className="c-table__num c-table__strong">{formatSignedYen(r.diffSales)}</td>
              <td>
                <MatchBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
