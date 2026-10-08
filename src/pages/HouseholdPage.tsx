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
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">加入家庭</h1>
        <button type="button" onClick={() => void onSignOut()} className="btn-ghost px-3 text-[15px] text-muted">
          退出登录
        </button>
      </header>

      <div className="chip-row">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`touch-chip ring-1 ${mode === 'create' ? 'bg-accent text-white ring-transparent' : 'bg-surface ring-line'}`}
        >
          我来创建
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`touch-chip ring-1 ${mode === 'join' ? 'bg-accent text-white ring-transparent' : 'bg-surface ring-line'}`}
        >
          我有邀请码
        </button>
      </div>

      <form onSubmit={submit} className="rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-soft)]">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">你的称呼</span>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        {mode === 'create' ? (
          <label className="mt-4 flex flex-col gap-2">
            <span className="text-[15px] font-bold">家庭名字</span>
            <input
              className="field-input"
              value={houseName}
              onChange={(e) => setHouseName(e.target.value)}
              placeholder="我们家"
            />
          </label>
        ) : (
          <label className="mt-4 flex flex-col gap-2">
            <span className="text-[15px] font-bold">邀请码</span>
            <input
              className="field-input tracking-[0.2em] uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="六位邀请码"
              required
            />
          </label>
        )}

        {error && <p className="mt-4 rounded-[var(--radius-card)] bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? '处理中…' : mode === 'create' ? '创建家庭' : '加入家庭'}
        </button>
      </form>
    </div>
  )
}

export function InviteBanner({ household }: { household: Household }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mb-3 rounded-[var(--radius-card)] bg-accent-soft px-4 py-3 text-[15px] shadow-[var(--shadow-soft)]">
      <p className="font-bold">{household.name}</p>
      <p className="mt-1 text-muted">
        邀请码 <span className="font-bold tracking-widest text-accent-deep">{household.inviteCode}</span>
        ，发给家人就能一起记。
      </p>
      <button
        type="button"
        className="mt-2 min-h-11 font-bold text-accent-deep underline"
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
