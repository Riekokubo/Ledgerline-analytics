import { describe, expect, it } from 'vitest'
import { formatYen } from './formatYen'

describe('formatYen', () => {
  it('3桁ごとにカンマを入れる', () => {
    expect(formatYen(3584000)).toBe('¥3,584,000')
  })

  it('0円はそのまま表示する', () => {
    expect(formatYen(0)).toBe('¥0')
  })

  it('小数は四捨五入する', () => {
    expect(formatYen(7196.8)).toBe('¥7,197')
  })

  it('マイナス（返金など）は先頭に − を付ける', () => {
    expect(formatYen(-36000)).toBe('−¥36,000')
  })
})
