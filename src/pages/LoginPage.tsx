import { useState, type FormEvent } from 'react'

interface Props {
  usernameHint?: string
  error?: string | null
  onSignIn: (username: string, password: string) => Promise<void>
  onSignUp: (username: string, password: string, nickname: string) => Promise<void>
}

const inputClass =
  'w-full rounded-2xl border-2 border-line bg-white px-3.5 py-3 outline-none focus:border-accent'

export function LoginPage({ usernameHint = '', error, onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState(usernameHint)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setLocalError(null)
    try {
      await action()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '失败了，请再试')
      setBusy(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'login') {
      void run(() => onSignIn(username, password))
      return
    }
    if (password !== password2) {
      setLocalError('两次输入的密码不一样')
      return
    }
    void run(() => onSignUp(username, password, nickname || username))
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
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2 text-sm font-black ring-2 ${mode === 'login' ? 'bg-accent text-white ring-ink/20' : 'bg-white ring-ink/10'}`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full py-2 text-sm font-black ring-2 ${mode === 'register' ? 'bg-accent text-white ring-ink/20' : 'bg-white ring-ink/10'}`}
          >
            注册
          </button>
        </div>

        <h2 className="text-xl font-black">{mode === 'login' ? '欢迎回家' : '给自己建一个账号'}</h2>
        <p className="mt-1 text-sm text-muted">
          {mode === 'login'
            ? '用用户名和密码登录，家人各自用自己的账号。'
            : '用户名用英文（例如 mama），称呼可以写中文（例如妈妈）。若注册被腾讯云拦住，就在控制台手动添加用户。'}
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

          {mode === 'register' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-black">称呼</span>
              <input
                className={inputClass}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如 妈妈（可填中文）"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-black">密码</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {mode === 'register' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-black">再输入一次密码</span>
              <input
                type="password"
                className={inputClass}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-full bg-accent py-3.5 text-lg font-black text-white disabled:opacity-50"
          >
            {busy ? '请稍等…' : mode === 'login' ? '登录' : '注册并进入'}
          </button>
        </form>

        {(localError || error) && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{localError || error}</p>
        )}
      </section>
    </div>
  )
}
