// =====================================================================
// Ledgerline Analytics ・ Google Apps Script（サーバー側）
//
// 役割
//   - 画面（index.html：Vite でビルドした1ファイル）を配信する
//   - 共通の暗証番号でログインさせ、一時的なトークンを発行する
//   - 集計に必要な項目だけをスプレッドシートに保存・読み込みする
//
// 暗証番号は、プロジェクトの設定 › スクリプト プロパティ の「PIN」に入れる。
// コードには書かない（変更するときもコードを触らずに済む）。
//
// 守っていること
//   - 暗証番号の確認は必ずここ（サーバー）で行う
//   - データの読み込み・保存のたびにトークンを確認する
//   - 5回続けて間違えたら15分ロックする
//   - 画面から届いたデータは信用せず、形をチェックしてから保存する
//   - 氏名・住所・メールなどは受け取らない（注文は7項目だけ）
// =====================================================================

const SHEET_NAMES = {
  orders: 'orders',
  goaffpro: 'goaffpro_monthly',
  meta: 'meta',
}

const ORDER_HEADERS = [
  'orderId',
  'orderDate',
  'total',
  'refunded',
  'isCancelled',
  'purchaseType',
  'affiliate',
]
const GOAFFPRO_HEADERS = ['month', 'sales', 'revenue', 'commission']
const META_HEADERS = ['key', 'value']

const PURCHASE_TYPES = ['normal', 'subscription-first', 'subscription-recurring']

const TOKEN_TTL_SECONDS = 6 * 60 * 60 // ログインの有効時間：6時間
const LOCK_SECONDS = 15 * 60 // ロック時間：15分
const MAX_FAILS = 5 // 何回間違えたらロックするか
const MAX_ORDERS_PER_SAVE = 20000
const MAX_TEXT_LENGTH = 200

// ---------------------------------------------------------------------
// 画面の配信
// ---------------------------------------------------------------------

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Ledgerline Analytics')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

// ---------------------------------------------------------------------
// ログイン
// 画面に返すエラーは、先頭に [auth] などの印を付けて種類を伝える
// ---------------------------------------------------------------------

function login(pin) {
  const cache = CacheService.getScriptCache()
  const fails = Number(cache.get('login_fails') || 0)
  if (fails >= MAX_FAILS) {
    throw new Error('[locked] 間違いが続いたため、15分ほどお待ちください。')
  }

  const expected = PropertiesService.getScriptProperties().getProperty('PIN')
  if (!expected) {
    throw new Error('[setup] 暗証番号が設定されていません（スクリプト プロパティ「PIN」）。')
  }

  if (typeof pin !== 'string' || pin !== expected) {
    cache.put('login_fails', String(fails + 1), LOCK_SECONDS)
    Utilities.sleep(800) // 連続で試されにくくする
    const left = MAX_FAILS - (fails + 1)
    throw new Error(
      left > 0
        ? `[pin] 暗証番号が違います（あと${left}回でロックされます）。`
        : '[locked] 間違いが続いたため、15分ほどお待ちください。',
    )
  }

  cache.remove('login_fails')
  const token = Utilities.getUuid()
  cache.put('token_' + token, '1', TOKEN_TTL_SECONDS)
  return token
}

function logout(token) {
  if (typeof token === 'string') CacheService.getScriptCache().remove('token_' + token)
}

function requireAuth_(token) {
  const ok =
    typeof token === 'string' &&
    token.length > 0 &&
    CacheService.getScriptCache().get('token_' + token) === '1'
  if (!ok) throw new Error('[auth] ログインの有効期限が切れました。もう一度ログインしてください。')
}

// ---------------------------------------------------------------------
// 画面から呼ぶ関数（google.script.run から呼ばれる）
// ---------------------------------------------------------------------

/** 保存済みのデータをまとめて返す */
function loadAll(token) {
  requireAuth_(token)
  return readAll_()
}

/** 注文を保存する（同じ注文番号は新しい内容で上書き、なければ追加） */
function saveOrders(token, orders, fileName) {
  requireAuth_(token)
  const incoming = validateOrders_(orders)

  return withLock_(function () {
    const merged = mergeOrders_(readOrders_(), incoming)
    writeRows_(getSheet_(SHEET_NAMES.orders, ORDER_HEADERS), ORDER_HEADERS.length, merged.map(orderToRow_))
    writeMeta_({
      lastImportFileName: cleanText_(fileName) || '(ファイル名なし)',
      lastImportAt: new Date().toISOString(),
      lastImportOrderCount: String(incoming.length),
    })
    return readAll_()
  })
}

