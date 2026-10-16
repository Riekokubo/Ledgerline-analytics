import { createContext, useContext } from 'react'
import type { Encoding } from '../lib/csv/decode'
import type { ImportIssue, ShopifyImportStats } from '../lib/csv/shopifyOrders'
import type { Order } from '../types/domain'

// =====================================================================
// アプリ全体で共有するデータ（Context）
// 取り込み画面で読み込んだ注文を、ダッシュボードや一覧画面でも使えるようにする。
// データはメモリ上だけに置き、ページを再読み込みすると消える（保存しない）。
// =====================================================================

export type ShopifyImport = {
  fileName: string
  encoding: Encoding
  stats: ShopifyImportStats
  issues: ImportIssue[]
  /** 取り込んだ日時（画面に「最終更新」として表示する） */
  importedAt: Date
}

export type DataContextValue = {
  /** 'demo'：架空のサンプル ／ 'shopify'：取り込んだ CSV */
  source: 'demo' | 'shopify'
  orders: Order[]
  shopifyImport: ShopifyImport | null
  setShopifyData: (orders: Order[], info: ShopifyImport) => void
  clearData: () => void
}

export const DataContext = createContext<DataContextValue | null>(null)

/** どの画面からでも共有データを取り出すためのフック */
export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData は DataProvider の内側で使ってください')
  return value
}
