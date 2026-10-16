import { useState } from 'react'
import { Link } from 'react-router'
import { decodeCsv } from '../../lib/csv/decode'
import { REQUIRED_COLUMNS, parseShopifyOrders } from '../../lib/csv/shopifyOrders'
import { formatDate } from '../../lib/date/date'
import { formatCount } from '../../lib/format/format'
import { formatDateTime } from '../../lib/format/formatDateTime'
import { useData } from '../../store/dataContext'
import { PURCHASE_TYPE_LABELS } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Dropzone } from '../ui/Dropzone'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_ISSUES_SHOWN = 10

export function ShopifyImportCard() {
  const { shopifyImport, setShopifyData } = useData()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // async：ファイルの読み込みは時間がかかるので、終わるのを待ってから次へ進む
  async function handleFile(file: File) {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('CSV ファイル（.csv）を選んでください')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('ファイルが大きすぎます（20MB まで）')
      return
    }

    setIsLoading(true)
    try {
      const { text, encoding } = decodeCsv(await file.arrayBuffer())
      const result = parseShopifyOrders(text)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setShopifyData(result.orders, {
        fileName: file.name,
        encoding,
        stats: result.stats,
        issues: result.issues,
        importedAt: new Date(),
      })
    } catch {
      setError('ファイルを読み込めませんでした。もう一度お試しください')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = shopifyImport?.stats
  const badge = error ? (
    <Badge tone="error">エラー</Badge>
  ) : shopifyImport ? (
    <Badge tone="success">読み込み完了</Badge>
  ) : (
    <Badge tone="neutral">未読み込み</Badge>
  )

  return (
    <Card
      title="① Shopify 注文データ"
      description="管理画面 › 注文管理 › エクスポート（CSV）"
      aside={badge}
    >
      <Dropzone onFile={handleFile} isLoading={isLoading} error={error} />

      {shopifyImport && stats && (
        <div className="p-import-result">
          <div className="p-import-result__file">
            <span className="p-import-result__file-name">{shopifyImport.fileName}</span>
            <span className="p-import-result__file-meta">
              {shopifyImport.encoding} ・ {stats.columnCount}列 ・ 取り込み{' '}
              {formatDateTime(shopifyImport.importedAt)}
            </span>
          </div>

          <dl className="p-import-result__list">
            <dt>CSVの行数</dt>
            <dd>{stats.rowCount.toLocaleString('ja-JP')}行</dd>
            <dt>注文数（注文番号でまとめた件数）</dt>
            <dd className="p-import-result__strong">{formatCount(stats.orderCount)}</dd>
            <dt>うちキャンセル</dt>
            <dd>{formatCount(stats.cancelledCount)}</dd>
            <dt>うち返金あり</dt>
            <dd>{formatCount(stats.refundedCount)}</dd>
            <dt>注文日の範囲</dt>
            <dd>
              {stats.dateRange &&
                `${formatDate(stats.dateRange.start)} – ${formatDate(stats.dateRange.end)}`}
            </dd>
            <dt>紹介者情報（Affiliate）あり</dt>
            <dd>{formatCount(stats.affiliateOrderCount)}</dd>
            <dt>購入タイプ</dt>
            <dd>
              {(Object.keys(stats.typeCounts) as (keyof typeof stats.typeCounts)[])
                .map((type) => `${PURCHASE_TYPE_LABELS[type]} ${stats.typeCounts[type]}`)
                .join(' ・ ')}
            </dd>
          </dl>

          <p className="p-import-result__columns">
            読み込んだ列：{REQUIRED_COLUMNS.join(' / ')}
            <br />
            破棄した列：氏名・住所・メール・電話など {stats.discardedColumnCount}
            列（保存していません）
          </p>

          {shopifyImport.issues.length > 0 && (
            <div className="c-alert c-alert--warning" role="status">
              <p className="c-alert__title">
                {shopifyImport.issues.length}件の注文を集計から除外しました
              </p>
              <ul className="c-alert__list">
                {shopifyImport.issues.slice(0, MAX_ISSUES_SHOWN).map((issue) => (
                  <li key={`${issue.row}-${issue.message}`}>
                    {issue.row}行目：{issue.message}
                  </li>
                ))}
                {shopifyImport.issues.length > MAX_ISSUES_SHOWN && (
                  <li>ほか {shopifyImport.issues.length - MAX_ISSUES_SHOWN}件</li>
                )}
              </ul>
            </div>
          )}

          <div className="p-actions">
            <Link to="/data" className="c-button c-button--secondary">
              読み込んだデータを確認
            </Link>
            <Link to="/" className="c-button c-button--primary">
              ダッシュボードで見る
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
