import { categoryOf } from '../lib/categories'
import { getExpiryInfo } from '../lib/expiry'
import type { Item } from '../lib/types'
import { ExpiryBadge } from './ExpiryBadge'

interface Props {
  item: Item
  today: string
  addedBy?: string
  onClick: () => void
}

export function formatPrice(price: number | null): string {
  return price === null ? '' : `¥${price.toFixed(2).replace(/\.00$/, '')}`
}

export function ItemCard({ item, today, addedBy, onClick }: Props) {
  const info = getExpiryInfo(item.expiryDate, today)
  const cat = categoryOf(item.category)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full overflow-hidden rounded-[28px] bg-surface text-left shadow-[0_10px_0_0_rgba(28,20,12,0.12)] ring-2 ring-ink/10 transition active:translate-y-0.5 active:shadow-none"
    >
      <span className="w-3 shrink-0" style={{ background: info.color }} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 gap-3 p-3">
        {item.photo ? (
          <img src={item.photo} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-2 ring-ink/10" />
        ) : (
          <span
            className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl text-3xl font-black text-white"
            style={{ background: cat.swatch }}
            aria-hidden="true"
          >
            {item.name.slice(0, 1)}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 text-[20px] leading-tight font-black">{item.name}</span>
            {item.price !== null && <span className="shrink-0 text-base font-bold">{formatPrice(item.price)}</span>}
          </span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[13px] font-semibold text-white" style={{ background: cat.swatch }}>
            <span className="h-2 w-2 rounded-full bg-white" />
            {cat.name}
          </span>
          <ExpiryBadge info={info} />
          {item.location && <span className="truncate text-sm font-medium text-muted">放在 {item.location}</span>}
          <span className="text-[12px] font-semibold text-accent">
            点这里可以改或删{addedBy ? ` · ${addedBy} 记的` : ''}
          </span>
        </span>
      </span>
    </button>
  )
}
