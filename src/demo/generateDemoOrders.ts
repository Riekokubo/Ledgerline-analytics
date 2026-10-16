import type { DateString, Order, PurchaseType } from '../types/domain'
import { addDays } from '../lib/date/date'

// =====================================================================
// デモ用の架空の注文データを作る
// 実データの代わりに画面を確認するためのもの。数値はすべて架空。
// 毎回同じデータになるよう、決まった順番で乱数を出す仕組み（シード付き乱数）を使う。
// =====================================================================

/** シード付き乱数（同じ seed なら毎回同じ数列になる） */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 重み付きで1つ選ぶ（例：[['A', 3], ['B', 1]] なら A が B の3倍出やすい） */
function pickWeighted<T>(random: () => number, items: [T, number][]): T {
  const total = items.reduce((t, [, w]) => t + w, 0)
  let r = random() * total
  for (const [item, weight] of items) {
    r -= weight
    if (r < 0) return item
  }
  return items[items.length - 1][0]
}

const AFFILIATES: [string, number][] = [
  ['紹介者 A', 34],
  ['紹介者 B', 22],
  ['紹介者 C', 16],
  ['紹介者 D', 12],
  ['紹介者 E', 10],
  ['紹介者 F', 6],
]

// 架空の商品価格（セット数違い）
const PRICES: [number, number][] = [
  [7800, 70],
  [15600, 20],
  [23400, 7],
  [46800, 3],
]

type Options = {
  start: DateString
  end: DateString
  seed?: number
}

export function generateDemoOrders({ start, end, seed = 20261016 }: Options): Order[] {
  const random = createRandom(seed)
  const orders: Order[] = []
  let number = 1001

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const count = 11 + Math.floor(random() * 12) // 1日 11〜22件

    for (let i = 0; i < count; i++) {
      const purchaseType = pickWeighted<PurchaseType>(random, [
        ['normal', 33],
        ['subscription-first', 15],
        ['subscription-recurring', 52],
      ])
      const total = purchaseType === 'subscription-recurring' ? 6600 : pickWeighted(random, PRICES)

      // 定期・継続には紹介者が付かない（実データと同じ傾向）
      const hasAffiliate = purchaseType !== 'subscription-recurring' && random() < 0.62
      const isCancelled = purchaseType === 'normal' && random() < 0.03
      const isRefunded = !isCancelled && random() < 0.008

      orders.push({
        orderId: `#${number++}`,
        orderDate: date,
        total,
        refunded: isRefunded ? total : 0,
        isCancelled,
        purchaseType,
        affiliate: hasAffiliate ? pickWeighted(random, AFFILIATES) : null,
      })
    }
  }
  return orders
}