/** GoAffPro の月別データを保存する（同じ月は上書き） */
function saveGoAffProMonthly(token, rows) {
  requireAuth_(token)
  const incoming = validateMonthlyRows_(rows)

  return withLock_(function () {
    const merged = mergeMonthly_(readMonthly_(), incoming)
    writeRows_(
      getSheet_(SHEET_NAMES.goaffpro, GOAFFPRO_HEADERS),
      GOAFFPRO_HEADERS.length,
      merged.map(function (r) {
        return [r.month, r.sales, r.revenue, r.commission === null ? '' : r.commission]
      }),
    )
    return readAll_()
  })
}

// ---------------------------------------------------------------------
// 入力のチェック（画面から届いた値は信用しない）
// ---------------------------------------------------------------------

function validateOrders_(orders) {
  if (!Array.isArray(orders)) throw new Error('[data] 注文データの形が正しくありません。')
  if (orders.length === 0) throw new Error('[data] 保存する注文がありません。')
  if (orders.length > MAX_ORDERS_PER_SAVE) {
    throw new Error('[data] 一度に保存できるのは ' + MAX_ORDERS_PER_SAVE + ' 件までです。')
  }
  return orders.map(function (o, i) {
    const where = '[data] ' + (i + 1) + '件目の注文：'
    if (!o || typeof o !== 'object') throw new Error(where + '形が正しくありません。')
    if (typeof o.orderId !== 'string' || o.orderId === '' || o.orderId.length > 50) {
      throw new Error(where + '注文番号が正しくありません。')
    }
    if (!isDateString_(o.orderDate)) throw new Error(where + '注文日が正しくありません。')
    if (!isYen_(o.total) || !isYen_(o.refunded)) throw new Error(where + '金額が正しくありません。')
    if (typeof o.isCancelled !== 'boolean') throw new Error(where + 'キャンセルの値が正しくありません。')
    if (PURCHASE_TYPES.indexOf(o.purchaseType) === -1) {
      throw new Error(where + '購入タイプが正しくありません。')
    }
    if (o.affiliate !== null && (typeof o.affiliate !== 'string' || o.affiliate.length > MAX_TEXT_LENGTH)) {
      throw new Error(where + '紹介者名が正しくありません。')
    }
    // 決まった7項目だけを取り出す（ほかの項目が混ざっていても保存しない）
    return {
      orderId: o.orderId,
      orderDate: o.orderDate,
      total: o.total,
      refunded: o.refunded,
      isCancelled: o.isCancelled,
      purchaseType: o.purchaseType,
      affiliate: o.affiliate === null || o.affiliate.trim() === '' ? null : o.affiliate,
    }
  })
}

function validateMonthlyRows_(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 240) {
    throw new Error('[data] 月別データの形が正しくありません。')
  }
  return rows.map(function (r, i) {
    const where = '[data] ' + (i + 1) + '行目：'
    if (!r || typeof r !== 'object') throw new Error(where + '形が正しくありません。')
    if (typeof r.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)) {
      throw new Error(where + '月が正しくありません。')
    }
    if (!isCount_(r.sales) || !isYen_(r.revenue)) throw new Error(where + '数値が正しくありません。')
    if (r.commission !== null && !isFiniteNumber_(r.commission)) {
      throw new Error(where + 'コミッションが正しくありません。')
    }
    return { month: r.month, sales: r.sales, revenue: r.revenue, commission: r.commission }
  })
}

function isFiniteNumber_(v) {
  return typeof v === 'number' && isFinite(v)
}
function isYen_(v) {
  return isFiniteNumber_(v) && v >= 0 && v < 1e12
}
function isCount_(v) {
  return isFiniteNumber_(v) && v >= 0 && Math.floor(v) === v
}
function isDateString_(v) {
  return typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v)
}
function cleanText_(v) {
  return typeof v === 'string' ? v.slice(0, MAX_TEXT_LENGTH) : ''
}

// ---------------------------------------------------------------------
// まとめ方（同じ注文番号・同じ月は新しいほうで上書き）
// ---------------------------------------------------------------------

function mergeOrders_(existing, incoming) {
  const byId = {}
  existing.forEach(function (o) {
    byId[o.orderId] = o
  })
  incoming.forEach(function (o) {
    byId[o.orderId] = o
  })
  return Object.keys(byId)
    .map(function (id) {
      return byId[id]
    })
    .sort(function (a, b) {
      if (a.orderDate !== b.orderDate) return a.orderDate < b.orderDate ? -1 : 1
      return a.orderId < b.orderId ? -1 : a.orderId > b.orderId ? 1 : 0
    })
}

