// アプリの名前（公開デモ用の架空のブランド名）。名前を変えるときはここと index.html の <title> を直す
export const APP_NAME = { brand: 'Ledgerline', product: 'Analytics' }

// どこで動いているか
// - 'gas'  ：Google Apps Script 版（ログインあり・スプレッドシートに保存）
// - それ以外：公開デモ／ローカル開発（ブラウザ内だけで処理・保存しない）
export const IS_GAS = import.meta.env.MODE === 'gas'
