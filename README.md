# Ledgerline Analytics

ECストアの売上と、アフィリエイト（紹介）経由の売上をひとつの画面で確認できる分析ダッシュボードです。
Shopify の注文CSVと GoAffPro の実績を読み込み、ブラウザの中だけで集計します。

**デモ：** https://riekokubo.github.io/Ledgerline-analytics/
（表示されているデータはすべて架空です。ストア名も架空のものに置き換えています）

> **名前の由来**　Ledger（帳簿）と Line（グラフの線）を合わせた名前です。
> 楽譜で五線からはみ出した音を書き足す短い線も「レジャーライン」と呼びます。
> ストアの管理画面だけでは見えない数字を書き足す、という意味を込めました。

---

## 背景と課題

Shopify で運営するストアの月次レポートを作る際、全体の売上は Shopify、紹介経由の売上はアフィリエイト管理アプリ GoAffPro と、別々の画面を行き来する必要がありました。
「売上のうち紹介経由はどれくらいか」「定期購入はどう推移しているか」が一目で分からないことが課題でした。

## 調査で分かったこと（仕様を決めた根拠）

実際の注文CSVを分析し、当初の想定から仕様を変えました。

- **紹介者の情報は Shopify 側にもあった**
  注文CSVの Note Attributes 列に、GoAffPro が紹介者名を書き込んでいました。
  → 当初予定していた「GoAffPro の注文IDと突き合わせる」方式をやめ、**売上はすべて Shopify を正**とし、GoAffPro は答え合わせ（照合）用に変更。二重計上の心配がなくなりました。
- **定期購入が注文の半数以上を占めていた**
  → 全体像をつかみにくい原因だったため、「通常購入・定期初回・定期継続」の内訳をダッシュボードに追加しました。
- **照合すると差が出る理由が見えた**
  定期継続の注文にも一部紹介者が付いており、GoAffPro の報告値との差と一致しました。
  → 差を隠さず「一致／差あり」で表示し、確認のきっかけにする設計にしました。

## 設計で大事にしたこと

- **数字の根拠を必ず添える**：各KPIの下に「キャンセル除外・返金差引後」などの算出方法を表示
- **個人情報を持たない**：CSVの79列のうち、集計に必要な9列だけを読み取り、氏名・住所・メールは読み込み時に破棄
- **データを外に出さない**：処理はすべてブラウザ内。サーバーへの送信・保存はしない
- **状態をきちんと見せる**：データなし・読み込み中・エラー・サンプル表示中を、それぞれ画面で区別

## デザインと実装のつながり

- Figma の Variables（色・余白・角丸）と、コードの CSS カスタムプロパティを**同じ名前**で管理（`src/styles/foundation/_tokens.scss`）
- Figma のコンポーネントのバリアント（例：KpiCard の Default / Loading / Empty）を、React の props として実装
- CSS は **FLOCSS ＋ BEM** で設計（`.c-kpi-card__value`、`.c-kpi-card--empty` など）

## 使用技術

React ・ TypeScript ・ Vite ・ SCSS（FLOCSS / BEM）・ Recharts ・ Papa Parse ・ Vitest ・ React Router ・ GitHub Actions（GitHub Pages へ自動公開）

## 品質

集計・CSV読み取り・照合のロジックは、画面と切り離した関数にしてテストを書いています（58件）。
実際のCSVで、別の方法で集計した値と件数・金額が一致することを確認しました。

---

## 開発の始め方

```bash
npm install      # 必要なパッケージを入れる（最初の1回）
npm run dev      # 開発用サーバーを起動 → http://localhost:5173
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発用サーバーを起動 |
| `npm test` | テストを実行 |
| `npm run build` | 型チェックをして本番用に書き出す |
| `npm run lint` | コードの書き方の問題を検出 |
| `npm run format` | コードの整形 |

## ディレクトリ構成

```
src/
├─ pages/          画面（ダッシュボード・データ取り込み・読み込み済みデータ）
├─ components/     部品（layout / ui / dashboard / import / goaffpro / data）
├─ lib/            画面を持たない処理。テストを書く場所
│  ├─ aggregate/   売上の集計
│  ├─ csv/         Shopify CSV の読み取り
│  ├─ goaffpro/    GoAffPro の表の読み取り
│  ├─ reconcile/   Shopify と GoAffPro の照合
│  ├─ date/        日付の計算（日本時間）
│  └─ format/      金額・日付・割合の表示
├─ store/          画面間で共有するデータ（React Context）
├─ demo/           架空のサンプルデータ
└─ styles/         SCSS（foundation / layout / object）
tests/fixtures/    テスト用の架空CSV
```

## データの取り扱い

- 実際の顧客情報や売上データは、Git にも公開環境にも入れない
- `.gitignore` で CSV と `local-data/` を除外（`tests/fixtures/` の架空データのみ例外）
- 公開デモでも、CSV を読み込んだ場合の処理はブラウザ内だけで完結する
