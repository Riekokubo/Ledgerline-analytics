import { describe, expect, it } from 'vitest'
import type { Order } from '../../types/domain'
import { compareAffiliates, compareMonthly, normalizeName, summarizeMonthly } from './reconcile'

function order(overrides: Partial<Order>): Order {
  return {
    orderId: '#1',
    orderDate: '2026-09-10',
    total: 10000,
    refunded: 0,
    isCancelled: false,
    purchaseType: 'normal',
    affiliate: null,
    ...overrides,
  }
}

const orders: Order[] = [
  order({ orderId: '#1', orderDate: '2026-09-01', affiliate: '紹介者 A' }),
  order({ orderId: '#2', orderDate: '2026-09-15', affiliate: '紹介者 B' }),
  order({ orderId: '#3', orderDate: '2026-09-30', affiliate: '紹介者 A', refunded: 4000 }),
  order({ orderId: '#4', orderDate: '2026-09-20', affiliate: '紹介者 B', isCancelled: true }),
  order({ orderId: '#5', orderDate: '2026-09-20' }), // 紹介なし
]
const september = { start: '2026-09-01', end: '2026-09-30' }

describe('compareMonthly（月別）', () => {
  it('Shopify の紹介売上（キャンセル除外・返金差引）と比べる', () => {
    const [row] = compareMonthly(
      orders,
      [{ month: '2026-09', sales: 3, revenue: 26000, commission: null }],
      september,
    )
    // Shopify：3件・10000 + 10000 + 6000 = 26000
    expect(row).toMatchObject({
      shopify: { orders: 3, sales: 26000 },
      diffOrders: 0,
      diffSales: 0,
      status: 'match',
    })
  })

  it('差があれば diff', () => {
    const [row] = compareMonthly(
      orders,
      [{ month: '2026-09', sales: 2, revenue: 20000, commission: null }],
      september,
    )
    expect(row).toMatchObject({ diffOrders: 1, diffSales: 6000, status: 'diff' })
  })

  it('Shopify のデータが月の途中までなら比較しない', () => {
    const partial = { start: '2026-09-01', end: '2026-09-20' }
    const [row] = compareMonthly(
      orders,
      [{ month: '2026-09', sales: 3, revenue: 26000, commission: null }],
      partial,
    )
    expect(row.status).toBe('not-covered')
    expect(row.shopify).toBeNull()
  })
})

describe('compareAffiliates（紹介者別）', () => {
  it('名前で突き合わせ、片方にしかない紹介者も表示する', () => {
    const rows = compareAffiliates(orders, september, [
      { name: '紹介者 A', sales: 2, revenue: 16000 },
      { name: '紹介者 C', sales: 1, revenue: 7800 },
    ])
    expect(rows.map((r) => [r.name, r.status, r.diffSales])).toEqual([
      ['紹介者 A', 'match', 0],
      ['紹介者 B', 'shopify-only', null],
      ['紹介者 C', 'goaffpro-only', null],
    ])
  })

  it('全角・半角や空白の違いは同じ名前として扱う', () => {
    expect(normalizeName('　紹介者  Ａ ')).toBe(normalizeName('紹介者 A'))
    const rows = compareAffiliates(orders, september, [
      { name: '紹介者　Ａ', sales: 2, revenue: 16000 },
    ])
    expect(rows[0].status).toBe('match')
  })
})

describe('summarizeMonthly', () => {
  it('比較できた月だけを合計する', () => {
    const rows = compareMonthly(
      orders,
      [
        { month: '2026-08', sales: 5, revenue: 50000, commission: null },
        { month: '2026-09', sales: 2, revenue: 20000, commission: null },
      ],
      september,
    )
    expect(summarizeMonthly(rows)).toMatchObject({
      months: ['2026-09'],
      diffOrders: 1,
      diffSales: 6000,
    })
  })

  it('比較できる月がなければ null', () => {
    expect(summarizeMonthly([])).toBeNull()
  })
})
