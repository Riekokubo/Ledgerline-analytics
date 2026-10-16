// 架空のサンプル値（Step 1 の表示確認用）
// Step 3 で集計ロジックができたら、計算結果に置き換える
export const SAMPLE_KPIS = [
  { label: '総売上', value: '¥3,584,000', note: 'Shopify ・ キャンセル除外 ・ 返金差引後' },
  { label: '注文数', value: '498件', note: 'キャンセル 5件を除く' },
  { label: '平均注文額', value: '¥7,197', note: '総売上 ÷ 注文数' },
  { label: 'アフィリエイト経由売上', value: '¥1,218,000', note: '紹介者情報のある注文 160件' },
  { label: '紹介売上の割合', value: '34.0%', note: '全体売上に対する割合' },
]
