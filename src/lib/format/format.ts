// 画面に表示するための整形。値が計算できない（null）ときは「—」を出す

export { formatYen } from './formatYen'

/** 0〜1 の割合を「34.0%」にする */
export function formatPercent(ratio: number | null): string {
  if (ratio === null) return '—'
  return `${(ratio * 100).toFixed(1)}%`
}

/** 件数を「498件」にする */
export function formatCount(count: number): string {
  return `${count.toLocaleString('ja-JP')}件`
}
