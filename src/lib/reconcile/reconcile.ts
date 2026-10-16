import type { DateRange, Order } from '../../types/domain'
import { endOfMonth, isInRange } from '../date/date'
import { isCounted, netSales } from '../aggregate/aggregate'
import type { LeaderboardRow, MonthlyRow } from '../goaffpro/parsePaste'

// =====================================================================
// Shopify の紹介売上と、GoAffPro の報告値を照らし合わせる
// 売上の正は Shopify。GoAffPro との差は「確認のきっかけ」として表示する。
// =====================================================================

export type MatchStatus = 'match' | 'diff' | 'not-covered' | 'shopify-only' | 'goaffpro-only'

type Totals = { orders: number; sales: number }

/** 紹介者情報のある注文の件数と売上（キャンセル除外・返金差引後） */
function affiliateTotals(orders: Order[]): Totals {
  const target = orders.filter((o) => isCounted(o) && o.affiliate !== null)
  return { orders: target.length, sales: target.reduce((t, o) => t + netSales(o), 0) }
}

export type MonthlyComparison = {
  month: string
  shopify: Totals | null
  goaffpro: { sales: number; revenue: number }
  diffOrders: number | null
  diffSales: number | null
  status: MatchStatus
}

/**
 * 月別の照合。
 * Shopify のデータがその月をまるごと含む場合だけ比べる（月の途中までのデータで比べると差が出て当然なため）
 */
export function compareMonthly(
  orders: Order[],
  monthly: MonthlyRow[],
  coverage: DateRange | null,
): MonthlyComparison[] {
  return monthly.map((row) => {
    const month: DateRange = { start: `${row.month}-01`, end: endOfMonth(`${row.month}-01`) }
    const covered = coverage !== null && coverage.start <= month.start && coverage.end >= month.end
    if (!covered) {
      return {
        month: row.month,
        shopify: null,
        goaffpro: row,
        diffOrders: null,
        diffSales: null,
        status: 'not-covered',
      }
    }
    const shopify = affiliateTotals(orders.filter((o) => isInRange(o.orderDate, month)))
    const diffOrders = shopify.orders - row.sales
    const diffSales = shopify.sales - row.revenue
    return {
      month: row.month,
      shopify,
      goaffpro: row,
      diffOrders,
      diffSales,
      status: diffOrders === 0 && diffSales === 0 ? 'match' : 'diff',
    }
  })
}

/** 名前の表記ゆれ（全角・半角、余分な空白、大文字小文字）をそろえる */
export function normalizeName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export type AffiliateComparison = {
  name: string
  shopify: Totals | null
  goaffpro: { sales: number; revenue: number } | null
  diffSales: number | null
  status: MatchStatus
}

/** 紹介者別の照合（Leaderboard を貼り付けたときの期間で比べる） */
export function compareAffiliates(
  orders: Order[],
  range: DateRange,
  leaderboard: LeaderboardRow[],
): AffiliateComparison[] {
  const shopifyByName = new Map<string, { name: string; totals: Totals }>()
  for (const order of orders) {
    if (!isCounted(order) || order.affiliate === null || !isInRange(order.orderDate, range))
      continue
    const key = normalizeName(order.affiliate)
    const current = shopifyByName.get(key) ?? {
      name: order.affiliate,
      totals: { orders: 0, sales: 0 },
    }
    current.totals.orders += 1
    current.totals.sales += netSales(order)
    shopifyByName.set(key, current)
  }

  const rows: AffiliateComparison[] = []
  const seen = new Set<string>()

  for (const g of leaderboard) {
    const key = normalizeName(g.name)
    seen.add(key)
    const s = shopifyByName.get(key)
    if (!s) {
      rows.push({
        name: g.name,
        shopify: null,
        goaffpro: g,
        diffSales: null,
        status: 'goaffpro-only',
      })
      continue
    }
    const diffSales = s.totals.sales - g.revenue
    rows.push({
      name: s.name,
      shopify: s.totals,
      goaffpro: g,
      diffSales,
      status: diffSales === 0 && s.totals.orders === g.sales ? 'match' : 'diff',
    })
  }

  for (const [key, s] of shopifyByName) {
    if (seen.has(key)) continue
    rows.push({
      name: s.name,
      shopify: s.totals,
      goaffpro: null,
      diffSales: null,
      status: 'shopify-only',
    })
  }

  // Shopify の紹介売上が多い順
  return rows.sort((a, b) => (b.shopify?.sales ?? 0) - (a.shopify?.sales ?? 0))
}

export type ReconcileSummary = {
  months: string[]
  shopify: Totals
  goaffpro: { sales: number; revenue: number }
  diffOrders: number
  diffSales: number
}

/** 比較できた月の合計（ダッシュボードのカード用） */
export function summarizeMonthly(rows: MonthlyComparison[]): ReconcileSummary | null {
  const compared = rows.filter((r) => r.shopify !== null)
  if (compared.length === 0) return null
  const shopify = compared.reduce(
    (t, r) => ({ orders: t.orders + r.shopify!.orders, sales: t.sales + r.shopify!.sales }),
    { orders: 0, sales: 0 },
  )
  const goaffpro = compared.reduce(
    (t, r) => ({ sales: t.sales + r.goaffpro.sales, revenue: t.revenue + r.goaffpro.revenue }),
    { sales: 0, revenue: 0 },
  )
  return {
    months: compared.map((r) => r.month),
    shopify,
    goaffpro,
    diffOrders: shopify.orders - goaffpro.sales,
    diffSales: shopify.sales - goaffpro.revenue,
  }
}
