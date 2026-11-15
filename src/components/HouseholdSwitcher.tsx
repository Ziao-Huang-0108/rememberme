import { useRef, useState, type FormEvent } from 'react'
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
  onRename: (householdId: string, name: string) => Promise<void>
  onRequestLeave: (household: Household) => void
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
  onRename,
  onRequestLeave,
}: Props) {
  const [mode, setMode] = useState<PanelMode>('list')
  const [houseName, setHouseName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingName = useRef(false)
  const openSession = open ? `${currentId}\0${nickname}` : ''
  const [session, setSession] = useState(openSession)
  if (session !== openSession) {
    setSession(openSession)
    if (open) {
      setMode('list')
      setHouseName('')
      setEditingId(null)
      setRenameDraft('')
      setRenameError(null)
      setCode('')
      setName(nickname)
      setBusy(false)
      setError(null)
    }
  }

  if (!open) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'create' && !houseName.trim()) {
      setError('请先给家里起个名字')
      return
    }
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

  async function saveRename(house: Household) {
    const trimmed = renameDraft.trim()
    if (trimmed === house.name) {
      setEditingId(null)
      setRenameError(null)
      return
    }
    if (!trimmed) {
      setRenameError('请先给家里起个名字')
      return
    }
    if (savingName.current) return
    savingName.current = true
    setRenameError(null)
    try {
      await onRename(house.id, trimmed)
      setEditingId(null)
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : '改名失败')
    } finally {
      savingName.current = false
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
                const editing = editingId === house.id
                return (
                  <li
                    key={house.id}
                    className={`rounded-[var(--radius-card)] px-3 py-2 ring-1 ${
                      selected ? 'bg-accent-soft ring-accent' : 'bg-surface ring-line'
                    }`}
                  >
                    <div className="flex min-h-14 items-center gap-2">
                      {editing ? (
                        <form
                          className="relative min-w-0 flex-1"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void saveRename(house)
                          }}
                        >
                          <input
                            className="field-input"
                            style={{ minHeight: '4rem', paddingRight: '6.5rem' }}
                            value={renameDraft}
                            onChange={(event) => setRenameDraft(event.target.value)}
                            onBlur={(event) => {
                              const next = event.relatedTarget
                              if (next instanceof HTMLElement && event.currentTarget.form?.contains(next)) return
                              void saveRename(house)
                            }}
                            aria-label={`${house.name}的名字`}
                            aria-invalid={renameError ? true : undefined}
                            enterKeyHint="done"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="btn-primary absolute top-1/2 right-2 z-10 -translate-y-1/2 whitespace-nowrap"
                            onPointerDown={(event) => {
                              event.preventDefault()
                            }}
                          >
                            保存
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(house)
                              onClose()
                            }}
                            className="min-h-11 min-w-0 flex-1 truncate px-1 text-left text-[17px] font-bold active:opacity-80"
                          >
                            {house.name}
                            {selected && (
                              <span className="ml-2 text-[14px] font-bold text-accent-deep">当前</span>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost shrink-0 px-3 text-[15px]"
                            onClick={() => {
                              setEditingId(house.id)
                              setRenameDraft(house.name)
                              setRenameError(null)
                            }}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="btn-ghost shrink-0 px-3 text-[15px]"
                            onClick={() => onRequestLeave(house)}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                    {editing && renameError && (
                      <p className="px-1 pb-1 text-[15px] text-red-700">{renameError}</p>
                    )}
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
                  placeholder="比如：我们家"
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
