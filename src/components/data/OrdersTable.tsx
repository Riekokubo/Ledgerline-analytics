import { useState } from 'react'
import { netSales } from '../../lib/aggregate/aggregate'
import { formatDate } from '../../lib/date/date'
import { formatYen } from '../../lib/format/format'
import { PURCHASE_TYPE_LABELS, type Order } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const PAGE_SIZE = 20

function statusOf(order: Order) {
  if (order.isCancelled) return { label: 'キャンセル', tone: 'neutral' as const }
  if (order.refunded > 0) return { label: '返金あり', tone: 'warning' as const }
  return { label: '支払済み', tone: 'success' as const }
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // 新しい注文が上に来るように並べ、注文番号で絞り込む
  const filtered = [...orders]
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.orderId.localeCompare(a.orderId))
    .filter((o) => o.orderId.includes(query.trim()))

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const rows = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  return (
    <div className="p-orders">
      <label className="p-orders__search">
        注文番号で検索
        <input
          type="search"
          value={query}
          placeholder="#1201"
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
        />
      </label>

      <div className="c-table-wrap">
        <table className="c-table c-table--wide">
          <thead>
            <tr>
              <th scope="col">注文番号</th>
              <th scope="col">注文日</th>
              <th scope="col">状態</th>
              <th scope="col">購入タイプ</th>
              <th scope="col" className="c-table__num">
                合計
              </th>
              <th scope="col" className="c-table__num">
                返金
              </th>
              <th scope="col" className="c-table__num">
                売上計上額
              </th>
              <th scope="col">紹介者</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const status = statusOf(o)
              return (
                <tr key={o.orderId}>
                  <td className="c-table__strong">{o.orderId}</td>
                  <td>{formatDate(o.orderDate)}</td>
                  <td>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td>{PURCHASE_TYPE_LABELS[o.purchaseType]}</td>
                  <td className="c-table__num">{formatYen(o.total)}</td>
                  <td className="c-table__num">{o.refunded > 0 ? formatYen(-o.refunded) : '—'}</td>
                  <td className="c-table__num c-table__strong">
                    {o.isCancelled ? '対象外' : formatYen(netSales(o))}
                  </td>
                  <td>{o.affiliate ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="p-orders__pager">
        <span>
          {filtered.length.toLocaleString('ja-JP')}件中{' '}
          {filtered.length === 0 ? 0 : current * PAGE_SIZE + 1}–
          {Math.min((current + 1) * PAGE_SIZE, filtered.length)}件
        </span>
        <div className="p-actions">
          <Button disabled={current === 0} onClick={() => setPage(current - 1)}>
            前へ
          </Button>
          <Button disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
            次へ
          </Button>
        </div>
      </div>
    </div>
  )
}
