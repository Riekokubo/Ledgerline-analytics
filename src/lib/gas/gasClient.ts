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

/** 'Error: [auth] 〜' のような文字から、種類と本文を取り出す */
export function parseGasError(raw: unknown): GasError {
  const text = raw instanceof Error ? raw.message : String(raw ?? '')
  const cleaned = text.replace(/^(Error|Exception):\s*/, '')
  const match = cleaned.match(/^\[(auth|pin|locked|setup|busy|data)\]\s*(.*)$/s)
  if (match) return new GasError(match[1] as GasErrorKind, match[2])
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
