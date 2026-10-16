import { describe, expect, it } from 'vitest'
import type { Order } from '../../types/domain'
import {
  affiliateRanking,
  breakdownByPurchaseType,
  dailySales,
  filterByRange,
  summarize,
} from './aggregate'

// テスト用の注文を短く書くための関数（指定しない項目は標準値）
function order(overrides: Partial<Order>): Order {
  return {
    orderId: '#1000',
    orderDate: '2026-09-01',
    total: 10000,
    refunded: 0,
    isCancelled: false,
    purchaseType: 'normal',
    affiliate: null,
    ...overrides,
  }
}

// 架空の注文5件
const orders: Order[] = [
  order({ orderId: '#1', orderDate: '2026-09-01', total: 10000, affiliate: 'A' }),
  order({
    orderId: '#2',
    orderDate: '2026-09-01',
    total: 20000,
    purchaseType: 'subscription-first',
    affiliate: 'B',
  }),
  order({
    orderId: '#3',
    orderDate: '2026-09-02',
    total: 6000,
    purchaseType: 'subscription-recurring',
  }),
  order({ orderId: '#4', orderDate: '2026-09-03', total: 8000, refunded: 3000, affiliate: 'A' }), // 一部返金
  order({ orderId: '#5', orderDate: '2026-09-03', total: 9000, isCancelled: true, affiliate: 'B' }), // キャンセル
]

describe('summarize（KPI）', () => {
  const s = summarize(orders)

  it('キャンセルを除き、返金を差し引いて総売上を出す', () => {
    // 10000 + 20000 + 6000 + (8000 − 3000) = 41000
    expect(s.totalSales).toBe(41000)
  })

  it('キャンセルは注文数に含めない', () => {
    expect(s.orderCount).toBe(4)
    expect(s.cancelledCount).toBe(1)
  })

  it('平均注文額 = 総売上 ÷ 注文数', () => {
    expect(s.averageOrderValue).toBe(10250)
  })

  it('紹介売上は紹介者のある注文だけ（キャンセル分は含めない）', () => {
    // A: 10000 + 5000、B: 20000（#5 はキャンセル）
    expect(s.affiliateSales).toBe(35000)
    expect(s.affiliateOrderCount).toBe(3)
  })

  it('紹介売上の割合', () => {
    expect(s.affiliateShare).toBeCloseTo(35000 / 41000)
  })

  it('注文が0件なら平均と割合は null（0で割らない）', () => {
    const empty = summarize([])
    expect(empty.averageOrderValue).toBeNull()
    expect(empty.affiliateShare).toBeNull()
  })
})

describe('filterByRange（期間）', () => {
  it('開始日と終了日を含む', () => {
    const result = filterByRange(orders, { start: '2026-09-02', end: '2026-09-03' })
    expect(result.map((o) => o.orderId)).toEqual(['#3', '#4', '#5'])
  })
})

describe('dailySales（日別）', () => {
  const days = dailySales(orders, { start: '2026-09-01', end: '2026-09-04' })

  it('注文のない日も 0 で並べる', () => {
    expect(days).toHaveLength(4)
    expect(days[3]).toEqual({ date: '2026-09-04', total: 0, affiliate: 0 })
  })

  it('日ごとの全体売上と紹介売上', () => {
    expect(days[0]).toEqual({ date: '2026-09-01', total: 30000, affiliate: 30000 })
    expect(days[2]).toEqual({ date: '2026-09-03', total: 5000, affiliate: 5000 })
  })
})

describe('breakdownByPurchaseType（購入タイプ別）', () => {
  const rows = breakdownByPurchaseType(orders)

  it('3つのタイプを必ず同じ順で返す', () => {
    expect(rows.map((r) => r.type)).toEqual([
      'normal',
      'subscription-first',
      'subscription-recurring',
    ])
  })

  it('タイプごとの件数・売上・紹介売上', () => {
    expect(rows[0]).toMatchObject({ orderCount: 2, sales: 15000, affiliateSales: 15000 })
    expect(rows[1]).toMatchObject({ orderCount: 1, sales: 20000, affiliateSales: 20000 })
    expect(rows[2]).toMatchObject({ orderCount: 1, sales: 6000, affiliateSales: 0 })
  })

  it('構成比を合計すると 1（100%）になる', () => {
    const total = rows.reduce((t, r) => t + (r.share ?? 0), 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('affiliateRanking（ランキング）', () => {
  const ranking = affiliateRanking(orders)

  it('売上の多い順に並べ、順位を付ける', () => {
    expect(ranking.map((r) => [r.rank, r.name, r.sales])).toEqual([
      [1, 'B', 20000],
      [2, 'A', 15000],
    ])
  })

  it('キャンセル分は件数に含めない', () => {
    expect(ranking[0].orderCount).toBe(1)
  })

  it('構成比は紹介売上全体に対する割合', () => {
    expect(ranking[0].share).toBeCloseTo(20000 / 35000)
  })
})
