// Figma の KpiCard コンポーネント（State=Default / Loading / Empty）に対応
// 数値の下には必ず「算出根拠（note）」を表示して、数字の意味が分かるようにする
type KpiCardProps = {
  label: string
  value?: string
  note?: string
  state?: 'default' | 'loading' | 'empty'
}

export function KpiCard({ label, value, note, state = 'default' }: KpiCardProps) {
  return (
    <div className={`c-kpi-card c-kpi-card--${state}`} aria-busy={state === 'loading'}>
      <p className="c-kpi-card__label">{label}</p>

      {state === 'loading' && <div className="c-kpi-card__skeleton" aria-hidden="true" />}
      {state === 'default' && <p className="c-kpi-card__value">{value}</p>}
      {state === 'empty' && <p className="c-kpi-card__value">—</p>}

      <p className="c-kpi-card__note">
        {state === 'loading' && '読み込み中'}
        {state === 'empty' && 'データなし（CSV未取り込み）'}
        {state === 'default' && note}
      </p>
    </div>
  )
}
