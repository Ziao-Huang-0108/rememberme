import { useState, type FormEvent, type ReactNode } from 'react'
import { ExpiryBadge } from '../components/ExpiryBadge'
import { CATEGORIES, categoryOf } from '../lib/categories'
import { getExpiryInfo, todayString } from '../lib/expiry'
import { compressPhoto } from '../lib/photo'
import { emptyInput, type Item, type ItemInput } from '../lib/types'

interface Props {
  item?: Item
  today: string
  locations: string[]
  onSave: (input: ItemInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

const QUICK_SPANS: { label: string; months: number }[] = [
  { label: '1 个月', months: 1 },
  { label: '3 个月', months: 3 },
  { label: '半年', months: 6 },
  { label: '1 年', months: 12 },
  { label: '2 年', months: 24 },
  { label: '3 年', months: 36 },
]

function addMonths(date: string, months: number) {
  const [y, m, d] = date.split('-').map(Number)
  return todayString(new Date(y, m - 1 + months, d))
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-black">
        {label}
        {hint && <span className="ml-1.5 font-medium text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-2xl border-2 border-line bg-surface px-3.5 py-3 outline-none focus:border-accent'

export function ItemFormPage({ item, today, locations, onSave, onDelete, onCancel }: Props) {
  const [form, setForm] = useState<ItemInput>(() =>
    item ? { ...emptyInput, ...item } : { ...emptyInput, purchaseDate: today },
  )
  const [priceText, setPriceText] = useState(item?.price != null ? String(item.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const info = getExpiryInfo(form.expiryDate, today)

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    try {
      set('photo', await compressPhoto(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : '照片加不上')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return setError('请填写物品名称')
    const price = priceText.trim() === '' ? null : Number(priceText)
    if (price !== null && (!Number.isFinite(price) || price < 0)) return setError('价格请填数字')
    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...form,
        name,
        price,
        category: categoryOf(form.category).id,
        location: form.location.trim(),
        description: form.description.trim(),
        note: form.note.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请再试一次')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete || !window.confirm(`确定删除「${item?.name}」吗？`)) return
    setSaving(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <button type="button" onClick={onCancel} className="py-1 text-[15px] font-bold text-muted">
          取消
        </button>
        <h1 className="text-lg font-black">{item ? '改一改' : '记一件'}</h1>
        <button type="submit" disabled={saving} className="rounded-full bg-accent px-4 py-1.5 font-black text-white disabled:opacity-50">
          {saving ? '保存中' : '保存'}
        </button>
      </header>

      {error && <p className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-black">
          照片 <span className="font-medium text-muted">选填，拍外观或放在哪</span>
        </span>
        {form.photo ? (
          <div className="relative">
            <img src={form.photo} alt="" className="h-44 w-full rounded-[24px] object-cover ring-2 ring-ink/10" />
            <button
              type="button"
              onClick={() => set('photo', null)}
              className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold"
            >
              去掉照片
            </button>
          </div>
        ) : (
          <label className="grid h-32 place-items-center rounded-[24px] border-2 border-dashed border-ink/20 bg-surface text-center font-bold text-muted">
            点这里拍照或选一张图
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                handlePhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      <Field label="名称">
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：布洛芬" autoFocus={!item} />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-black">类别</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const selected = form.category === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set('category', c.id)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-bold ring-2 ${selected ? 'text-white ring-ink/20' : 'bg-surface ring-ink/10'}`}
                style={selected ? { background: c.swatch } : undefined}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      <Field label="功能 / 用途" hint="选填">
        <textarea className={`${inputClass} min-h-20`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="例如：退烧、止痛" />
      </Field>

      <Field label="放在哪" hint="选填">
        <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="例如：客厅-电视柜左边抽屉" list="location-options" />
        <datalist id="location-options">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="价格" hint="元">
          <input className={inputClass} value={priceText} onChange={(e) => setPriceText(e.target.value)} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="购买日期">
          <input type="date" className={inputClass} value={form.purchaseDate ?? ''} onChange={(e) => set('purchaseDate', e.target.value || null)} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Field label="过期日期" hint="不过期的可以不填">
          <input type="date" className={inputClass} value={form.expiryDate ?? ''} onChange={(e) => set('expiryDate', e.target.value || null)} />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-[13px] font-medium text-muted">从购买日起算：</span>
          {QUICK_SPANS.map(({ label, months }) => (
            <button
              key={label}
              type="button"
              onClick={() => set('expiryDate', addMonths(form.purchaseDate ?? today, months))}
              className="rounded-full bg-surface px-3 py-1 text-[13px] font-bold ring-2 ring-ink/10"
            >
              {label}
            </button>
          ))}
          {form.expiryDate && (
            <button type="button" onClick={() => set('expiryDate', null)} className="rounded-full px-3 py-1 text-[13px] font-bold text-muted underline">
              清空
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          现在的状态：<ExpiryBadge info={info} />
        </div>
      </div>

      <Field label="备注" hint="选填">
        <textarea className={`${inputClass} min-h-16`} value={form.note} onChange={(e) => set('note', e.target.value)} />
      </Field>

      {onDelete && (
        <button type="button" onClick={handleDelete} disabled={saving} className="mt-2 rounded-2xl bg-red-50 py-3 font-black text-red-700 ring-2 ring-red-200">
          删除这件物品
        </button>
      )}
    </form>
  )
}
