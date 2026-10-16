import { useState, type ReactNode } from 'react'
import { DEMO_ORDERS } from '../demo/demoData'
import type { Order } from '../types/domain'
import { DataContext, type ShopifyImport } from './dataContext'

export function DataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS)
  const [shopifyImport, setShopifyImport] = useState<ShopifyImport | null>(null)

  const value = {
    source: shopifyImport ? ('shopify' as const) : ('demo' as const),
    orders,
    shopifyImport,
    setShopifyData: (nextOrders: Order[], info: ShopifyImport) => {
      setOrders(nextOrders)
      setShopifyImport(info)
    },
    // 消去するとサンプルデータの表示に戻る
    clearData: () => {
      setOrders(DEMO_ORDERS)
      setShopifyImport(null)
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
