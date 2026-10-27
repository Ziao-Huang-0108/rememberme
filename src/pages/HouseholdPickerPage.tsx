import type { Household } from '../lib/household'

interface Props {
  households: Household[]
  onSelect: (household: Household) => void
  onCreateNew: () => void
  onJoinNew: () => void
  onSignOut: () => Promise<void>
}

export function HouseholdPickerPage({ households, onSelect, onCreateNew, onJoinNew, onSignOut }: Props) {
  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">选一个家</h1>
          <p className="mt-1 text-[15px] text-muted">你加入了好几家，先选今天要看哪一家。</p>
        </div>
        <button type="button" onClick={() => void onSignOut()} className="btn-ghost shrink-0 px-3 text-[15px] text-muted">
          退出登录
        </button>
      </header>

      <ul className="flex flex-col gap-3">
        {households.map((house) => (
          <li key={house.id}>
            <button
              type="button"
              onClick={() => onSelect(house)}
              className="flex min-h-14 w-full items-center justify-between rounded-[var(--radius-card)] bg-surface px-5 py-4 text-left shadow-[var(--shadow-soft)] ring-1 ring-line transition active:opacity-80"
            >
              <span className="text-[18px] font-bold text-ink">{house.name}</span>
              <span className="text-[15px] font-bold text-accent-deep">进入</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-col gap-3">
        <button type="button" onClick={onCreateNew} className="btn-primary w-full">
          新建一家
        </button>
        <button type="button" onClick={onJoinNew} className="btn-ghost w-full min-h-12 ring-1 ring-line">
          用邀请码再加一家
        </button>
      </div>
    </div>
  )
}
