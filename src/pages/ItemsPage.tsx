import { useMemo, useState, type ReactNode } from 'react'
import { ItemCard } from '../components/ItemCard'
import { Legend } from '../components/Legend'
import { ShibaMascot } from '../components/ShibaMascot'
import { CATEGORIES } from '../lib/categories'
import { LEVELS, daysUntil, getExpiryInfo, levelSwatch, type ExpiryLevel } from '../lib/expiry'
import type { Item } from '../lib/types'

interface Props {
  items: Item[]
  today: string
  loading: boolean
  error: string | null
  memberNames?: Record<string, string>
  headerAction?: ReactNode
  notice?: ReactNode
  onAdd: () => void
  onEdit: (item: Item) => void
}

type SortKey = 'near' | 'far' | 'newest'

function Chip({
  selected,
  onClick,
  children,
  disabled,
  color,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  color?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold ring-2 transition ${
        selected ? 'text-white ring-ink/20' : 'bg-surface text-ink ring-ink/10'
      } disabled:opacity-50`}
      style={selected ? { background: color ?? '#e25c2b' } : undefined}
    >
      {children}
    </button>
  )
}

export function ItemsPage({ items, today, loading, error, memberNames, headerAction, notice, onAdd, onEdit }: Props) {
  const [sort, setSort] = useState<SortKey>('near')
  const [level, setLevel] = useState<ExpiryLevel | 'all'>('all')
  const [category, setCategory] = useState<string>('all')
  const [uploader, setUploader] = useState<string>('all')
  const memberEntries = Object.entries(memberNames ?? {})

  const visible = useMemo(() => {
    const filtered = items.filter((item) => {
      const info = getExpiryInfo(item.expiryDate, today)
      if (level !== 'all' && info.level !== level) return false
      if (category !== 'all' && item.category !== category) return false
      if (uploader !== 'all' && item.createdBy !== uploader) return false
      return true
    })
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt)
      const da = a.expiryDate ? daysUntil(a.expiryDate, today) : Number.POSITIVE_INFINITY
      const db = b.expiryDate ? daysUntil(b.expiryDate, today) : Number.POSITIVE_INFINITY
      return sort === 'near' ? da - db : db - da
    })
    return copy
  }, [items, today, sort, level, category, uploader])

  return (
    <div className="relative z-10 mx-auto min-h-dvh w-full max-w-xl px-4 pb-32">
      <header className="sticky top-0 z-20 -mx-4 bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3 pr-24">
          <div className="flex items-center gap-2.5">
            <ShibaMascot />
            <div>
              <p className="text-[13px] font-bold tracking-wide text-accent">全家的物品小本子 · 小六守门</p>
              <h1 className="brand-title text-[30px] leading-none">Remember Me</h1>
              <p className="mt-1 text-[13px] font-medium text-muted">
                今天 {today} · {items.length} 件
              </p>
            </div>
          </div>
          {headerAction}
        </div>
      </header>

      {notice}

      <div className="mb-3">
        <Legend />
      </div>

      <section className="mb-4 flex flex-col gap-2">
        <p className="text-[13px] font-black">怎么排</p>
        <div className="chip-row">
          <Chip selected={sort === 'near'} onClick={() => setSort('near')}>
            过期近 → 远
          </Chip>
          <Chip selected={sort === 'far'} onClick={() => setSort('far')}>
            过期远 → 近
          </Chip>
          <Chip selected={sort === 'newest'} onClick={() => setSort('newest')}>
            最近记下
          </Chip>
        </div>
        <p className="text-[13px] font-black">过期情况</p>
        <div className="chip-row">
          <Chip selected={level === 'all'} onClick={() => setLevel('all')}>
            全部
          </Chip>
          {LEVELS.map((row) => (
            <Chip key={row.level} selected={level === row.level} color={levelSwatch(row.level)} onClick={() => setLevel(row.level)}>
              {row.name}
            </Chip>
          ))}
        </div>
        <p className="text-[13px] font-black">类别</p>
        <div className="chip-row">
          <Chip selected={category === 'all'} onClick={() => setCategory('all')}>
            全部
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} selected={category === c.id} color={c.swatch} onClick={() => setCategory(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <p className="text-[13px] font-black">谁记的</p>
        <div className="chip-row">
          <Chip selected={uploader === 'all'} onClick={() => setUploader('all')}>
            全部人
          </Chip>
          {memberEntries.length === 0 ? (
            <Chip selected={false} disabled onClick={() => undefined}>
              登录家庭后可选
            </Chip>
          ) : (
            memberEntries.map(([id, name]) => (
              <Chip key={id} selected={uploader === id} onClick={() => setUploader(id)}>
                {name}
              </Chip>
            ))
          )}
        </div>
      </section>

      {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 font-medium text-red-800">{error}</p>}

      {loading ? (
        <p className="py-10 text-center font-medium text-muted">正在读取…</p>
      ) : items.length === 0 ? (
        <section className="rounded-[28px] bg-surface px-5 py-8 text-center shadow-[0_8px_0_0_rgba(28,20,12,0.1)] ring-2 ring-ink/10">
          <h2 className="text-xl font-black">本子还是空的</h2>
          <p className="mt-2 text-muted">买了东西就点下面的大按钮。以后写错了，点卡片就能改、能删。</p>
        </section>
      ) : visible.length === 0 ? (
        <section className="rounded-[28px] bg-surface px-5 py-8 text-center ring-2 ring-ink/10">
          <h2 className="text-lg font-black">没有符合条件的东西</h2>
          <p className="mt-1 text-muted">换一个筛选条件，或点「全部」再看看。</p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {visible.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                today={today}
                addedBy={item.createdBy ? memberNames?.[item.createdBy] : undefined}
                onClick={() => onEdit(item)}
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-accent px-8 py-4 text-lg font-black text-white shadow-[0_6px_0_0_#9a3412] ring-2 ring-ink/20 active:translate-y-0.5 active:shadow-none"
      >
        + 记一件
      </button>
    </div>
  )
}
