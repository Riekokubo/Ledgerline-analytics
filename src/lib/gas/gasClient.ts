// =====================================================================
// Google Apps Script（gas/Code.js）の関数を呼ぶための窓口
// google.script.run はコールバック形式なので、Promise（await できる形）に包む。
// =====================================================================

import type { MonthlyRow } from '../goaffpro/parsePaste'
import type { Order } from '../../types/domain'

/** スプレッドシートに保存されているデータ */
export type StoredData = {
  orders: Order[]
  goaffproMonthly: MonthlyRow[]
  lastImport: { fileName: string; importedAt: string; orderCount: number } | null
}

/** GAS から返るエラーの種類（Code.js でメッセージの先頭に [auth] などを付けている） */
export type GasErrorKind = 'auth' | 'pin' | 'locked' | 'setup' | 'busy' | 'data' | 'unknown'

export class GasError extends Error {
  kind: GasErrorKind
  constructor(kind: GasErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

/** GAS から返ったエラーを文字にする（Error 以外の形で届くこともある） */
function errorText(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'message' in raw) return String(raw.message)
  return String(raw ?? '')
}

/**
 * 'Error: [auth] 〜' 'ScriptError: Exception: [pin] 〜' のような文字から、種類と本文を取り出す。
 * 先頭に付く文字は環境によって違うので、[auth] などの印を文中から探す
 */
export function parseGasError(raw: unknown): GasError {
  const match = errorText(raw).match(/\[(auth|pin|locked|setup|busy|data)\]\s*([\s\S]*)$/)
  if (match) return new GasError(match[1] as GasErrorKind, match[2].trim())
  console.error('Ledgerline: GAS error', raw) // 想定外のエラーは原因を調べられるよう残す
  return new GasError('unknown', '通信に失敗しました。時間をおいてもう一度お試しください。')
}

type ScriptRun = {
  withSuccessHandler(fn: (value: unknown) => void): ScriptRun
  withFailureHandler(fn: (error: unknown) => void): ScriptRun
} & Record<string, (...args: unknown[]) => void>

declare global {
  interface Window {
    google?: { script?: { run?: ScriptRun } }
  }
}

function call<T>(name: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = window.google?.script?.run
    if (!run) {
      reject(new GasError('setup', 'Google Apps Script の外では保存できません。'))
      return
    }
    run
      .withSuccessHandler((value) => resolve(value as T))
      .withFailureHandler((error) => reject(parseGasError(error)))
      [name](...args)
  })
}

export const gas = {
  login: (pin: string) => call<string>('login', pin),
  logout: (token: string) => call<void>('logout', token),
  loadAll: (token: string) => call<StoredData>('loadAll', token),
  saveOrders: (token: string, orders: Order[], fileName: string) =>
    call<StoredData>('saveOrders', token, orders, fileName),
  saveGoAffProMonthly: (token: string, rows: MonthlyRow[]) =>
    call<StoredData>('saveGoAffProMonthly', token, rows),
}
