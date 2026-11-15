const STORAGE_KEY = 'remember-me:text-scale'

/** 三档：正常 / 稍大 / 更大 */
export const TEXT_SCALE_STEPS = [1, 1.12, 1.25] as const

export type TextScale = (typeof TEXT_SCALE_STEPS)[number]

export function readStoredTextScale(): TextScale {
  const raw = Number(localStorage.getItem(STORAGE_KEY))
  if (TEXT_SCALE_STEPS.includes(raw as TextScale)) return raw as TextScale
  return 1
}

export function applyTextScale(scale: TextScale) {
  document.documentElement.style.setProperty('--text-scale', String(scale))
  localStorage.setItem(STORAGE_KEY, String(scale))
}

export function initTextScale() {
  applyTextScale(readStoredTextScale())
}

export function stepIndexOf(scale: TextScale): number {
  const i = TEXT_SCALE_STEPS.indexOf(scale)
  return i < 0 ? 0 : i
}
