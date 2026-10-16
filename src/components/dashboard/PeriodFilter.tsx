import { SegmentedControl } from '../ui/SegmentedControl'
import type { PeriodPreset } from '../../lib/date/date'
import type { DateRange } from '../../types/domain'

export type PeriodChoice = PeriodPreset | 'custom'

const OPTIONS: { value: PeriodChoice; label: string }[] = [
  { value: 'this-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'last-3-months', label: '過去3ヶ月' },
  { value: 'custom', label: '期間指定' },
]

type Props = {
  choice: PeriodChoice
  onChoiceChange: (choice: PeriodChoice) => void
  customRange: DateRange
  onCustomRangeChange: (range: DateRange) => void
}

export function PeriodFilter({ choice, onChoiceChange, customRange, onCustomRangeChange }: Props) {
  const isInvalid = customRange.start > customRange.end

  return (
    <div className="c-period-filter">
      <SegmentedControl label="期間" options={OPTIONS} value={choice} onChange={onChoiceChange} />

      {choice === 'custom' && (
        <div className="c-period-filter__custom">
          <label className="c-period-filter__field">
            開始日
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => onCustomRangeChange({ ...customRange, start: e.target.value })}
            />
          </label>
          <span aria-hidden="true">–</span>
          <label className="c-period-filter__field">
            終了日
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => onCustomRangeChange({ ...customRange, end: e.target.value })}
            />
          </label>
          {isInvalid && (
            <p className="c-period-filter__error" role="alert">
              開始日は終了日より前にしてください
            </p>
          )}
        </div>
      )}
    </div>
  )
}
