// =====================================================================
// アプリ内で使うデータの「型」（どんな項目を持つかの設計図）
// CSV の列名ではなく「集計に必要な情報」で定義する。
// CSV → この型への変換は Step 5 の取り込み処理で行う。
// =====================================================================

/** 日付（日本時間）。'2026-09-30' の形の文字列 */
export type DateString = string

/** 購入タイプ。Shopify の Tags 列から判定する */
export type PurchaseType = 'normal' | 'subscription-first' | 'subscription-recurring'

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  normal: '通常購入',
  'subscription-first': '定期・初回',
  'subscription-recurring': '定期・継続',
}

/** 1件の注文（Shopify の注文エクスポートを注文番号でまとめたもの） */
export type Order = {
  /** 注文番号（例：'#1203'） */
  orderId: string
  /** 注文日（日本時間） */
  orderDate: DateString
  /** 合計金額（円・返金前） */
  total: number
  /** 返金額（円）。注文日基準で差し引く */
  refunded: number
  /** キャンセルされた注文か */
  isCancelled: boolean
  purchaseType: PurchaseType
  /** 紹介者名（Note Attributes の Affiliate）。紹介なしは null */
  affiliate: string | null
}

/** 期間（開始日・終了日を含む） */
export type DateRange = {
  start: DateString
  end: DateString
}
