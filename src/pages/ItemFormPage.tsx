import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ExpiryBadge } from '../components/ExpiryBadge'
import { PhotoPreview } from '../components/PhotoPreview'
import { PlacePicker } from '../components/PlacePicker'
import { CATEGORIES, categoryOf } from '../lib/categories'
import { getExpiryInfo } from '../lib/expiry'
import { extractItemFromText, mergeExtractedIntoForm } from '../lib/itemExtract'
import { recognizePackageText } from '../lib/packageOcr'
import { compressPhoto } from '../lib/photo'
import type { Place, PlaceInput } from '../lib/places'
import { emptyInput, type Item, type ItemInput } from '../lib/types'
import { speechRecognitionAvailable, startVoiceListen, type VoiceListenHandle } from '../lib/voiceInput'

interface Props {
  item?: Item
  today: string
  locations: string[]
  places: Place[]
  onCreatePlace: (input: PlaceInput) => Promise<Place>
  onSave: (input: ItemInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
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

function hasExtraFields(item?: Item) {
  if (!item) return false
  return Boolean(
    item.price != null || item.purchaseDate || item.description.trim() || item.note.trim(),
  )
}

export function ItemFormPage({
  item,
  today,
  locations,
  places,
  onCreatePlace,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [form, setForm] = useState<ItemInput>(() =>
    item ? { ...emptyInput, ...item } : { ...emptyInput },
  )
  const [placeList, setPlaceList] = useState(places)
  useEffect(() => {
    setPlaceList(places)
  }, [places])
  const [priceText, setPriceText] = useState(item?.price != null ? String(item.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureHint, setCaptureHint] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(() => hasExtraFields(item))
  const [draftText, setDraftText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState<string | null>(null)
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const packageInputRef = useRef<HTMLInputElement>(null)
  const voiceHandleRef = useRef<VoiceListenHandle | null>(null)
  const formRef = useRef(form)
  const priceTextRef = useRef(priceText)
  formRef.current = form
  priceTextRef.current = priceText

  useEffect(() => {
    return () => {
      void voiceHandleRef.current?.stop().catch(() => undefined)
      voiceHandleRef.current = null
    }
  }, [])

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const info = getExpiryInfo(form.expiryDate, today)

  async function applyExtractedText(rawText: string, sourceLabel: string) {
    const current = formRef.current
    const currentPrice = priceTextRef.current
    const knownLocations = [...locations, ...placeList.map((p) => p.label)]
    const extracted = await extractItemFromText(rawText, { today, knownLocations })
    const { next, filled } = mergeExtractedIntoForm(
      {
        name: current.name,
        category: current.category,
        location: current.location,
        description: current.description,
        note: current.note,
        priceText: currentPrice,
        purchaseDate: current.purchaseDate,
        expiryDate: current.expiryDate,
      },
      extracted,
    )
    const placeFromExtract =
      !current.placeId && extracted.location
        ? placeList.find((p) => p.label === extracted.location)
        : null
    setForm((f) => ({
      ...f,
      name: next.name,
      category: next.category,
      description: next.description,
      note: next.note,
      purchaseDate: next.purchaseDate,
      expiryDate: next.expiryDate,
      placeId: f.placeId ?? placeFromExtract?.id ?? null,
      location: placeFromExtract ? placeFromExtract.label : next.location,
    }))
    setPriceText(next.priceText)
    if (placeFromExtract && !filled.includes('放在哪')) filled.push('放在哪')
    if (filled.some((label) => ['价格', '购买日期', '用途', '备注'].includes(label))) {
      setMoreOpen(true)
    }
    setExtractStatus(
      filled.length > 0
        ? `${sourceLabel}已填入：${filled.join('、')}。请核对后再保存。`
        : `${sourceLabel}没有空格子可填，或认不出新信息。已填过的不会被覆盖。`,
    )
  }

  async function handleExtractFromText() {
    setError(null)
    setExtractStatus(null)
    setExtracting(true)
    try {
      await applyExtractedText(draftText, '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '自动填写失败，请再试一次')
    } finally {
      setExtracting(false)
    }
  }

  async function handlePackagePhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    setCaptureHint(null)
    setExtractStatus(null)
    setExtracting(true)
    try {
      if (!formRef.current.photo) {
        try {
          set('photo', await compressPhoto(file))
        } catch {
          /* 外观照失败不挡识别 */
        }
      }
      const text = await recognizePackageText(file, setExtractStatus)
      setDraftText(text)
      setExtractStatus('正在分析并填入空格…')
      await applyExtractedText(text, '根据包装字，')
    } catch (err) {
      setError(err instanceof Error ? err.message : '拍包装识别失败，请再试一次或改用手填')
    } finally {
      setExtracting(false)
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    try {
      set('photo', await compressPhoto(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : '照片加不上')
    }
  }

  async function finishVoiceWithText(text: string) {
    voiceHandleRef.current = null
    setListening(false)
    if (!text.trim()) {
      setExtractStatus('没有听清，请再说一次，或改用手填')
      return
    }
    setDraftText(text)
    setExtracting(true)
    setExtractStatus('正在分析并填入空格…')
    try {
      await applyExtractedText(text, '根据你说的，')
    } catch (err) {
      setError(err instanceof Error ? err.message : '自动填写失败，请再试一次')
    } finally {
      setExtracting(false)
    }
  }

  async function handleVoiceToggle() {
    setError(null)
    setCaptureHint(null)

    if (listening && voiceHandleRef.current) {
      setExtractStatus('正在结束录音…')
      try {
        const text = await voiceHandleRef.current.stop()
        await finishVoiceWithText(text)
      } catch (err) {
        voiceHandleRef.current = null
        setListening(false)
        setError(err instanceof Error ? err.message : '语音识别失败，请再试一次')
        setExtractStatus(null)
      }
      return
    }

    if (!speechRecognitionAvailable()) {
      setError('这台手机或浏览器还不支持语音输入，请改用拍包装、粘贴文字或手填')
      return
    }
    if (extracting) return

    try {
      const handle = startVoiceListen({
        onPartial: (text) => {
          if (text) setDraftText(text)
        },
        onEnded: (text) => {
          // 浏览器自己停了（例如静音太久）
          if (!voiceHandleRef.current) return
          void finishVoiceWithText(text)
        },
      })
      voiceHandleRef.current = handle
      setListening(true)
      setExtractStatus('正在听…说完再点一次结束；听的时候会先暂停背景音乐')
    } catch (err) {
      setListening(false)
      voiceHandleRef.current = null
      setError(err instanceof Error ? err.message : '没法开始听，请再试一次')
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
        <span className="text-[15px] font-bold">先采集，再核对</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => packageInputRef.current?.click()}
            disabled={extracting || listening}
            className="btn-ghost min-h-14 w-full flex-col gap-0.5 py-3 text-[16px] disabled:opacity-50"
          >
            <span>拍包装</span>
            <span className="text-[12px] font-medium text-muted">
              {extracting && !listening ? '识别中…' : '认包装上的字'}
            </span>
          </button>
          <input
            ref={packageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void handlePackagePhoto(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => void handleVoiceToggle()}
            disabled={extracting && !listening}
            className={`btn-ghost min-h-14 w-full flex-col gap-0.5 py-3 text-[16px] disabled:opacity-50 ${
              listening ? 'ring-2 ring-[var(--color-accent)]' : ''
            }`}
          >
            <span>{listening ? '说完了' : '说话填写'}</span>
            <span className="text-[12px] font-medium text-muted">
              {listening ? '再点一下结束' : '少打字 · 点一下开始'}
            </span>
          </button>
        </div>
        {captureHint && (
          <p className="rounded-[var(--radius-card)] bg-accent-soft px-4 py-3 text-[15px] font-medium text-ink" role="status">
            {captureHint}
          </p>
        )}
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface px-4 py-3 shadow-[var(--shadow-soft)]">
          <span className="text-[15px] font-bold">
            粘贴文字试填{' '}
            <span className="font-medium text-muted">拍照/说话认出的字也会出现在这里，可改再填</span>
          </span>
          <textarea
            className="field-input min-h-24"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="例如：布洛芬，放客厅药箱，保质期到 2027 年 6 月，退烧用"
          />
          <button
            type="button"
            onClick={() => void handleExtractFromText()}
            disabled={extracting || !draftText.trim()}
            className="btn-ghost w-full disabled:opacity-50"
          >
            {extracting ? '正在分析…' : '识别并填入空格'}
          </button>
          {extractStatus && (
            <p className="text-[14px] font-medium text-accent-deep" role="status">
              {extractStatus}
            </p>
          )}
        </div>
      </div>

      <Field label="名称">
        <input
          className="field-input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="例如：布洛芬"
          autoFocus={!item}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">
          外观照片 <span className="font-medium text-muted">选填</span>
        </span>
        {form.photo ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(true)}
              className="block w-full overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]"
              aria-label="预览完整照片"
            >
              <img src={form.photo} alt="" className="h-44 w-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => set('photo', null)}
              className="btn-ghost absolute top-3 right-3 bg-white/95 px-3 text-[14px]"
            >
              去掉照片
            </button>
            <PhotoPreview
              src={form.photo}
              open={photoPreviewOpen}
              onClose={() => setPhotoPreviewOpen(false)}
            />
          </div>
        ) : (
          <label className="grid min-h-32 place-items-center rounded-[var(--radius-card)] border border-dashed border-line bg-bg px-4 text-center text-[16px] font-bold text-muted">
            点这里拍照或选一张图
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                void handlePhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Field label="过期日期" hint="不过期的可以不填">
          <input
            type="date"
            className="field-input"
            value={form.expiryDate ?? ''}
            onChange={(e) => set('expiryDate', e.target.value || null)}
          />
        </Field>
        {form.expiryDate && (
          <button
            type="button"
            onClick={() => set('expiryDate', null)}
            className="self-start text-[13px] font-medium text-muted underline"
          >
            清空过期日期
          </button>
        )}
        <div className="flex items-center gap-2 text-[15px] font-medium text-muted">
          现在的状态：<ExpiryBadge info={info} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">
          放在哪 <span className="ml-1.5 font-medium text-muted">选填，可点图或新建</span>
        </span>
        <PlacePicker
          places={placeList}
          value={form.placeId}
          onChange={(place) => {
            setForm((f) => ({
              ...f,
              placeId: place?.id ?? null,
              location: place?.label ?? '',
            }))
          }}
          onCreate={async (input) => {
            const place = await onCreatePlace(input)
            setPlaceList((list) =>
              [...list.filter((p) => p.id !== place.id), place].sort((a, b) =>
                a.label.localeCompare(b.label, 'zh'),
              ),
            )
            return place
          }}
        />
        {!form.placeId && (
          <input
            className="field-input"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="或直接打字：客厅-电视柜左边抽屉"
            list="location-options"
          />
        )}
        <datalist id="location-options">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>

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

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="btn-ghost w-full justify-between px-4 text-[15px]"
          aria-expanded={moreOpen}
        >
          <span>还可以补充</span>
          <span className="font-medium text-muted">{moreOpen ? '收起' : '展开'}</span>
        </button>

        {moreOpen && (
          <div className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-surface px-4 py-4 shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-2 gap-3">
              <Field label="价格" hint="选填 · 元">
                <input
                  className="field-input"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </Field>
              <Field label="购买日期" hint="选填">
                <input
                  type="date"
                  className="field-input"
                  value={form.purchaseDate ?? ''}
                  onChange={(e) => set('purchaseDate', e.target.value || null)}
                />
              </Field>
            </div>

            <Field label="功能 / 用途" hint="选填">
              <textarea
                className="field-input min-h-20"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="例如：退烧、止痛"
              />
            </Field>

            <Field label="备注" hint="选填">
              <textarea className="field-input min-h-16" value={form.note} onChange={(e) => set('note', e.target.value)} />
            </Field>
          </div>
        )}
      </div>

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
