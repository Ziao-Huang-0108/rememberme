import { useState } from 'react'
import { categoryOf } from '../lib/categories'
import { getExpiryInfo } from '../lib/expiry'
import type { Place } from '../lib/places'
import type { Item } from '../lib/types'
import { ExpiryBadge } from './ExpiryBadge'
import { PhotoPreview } from './PhotoPreview'
import { PlaceThumb } from './PlaceThumb'

interface Props {
  item: Item
  today: string
  placesById?: Record<string, Place>
  addedBy?: string
  onClick: () => void
}

export function formatPrice(price: number | null): string {
  return price === null ? '' : `¥${price.toFixed(2).replace(/\.00$/, '')}`
}

export function ItemCard({ item, today, placesById, addedBy, onClick }: Props) {
  const info = getExpiryInfo(item.expiryDate, today)
  const cat = categoryOf(item.category)
  const place = item.placeId ? placesById?.[item.placeId] : undefined
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div
        className="flex min-h-11 w-full overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-soft)]"
        style={{ border: `2px solid ${info.color}` }}
      >
        <span className="flex min-w-0 flex-1 gap-3 p-3">
          {item.photo ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="h-24 w-24 shrink-0 overflow-hidden rounded-[12px] ring-1 ring-line/80"
              aria-label={`预览「${item.name}」的照片`}
            >
              <img src={item.photo} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span
              className="grid h-24 w-24 shrink-0 place-items-center rounded-[12px] text-3xl font-bold text-white"
              style={{ background: cat.swatch }}
              aria-hidden="true"
            >
              {item.name.slice(0, 1)}
            </span>
          )}
          <button
            type="button"
            onClick={onClick}
            className="flex min-w-0 flex-1 flex-col gap-1.5 text-left transition active:opacity-90"
          >
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
            {(place || item.location) && (
              <span className="min-w-0">
                <PlaceThumb place={place} fallbackLabel={item.location} />
              </span>
            )}
            <span className="text-[13px] font-semibold text-accent-deep">
              点这里可以改或删{addedBy ? ` · ${addedBy} 记的` : ''}
            </span>
          </button>
        </span>
      </div>
      {item.photo && (
        <PhotoPreview src={item.photo} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  )
}
