/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Order } from '../../types/domain'

// =====================================================================
// gas/Code.js（GAS のサーバー側）を、GAS の機能をまねた偽物の上で動かして確かめる
// =====================================================================

type Cell = string | number | boolean
type Grid = Cell[][]

/** スプレッドシートの偽物（使っている機能だけ） */
function fakeSpreadsheet() {
  const sheets: Record<string, Grid> = {}
  const sheetApi = (name: string) => {
    const grid = sheets[name]
    const lastRow = () => {
      for (let r = grid.length; r > 0; r--) {
        if ((grid[r - 1] ?? []).some((v) => v !== '' && v !== undefined)) return r
      }
      return 0
    }
    return {
      getLastRow: lastRow,
      getMaxRows: () => 1000,
      setFrozenRows: () => {},
      getRange: (row: number, col: number, rows: number, cols: number) => {
        const range = {
          setValues: (values: Grid) => {
            values.forEach((v, i) => {
              grid[row - 1 + i] = grid[row - 1 + i] ?? []
              v.forEach((cell, j) => (grid[row - 1 + i][col - 1 + j] = cell))
            })
            return range
          },
          getValues: () =>
            Array.from({ length: rows }, (_, i) =>
              Array.from({ length: cols }, (_, j) => grid[row - 1 + i]?.[col - 1 + j] ?? ''),
            ),
          clearContent: () => {
            for (let i = 0; i < rows; i++) {
              for (let j = 0; j < cols; j++) {
                if (grid[row - 1 + i]) grid[row - 1 + i][col - 1 + j] = ''
              }
            }
            return range
          },
          setNumberFormat: () => range,
          setFontWeight: () => range,
        }
        return range
      },
    }
  }
  return {
    sheets,
    api: {
      getSheetByName: (name: string) => (sheets[name] ? sheetApi(name) : null),
      insertSheet: (name: string) => {
        sheets[name] = []
        return sheetApi(name)
      },
    },
  }
}

function loadServer(pin = 'sora-2026') {
  const cache = new Map<string, string>()
  const ss = fakeSpreadsheet()
  let uuid = 0
  const context: Record<string, unknown> = {
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cache.get(k) ?? null,
        put: (k: string, v: string) => void cache.set(k, v),
        remove: (k: string) => void cache.delete(k),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k: string) => (k === 'PIN' ? pin : null) }),
    },
    Utilities: {
      sleep: () => {},
      getUuid: () => `token-${++uuid}`,
      formatDate: (d: Date) => d.toISOString().slice(0, 10),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss.api },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  }
  runInNewContext(readFileSync('gas/Code.js', 'utf8'), context)
  // vm の中の値は別の世界のオブジェクトなので、JSON を通して比べやすくする
  const call = (name: string, ...args: unknown[]) =>
    JSON.parse(JSON.stringify((context[name] as (...a: unknown[]) => unknown)(...args) ?? null))
  return { call, context, ss, cache }
}

const order = (over: Partial<Order> = {}): Order => ({
  orderId: '#1001',
  orderDate: '2026-10-01',
  total: 5000,
  refunded: 0,
  isCancelled: false,
  purchaseType: 'normal',
  affiliate: null,
  ...over,
})

describe('ログイン', () => {
  it('正しい暗証番号でトークンが発行される', () => {
    const { call } = loadServer()
    expect(call('login', 'sora-2026')).toBe('token-1')
  })

  it('間違えると残り回数を伝え、5回でロックされる', () => {
    const { call } = loadServer()
    expect(() => call('login', 'x')).toThrow('[pin] 暗証番号が違います（あと4回')
    for (let i = 0; i < 3; i++) expect(() => call('login', 'x')).toThrow('[pin]')
    expect(() => call('login', 'x')).toThrow('[locked]')
    // ロック中は正しい番号でも入れない
    expect(() => call('login', 'sora-2026')).toThrow('[locked]')
  })

  it('文字列以外は受け付けない', () => {
    const { call } = loadServer()
    expect(() => call('login', { toString: () => 'sora-2026' })).toThrow('[pin]')
  })

  it('暗証番号が未設定なら、設定を促す', () => {
    const { call } = loadServer('')
    expect(() => call('login', '')).toThrow('[setup]')
  })
})

describe('トークンの確認', () => {
  it('トークンがないと、読み込みも保存もできない', () => {
    const { call } = loadServer()
    expect(() => call('loadAll', 'nope')).toThrow('[auth]')
    expect(() => call('saveOrders', 'nope', [order()], 'a.csv')).toThrow('[auth]')
    expect(() => call('saveGoAffProMonthly', undefined, [])).toThrow('[auth]')
  })

  it('ログアウトするとトークンは使えなくなる', () => {
    const { call } = loadServer()
    const token = call('login', 'sora-2026')
    expect(call('loadAll', token).orders).toEqual([])
    call('logout', token)
    expect(() => call('loadAll', token)).toThrow('[auth]')
  })
})

