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
      className="flex min-h-11 w-full overflow-hidden rounded-[var(--radius-card)] bg-surface text-left shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
    >
      {/* 过期紧急度色条：产品信息，保留细条 */}
      <span className="w-1 shrink-0" style={{ background: info.color }} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 gap-3 p-3">
        {item.photo ? (
          <img src={item.photo} alt="" className="h-24 w-24 shrink-0 rounded-[12px] object-cover" />
        ) : (
          <span
            className="grid h-24 w-24 shrink-0 place-items-center rounded-[12px] text-3xl font-bold text-white"
            style={{ background: cat.swatch }}
            aria-hidden="true"
          >
            {item.name.slice(0, 1)}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 text-[20px] leading-tight font-bold">{item.name}</span>
            {item.price !== null && <span className="shrink-0 text-base font-bold">{formatPrice(item.price)}</span>}
          </span>
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold text-white"
            style={{ background: cat.swatch }}
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            {cat.name}
          </span>
          <ExpiryBadge info={info} />
          {item.location && <span className="truncate text-[15px] font-medium text-muted">放在 {item.location}</span>}
          <span className="text-[13px] font-semibold text-accent-deep">
            点这里可以改或删{addedBy ? ` · ${addedBy} 记的` : ''}
          </span>
        </span>
      </span>
    </button>
  )
}
