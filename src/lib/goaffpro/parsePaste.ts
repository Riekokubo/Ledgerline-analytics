// =====================================================================
// GoAffPro の画面からコピーした表を読み取る
// ブラウザで表をコピーすると、セルの区切りがタブ、行の区切りが改行の文字列になる。
// - Annual Report（月別）：Month / Sales / Revenue / Commission …
// - Leaderboard（紹介者別）：アフィリエイター名 / Sales / Revenue …
// =====================================================================

export type MonthlyRow = {
  /** '2026-09' の形 */
  month: string
  /** 紹介件数 */
  sales: number
  /** 紹介売上（円） */
  revenue: number
  commission: number | null
}

export type LeaderboardRow = {
  name: string
  sales: number
  revenue: number
}

export type PasteNote = { line: number; message: string }

export type PasteResult<T> =
  { ok: true; rows: T[]; notes: PasteNote[] } | { ok: false; error: string }

/** 1行をセルに分ける（タブがなければ、2つ以上続く空白で分ける） */
function splitCells(line: string): string[] {
  const cells = line.includes('\t') ? line.split('\t') : line.split(/\s{2,}/)
  return cells.map((cell) => cell.trim())
}

function toLines(text: string): { line: number; cells: string[] }[] {
  return text
    .split(/\r?\n/)
    .map((raw, index) => ({ line: index + 1, cells: splitCells(raw) }))
    .filter((row) => row.cells.some((cell) => cell !== ''))
}

/** '¥1,704,000' '20.28%' '1,231' などを数値にする */
export function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null
  const cleaned = value.replace(/[¥$,%\s]/g, '')
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  return Number(cleaned)
}

const MONTHS_EN = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

/** 'September' 'Sep' '9月' '9' → 9（読めなければ null） */
export function parseMonth(value: string): number | null {
  const v = value.trim().toLowerCase()
  const english = MONTHS_EN.findIndex((m) => m === v || m.slice(0, 3) === v)
  if (english !== -1) return english + 1
  const numeric = v.match(/^(\d{1,2})月?$/)
  if (numeric) {
    const n = Number(numeric[1])
    if (n >= 1 && n <= 12) return n
  }
  return null
}

const isTotalRow = (cell: string) => /^(total|合計)$/i.test(cell.trim())

/** 見出しの行から、指定した言葉を含む列の位置を探す */
function findColumn(header: string[], patterns: RegExp[]): number {
  return header.findIndex((cell) => patterns.some((p) => p.test(cell)))
}

export function parseAnnualReport(text: string, year: number): PasteResult<MonthlyRow> {
  const lines = toLines(text)
  if (lines.length === 0) return { ok: false, error: '貼り付けたデータが空です。' }

  // 見出しの行があれば、列の位置を見出しから決める
  let columns = { month: 0, sales: 1, revenue: 2, commission: 3 }
  let body = lines
  const header = lines[0].cells
  if (/^(month|月)$/i.test(header[0])) {
    columns = {
      month: 0,
      sales: findColumn(header, [/^sales$/i, /件数/]),
      revenue: findColumn(header, [/revenue/i, /売上/]),
      commission: findColumn(header, [/commission/i, /報酬|コミッション/]),
    }
    if (columns.sales === -1 || columns.revenue === -1) {
      return { ok: false, error: '見出しに Sales と Revenue の列が見つかりません。' }
    }
    body = lines.slice(1)
  }

  const rows: MonthlyRow[] = []
  const notes: PasteNote[] = []
  for (const { line, cells } of body) {
    if (isTotalRow(cells[0])) {
      notes.push({ line, message: '「Total」行は合計のため読み飛ばしました' })
      continue
    }
    const month = parseMonth(cells[columns.month] ?? '')
    const sales = parseNumber(cells[columns.sales])
    const revenue = parseNumber(cells[columns.revenue])
    if (month === null || sales === null || revenue === null) {
      notes.push({ line, message: `「${cells.join(' ')}」を読み取れませんでした` })
      continue
    }
    rows.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      sales,
      revenue,
      commission: columns.commission === -1 ? null : parseNumber(cells[columns.commission]),
    })
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error: '月別のデータを読み取れませんでした。表を見出しの行からコピーしてください。',
    }
  }
  return { ok: true, rows, notes }
}

export function parseLeaderboard(text: string): PasteResult<LeaderboardRow> {
  const lines = toLines(text)
  if (lines.length < 2) {
    return { ok: false, error: '見出しの行とデータの行を、両方含めてコピーしてください。' }
  }

  const header = lines[0].cells
  const columns = {
    name: findColumn(header, [/affiliate/i, /name/i, /名前|アフィリエイター|紹介者/]),
    sales: findColumn(header, [/^sales$/i, /件数/]),
    revenue: findColumn(header, [/revenue/i, /売上/]),
  }
  if (columns.name === -1 || columns.revenue === -1) {
    return {
      ok: false,
      error:
        '見出しに「名前（Affiliate / Name）」と「Revenue」の列が見つかりません。見出しの行も含めてコピーしてください。',
    }
  }

  const rows: LeaderboardRow[] = []
  const notes: PasteNote[] = []
  for (const { line, cells } of lines.slice(1)) {
    const name = (cells[columns.name] ?? '').trim()
    if (isTotalRow(name)) {
      notes.push({ line, message: '「Total」行は合計のため読み飛ばしました' })
      continue
    }
    const revenue = parseNumber(cells[columns.revenue])
    const sales = columns.sales === -1 ? 0 : parseNumber(cells[columns.sales])
    if (!name || revenue === null || sales === null) {
      notes.push({ line, message: `「${cells.join(' ')}」を読み取れませんでした` })
      continue
    }
    rows.push({ name, sales, revenue })
  }

  if (rows.length === 0) {
    return { ok: false, error: '紹介者別のデータを読み取れませんでした。' }
  }
  return { ok: true, rows, notes }
}
