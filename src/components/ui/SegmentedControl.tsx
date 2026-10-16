// Figma の SegmentItem を並べた切り替えボタン（期間フィルター・タブで使う）
// <T extends string> は「選択肢の値の型を呼び出し側で決められる」という TypeScript の書き方
type Option<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  label: string // 画面読み上げ用の名前（例：期間）
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="c-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="c-segmented__item"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
