import type { PurchaseTypeBreakdown as Row } from '../../lib/aggregate/aggregate'
import { formatCount, formatPercent, formatYen } from '../../lib/format/format'
import { PURCHASE_TYPE_COLORS } from '../../lib/style/purchaseTypeColors'
import { PURCHASE_TYPE_LABELS } from '../../types/domain'

export function PurchaseTypeBreakdown({ rows }: { rows: Row[] }) {
  const description = rows
    .map((r) => `${PURCHASE_TYPE_LABELS[r.type]} ${formatPercent(r.share)}`)
    .join('、')

  return (
    <div className="p-purchase-types">
      {/* 構成比の横棒。読み上げでは割合を文章で伝える */}
      <div className="p-purchase-types__bar" role="img" aria-label={`売上構成比：${description}`}>
        {rows
          .filter((r) => (r.share ?? 0) > 0)
          .map((r) => (
            <div
              key={r.type}
              className={`p-purchase-types__segment p-purchase-types__segment--${r.type}`}
              style={{ flexGrow: r.share ?? 0 }}
            >
              {(r.share ?? 0) >= 0.08 && formatPercent(r.share)}
            </div>
          ))}
      </div>

      <div className="p-purchase-types__cards">
        {rows.map((r) => (
          <div key={r.type} className="p-purchase-types__card">
            <p className="p-purchase-types__name">
              <span
                className="c-legend__swatch"
                style={{ background: `var(${PURCHASE_TYPE_COLORS[r.type]})` }}
                aria-hidden="true"
              />
              {PURCHASE_TYPE_LABELS[r.type]}
            </p>
            <p className="p-purchase-types__sales">{formatYen(r.sales)}</p>
            <dl className="p-purchase-types__list">
              <dt>注文数</dt>
              <dd>{formatCount(r.orderCount)}</dd>
              <dt>平均注文額</dt>
              <dd>{r.averageOrderValue === null ? '—' : formatYen(r.averageOrderValue)}</dd>
              <dt>うちアフィリエイト経由</dt>
              <dd className="p-purchase-types__affiliate">
                {r.affiliateSales > 0 ? formatYen(r.affiliateSales) : '—'}
              </dd>
            </dl>
          </div>
        ))}
      </div>

      <p className="p-purchase-types__note">
        定期・継続の注文には紹介者情報がほとんど付かないため、アフィリエイト経由売上の大部分は通常購入と定期・初回から生まれています。
      </p>
    </div>
  )
}
