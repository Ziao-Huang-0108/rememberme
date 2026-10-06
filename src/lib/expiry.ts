export type ExpiryLevel = 'expired' | 'red' | 'orange' | 'yellow' | 'green' | 'none'

export interface ExpiryInfo {
  level: ExpiryLevel
  /** Days from today until expiry; negative once expired, null when no expiry date. */
  days: number | null
  /** 0 = least urgent within its level, 1 = most urgent. */
  urgency: number
  label: string
  color: string
  textColor: string
  tint: string
}

export const LEVELS: { level: ExpiryLevel; name: string; range: string }[] = [
  { level: 'expired', name: '已过期', range: '已经过了过期日' },
  { level: 'red', name: '红色', range: '一个月内（≤30 天）' },
  { level: 'orange', name: '橙色', range: '一个月到半年' },
  { level: 'yellow', name: '黄色', range: '半年到一年' },
  { level: 'green', name: '绿色', range: '一年及以上' },
  { level: 'none', name: '不过期', range: '没有填过期日期' },
]

const DAY_MS = 24 * 60 * 60 * 1000

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toUtcDay(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

export function daysUntil(expiryDate: string, today: string): number {
  return toUtcDay(expiryDate) - toUtcDay(today)
}

export function levelForDays(days: number | null): ExpiryLevel {
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days <= 30) return 'red'
  if (days < 180) return 'orange'
  if (days < 365) return 'yellow'
  return 'green'
}

/** Position inside the level's day range, mapped so that closer to expiry = higher urgency. */
function urgencyFor(level: ExpiryLevel, days: number | null): number {
  if (days === null) return 0
  const span = (from: number, to: number) => 1 - (Math.min(Math.max(days, from), to) - from) / (to - from)
  switch (level) {
    case 'expired':
      return 1
    case 'red':
      return span(0, 30)
    case 'orange':
      return span(31, 179)
    case 'yellow':
      return span(180, 364)
    case 'green':
      return span(365, 365 * 3)
    case 'none':
      return 0
  }
}

const PALETTE: Record<ExpiryLevel, { hue: number; sat: number; light: [number, number] }> = {
  expired: { hue: 0, sat: 65, light: [28, 28] },
  red: { hue: 2, sat: 78, light: [64, 40] },
  orange: { hue: 24, sat: 90, light: [64, 44] },
  yellow: { hue: 44, sat: 92, light: [66, 46] },
  green: { hue: 148, sat: 52, light: [58, 34] },
  none: { hue: 35, sat: 12, light: [72, 72] },
}

function colorsFor(level: ExpiryLevel, urgency: number) {
  const { hue, sat, light } = PALETTE[level]
  const l = light[0] + (light[1] - light[0]) * urgency
  return {
    color: `hsl(${hue} ${sat}% ${l.toFixed(1)}%)`,
    textColor: l < 52 ? '#ffffff' : '#1f1a14',
    tint: `hsl(${hue} ${sat}% 96%)`,
  }
}

export function formatDays(days: number | null): string {
  if (days === null) return '不过期'
  if (days < 0) return `已过期 ${-days} 天`
  if (days === 0) return '今天过期'
  if (days < 60) return `还剩 ${days} 天`
  if (days < 365) return `还剩 ${days} 天（约 ${Math.floor(days / 30)} 个月）`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return `还剩 ${days} 天（约 ${years} 年${months ? ` ${months} 个月` : ''}）`
}

export function getExpiryInfo(expiryDate: string | null, today: string): ExpiryInfo {
  const days = expiryDate ? daysUntil(expiryDate, today) : null
  const level = levelForDays(days)
  const urgency = urgencyFor(level, days)
  return { level, days, urgency, label: formatDays(days), ...colorsFor(level, urgency) }
}

/** Sample color for legends, at the middle of each level. */
export function levelSwatch(level: ExpiryLevel): string {
  return colorsFor(level, 0.5).color
}
