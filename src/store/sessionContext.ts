import { createContext, useContext } from 'react'

// =====================================================================
// ログイン中の情報（GAS 版だけで使う）
// 公開デモでは Provider がないので、useSession() は null を返す。
// =====================================================================

export type SessionContextValue = {
  logout: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue | null {
  return useContext(SessionContext)
}
