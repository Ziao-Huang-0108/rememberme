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
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-bold">
        {label}
        {hint && <span className="ml-1.5 font-medium text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

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
    <form
      onSubmit={handleSubmit}
      className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-[calc(120px+env(safe-area-inset-bottom))]"
    >
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <button type="button" onClick={onCancel} className="btn-ghost shrink-0 px-3 text-[15px] text-muted">
          取消
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[18px] font-bold">{item ? '改一改' : '记一件'}</h1>
        <span className="w-[72px] shrink-0" aria-hidden="true" />
      </header>

      {error && <p className="rounded-[var(--radius-card)] bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">
          照片 <span className="font-medium text-muted">选填，拍外观或放在哪</span>
        </span>
        {form.photo ? (
          <div className="relative">
            <img src={form.photo} alt="" className="h-44 w-full rounded-[var(--radius-card)] object-cover shadow-[var(--shadow-soft)]" />
            <button type="button" onClick={() => set('photo', null)} className="btn-ghost absolute top-3 right-3 bg-white/95 px-3 text-[14px]">
              去掉照片
            </button>
          </div>
        ) : (
          <label className="grid min-h-32 place-items-center rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-4 text-center text-[16px] font-bold text-muted">
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
        <input className="field-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：布洛芬" autoFocus={!item} />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">类别</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const selected = form.category === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set('category', c.id)}
                className={`touch-chip ring-1 ${selected ? 'text-white ring-transparent' : 'bg-surface text-ink ring-line'}`}
                style={selected ? { background: c.swatch } : undefined}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      <Field label="功能 / 用途" hint="选填">
        <textarea className="field-input min-h-20" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="例如：退烧、止痛" />
      </Field>

      <Field label="放在哪" hint="选填">
        <input className="field-input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="例如：客厅-电视柜左边抽屉" list="location-options" />
        <datalist id="location-options">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="价格" hint="元">
          <input className="field-input" value={priceText} onChange={(e) => setPriceText(e.target.value)} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="购买日期">
          <input type="date" className="field-input" value={form.purchaseDate ?? ''} onChange={(e) => set('purchaseDate', e.target.value || null)} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Field label="过期日期" hint="不过期的可以不填">
          <input type="date" className="field-input" value={form.expiryDate ?? ''} onChange={(e) => set('expiryDate', e.target.value || null)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-[13px] font-medium text-muted">从购买日起算：</span>
          {QUICK_SPANS.map(({ label, months }) => (
            <button
              key={label}
              type="button"
              onClick={() => set('expiryDate', addMonths(form.purchaseDate ?? today, months))}
              className="touch-chip bg-surface text-[13px] ring-1 ring-line"
            >
              {label}
            </button>
          ))}
          {form.expiryDate && (
            <button type="button" onClick={() => set('expiryDate', null)} className="touch-chip text-[13px] text-muted underline ring-0">
              清空
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[15px] font-medium text-muted">
          现在的状态：<ExpiryBadge info={info} />
        </div>
      </div>

      <Field label="备注" hint="选填">
        <textarea className="field-input min-h-16" value={form.note} onChange={(e) => set('note', e.target.value)} />
      </Field>

      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="min-h-12 rounded-[var(--radius-card)] bg-red-50 py-3 text-[16px] font-bold text-red-700 ring-1 ring-red-200 disabled:opacity-50"
        >
          删除这件物品
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-bg/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">
          <button type="submit" disabled={saving} className="btn-primary w-full shadow-[var(--shadow-soft)]">
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </form>
  )
}
