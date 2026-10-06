export const CATEGORIES = [
  { id: 'clothes', name: '衣物', swatch: '#7c5cbf' },
  { id: 'home', name: '生活用品', swatch: '#2f7fd6' },
  { id: 'care', name: '洗护用品', swatch: '#12a3a3' },
  { id: 'food', name: '食品药品', swatch: '#c45c9a' },
  { id: 'art', name: '文化艺术', swatch: '#4f6bd6' },
  { id: 'pet', name: '宠物用品', swatch: '#c46a3a' },
  { id: 'other', name: '其他', swatch: '#7a7268' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function categoryOf(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
