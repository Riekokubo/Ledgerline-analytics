import { formatYen } from './formatYen'

/** 差額を「+¥22,000」「−¥7,800」にする。0 は「±0」 */
export function formatSignedYen(diff: number | null): string {
  if (diff === null) return '—'
  if (diff === 0) return '±0'
  return diff > 0 ? `+${formatYen(diff)}` : formatYen(diff)
}

/** 件数の差を「+3」「−1」にする */
export function formatSignedCount(diff: number | null): string {
  if (diff === null) return '—'
  if (diff === 0) return '±0'
  return diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`
}

/** '2026-09' → '2026/09' */
export function formatMonth(month: string): string {
  return month.replace('-', '/')
}
