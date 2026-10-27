import { useEffect, useState, type FormEvent } from 'react'
import type { Household } from '../lib/household'

interface Props {
  open: boolean
  households: Household[]
  currentId: string
  nickname: string
  onClose: () => void
  onSelect: (household: Household) => void
  onCreate: (name: string, nickname: string) => Promise<void>
  onJoin: (code: string, nickname: string) => Promise<void>
}

type PanelMode = 'list' | 'create' | 'join'

export function HouseholdSwitcher({
  open,
  households,
  currentId,
  nickname,
  onClose,
  onSelect,
  onCreate,
  onJoin,
}: Props) {
  const [mode, setMode] = useState<PanelMode>('list')
  const [houseName, setHouseName] = useState('我们家')
  const [code, setCode] = useState('')
  const [name, setName] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('list')
    setHouseName('我们家')
    setCode('')
    setName(nickname)
    setBusy(false)
    setError(null)
  }, [open, nickname])

  if (!open) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'create') await onCreate(houseName, name)
      else if (mode === 'join') await onJoin(code, name)
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败了，请再试')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-bg px-4 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {mode === 'list' ? '切换家庭' : mode === 'create' ? '新建一家' : '用邀请码加入'}
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost min-h-11 px-3 text-[15px]">
            关闭
          </button>
        </div>

        {mode === 'list' ? (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {households.map((house) => {
                const selected = house.id === currentId
                return (
                  <li key={house.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(house)
                        onClose()
                      }}
                      className={`flex min-h-14 w-full items-center justify-between rounded-[var(--radius-card)] px-4 py-3 text-left ring-1 transition active:opacity-80 ${
                        selected ? 'bg-accent-soft ring-accent text-ink' : 'bg-surface ring-line'
                      }`}
                    >
                      <span className="text-[17px] font-bold">{house.name}</span>
                      {selected && <span className="text-[14px] font-bold text-accent-deep">当前</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <button type="button" onClick={() => setMode('create')} className="btn-primary w-full">
              新建一家
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="btn-ghost w-full min-h-12 ring-1 ring-line"
            >
              用邀请码再加一家
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                setMode('list')
                setError(null)
              }}
              className="self-start min-h-11 font-bold text-accent-deep underline"
            >
              返回列表
            </button>
            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold">你的称呼</span>
              <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            {mode === 'create' ? (
              <label className="flex flex-col gap-2">
                <span className="text-[15px] font-bold">家庭名字</span>
                <input
                  className="field-input"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="我们家"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-2">
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
            {error && (
              <p className="rounded-[var(--radius-card)] bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? '处理中…' : mode === 'create' ? '创建并进入' : '加入并进入'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
