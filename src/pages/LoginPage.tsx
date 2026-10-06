import { useState, type FormEvent } from 'react'

interface Props {
  nicknameHint?: string
  error?: string | null
  onNicknameLogin: (nickname: string) => Promise<void>
  onWechatLogin: () => Promise<void>
}

export function LoginPage({ nicknameHint = '', error, onNicknameLogin, onWechatLogin }: Props) {
  const [nickname, setNickname] = useState(nicknameHint)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setLocalError(null)
    try {
      await action()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '登录失败')
      setBusy(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => onNicknameLogin(nickname))
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
        <h2 className="text-xl font-black">先告诉我怎么称呼你</h2>
        <p className="mt-1 text-sm text-muted">比如妈妈、爸爸、小六的铲屎官。微信扫码登录开通后，会换成更方便的方式。</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            className="w-full rounded-2xl border-2 border-line bg-white px-3.5 py-3 outline-none focus:border-accent"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="你的称呼"
            autoFocus
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent py-3.5 text-lg font-black text-white disabled:opacity-50"
          >
            {busy ? '进入中…' : '进入小本子'}
          </button>
        </form>

        <div className="my-4 h-px bg-line" />

        <button
          type="button"
          disabled={busy}
          onClick={() => void run(onWechatLogin)}
          className="w-full rounded-full bg-[#07c160] py-3.5 text-lg font-black text-white disabled:opacity-50"
        >
          微信登录
        </button>
        <p className="mt-2 text-center text-[12px] text-muted">若提示未开通，先用上面的称呼进入；微信开好后再切过来。</p>

        {(localError || error) && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{localError || error}</p>
        )}
      </section>
    </div>
  )
}
