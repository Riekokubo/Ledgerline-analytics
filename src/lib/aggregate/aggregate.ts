import type { DateRange, DateString, Order, PurchaseType } from '../../types/domain'
import { eachDay, isInRange } from '../date/date'

// =====================================================================
// 集計ロジック（画面を持たない「純粋な関数」）
// 同じ注文データを渡せば、いつも同じ結果が返る。だからテストしやすい。
//
// 集計ルール
// - 売上はすべて Shopify の注文データから計算する（GoAffPro は照合用）
// - キャンセルされた注文は、件数にも売上にも含めない
// - 返金は注文日基準で差し引く（売上計上額 = 合計 − 返金額）
// - アフィリエイト経由売上は、紹介者情報のある注文の売上計上額の合計
// =====================================================================

/** 集計対象の注文か（キャンセルを除く） */
export function isCounted(order: Order): boolean {
  return !order.isCancelled
}

/** 1注文の売上計上額（返金を差し引いた額） */
export function netSales(order: Order): number {
  return order.total - order.refunded
}

/** 期間内の注文だけを取り出す */
export function filterByRange(orders: Order[], range: DateRange): Order[] {
  return orders.filter((order) => isInRange(order.orderDate, range))
}

function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0)
}

export type Summary = {
  totalSales: number
  orderCount: number
  /** 注文が0件のときは計算できないので null */
  averageOrderValue: number | null
  affiliateSales: number
  affiliateOrderCount: number
  /** 全体売上に占める紹介売上の割合（0〜1）。売上0のときは null */
  affiliateShare: number | null
  cancelledCount: number
}

/** KPIカード用の集計 */
export function summarize(orders: Order[]): Summary {
  const counted = orders.filter(isCounted)
  const affiliated = counted.filter((order) => order.affiliate !== null)

  const totalSales = sum(counted.map(netSales))
  const affiliateSales = sum(affiliated.map(netSales))

  return {
    totalSales,
    orderCount: counted.length,
    averageOrderValue: counted.length > 0 ? totalSales / counted.length : null,
    affiliateSales,
    affiliateOrderCount: affiliated.length,
    affiliateShare: totalSales > 0 ? affiliateSales / totalSales : null,
    cancelledCount: orders.length - counted.length,
  }
}

export type DailySales = {
  date: DateString
  total: number
  affiliate: number
}

/** 日別の売上（グラフ用）。注文のない日も 0 として並べる */
export function dailySales(orders: Order[], range: DateRange): DailySales[] {
  const byDate = new Map<DateString, DailySales>()
  for (const date of eachDay(range)) {
    byDate.set(date, { date, total: 0, affiliate: 0 })
  }
  for (const order of orders.filter(isCounted)) {
    const day = byDate.get(order.orderDate)
    if (!day) continue // 期間外
    day.total += netSales(order)
    if (order.affiliate !== null) day.affiliate += netSales(order)
  }
  return [...byDate.values()]
}

export type PurchaseTypeBreakdown = {
  type: PurchaseType
  orderCount: number
  sales: number
  averageOrderValue: number | null
  affiliateSales: number
  /** 全体売上に占める割合（0〜1） */
  share: number | null
}

const PURCHASE_TYPES: PurchaseType[] = ['normal', 'subscription-first', 'subscription-recurring']

/** 購入タイプ別（通常・定期初回・定期継続）の内訳 */
export function breakdownByPurchaseType(orders: Order[]): PurchaseTypeBreakdown[] {
  const counted = orders.filter(isCounted)
  const totalSales = sum(counted.map(netSales))

  return PURCHASE_TYPES.map((type) => {
    const ofType = counted.filter((order) => order.purchaseType === type)
    const sales = sum(ofType.map(netSales))
    return {
      type,
      orderCount: ofType.length,
      sales,
      averageOrderValue: ofType.length > 0 ? sales / ofType.length : null,
      affiliateSales: sum(ofType.filter((o) => o.affiliate !== null).map(netSales)),
      share: totalSales > 0 ? sales / totalSales : null,
    }
  })
}

export type AffiliateRankingRow = {
  rank: number
  name: string
  orderCount: number
  sales: number
  /** 紹介売上全体に占める割合（0〜1） */
  share: number
}

/** アフィリエイター別の売上ランキング（売上の多い順） */
export function affiliateRanking(orders: Order[]): AffiliateRankingRow[] {
  const totals = new Map<string, { orderCount: number; sales: number }>()

  for (const order of orders.filter(isCounted)) {
    if (order.affiliate === null) continue
    const current = totals.get(order.affiliate) ?? { orderCount: 0, sales: 0 }
    current.orderCount += 1
    current.sales += netSales(order)
    totals.set(order.affiliate, current)
  }

  const affiliateTotal = sum([...totals.values()].map((t) => t.sales))

  return [...totals.entries()]
    .map(([name, t]) => ({ name, ...t }))
    .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name, 'ja'))
    .map((row, index) => ({
      rank: index + 1,
      ...row,
      share: affiliateTotal > 0 ? row.sales / affiliateTotal : 0,
    }))
}
