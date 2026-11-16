import { rdb, throwIfDbError, cloudReady } from './cloudbase'
import { placeIconOf, type PlaceIconId } from './placeIcons'

export interface Place {
  id: string
  label: string
  icon: PlaceIconId
  photo: string | null
  createdAt: string
  updatedAt: string
}

export interface PlaceInput {
  label: string
  icon: PlaceIconId
  photo: string | null
}

const LOCAL_KEY = 'remember-me:places:v1'

function toPlace(row: Record<string, unknown>): Place {
  return {
    id: String(row.id),
    label: String(row.label || ''),
    icon: placeIconOf(String(row.icon || 'other')).id,
    photo: (row.photo as string | null) ?? null,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }
}

function readLocal(householdId: string): Place[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY}:${householdId}`)
    const data = raw ? JSON.parse(raw) : []
    if (!Array.isArray(data)) return []
    return data
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const p = row as Partial<Place>
        if (typeof p.id !== 'string' || typeof p.label !== 'string') return null
        return {
          id: p.id,
          label: p.label,
          icon: placeIconOf(p.icon).id,
          photo: p.photo ?? null,
          createdAt: p.createdAt ?? new Date().toISOString(),
          updatedAt: p.updatedAt ?? new Date().toISOString(),
        } satisfies Place
      })
      .filter((x): x is Place => x !== null)
  } catch {
    return []
  }
}

function writeLocal(householdId: string, places: Place[]) {
  localStorage.setItem(`${LOCAL_KEY}:${householdId}`, JSON.stringify(places))
}

export async function listPlaces(householdId: string, useCloud: boolean): Promise<Place[]> {
  if (!useCloud || !cloudReady) {
    return readLocal(householdId).sort((a, b) => a.label.localeCompare(b.label, 'zh'))
  }
  const { data, error } = await rdb.from('places').select().eq('household_id', householdId)
  throwIfDbError(error, '读取位置失败')
  return ((data as Array<Record<string, unknown>>) || [])
    .map(toPlace)
    .sort((a, b) => a.label.localeCompare(b.label, 'zh'))
}

export async function savePlace(
  householdId: string,
  input: PlaceInput,
  useCloud: boolean,
  id?: string,
): Promise<Place> {
  const label = input.label.trim()
  if (!label) throw new Error('请填写位置名字')
  const icon = placeIconOf(input.icon).id
  const now = new Date().toISOString()

  if (!useCloud || !cloudReady) {
    const places = readLocal(householdId)
    if (id) {
      const next = places.map((p) =>
        p.id === id ? { ...p, label, icon, photo: input.photo, updatedAt: now } : p,
      )
      writeLocal(householdId, next)
      const found = next.find((p) => p.id === id)
      if (!found) throw new Error('找不到这个位置')
      return found
    }
    const created: Place = {
      id: crypto.randomUUID(),
      label,
      icon,
      photo: input.photo,
      createdAt: now,
      updatedAt: now,
    }
    writeLocal(householdId, [...places, created])
    return created
  }

  if (id) {
    const { error } = await rdb
      .from('places')
      .update({
        label,
        icon,
        photo: input.photo,
        updated_at: now,
      })
      .eq('id', id)
      .eq('household_id', householdId)
    throwIfDbError(error, '保存位置失败')
    return { id, label, icon, photo: input.photo, createdAt: now, updatedAt: now }
  }

  const { data, error } = await rdb
    .from('places')
    .insert({
      household_id: householdId,
      label,
      icon,
      photo: input.photo,
      created_at: now,
      updated_at: now,
    })
    .select()
  throwIfDbError(error, '新建位置失败')
  const row = (data as Array<Record<string, unknown>> | null)?.[0]
  if (!row) throw new Error('新建位置失败')
  return toPlace(row)
}
