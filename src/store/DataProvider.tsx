import { useState, type ReactNode } from 'react'
import { DEMO_ORDERS, DEMO_RANGE } from '../demo/demoData'
import type { StoredData } from '../lib/gas/gasClient'
import type { MonthlyRow } from '../lib/goaffpro/parsePaste'
import { rangeOfOrders } from '../lib/orders/rangeOfOrders'
import type { Order } from '../types/domain'
import {
  DataContext,
  type DataContextValue,
  type GoAffProData,
  type SaveState,
  type ShopifyImport,
  type StoredInfo,
} from './dataContext'

const EMPTY_GOAFFPRO: GoAffProData = { monthly: null, leaderboard: null }

/** GAS 版で渡される保存先（公開デモでは渡さない＝保存しない） */
export type RemoteStorage = {
  initial: StoredData
  saveOrders: (orders: Order[], fileName: string) => Promise<StoredData>
  saveGoAffProMonthly: (rows: MonthlyRow[]) => Promise<StoredData>
}

function toStoredInfo(data: StoredData): StoredInfo | null {
  if (data.orders.length === 0) return null
  return {
    orderCount: data.orders.length,
    lastImport: data.lastImport
      ? { ...data.lastImport, importedAt: new Date(data.lastImport.importedAt) }
      : null,
  }
}

function toMonthly(rows: MonthlyRow[]): GoAffProData['monthly'] {
  if (rows.length === 0) return null
  const latest = rows[rows.length - 1].month
  return { year: Number(latest.slice(0, 4)), rows, importedAt: new Date() }
}

type DataProviderProps = {
  children: ReactNode
  remote?: RemoteStorage
}

export function DataProvider({ children, remote }: DataProviderProps) {
  const initial = remote?.initial
  const [orders, setOrders] = useState<Order[]>(() =>
    initial && initial.orders.length > 0 ? initial.orders : DEMO_ORDERS,
  )
  const [stored, setStored] = useState<StoredInfo | null>(() =>
    initial ? toStoredInfo(initial) : null,
  )
  const [shopifyImport, setShopifyImport] = useState<ShopifyImport | null>(null)
  const [goaffpro, setGoaffpro] = useState<GoAffProData>(() => ({
    ...EMPTY_GOAFFPRO,
    monthly: initial ? toMonthly(initial.goaffproMonthly) : null,
  }))
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', message: null })

  // スプレッドシートから返ってきた最新の内容を画面に反映する
  function applyStored(data: StoredData) {
    if (data.orders.length > 0) setOrders(data.orders)
    setStored(toStoredInfo(data))
    const monthly = toMonthly(data.goaffproMonthly)
    if (monthly) setGoaffpro((prev) => ({ ...prev, monthly }))
  }

  async function persist(task: () => Promise<StoredData>, doneMessage: string) {
    setSaveState({ status: 'saving', message: null })
    try {
      const data = await task()
      applyStored(data)
      setSaveState({ status: 'saved', message: doneMessage })
    } catch (error) {
      setSaveState({
        status: 'error',
        message: error instanceof Error ? error.message : '保存できませんでした。',
      })
    }
  }

  // 保存済みデータがあるときは、全期間を「カバーしている期間」とする
  const coverage = stored
    ? rangeOfOrders(orders)
    : shopifyImport
      ? shopifyImport.stats.dateRange
      : DEMO_RANGE

  const value: DataContextValue = {
    source: shopifyImport || stored ? 'shopify' : 'demo',
    orders,
    coverage,
    shopifyImport,
    stored,
    storage: remote ? saveState : null,
    goaffpro,
    setShopifyData: (nextOrders, info) => {
      setOrders(nextOrders)
      setShopifyImport(info)
      if (remote) {
        void persist(
          () => remote.saveOrders(nextOrders, info.fileName),
          `${nextOrders.length.toLocaleString('ja-JP')}件の注文をスプレッドシートに保存しました。`,
        )
      }
    },
    // 既存の値を残しつつ一部だけ変える（...prev はオブジェクトのコピー）
    setGoAffProMonthly: (year, rows) => {
      setGoaffpro((prev) => ({ ...prev, monthly: { year, rows, importedAt: new Date() } }))
      if (remote) {
        void persist(
          () => remote.saveGoAffProMonthly(rows),
          `GoAffPro の月別データ（${rows.length}か月分）を保存しました。`,
        )
      }
    },
    setGoAffProLeaderboard: (range, rows) =>
      setGoaffpro((prev) => ({ ...prev, leaderboard: { range, rows, importedAt: new Date() } })),
    clearGoAffPro: () => setGoaffpro(EMPTY_GOAFFPRO),
    // 消去するとサンプルデータの表示に戻る（GAS 版では使わない：保存データはシートで管理する）
    clearData: () => {
      setOrders(DEMO_ORDERS)
      setShopifyImport(null)
      setGoaffpro(EMPTY_GOAFFPRO)
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
