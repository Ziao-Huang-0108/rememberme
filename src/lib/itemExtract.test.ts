import { describe, expect, it } from 'vitest'
import { mergeExtractedIntoForm, normalizeExtracted, parseJsonObject } from './itemExtract'

describe('parseJsonObject', () => {
  it('reads bare json', () => {
    expect(parseJsonObject('{"name":"布洛芬"}').name).toBe('布洛芬')
  })

  it('reads fenced json', () => {
    expect(parseJsonObject('```json\n{"name":"维生素C"}\n```').name).toBe('维生素C')
  })
})

describe('normalizeExtracted', () => {
  it('computes expiry from production date and shelf life months', () => {
    const out = normalizeExtracted(
      { productionDate: '2025-01-15', shelfLifeMonths: 12, name: '酱油' },
      '2026-11-16',
    )
    expect(out.expiryDate).toBe('2026-01-15')
    expect(out.name).toBe('酱油')
  })

  it('uses today when only shelf life months exist', () => {
    const out = normalizeExtracted({ shelfLifeMonths: 6, name: '酸奶' }, '2026-11-16')
    expect(out.expiryDate).toBe('2027-05-16')
  })
})

describe('mergeExtractedIntoForm', () => {
  const empty = {
    name: '',
    category: 'home',
    location: '',
    description: '',
    note: '',
    priceText: '',
    purchaseDate: null,
    expiryDate: null,
  }

  it('fills empty fields only', () => {
    const { next, filled } = mergeExtractedIntoForm(
      { ...empty, name: '已有名字', location: '' },
      {
        name: '新名字',
        category: 'food',
        location: '药箱',
        description: null,
        note: null,
        price: null,
        purchaseDate: null,
        expiryDate: '2027-01-01',
      },
    )
    expect(next.name).toBe('已有名字')
    expect(next.location).toBe('药箱')
    expect(next.expiryDate).toBe('2027-01-01')
    expect(next.category).toBe('home')
    expect(filled).toEqual(['放在哪', '过期日期'])
  })

  it('sets category when name was empty', () => {
    const { next, filled } = mergeExtractedIntoForm(empty, {
      name: '布洛芬',
      category: 'food',
      location: null,
      description: '退烧',
      note: null,
      price: 12,
      purchaseDate: null,
      expiryDate: '2027-06-01',
    })
    expect(next.name).toBe('布洛芬')
    expect(next.category).toBe('food')
    expect(next.priceText).toBe('12')
    expect(filled).toContain('类别')
    expect(filled).toContain('名称')
  })
})
