import { isCounted, netSales } from '../lib/aggregate/aggregate'
import { addMonths, endOfMonth } from '../lib/date/date'
import type { DateRange, Order } from '../types/domain'

// デモ用：GoAffPro の画面からコピーしたような「架空の」表を作る。
// 照合の見え方を確かめられるよう、Shopify 側と少しだけ差を付ける。

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function affiliateTotals(orders: Order[], range: DateRange) {
  const target = orders.filter(
    (o) =>
      isCounted(o) &&
      o.affiliate !== null &&
      o.orderDate >= range.start &&
      o.orderDate <= range.end,
  )
  return { count: target.length, revenue: target.reduce((t, o) => t + netSales(o), 0) }
}

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`

/** Annual Report 風（直近3か月）。最後の月だけ 1件・¥7,800 少なくする */
export function sampleAnnualReport(orders: Order[], coverage: DateRange): string {
  const lines = ['Month\tSales\tRevenue\tCommission\t%']
  for (let i = 0; i < 3; i++) {
    const start = addMonths(coverage.start, i)
    const t = affiliateTotals(orders, { start, end: endOfMonth(start) })
    const adjust = i === 2 ? 1 : 0
    const revenue = t.revenue - adjust * 7800
    lines.push(
      [
        MONTH_NAMES[Number(start.slice(5, 7)) - 1],
        t.count - adjust,
        yen(revenue),
        yen(Math.round(revenue * 0.2)),
        '20.00%',
      ].join('\t'),
    )
  }
  return lines.join('\n')
}

/** Leaderboard 風。1人だけ ¥7,800 少なくする */
export function sampleLeaderboard(orders: Order[], range: DateRange): string {
  const byName = new Map<string, { count: number; revenue: number }>()
  for (const o of orders) {
    if (
      !isCounted(o) ||
      o.affiliate === null ||
      o.orderDate < range.start ||
      o.orderDate > range.end
    )
      continue
    const t = byName.get(o.affiliate) ?? { count: 0, revenue: 0 }
    t.count += 1
    t.revenue += netSales(o)
    byName.set(o.affiliate, t)
  }
  const rows = [...byName.entries()].sort((a, b) => b[1].revenue - a[1].revenue)
  const lines = ['#\tAffiliate\tSales\tRevenue']
  rows.forEach(([name, t], i) => {
    const adjust = i === 1 ? 1 : 0
    lines.push([i + 1, name, t.count - adjust, yen(t.revenue - adjust * 7800)].join('\t'))
  })
  return lines.join('\n')
}
