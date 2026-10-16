/**
 * 金額を「¥1,234,567」の形式にする。
 * 円は小数を使わないため、四捨五入して整数にする。
 */
export function formatYen(amount: number): string {
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '−' : ''
  return `${sign}¥${Math.abs(rounded).toLocaleString('ja-JP')}`
}
