// グラフや内訳の凡例。color には CSS 変数名（例：'--color-affiliate'）を渡す
type LegendItem = { label: string; color: string }

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="c-legend">
      {items.map((item) => (
        <li key={item.label} className="c-legend__item">
          <span
            className="c-legend__swatch"
            style={{ background: `var(${item.color})` }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
