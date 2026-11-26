import { describe, expect, it } from 'vitest'
import { rangeOfOrders } from '../orders/rangeOfOrders'
import { parseGasError } from './gasClient'

describe('parseGasError', () => {
  it('GAS のエラーから、種類と本文を取り出す', () => {
    const e = parseGasError(new Error('Error: [auth] もう一度ログインしてください。'))
    expect(e.kind).toBe('auth')
    expect(e.message).toBe('もう一度ログインしてください。')
  })

  it('印のないエラーは、中身を見せずに一般的な文にする', () => {
    const e = parseGasError(new Error('Exception: Service Spreadsheets failed'))
    expect(e.kind).toBe('unknown')
    expect(e.message).not.toContain('Spreadsheets')
  })
})

describe('rangeOfOrders', () => {
  const o = (orderDate: string) => ({
    orderId: orderDate,
    orderDate,
    total: 0,
    refunded: 0,
    isCancelled: false,
    purchaseType: 'normal' as const,
    affiliate: null,
  })

  it('いちばん古い日と新しい日を返す', () => {
    expect(rangeOfOrders([o('2026-10-05'), o('2026-09-01'), o('2026-10-31')])).toEqual({
      start: '2026-09-01',
      end: '2026-10-31',
    })
  })

  it('注文がなければ null', () => {
    expect(rangeOfOrders([])).toBeNull()
  })
})