describe('注文の保存', () => {
  let server: ReturnType<typeof loadServer>
  let token: string
  beforeEach(() => {
    server = loadServer()
    token = server.call('login', 'sora-2026')
  })

  it('保存した注文を、そのまま読み込める', () => {
    const orders = [
      order({ orderId: '#1002', orderDate: '2026-10-02', affiliate: 'Aさん' }),
      order({ orderId: '#1001', isCancelled: true, purchaseType: 'subscription-first' }),
    ]
    const saved = server.call('saveOrders', token, orders, 'orders_10.csv')
    expect(saved.orders).toEqual([orders[1], orders[0]]) // 注文日の順に並ぶ
    expect(saved.lastImport).toMatchObject({ fileName: 'orders_10.csv', orderCount: 2 })
    expect(server.call('loadAll', token).orders).toEqual(saved.orders)
  })

  it('同じ注文番号は新しい内容で上書きし、ほかは残す', () => {
    server.call('saveOrders', token, [order({ orderId: '#1' }), order({ orderId: '#2' })], 'a.csv')
    const saved = server.call(
      'saveOrders',
      token,
      [order({ orderId: '#2', refunded: 1200 }), order({ orderId: '#3', orderDate: '2026-11-01' })],
      'b.csv',
    )
    expect(saved.orders.map((o: Order) => [o.orderId, o.refunded])).toEqual([
      ['#1', 0],
      ['#2', 1200],
      ['#3', 0],
    ])
  })

  it('決まった7項目以外は保存しない（氏名などが混ざっていても捨てる）', () => {
    const withExtra = { ...order(), email: 'a@example.com', name: '山田' }
    server.call('saveOrders', token, [withExtra], 'a.csv')
    const row = server.ss.sheets.orders[1]
    expect(row).toHaveLength(7)
    expect(JSON.stringify(server.ss.sheets)).not.toContain('example.com')
  })

  it('形の正しくないデータは保存しない', () => {
    const bad: Partial<Record<keyof Order, unknown>>[] = [
      { orderDate: '2026/10/01' },
      { total: -1 },
      { total: '5000' },
      { isCancelled: 'false' },
      { purchaseType: 'other' },
      { orderId: '' },
      { affiliate: 123 },
    ]
    for (const over of bad) {
      expect(() => server.call('saveOrders', token, [order(over as Partial<Order>)], 'x')).toThrow(
        '[data]',
      )
    }
    expect(() => server.call('saveOrders', token, 'not array', 'x')).toThrow('[data]')
    expect(() => server.call('saveOrders', token, [], 'x')).toThrow('[data]')
    expect(server.call('loadAll', token).orders).toEqual([])
  })

  it('シートで日付に変わってしまった注文日も、元の形で読み込む', () => {
    server.call('saveOrders', token, [order()], 'a.csv')
    server.ss.sheets.orders[1][1] = new Date('2026-10-01T00:00:00Z') as unknown as string
    expect(server.call('loadAll', token).orders[0].orderDate).toBe('2026-10-01')
  })
})

describe('GoAffPro 月別データの保存', () => {
  it('同じ月は上書きし、月の順に並べる', () => {
    const { call } = loadServer()
    const token = call('login', 'sora-2026')
    call('saveGoAffProMonthly', token, [
      { month: '2026-09', sales: 157, revenue: 1196000, commission: 241600 },
      { month: '2026-08', sales: 171, revenue: 1288000, commission: null },
    ])
    const saved = call('saveGoAffProMonthly', token, [
      { month: '2026-09', sales: 160, revenue: 1200000, commission: 242000 },
      { month: '2026-10', sales: 140, revenue: 1100000, commission: 220000 },
    ])
    expect(
      saved.goaffproMonthly.map((r: { month: string; sales: number }) => [r.month, r.sales]),
    ).toEqual([
      ['2026-08', 171],
      ['2026-09', 160],
      ['2026-10', 140],
    ])
    expect(saved.goaffproMonthly[0].commission).toBeNull()
  })

  it('月の形が正しくなければ保存しない', () => {
    const { call } = loadServer()
    const token = call('login', 'sora-2026')
    expect(() =>
      call('saveGoAffProMonthly', token, [
        { month: '2026-13', sales: 1, revenue: 1, commission: null },
      ]),
    ).toThrow('[data]')
  })
})
