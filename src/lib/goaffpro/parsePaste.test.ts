import { describe, expect, it } from 'vitest'
import { parseAnnualReport, parseLeaderboard, parseMonth, parseNumber } from './parsePaste'

// GoAffPro の画面からコピーしたときと同じ形（タブ区切り）の架空データ
const annualReport = [
  'Month\tSales\tRevenue\tCommission\t%\tSign-ups\tRecruitment',
  'July\t120\t¥900,000\t¥180,000\t20.00%\t1\t0',
  'August\t98\t¥735,000\t¥147,000\t20.00%\t0\t0',
  'September\t110\t¥826,500\t¥165,300\t20.00%\t0\t0',
  'Total\t328\t¥2,461,500\t¥492,300\t20.00%\t1\t0',
].join('\n')

describe('parseAnnualReport（月別）', () => {
  const result = parseAnnualReport(annualReport, 2026)

  it('月・件数・紹介売上・コミッションを読み取る', () => {
    if (!result.ok) throw new Error(result.error)
    expect(result.rows).toEqual([
      { month: '2026-07', sales: 120, revenue: 900000, commission: 180000 },
      { month: '2026-08', sales: 98, revenue: 735000, commission: 147000 },
      { month: '2026-09', sales: 110, revenue: 826500, commission: 165300 },
    ])
  })

  it('Total 行は読み飛ばして知らせる', () => {
    if (!result.ok) throw new Error(result.error)
    expect(result.notes).toEqual([{ line: 5, message: '「Total」行は合計のため読み飛ばしました' }])
  })

  it('見出しの行がなくても、列の順番どおりに読める', () => {
    const withoutHeader = annualReport.split('\n').slice(1, 2).join('\n')
    const r = parseAnnualReport(withoutHeader, 2026)
    expect(r.ok && r.rows[0]).toMatchObject({ month: '2026-07', revenue: 900000 })
  })

  it('タブではなく空白で区切られていても読める', () => {
    const r = parseAnnualReport('September    110    ¥826,500    ¥165,300', 2026)
    expect(r.ok && r.rows[0]).toMatchObject({ month: '2026-09', sales: 110 })
  })

  it('空なら分かりやすいエラー', () => {
    expect(parseAnnualReport('   \n', 2026)).toEqual({
      ok: false,
      error: '貼り付けたデータが空です。',
    })
  })
})

describe('parseLeaderboard（紹介者別）', () => {
  it('見出しから列を探して読み取る', () => {
    const text = [
      '#\tAffiliate\tSales\tRevenue',
      '1\t紹介者 A\t40\t¥312,000',
      '2\t紹介者 B\t25\t¥195,000',
    ].join('\n')
    const r = parseLeaderboard(text)
    if (!r.ok) throw new Error(r.error)
    expect(r.rows).toEqual([
      { name: '紹介者 A', sales: 40, revenue: 312000 },
      { name: '紹介者 B', sales: 25, revenue: 195000 },
    ])
  })

  it('名前や売上の見出しがなければエラーにする', () => {
    const r = parseLeaderboard('A\t40\n B\t25')
    expect(r.ok).toBe(false)
  })
})

describe('部品', () => {
  it('月の表記ゆれ', () => {
    expect(parseMonth('September')).toBe(9)
    expect(parseMonth('Sep')).toBe(9)
    expect(parseMonth('9月')).toBe(9)
    expect(parseMonth('13')).toBeNull()
  })

  it('数値の読み取り', () => {
    expect(parseNumber('¥1,704,000')).toBe(1704000)
    expect(parseNumber('20.28%')).toBe(20.28)
    expect(parseNumber('—')).toBeNull()
  })
})

describe('全角の記号・数字', () => {
  it('全角の「￥」で書かれた金額も読める（GoAffPro の画面からコピーした場合）', () => {
    expect(parseNumber('￥1,316,800')).toBe(1316800)
    expect(parseNumber('￥96,000')).toBe(96000)
    expect(parseNumber('１，２３１')).toBe(1231)
  })

  it('見出しなし・全角の「￥」・余分な列があっても、月別データを読める', () => {
    const text = [
      'February\t12\t￥96,000\t￥21,900\t22.81%\t0\t0',
      'July\t166\t￥1,316,800\t￥276,100\t20.97%\t1\t0',
      'August\t1,231\t￥8,741,600\t￥1,767,520\t20.22%\t0\t0',
    ].join('\n')
    const result = parseAnnualReport(text, 2026)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows).toEqual([
      { month: '2026-02', sales: 12, revenue: 96000, commission: 21900 },
      { month: '2026-07', sales: 166, revenue: 1316800, commission: 276100 },
      { month: '2026-08', sales: 1231, revenue: 8741600, commission: 1767520 },
    ])
  })
})
