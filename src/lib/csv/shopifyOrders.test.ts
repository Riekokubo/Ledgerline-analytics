import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decodeCsv } from './decode'
import {
  affiliateFromNoteAttributes,
  parseShopifyDate,
  parseShopifyOrders,
  purchaseTypeFromTags,
} from './shopifyOrders'

// 実際の Shopify と同じ79列で作った架空の CSV
const fixture = readFileSync('tests/fixtures/shopify-orders-sample.csv', 'utf-8')

describe('parseShopifyOrders', () => {
  const result = parseShopifyOrders(fixture)
  if (!result.ok) throw new Error(result.error)
  const byId = Object.fromEntries(result.orders.map((o) => [o.orderId, o]))

  it('明細が2行ある注文も1件にまとめる', () => {
    expect(result.stats.rowCount).toBe(6)
    expect(result.stats.orderCount).toBe(5)
  })

  it('2行目（明細だけの行）ではなく、注文単位の行の金額を使う', () => {
    expect(byId['#9002'].total).toBe(15600)
  })

  it('購入タイプをタグから判定する', () => {
    expect(byId['#9001'].purchaseType).toBe('normal')
    expect(byId['#9002'].purchaseType).toBe('subscription-first')
    expect(byId['#9003'].purchaseType).toBe('subscription-recurring')
  })

  it('紹介者を Note Attributes から読み取る', () => {
    expect(byId['#9001'].affiliate).toBe('紹介者 A')
    expect(byId['#9003'].affiliate).toBeNull() // __ref だけでは紹介とみなさない
  })

  it('キャンセルと返金を読み取る', () => {
    expect(byId['#9004']).toMatchObject({ isCancelled: true, refunded: 7800 })
    expect(byId['#9005']).toMatchObject({ isCancelled: false, refunded: 3000 })
  })

  it('UTC で書かれた時刻も日本時間の日付にそろえる', () => {
    expect(byId['#9005'].orderDate).toBe('2026-09-04')
  })

  it('個人情報の列は Order に含めない', () => {
    const keys = Object.keys(byId['#9001'])
    expect(keys).not.toContain('Email')
    expect(JSON.stringify(result.orders)).not.toContain('テスト 太郎')
    expect(JSON.stringify(result.orders)).not.toContain('example.com')
  })

  it('確認用の集計', () => {
    expect(result.stats).toMatchObject({
      cancelledCount: 1,
      refundedCount: 2,
      affiliateOrderCount: 3,
      typeCounts: { normal: 3, 'subscription-first': 1, 'subscription-recurring': 1 },
      dateRange: { start: '2026-09-01', end: '2026-09-04' },
      discardedColumnCount: 70,
    })
  })
})

describe('parseShopifyOrders のエラー', () => {
  it('必須の列がなければ、足りない列名を伝える', () => {
    const result = parseShopifyOrders('Name,Total\n#1,100\n')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Created at')
  })

  it('日付が読めない行は飛ばして、行番号付きで知らせる', () => {
    const broken = fixture.replace('2026-09-01 10:00:00 +0900', '9月1日')
    const result = parseShopifyOrders(broken)
    if (!result.ok) throw new Error(result.error)
    expect(result.stats.orderCount).toBe(4)
    expect(result.issues[0]).toMatchObject({ row: 2 })
  })
})

describe('部品ごとの変換', () => {
  it('タグの判定', () => {
    expect(purchaseTypeFromTags('')).toBe('normal')
    expect(purchaseTypeFromTags('VIP, Subscription Recurring Order')).toBe('subscription-recurring')
  })

  it('Note Attributes の読み取り（改行コードが CRLF でも読める）', () => {
    expect(affiliateFromNoteAttributes('__ref: x\r\nAffiliate: 紹介者 C')).toBe('紹介者 C')
    expect(affiliateFromNoteAttributes('Affiliate: ')).toBeNull()
  })

  it('日付の形式が違えば null', () => {
    expect(parseShopifyDate('2026/09/01')).toBeNull()
  })
})

describe('decodeCsv（文字コード）', () => {
  it('UTF-8 の BOM を取り除く', () => {
    const buffer = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Name')]).buffer
    expect(decodeCsv(buffer)).toEqual({ text: 'Name', encoding: 'UTF-8' })
  })

  it('Shift_JIS も読める', () => {
    // 「注文」の Shift_JIS のバイト列
    const buffer = new Uint8Array([0x92, 0x8d, 0x95, 0xb6]).buffer
    expect(decodeCsv(buffer)).toEqual({ text: '注文', encoding: 'Shift_JIS' })
  })
})
