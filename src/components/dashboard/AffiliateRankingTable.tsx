import type { AffiliateRankingRow } from '../../lib/aggregate/aggregate'
import { formatCount, formatPercent, formatYen } from '../../lib/format/format'

export function AffiliateRankingTable({ rows }: { rows: AffiliateRankingRow[] }) {
  if (rows.length === 0) {
    return <p className="c-empty">この期間に紹介者情報のある注文はありません</p>
  }

  // 1位の構成比を棒の最大幅にする（差が見やすくなる）
  const maxShare = rows[0].share

  return (
    <div className="c-table-wrap">
      <table className="c-table">
        <thead>
          <tr>
            <th scope="col" className="c-table__rank">
              順位
            </th>
            <th scope="col">アフィリエイター</th>
            <th scope="col" className="c-table__num">
              紹介注文
            </th>
            <th scope="col" className="c-table__num">
              紹介売上
            </th>
            <th scope="col" className="c-table__share">
              構成比
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="c-table__rank">{row.rank}</td>
              <td className="c-table__strong">{row.name}</td>
              <td className="c-table__num">{formatCount(row.orderCount)}</td>
              <td className="c-table__num c-table__strong">{formatYen(row.sales)}</td>
              <td className="c-table__share">
                <span className="c-share-bar">
                  <span className="c-share-bar__track" aria-hidden="true">
                    <span
                      className="c-share-bar__fill"
                      style={{ width: `${(row.share / maxShare) * 100}%` }}
                    />
                  </span>
                  <span className="c-share-bar__value">{formatPercent(row.share)}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
