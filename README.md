# Ledgerline Analytics

Shopify の注文CSVと GoAffPro の実績をまとめて確認する、売上分析ダッシュボード。
CSV はブラウザ内だけで処理し、サーバーには送信しない。

## はじめかた

```bash
npm install      # 必要なパッケージを入れる（最初の1回）
npm run dev      # 開発用サーバーを起動 → 表示された http://localhost:5173 を開く
```

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発用サーバーを起動（保存すると画面が自動で更新される） |
| `npm test` | 集計ロジックなどのテストを実行（保存のたびに再実行） |
| `npm run build` | 型チェックをしてから本番用に書き出す |
| `npm run lint` | コードの書き方の問題を検出 |
| `npm run format` | コードの整形（インデントや引用符をそろえる） |

## ディレクトリ構成

```
src/
├─ main.tsx            React の起動とスタイルの読み込み
├─ App.tsx             画面の大元
├─ lib/                画面を持たない処理（集計・整形など）。テストを書く場所
│  └─ format/          金額・日付・割合の表示整形
└─ styles/             SCSS（FLOCSS の順番で管理）
   ├─ main.scss        読み込みの入口
   ├─ foundation/      トークン（Figma の Variables と同じ名前）・リセット
   ├─ layout/          l- 画面の骨組み
   └─ object/
      ├─ component/    c- 小さな部品（BEM）
      ├─ project/      p- 画面固有のまとまり
      └─ utility/      u- 補助クラス
tests/fixtures/        テスト用の架空CSVだけを置く
local-data/            実データを置く場合の場所（Git 管理外）
```

## データの取り扱い

- 実際の顧客情報や売上データは、Git にも公開環境にも入れない
- `.gitignore` で CSV と `local-data/` を除外している（`tests/fixtures/` の架空データのみ例外）
- デモ画面は架空データを使い、画面上にサンプルであることを表示する
