import { useState, type FormEvent, type ReactNode } from 'react'
import { ExpiryBadge } from '../components/ExpiryBadge'
import { getExpiryInfo, todayString } from '../lib/expiry'
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
      <span className="text-sm font-semibold">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

export function ItemFormPage({ item, today, locations, onSave, onDelete, onCancel }: Props) {
  const [form, setForm] = useState<ItemInput>(() =>
    item ? { ...emptyInput, ...item } : { ...emptyInput, purchaseDate: today },
  )
  const [priceText, setPriceText] = useState(item?.price != null ? String(item.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const info = getExpiryInfo(form.expiryDate, today)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return setError('请填写物品名称')
    const price = priceText.trim() === '' ? null : Number(priceText)
    if (price !== null && (!Number.isFinite(price) || price < 0)) return setError('价格请填数字')
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, name, price, location: form.location.trim(), description: form.description.trim(), note: form.note.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请再试一次')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete || !window.confirm(`确定删除「${item?.name}」吗？删除后家人也看不到了。`)) return
    setSaving(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pb-16">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-bg/95 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <button type="button" onClick={onCancel} className="py-1 text-[15px] text-muted">
          取消
        </button>
        <h1 className="text-lg font-bold">{item ? '修改物品' : '记一件'}</h1>
        <button type="submit" disabled={saving} className="rounded-full bg-accent px-4 py-1.5 font-semibold text-white disabled:opacity-50">
          {saving ? '保存中' : '保存'}
        </button>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

      <Field label="名称">
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：布洛芬" autoFocus={!item} />
      </Field>

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
        <Field label="过期日期" hint="不过期的东西可以不填">
          <input type="date" className={inputClass} value={form.expiryDate ?? ''} onChange={(e) => set('expiryDate', e.target.value || null)} />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-[13px] text-muted">从购买日起算保质期：</span>
          {QUICK_SPANS.map(({ label, months }) => (
            <button
              key={label}
              type="button"
              onClick={() => set('expiryDate', addMonths(form.purchaseDate ?? today, months))}
              className="rounded-full border border-line bg-surface px-3 py-1 text-[13px]"
            >
              {label}
            </button>
          ))}
          {form.expiryDate && (
            <button type="button" onClick={() => set('expiryDate', null)} className="rounded-full px-3 py-1 text-[13px] text-muted underline">
              清空
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          现在的状态：<ExpiryBadge info={info} />
        </div>
      </div>

      <Field label="备注" hint="选填">
        <textarea className={`${inputClass} min-h-16`} value={form.note} onChange={(e) => set('note', e.target.value)} />
      </Field>

      {onDelete && (
        <button type="button" onClick={handleDelete} disabled={saving} className="mt-2 rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-700">
          删除这件物品
        </button>
      )}
    </form>
  )
}
