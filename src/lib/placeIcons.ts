export const PLACE_ICONS = [
  { id: 'fridge', name: '冰箱', swatch: '#6b9bd1' },
  { id: 'cabinet', name: '柜子', swatch: '#c4a574' },
  { id: 'drawer', name: '抽屉', swatch: '#a8896c' },
  { id: 'table', name: '桌子', swatch: '#8f7a66' },
  { id: 'medbox', name: '药箱', swatch: '#d47a9a' },
  { id: 'shelf', name: '架子', swatch: '#7d8f6a' },
  { id: 'other', name: '其他', swatch: '#9c9c96' },
] as const

export type PlaceIconId = (typeof PLACE_ICONS)[number]['id']

export function placeIconOf(id: string | null | undefined) {
  return PLACE_ICONS.find((i) => i.id === id) ?? PLACE_ICONS[PLACE_ICONS.length - 1]
}

/** 约定路径：先试 svg，再试 png（组件里用 onError 切换） */
export function placeIconCandidates(icon: string): string[] {
  const id = placeIconOf(icon).id
  return [`/places/${id}.svg`, `/places/${id}.png`]
}
