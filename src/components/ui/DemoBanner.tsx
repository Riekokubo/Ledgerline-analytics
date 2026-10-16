import { Link } from 'react-router'
import { Badge } from './Badge'

// サンプルデータを表示している間、画面上部に必ず出す帯
export function DemoBanner() {
  return (
    <div className="c-demo-banner" role="status">
      <Badge tone="warning">サンプル</Badge>
      <p className="c-demo-banner__text">
        サンプルデータを表示中です。表示されている数値はすべて架空のものです。
      </p>
      <Link to="/import" className="c-button c-button--primary">
        CSVを取り込む
      </Link>
    </div>
  )
}
