import { useState, type FormEvent } from 'react'

interface Props {
  usernameHint?: string
  error?: string | null
  onSignIn: (username: string, password: string) => Promise<void>
}

const inputClass =
  'w-full rounded-2xl border-2 border-line bg-white px-3.5 py-3 outline-none focus:border-accent'

export function LoginPage({ usernameHint = '', error, onSignIn }: Props) {
  const [username, setUsername] = useState(usernameHint)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setLocalError(null)
    try {
      await onSignIn(username, password)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '失败了，请再试')
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-5 px-4 pb-10">
      <div className="flex items-center gap-3">
        <img src="/shiba.png" alt="小六" className="h-20 w-20 object-contain" />
        <div>
          <p className="text-sm font-bold text-accent">全家的物品小本子</p>
          <h1 className="brand-title text-[34px] leading-none">Remember Me</h1>
        </div>
      </div>

      <section className="rounded-[28px] bg-surface p-5 shadow-[0_8px_0_0_rgba(28,20,12,0.1)] ring-2 ring-ink/10">
        <h2 className="text-xl font-black">欢迎回家</h2>
        <p className="mt-1 text-sm text-muted">
          用控制台里建好的用户名和密码登录。新账号请在 CloudBase「用户管理」里添加。
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-black">用户名</span>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例如 mama"
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-black">密码</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-full bg-accent py-3.5 text-lg font-black text-white disabled:opacity-50"
          >
            {busy ? '请稍等…' : '登录'}
          </button>
        </form>

        {(localError || error) && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{localError || error}</p>
        )}
      </section>
    </div>
  )
}
