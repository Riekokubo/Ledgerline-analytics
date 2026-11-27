import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { APP_NAME } from '../config/app'

// GAS 版のログイン画面。暗証番号の確認はサーバー（gas/Code.js）で行う
type LoginPageProps = {
  /** 暗証番号を送る。間違っていれば例外を投げる */
  onLogin?: (pin: string) => Promise<void>
  /** ログイン後、データを読み込んでいる間 */
  loading?: boolean
  /** ログインが切れたときなどのお知らせ */
  notice?: string | null
}

export function LoginPage({ onLogin, loading = false, notice = null }: LoginPageProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!onLogin || pin === '' || isSending) return
    setError(null)
    setIsSending(true)
    try {
      await onLogin(pin)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインできませんでした。')
      setPin('')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="p-login">
      <div className="p-login__panel">
        <div className="p-login__logo">
          <span className="p-login__mark" aria-hidden="true">
            {APP_NAME.brand.charAt(0)}
          </span>
          <span className="p-login__wordmark">
            <strong>{APP_NAME.brand}</strong>
            <small>{APP_NAME.product}</small>
          </span>
        </div>

        {loading ? (
          <p className="p-login__loading" role="status">
            データを読み込んでいます…
          </p>
        ) : (
          <form className="p-login__form" onSubmit={handleSubmit}>
            <div>
              <h1 className="p-login__title">ログイン</h1>
              <p className="p-login__description">共有されている暗証番号を入力してください。</p>
            </div>

            {notice && !error && (
              <p className="c-alert c-alert--warning" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="c-alert c-alert--error" role="alert">
                {error}
              </p>
            )}

            <label className="c-field">
              暗証番号
              <input
                type="password"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
              />
            </label>

            <Button type="submit" variant="primary" disabled={pin === '' || isSending}>
              {isSending ? '確認しています…' : 'ログイン'}
            </Button>

            <p className="p-login__note">
              集計に必要な項目だけを保存しています。氏名・住所・メールなどは保存しません。
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
