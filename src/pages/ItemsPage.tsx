import type { ReactNode } from 'react'
import { ItemCard } from '../components/ItemCard'
import { Legend } from '../components/Legend'
import { daysUntil } from '../lib/expiry'
import type { Item } from '../lib/types'

interface Props {
  items: Item[]
  today: string
  loading: boolean
  memberNames?: Record<string, string>
  headerRight?: ReactNode
  notice?: ReactNode
  onAdd: () => void
  onEdit: (item: Item) => void
}

function sortByUrgency(items: Item[], today: string) {
  const key = (it: Item) => (it.expiryDate ? daysUntil(it.expiryDate, today) : Number.POSITIVE_INFINITY)
  return [...items].sort((a, b) => key(a) - key(b) || a.name.localeCompare(b.name, 'zh'))
}

export function ItemsPage({ items, today, loading, memberNames, headerRight, notice, onAdd, onEdit }: Props) {
  const sorted = sortByUrgency(items, today)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28">
      <header className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Remember Me</h1>
            <p className="text-[13px] text-muted">今天是 {today}，共 {items.length} 件</p>
          </div>
          {headerRight}
        </div>
      </header>

      {notice}

      <div className="mb-4">
        <Legend />
      </div>

      {loading ? (
        <p className="py-10 text-center text-muted">正在读取…</p>
      ) : sorted.length === 0 ? (
        <section className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
          <h2 className="text-lg font-semibold">还没有记下任何东西</h2>
          <p className="mt-1 text-sm text-muted">买了东西就点下面的「记一件」，名称、价格、放在哪、什么时候过期，一次写完。</p>
        </section>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {sorted.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                today={today}
                creatorName={item.createdBy ? memberNames?.[item.createdBy] : undefined}
                onClick={() => onEdit(item)}
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-lg active:scale-95"
      >
        + 记一件
      </button>
    </div>
  )
}
