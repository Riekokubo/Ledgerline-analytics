/**
 * CSS カスタムプロパティ（デザイントークン）の値を JavaScript で読み取る。
 * Recharts のように色を JavaScript で渡す部品でも、_tokens.scss と同じ色を使うため。
 */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}
