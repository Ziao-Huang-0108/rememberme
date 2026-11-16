import { useState } from 'react'
import { PLACE_ICONS, type PlaceIconId } from '../lib/placeIcons'
import { compressPhoto } from '../lib/photo'
import type { Place, PlaceInput } from '../lib/places'
import { PlaceThumb } from './PlaceThumb'

interface Props {
  places: Place[]
  value: string | null
  onChange: (place: Place | null) => void
  onCreate: (input: PlaceInput) => Promise<Place>
}

export function PlacePicker({ places, value, onChange, onCreate }: Props) {
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState<PlaceIconId>('cabinet')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setBusy(true)
    setError(null)
    try {
      const place = await onCreate({ label, icon, photo })
      onChange(place)
      setCreating(false)
      setLabel('')
      setIcon('cabinet')
      setPhoto(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '新建位置失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`touch-chip ring-1 ${
            !value ? 'bg-accent text-white ring-transparent' : 'bg-surface text-ink ring-line'
          }`}
        >
          不选
        </button>
        {places.map((place) => {
          const selected = value === place.id
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onChange(place)}
              className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-[var(--radius-pill)] px-3 py-2 ring-1 transition active:scale-[0.98] ${
                selected ? 'bg-accent-soft ring-accent' : 'bg-surface ring-line'
              }`}
            >
              <PlaceThumb place={place} size="sm" />
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCreating((open) => !open)}
          className="touch-chip bg-surface text-accent-deep ring-1 ring-line"
        >
          {creating ? '取消新建' : '+ 新位置'}
        </button>
      </div>

      {creating && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-bg px-3 py-3 ring-1 ring-line">
          <label className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">位置名字</span>
            <input
              className="field-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：客厅电视柜"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">选个图标</span>
            <div className="flex flex-wrap gap-2">
              {PLACE_ICONS.map((opt) => {
                const selected = icon === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    className={`touch-chip ring-1 ${
                      selected ? 'text-white ring-transparent' : 'bg-surface text-ink ring-line'
                    }`}
                    style={selected ? { background: opt.swatch } : undefined}
                  >
                    {opt.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">
              实拍 <span className="font-medium text-muted">选填，有图就优先显示</span>
            </span>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="" className="h-28 w-full rounded-[12px] object-cover" />
                <button type="button" onClick={() => setPhoto(null)} className="btn-ghost absolute top-2 right-2 bg-white/95 px-3 text-[14px]">
                  去掉
                </button>
              </div>
            ) : (
              <label className="grid min-h-20 place-items-center rounded-[12px] border border-dashed border-line bg-surface px-3 text-center text-[15px] font-bold text-muted">
                拍这个柜子
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    void compressPhoto(file)
                      .then(setPhoto)
                      .catch((err) => setError(err instanceof Error ? err.message : '照片加不上'))
                  }}
                />
              </label>
            )}
          </div>
          {error && <p className="text-[14px] font-medium text-red-700">{error}</p>}
          <button type="button" disabled={busy || !label.trim()} onClick={() => void handleCreate()} className="btn-primary w-full disabled:opacity-50">
            {busy ? '保存中…' : '保存这个位置'}
          </button>
        </div>
      )}
    </div>
  )
}
