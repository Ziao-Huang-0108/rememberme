import { useState } from 'react'
import { TEXT_SCALE_STEPS, applyTextScale, readStoredTextScale, stepIndexOf } from '../lib/textScale'

const LABELS = ['正常', '稍大', '更大'] as const

export function TextScaleSlider() {
  const [index, setIndex] = useState(() => stepIndexOf(readStoredTextScale()))

  function onSlide(nextIndex: number) {
    const next = TEXT_SCALE_STEPS[nextIndex] ?? 1
    setIndex(stepIndexOf(next))
    applyTextScale(next)
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-surface/95 px-4 py-3 shadow-[var(--shadow-soft)] ring-1 ring-line/80 backdrop-blur">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-muted">字号</p>
          <label className="mt-1 flex flex-col gap-2">
            <span className="sr-only">调节页面字号</span>
            <input
              type="range"
              min={0}
              max={TEXT_SCALE_STEPS.length - 1}
              step={1}
              value={index}
              onChange={(e) => onSlide(Number(e.target.value))}
              className="h-11 w-full cursor-pointer accent-[var(--color-accent)]"
              aria-valuetext={LABELS[index]}
            />
            <span className="flex justify-between text-[12px] font-medium text-muted">
              {LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </span>
          </label>
        </div>
        <p className="brand-title shrink-0 text-[22px] leading-none" aria-live="polite">
          记住我
        </p>
      </div>
    </div>
  )
}
