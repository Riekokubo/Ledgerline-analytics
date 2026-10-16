import { describe, expect, it } from 'vitest'
import { addDays, eachDay, endOfMonth, rangeForPreset, todayInJapan } from './date'

describe('日付の計算', () => {
  it('月末・年末をまたいで日付を進める', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('月末日を求める（うるう年も考慮）', () => {
    expect(endOfMonth('2026-09-15')).toBe('2026-09-30')
    expect(endOfMonth('2028-02-03')).toBe('2028-02-29')
  })

  it('期間内の日付を並べる', () => {
    expect(eachDay({ start: '2026-09-29', end: '2026-10-02' })).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ])
  })
})

describe('期間の選択肢', () => {
  const today = '2026-10-16'

  it('今月は1日から今日まで', () => {
    expect(rangeForPreset('this-month', today)).toEqual({ start: '2026-10-01', end: '2026-10-16' })
  })

  it('先月は前月の1日から末日まで', () => {
    expect(rangeForPreset('last-month', today)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })

  it('過去3ヶ月は今月を含まない3か月', () => {
    expect(rangeForPreset('last-3-months', today)).toEqual({
      start: '2026-07-01',
      end: '2026-09-30',
    })
  })

  it('1月の先月は前年の12月', () => {
    expect(rangeForPreset('last-month', '2027-01-10')).toEqual({
      start: '2026-12-01',
      end: '2026-12-31',
    })
  })
})

describe('todayInJapan', () => {
  it('UTC で前日の夜でも、日本時間の日付を返す', () => {
    // UTC 2026-10-15 20:00 ＝ 日本時間 2026-10-16 05:00
    expect(todayInJapan(new Date('2026-10-15T20:00:00Z'))).toBe('2026-10-16')
  })
})
