import Papa from 'papaparse'
import type { DateRange, DateString, Order, PurchaseType } from '../../types/domain'
import { todayInJapan } from '../date/date'

// =====================================================================
// Shopify の「注文エクスポート」CSV を、アプリの Order 型に変換する
//
// - 1注文が複数行（商品明細ごと）になるので、注文番号（Name）でまとめる
// - 合計・返金・キャンセルなど注文単位の値は、各注文の最初の行に入っている
// - 集計に使う列だけを読み、氏名・住所・メールなどは変数にも残さない
// =====================================================================

/** 読み込みに必ず必要な列 */
export const REQUIRED_COLUMNS = [
  'Name',
  'Created at',
  'Currency',
  'Total',
  'Refunded Amount',
  'Cancelled at',
  'Financial Status',
  'Tags',
  'Note Attributes',
] as const

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]
type CsvRow = Record<string, string>

export type ImportIssue = {
  /** CSV の行番号（見出しを1行目として数える） */
  row: number
  message: string
}

export type ShopifyImportStats = {
  rowCount: number
  columnCount: number
  orderCount: number
  cancelledCount: number
  refundedCount: number
  affiliateOrderCount: number
  typeCounts: Record<PurchaseType, number>
  dateRange: DateRange | null
  usedColumns: string[]
  discardedColumnCount: number
}

export type ShopifyImportResult =
  | { ok: true; orders: Order[]; stats: ShopifyImportStats; issues: ImportIssue[] }
  | { ok: false; error: string }

/** 'Subscription Recurring Order' などのタグから購入タイプを判定する */
export function purchaseTypeFromTags(tags: string): PurchaseType {
  const list = tags.split(',').map((tag) => tag.trim())
  if (list.includes('Subscription Recurring Order')) return 'subscription-recurring'
  if (list.includes('Subscription First Order')) return 'subscription-first'
  return 'normal'
}

/** Note Attributes（「キー: 値」の複数行）から Affiliate の値を取り出す */
export function affiliateFromNoteAttributes(noteAttributes: string): string | null {
  for (const line of noteAttributes.split(/\r?\n/)) {
    const index = line.indexOf(':')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (key === 'Affiliate' && value !== '') return value
  }
  return null
}

/** '2026-09-30 17:50:32 +0900' → 日本時間の日付 '2026-09-30' */
export function parseShopifyDate(value: string): DateString | null {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-])(\d{2})(\d{2})$/)
  if (!match) return null
  const [, date, time, sign, hours, minutes] = match
  const parsed = new Date(`${date}T${time}${sign}${hours}:${minutes}`)
  if (Number.isNaN(parsed.getTime())) return null
  return todayInJapan(parsed) // どの時差で書かれていても日本時間の日付にそろえる
}

/** '4,410' や '¥4,410' も数値にする。空欄は 0 */
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[¥,\s]/g, '')
  if (cleaned === '') return 0
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : null
}

export function parseShopifyOrders(text: string): ShopifyImportResult {
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true })
  const headers = parsed.meta.fields ?? []

  // ---- 1. 列の確認
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column))
  if (missing.length > 0) {
    return {
      ok: false,
      error: `必須の列が見つかりません：${missing.join('、')}。Shopify の「注文」画面からエクスポートした CSV か確認してください。`,
    }
  }
  if (parsed.data.length === 0) {
    return { ok: false, error: 'CSV にデータの行がありません。' }
  }

  // ---- 2. 注文番号ごとに最初の行（注文単位の値が入っている行）を集める
  const firstRows = new Map<string, { row: CsvRow; line: number }>()
  parsed.data.forEach((row, index) => {
    const name = row.Name?.trim()
    if (!name) return
    const line = index + 2 // 見出しが1行目
    const existing = firstRows.get(name)
    // Financial Status が入っている行を注文単位の行として優先する
    if (!existing || (!existing.row['Financial Status'] && row['Financial Status'])) {
      firstRows.set(name, { row, line })
    }
  })

  // ---- 3. 必要な項目だけを取り出して Order にする
  const orders: Order[] = []
  const issues: ImportIssue[] = []
  const get = (row: CsvRow, column: RequiredColumn) => (row[column] ?? '').trim()

  for (const [orderId, { row, line }] of firstRows) {
    const orderDate = parseShopifyDate(get(row, 'Created at'))
    if (!orderDate) {
      issues.push({
        row: line,
        message: `${orderId}：注文日「${get(row, 'Created at')}」を日付として読めません`,
      })
      continue
    }
    const currency = get(row, 'Currency')
    if (currency !== 'JPY') {
      issues.push({
        row: line,
        message: `${orderId}：通貨が JPY ではありません（${currency || '空欄'}）。集計から除外しました`,
      })
      continue
    }
    const total = parseAmount(get(row, 'Total'))
    const refunded = parseAmount(get(row, 'Refunded Amount'))
    if (total === null || refunded === null) {
      issues.push({ row: line, message: `${orderId}：金額を数値として読めません` })
      continue
    }

    orders.push({
      orderId,
      orderDate,
      total,
      refunded,
      isCancelled: get(row, 'Cancelled at') !== '',
      purchaseType: purchaseTypeFromTags(get(row, 'Tags')),
      affiliate: affiliateFromNoteAttributes(get(row, 'Note Attributes')),
    })
  }

  if (orders.length === 0) {
    return {
      ok: false,
      error: '読み込める注文がありませんでした。下のエラー内容を確認してください。',
    }
  }

  // ---- 4. 確認用の集計
  const dates = orders.map((o) => o.orderDate).sort()
  const typeCounts: Record<PurchaseType, number> = {
    normal: 0,
    'subscription-first': 0,
    'subscription-recurring': 0,
  }
  orders.forEach((o) => (typeCounts[o.purchaseType] += 1))

  return {
    ok: true,
    orders,
    issues,
    stats: {
      rowCount: parsed.data.length,
      columnCount: headers.length,
      orderCount: orders.length,
      cancelledCount: orders.filter((o) => o.isCancelled).length,
      refundedCount: orders.filter((o) => o.refunded > 0).length,
      affiliateOrderCount: orders.filter((o) => o.affiliate !== null).length,
      typeCounts,
      dateRange: { start: dates[0], end: dates[dates.length - 1] },
      usedColumns: [...REQUIRED_COLUMNS],
      discardedColumnCount: headers.filter(
        (h) => !(REQUIRED_COLUMNS as readonly string[]).includes(h),
      ).length,
    },
  }
}
