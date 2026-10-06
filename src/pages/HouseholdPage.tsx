import { useState, type FormEvent } from 'react'
import type { Household } from '../lib/household'

interface Props {
  nickname: string
  onCreate: (name: string, nickname: string) => Promise<void>
  onJoin: (code: string, nickname: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function HouseholdPage({ nickname, onCreate, onJoin, onSignOut }: Props) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [houseName, setHouseName] = useState('我们家')
  const [code, setCode] = useState('')
  const [name, setName] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'create') await onCreate(houseName, name)
      else await onJoin(code, name)
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败了，请再试')
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">加入家庭</h1>
        <button type="button" onClick={() => void onSignOut()} className="text-sm font-bold text-muted">
          退出登录
        </button>
      </header>

      <div className="chip-row">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`rounded-full px-4 py-2 text-sm font-black ring-2 ${mode === 'create' ? 'bg-accent text-white ring-ink/20' : 'bg-surface ring-ink/10'}`}
        >
          我来创建
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`rounded-full px-4 py-2 text-sm font-black ring-2 ${mode === 'join' ? 'bg-accent text-white ring-ink/20' : 'bg-surface ring-ink/10'}`}
        >
          我有邀请码
        </button>
      </div>

      <form onSubmit={submit} className="rounded-[28px] bg-surface p-5 ring-2 ring-ink/10">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-black">你的称呼</span>
          <input
            className="rounded-2xl border-2 border-line px-3.5 py-3 outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        {mode === 'create' ? (
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-black">家庭名字</span>
            <input
              className="rounded-2xl border-2 border-line px-3.5 py-3 outline-none focus:border-accent"
              value={houseName}
              onChange={(e) => setHouseName(e.target.value)}
              placeholder="我们家"
            />
          </label>
        ) : (
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-black">邀请码</span>
            <input
              className="rounded-2xl border-2 border-line px-3.5 py-3 tracking-[0.2em] uppercase outline-none focus:border-accent"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="六位邀请码"
              required
            />
          </label>
        )}

        {error && <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-accent py-3.5 text-lg font-black text-white disabled:opacity-50"
        >
          {busy ? '处理中…' : mode === 'create' ? '创建家庭' : '加入家庭'}
        </button>
      </form>
    </div>
  )
}

export function InviteBanner({ household }: { household: Household }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mb-3 rounded-[24px] bg-accent-soft px-4 py-3 text-sm ring-2 ring-accent/20">
      <p className="font-black">{household.name}</p>
      <p className="mt-0.5 text-muted">
        邀请码 <span className="font-black tracking-widest text-accent">{household.inviteCode}</span>
        ，发给家人就能一起记。
      </p>
      <button
        type="button"
        className="mt-2 font-bold text-accent underline"
        onClick={async () => {
          await navigator.clipboard.writeText(household.inviteCode)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? '已复制' : '复制邀请码'}
      </button>
    </div>
  )
}
