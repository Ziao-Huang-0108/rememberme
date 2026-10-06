import { describe, expect, it } from 'vitest'
import { daysUntil, formatDays, getExpiryInfo, levelForDays, todayString } from './expiry'

describe('daysUntil', () => {
  it('counts calendar days', () => {
    expect(daysUntil('2026-10-06', '2026-10-05')).toBe(1)
    expect(daysUntil('2026-10-05', '2026-10-05')).toBe(0)
    expect(daysUntil('2026-10-01', '2026-10-05')).toBe(-4)
  })

  it('is not affected by daylight saving or leap years', () => {
    expect(daysUntil('2027-03-29', '2027-03-27')).toBe(2)
    expect(daysUntil('2029-01-01', '2028-01-01')).toBe(366)
  })
})

describe('levelForDays', () => {
  it.each([
    [null, 'none'],
    [-1, 'expired'],
    [0, 'red'],
    [30, 'red'],
    [31, 'orange'],
    [179, 'orange'],
    [180, 'yellow'],
    [364, 'yellow'],
    [365, 'green'],
    [2000, 'green'],
  ] as const)('%s days -> %s', (days, level) => {
    expect(levelForDays(days)).toBe(level)
  })
})

describe('getExpiryInfo', () => {
  it('gets darker as expiry approaches within a level', () => {
    const today = '2026-10-05'
    const far = getExpiryInfo('2026-11-04', today)
    const near = getExpiryInfo('2026-10-08', today)
    expect(far.level).toBe('red')
    expect(near.level).toBe('red')
    expect(near.urgency).toBeGreaterThan(far.urgency)
  })

  it('handles missing expiry date', () => {
    const info = getExpiryInfo(null, '2026-10-05')
    expect(info.level).toBe('none')
    expect(info.days).toBeNull()
  })
})

describe('formatDays', () => {
  it('describes the remaining time', () => {
    expect(formatDays(-3)).toBe('已过期 3 天')
    expect(formatDays(0)).toBe('今天过期')
    expect(formatDays(12)).toBe('还剩 12 天')
    expect(formatDays(400)).toBe('还剩 400 天（约 1 年 1 个月）')
  })
})

describe('todayString', () => {
  it('uses local date parts', () => {
    expect(todayString(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09')
  })
})
