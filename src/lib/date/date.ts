import type { DateRange, DateString } from '../../types/domain'

// 日付は 'YYYY-MM-DD' の文字列で扱う。
// Date オブジェクトは端末のタイムゾーンで値がずれることがあるため、
// 計算するときだけ UTC として扱い、すぐ文字列に戻す。

function toUtcDate(date: DateString): Date {
  return new Date(`${date}T00:00:00Z`)
}

function toDateString(date: Date): DateString {
  return date.toISOString().slice(0, 10)
}

/** 今日の日付（日本時間）。端末がどの国の設定でも日本の日付を返す */
export function todayInJapan(now: Date = new Date()): DateString {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000
  return toDateString(new Date(now.getTime() + JST_OFFSET_MS))
}

/** 日付を n 日ずらす */
export function addDays(date: DateString, days: number): DateString {
  const d = toUtcDate(date)
  d.setUTCDate(d.getUTCDate() + days)
  return toDateString(d)
}

/** その月の1日 */
export function startOfMonth(date: DateString): DateString {
  return `${date.slice(0, 7)}-01`
}

/** その月の末日 */
export function endOfMonth(date: DateString): DateString {
  const d = toUtcDate(startOfMonth(date))
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0) // 翌月の0日 ＝ 今月の末日
  return toDateString(d)
}

/** 月を n か月ずらした月の1日 */
export function addMonths(date: DateString, months: number): DateString {
  const d = toUtcDate(startOfMonth(date))
  d.setUTCMonth(d.getUTCMonth() + months)
  return toDateString(d)
}

/** 期間内の日付を1日ずつ並べる */
export function eachDay(range: DateRange): DateString[] {
  const days: DateString[] = []
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) {
    days.push(d)
  }
  return days
}

/** 期間内かどうか（文字列のまま大小比較できるのが 'YYYY-MM-DD' 形式の利点） */
export function isInRange(date: DateString, range: DateRange): boolean {
  return date >= range.start && date <= range.end
}

export type PeriodPreset = 'this-month' | 'last-month' | 'last-3-months'

/** 「今月」「先月」「過去3ヶ月」を具体的な期間にする */
export function rangeForPreset(preset: PeriodPreset, today: DateString): DateRange {
  switch (preset) {
    case 'this-month':
      return { start: startOfMonth(today), end: today }
    case 'last-month': {
      const start = addMonths(today, -1)
      return { start, end: endOfMonth(start) }
    }
    case 'last-3-months': {
      // 先月までの3か月（今月の途中分は含めない）
      const lastMonth = addMonths(today, -1)
      return { start: addMonths(today, -3), end: endOfMonth(lastMonth) }
    }
  }
}

/** '2026-09-01' → '2026/09/01' */
export function formatDate(date: DateString): string {
  return date.replaceAll('-', '/')
}