function mergeMonthly_(existing, incoming) {
  const byMonth = {}
  existing.concat(incoming).forEach(function (r) {
    byMonth[r.month] = r
  })
  return Object.keys(byMonth)
    .sort()
    .map(function (m) {
      return byMonth[m]
    })
}

// ---------------------------------------------------------------------
// スプレッドシートの読み書き
// ---------------------------------------------------------------------

function getSpreadsheet_() {
  // 別のスプレッドシートを使うときは、スクリプト プロパティ「SPREADSHEET_ID」に ID を入れる
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet()
}

/** シートを取り出す（なければ見出し付きで作る） */
function getSheet_(name, headers) {
  const ss = getSpreadsheet_()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold')
    sheet.setFrozenRows(1)
    // すべての列を「書式なしテキスト」に。日付の自動変換や、
    // 「=」で始まる文字が数式として動くのを防ぐ（数値・真偽値はそのまま入る）
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat('@')
  }
  return sheet
}

function readBody_(name, headers) {
  const sheet = getSheet_(name, headers)
  const last = sheet.getLastRow()
  if (last < 2) return []
  return sheet.getRange(2, 1, last - 1, headers.length).getValues()
}

/** 見出し以外をすべて書き換える */
function writeRows_(sheet, width, rows) {
  const last = sheet.getLastRow()
  if (last >= 2) sheet.getRange(2, 1, last - 1, width).clearContent()
  if (rows.length === 0) return
  const range = sheet.getRange(2, 1, rows.length, width)
  range.setNumberFormat('@')
  range.setValues(rows)
}

function orderToRow_(o) {
  return [
    o.orderId,
    o.orderDate,
    o.total,
    o.refunded,
    o.isCancelled,
    o.purchaseType,
    o.affiliate === null ? '' : o.affiliate,
  ]
}

function rowToOrder_(row) {
  return {
    orderId: String(row[0]),
    orderDate: toDateString_(row[1]),
    total: Number(row[2]) || 0,
    refunded: Number(row[3]) || 0,
    isCancelled: row[4] === true || String(row[4]).toUpperCase() === 'TRUE',
    purchaseType: PURCHASE_TYPES.indexOf(row[5]) === -1 ? 'normal' : row[5],
    affiliate: row[6] === '' || row[6] === null ? null : String(row[6]),
  }
}

/** シートで日付に変わってしまっていても '2026-09-30' の形に戻す */
function toDateString_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd')
  }
  return String(v)
}

function readOrders_() {
  return readBody_(SHEET_NAMES.orders, ORDER_HEADERS)
    .filter(function (row) {
      return row[0] !== ''
    })
    .map(rowToOrder_)
}

function readMonthly_() {
  return readBody_(SHEET_NAMES.goaffpro, GOAFFPRO_HEADERS)
    .filter(function (row) {
      return row[0] !== ''
    })
    .map(function (row) {
      return {
        month: String(row[0]),
        sales: Number(row[1]) || 0,
        revenue: Number(row[2]) || 0,
        commission: row[3] === '' ? null : Number(row[3]),
      }
    })
}

function readMeta_() {
  const meta = {}
  readBody_(SHEET_NAMES.meta, META_HEADERS).forEach(function (row) {
    if (row[0] !== '') meta[String(row[0])] = String(row[1])
  })
  return meta
}

function writeMeta_(updates) {
  const meta = readMeta_()
  Object.keys(updates).forEach(function (k) {
    meta[k] = updates[k]
  })
  writeRows_(
    getSheet_(SHEET_NAMES.meta, META_HEADERS),
    META_HEADERS.length,
    Object.keys(meta).map(function (k) {
      return [k, meta[k]]
    }),
  )
}

function readAll_() {
  const meta = readMeta_()
  return {
    orders: readOrders_(),
    goaffproMonthly: readMonthly_(),
    lastImport: meta.lastImportAt
      ? {
          fileName: meta.lastImportFileName || '',
          importedAt: meta.lastImportAt,
          orderCount: Number(meta.lastImportOrderCount) || 0,
        }
      : null,
  }
}

/** 同時に保存されてもデータが混ざらないよう、順番待ちにする */
function withLock_(fn) {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30 * 1000)) {
    throw new Error('[busy] ほかの方が保存中です。少し待ってからもう一度お試しください。')
  }
  try {
    return fn()
  } finally {
    lock.releaseLock()
  }
}
