import { getExpiryInfo } from '../lib/expiry'
import type { Item } from '../lib/types'

interface Props {
  item: Item
  today: string
  addedBy?: string
  onClick: () => void
}

export function formatPrice(price: number | null): string {
  return price === null ? '' : `¥${price.toFixed(2).replace(/\.00$/, '')}`
}

export default function ItemCard({ item, today, addedBy, onClick }: Props) {
  const info = getExpiryInfo(item.expiryDate, today)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-sm transition active:scale-[0.99]"
    >
      <span className="w-2 shrink-0" style={{ background: info.color }} aria-hidden="true" />
      {item.photo && <img src={item.photo} alt="" className="h-auto w-20 shrink-0 object-cover" />}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-lg font-semibold">{item.name}</span>
          {item.price !== null && <span className="shrink-0 text-muted">{formatPrice(item.price)}</span>}
        </span>
        <span
          className="self-start rounded-full px-2.5 py-0.5 text-sm font-medium"
          style={{ background: info.color, color: info.textColor }}
        >
          {info.label}
        </span>
        {item.description && <span className="line-clamp-2 text-sm text-muted">{item.description}</span>}
        <span className="flex flex-wrap gap-x-3 text-sm text-muted">
          {item.location && <span>放在：{item.location}</span>}
          {addedBy && <span>{addedBy} 添加</span>}
        </span>
      </span>
    </button>
  )
}
