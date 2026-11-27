import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GasError, gas, type StoredData } from '../lib/gas/gasClient'
import { LoginPage } from '../pages/LoginPage'
import { DataProvider, type RemoteStorage } from './DataProvider'
import { SessionContext } from './sessionContext'

// =====================================================================
// GAS 版の入口
//   ログイン画面 → 保存済みデータの読み込み → いつもの画面
// トークンはタブを閉じるまで sessionStorage に置く（再読み込みでログアウトしないように）。
// 使えない環境もあるので、読み書きは try/catch で包む。
// =====================================================================

const TOKEN_KEY = 'ledgerline-token'

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // 保存できなくても、メモリ上のトークンで動く
  }
}

type Phase =
  | { name: 'login'; message: string | null }
  | { name: 'loading'; token: string }
  | { name: 'ready'; token: string; initial: StoredData }

export function GasRoot({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = readToken()
    return saved ? { name: 'loading', token: saved } : { name: 'login', message: null }
  })

  const backToLogin = useCallback((message: string | null) => {
    writeToken(null)
    setPhase({ name: 'login', message })
  }, [])

  // ログインできたら、保存済みのデータを読み込む
  const loadingToken = phase.name === 'loading' ? phase.token : null
  useEffect(() => {
    if (!loadingToken) return
    let cancelled = false
    gas
      .loadAll(loadingToken)
      .then((initial) => {
        if (!cancelled) setPhase({ name: 'ready', token: loadingToken, initial })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        backToLogin(error instanceof GasError && error.kind === 'auth' ? null : messageOf(error))
      })
    return () => {
      cancelled = true
    }
  }, [loadingToken, backToLogin])

  async function handleLogin(pin: string) {
    const token = await gas.login(pin) // 間違っていれば例外 → LoginPage が表示する
    writeToken(token)
    setPhase({ name: 'loading', token })
  }

  const readyToken = phase.name === 'ready' ? phase.token : null

  // 保存の途中でログインが切れたら、ログイン画面に戻す
  const guard = useCallback(
    async <T,>(task: () => Promise<T>): Promise<T> => {
      try {
        return await task()
      } catch (error) {
        if (error instanceof GasError && error.kind === 'auth') backToLogin(error.message)
        throw error
      }
    },
    [backToLogin],
  )

  const session = useMemo(
    () => ({
      logout: () => {
        if (readyToken) gas.logout(readyToken).catch(() => {})
        backToLogin(null)
      },
    }),
    [readyToken, backToLogin],
  )

  if (phase.name === 'login') return <LoginPage onLogin={handleLogin} notice={phase.message} />
  if (phase.name === 'loading') return <LoginPage loading />

  const token = phase.token
  const remote: RemoteStorage = {
    initial: phase.initial,
    saveOrders: (orders, fileName) => guard(() => gas.saveOrders(token, orders, fileName)),
    saveGoAffProMonthly: (rows) => guard(() => gas.saveGoAffProMonthly(token, rows)),
  }

  return (
    <SessionContext.Provider value={session}>
      {/* key：ログインし直したら、画面の状態を最初から作り直す */}
      <DataProvider key={token} remote={remote}>
        {children}
      </DataProvider>
    </SessionContext.Provider>
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'データを読み込めませんでした。'
}
