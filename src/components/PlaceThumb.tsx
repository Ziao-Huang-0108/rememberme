import { useState } from 'react'
import { placeIconCandidates, placeIconOf } from '../lib/placeIcons'
import type { Place } from '../lib/places'

interface Props {
  place?: Pick<Place, 'label' | 'icon' | 'photo'> | null
  /** 没有关联位置时，用纯文字兜底 */
  fallbackLabel?: string
  size?: 'sm' | 'md'
}

export function PlaceThumb({ place, fallbackLabel, size = 'sm' }: Props) {
  const label = place?.label || fallbackLabel || ''
  if (!label) return null

  const box = size === 'md' ? 'h-10 w-10 text-[13px]' : 'h-8 w-8 text-[11px]'
  const icon = placeIconOf(place?.icon)
  const candidates = place ? placeIconCandidates(place.icon) : []
  const [srcIndex, setSrcIndex] = useState(0)
  const [imgFailed, setImgFailed] = useState(!place)

  if (place?.photo) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <img src={place.photo} alt="" className={`${box} shrink-0 rounded-[8px] object-cover`} />
        <span className="truncate text-[15px] font-medium text-ink">{label}</span>
      </span>
    )
  }

  const src = !imgFailed && candidates[srcIndex] ? candidates[srcIndex] : null

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {src ? (
        <img
          src={src}
          alt=""
          className={`${box} shrink-0 rounded-[8px] object-contain`}
          onError={() => {
            if (srcIndex + 1 < candidates.length) setSrcIndex((i) => i + 1)
            else setImgFailed(true)
          }}
        />
      ) : (
        <span
          className={`grid ${box} shrink-0 place-items-center rounded-[8px] font-bold text-white`}
          style={{ background: icon.swatch }}
          aria-hidden="true"
        >
          {icon.name.slice(0, 1)}
        </span>
      )}
      <span className="truncate text-[15px] font-medium text-ink">{label}</span>
    </span>
  )
}
