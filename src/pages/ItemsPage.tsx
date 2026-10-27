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
  householdName?: string
  headerAction?: ReactNode
  notice?: ReactNode
  onOpenHouseholdSwitcher?: () => void
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
      className={`touch-chip shrink-0 ring-1 transition ${
        selected ? 'text-white ring-transparent' : 'bg-surface text-ink ring-line'
      } disabled:opacity-50`}
      style={selected ? { background: color ?? 'var(--color-accent)' } : undefined}
    >
      {children}
    </button>
  )
}

function matchesQuery(item: Item, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [item.name, item.location, item.note, item.description].join('\n').toLowerCase()
  return hay.includes(q)
}

export function ItemsPage({
  items,
  today,
  loading,
  error,
  memberNames,
  householdName,
  headerAction,
  notice,
  onOpenHouseholdSwitcher,
  onAdd,
  onEdit,
}: Props) {
  const [sort, setSort] = useState<SortKey>('near')
  const [level, setLevel] = useState<ExpiryLevel | 'all'>('all')
  const [category, setCategory] = useState<string>('all')
  const [uploader, setUploader] = useState<string>('all')
  const [query, setQuery] = useState('')
  const memberEntries = Object.entries(memberNames ?? {})

  const visible = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!matchesQuery(item, query)) return false
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
  }, [items, today, sort, level, category, uploader, query])

  const hasQuery = query.trim().length > 0

  return (
    <div className="relative z-10 mx-auto min-h-dvh w-full max-w-xl px-4 pb-[calc(112px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 -mx-4 bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShibaMascot />
            <div className="min-w-0">
              <p className="text-[13px] font-bold tracking-wide text-accent-deep">全家的物品小本子 · 小六守门</p>
              <h1 className="brand-title text-[30px] leading-none">Remember Me</h1>
              <p className="mt-1 text-[13px] font-medium text-muted">
                今天 {today} · {items.length} 件
              </p>
            </div>
          </div>
          {headerAction}
        </div>
        {householdName && onOpenHouseholdSwitcher && (
          <button
            type="button"
            onClick={onOpenHouseholdSwitcher}
            className="mt-3 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-pill)] bg-accent-soft px-4 text-left ring-1 ring-accent/40 transition active:opacity-80"
          >
            <span className="truncate text-[15px] font-bold text-ink">
              当前：{householdName}
            </span>
            <span className="shrink-0 text-[14px] font-bold text-accent-deep">切换</span>
          </button>
        )}
      </header>

      {notice}

      <div className="mb-3">
        <Legend />
      </div>

      <label className="mb-4 flex flex-col gap-2">
        <span className="text-[15px] font-bold">搜索物品</span>
        <input
          className="field-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名称、位置、备注…"
          enterKeyHint="search"
        />
      </label>

      <section className="mb-6 flex flex-col gap-3">
        <p className="text-[15px] font-bold">怎么排</p>
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
        <p className="text-[15px] font-bold">过期情况</p>
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
        <p className="text-[15px] font-bold">类别</p>
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
        <p className="text-[15px] font-bold">谁记的</p>
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

      {error && <p className="mb-4 rounded-[var(--radius-card)] bg-red-50 p-4 font-medium text-red-800">{error}</p>}

      {loading ? (
        <p className="py-10 text-center font-medium text-muted">正在读取…</p>
      ) : items.length === 0 ? (
        <section className="rounded-[var(--radius-card)] bg-surface px-5 py-8 text-center shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-bold">本子还是空的</h2>
          <p className="mt-2 text-[16px] text-muted">买了东西就点下面的大按钮。以后写错了，点卡片就能改、能删。</p>
        </section>
      ) : visible.length === 0 ? (
        <section className="rounded-[var(--radius-card)] bg-surface px-5 py-8 text-center shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-bold">{hasQuery ? '没找到相关物品' : '没有符合条件的东西'}</h2>
          <p className="mt-1 text-[16px] text-muted">
            {hasQuery ? '换个关键词，或清空搜索再看看。' : '换一个筛选条件，或点「全部」再看看。'}
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
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

      {/* 底部居中「记一件」，左侧留给音乐控件 */}
      <button
        type="button"
        onClick={onAdd}
        className="btn-primary fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 px-8 text-[18px] shadow-[var(--shadow-soft)]"
      >
        + 记一件
      </button>
    </div>
  )
}
