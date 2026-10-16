import { createContext, useContext } from 'react'
import type { Encoding } from '../lib/csv/decode'
import type { ImportIssue, ShopifyImportStats } from '../lib/csv/shopifyOrders'
import type { LeaderboardRow, MonthlyRow } from '../lib/goaffpro/parsePaste'
import type { DateRange, Order } from '../types/domain'

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

/** GoAffPro の照合用データ（Annual Report と Leaderboard は別々に貼り付ける） */
export type GoAffProData = {
  monthly: { year: number; rows: MonthlyRow[]; importedAt: Date } | null
  leaderboard: { range: DateRange; rows: LeaderboardRow[]; importedAt: Date } | null
}

export type DataContextValue = {
  /** 'demo'：架空のサンプル ／ 'shopify'：取り込んだ CSV */
  source: 'demo' | 'shopify'
  orders: Order[]
  /** 注文データがカバーしている期間（照合で「まるごと含む月」を判定するのに使う） */
  coverage: DateRange | null
  shopifyImport: ShopifyImport | null
  goaffpro: GoAffProData
  setShopifyData: (orders: Order[], info: ShopifyImport) => void
  setGoAffProMonthly: (year: number, rows: MonthlyRow[]) => void
  setGoAffProLeaderboard: (range: DateRange, rows: LeaderboardRow[]) => void
  clearGoAffPro: () => void
  clearData: () => void
}

export const DataContext = createContext<DataContextValue | null>(null)

/** どの画面からでも共有データを取り出すためのフック */
export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData は DataProvider の内側で使ってください')
  return value
}
