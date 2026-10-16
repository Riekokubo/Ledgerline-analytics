import { useState, type ReactNode } from 'react'
import { DEMO_ORDERS, DEMO_RANGE } from '../demo/demoData'
import type { Order } from '../types/domain'
import {
  DataContext,
  type DataContextValue,
  type GoAffProData,
  type ShopifyImport,
} from './dataContext'

const EMPTY_GOAFFPRO: GoAffProData = { monthly: null, leaderboard: null }

export function DataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS)
  const [shopifyImport, setShopifyImport] = useState<ShopifyImport | null>(null)
  const [goaffpro, setGoaffpro] = useState<GoAffProData>(EMPTY_GOAFFPRO)

  const value: DataContextValue = {
    source: shopifyImport ? 'shopify' : 'demo',
    orders,
    coverage: shopifyImport ? shopifyImport.stats.dateRange : DEMO_RANGE,
    shopifyImport,
    goaffpro,
    setShopifyData: (nextOrders, info) => {
      setOrders(nextOrders)
      setShopifyImport(info)
    },
    // 既存の値を残しつつ一部だけ変える（...prev はオブジェクトのコピー）
    setGoAffProMonthly: (year, rows) =>
      setGoaffpro((prev) => ({ ...prev, monthly: { year, rows, importedAt: new Date() } })),
    setGoAffProLeaderboard: (range, rows) =>
      setGoaffpro((prev) => ({ ...prev, leaderboard: { range, rows, importedAt: new Date() } })),
    clearGoAffPro: () => setGoaffpro(EMPTY_GOAFFPRO),
    // 消去するとサンプルデータの表示に戻る
    clearData: () => {
      setOrders(DEMO_ORDERS)
      setShopifyImport(null)
      setGoaffpro(EMPTY_GOAFFPRO)
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
