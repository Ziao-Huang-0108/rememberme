import { useMemo, useRef, useState, type FormEvent } from 'react'
import { matchRememberedUsernames } from '../lib/rememberedUsernames'

interface Props {
  usernameHint?: string
  error?: string | null
  onSignIn: (username: string, password: string) => Promise<void>
}

export function LoginPage({ usernameHint = '', error, onSignIn }: Props) {
  const [username, setUsername] = useState(usernameHint)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => matchRememberedUsernames(username), [username])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setLocalError(null)
    setShowSuggestions(false)
    try {
      await onSignIn(username, password)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '失败了，请再试')
      setBusy(false)
    }
  }

  function pickUsername(name: string) {
    setUsername(name)
    setShowSuggestions(false)
    passwordRef.current?.focus()
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <img src="/shiba.png" alt="小六" className="h-20 w-20 object-contain" />
        <div>
          <p className="text-[14px] font-bold text-accent-deep">全家的物品小本子</p>
          <h1 className="brand-title text-[34px] leading-none">Remember Me</h1>
        </div>
      </div>

      <section className="rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-bold">欢迎回家</h2>
        <p className="mt-2 text-[15px] text-muted">
          用控制台里建好的用户名和密码登录。密码可交给浏览器保存；本站只记住本机用过的用户名，方便少打字。
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" autoComplete="on">
          <label className="relative flex flex-col gap-2">
            <span className="text-[15px] font-bold">用户名</span>
            <input
              className="field-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 150)
              }}
              placeholder="例如 mama"
              name="username"
              autoComplete="username"
              autoFocus
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="min-h-11 w-full px-4 py-3 text-left text-[16px] font-bold active:bg-accent-soft"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickUsername(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">密码</span>
            <input
              ref={passwordRef}
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={busy} className="btn-primary mt-1 w-full">
            {busy ? '请稍等…' : '登录'}
          </button>
        </form>

        {(localError || error) && (
          <p className="mt-4 rounded-[var(--radius-card)] bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">{localError || error}</p>
        )}
      </section>
    </div>
  )
}
