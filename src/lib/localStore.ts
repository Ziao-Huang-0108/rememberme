import { categoryOf } from './categories'
import type { Item, ItemInput, ItemStore } from './types'

export const LOCAL_KEY = 'remember-me:items:v1'

function normalize(raw: unknown): Item | null {
  if (!raw || typeof raw !== 'object') return null
  const it = raw as Partial<Item>
  if (typeof it.id !== 'string' || typeof it.name !== 'string') return null
  return {
    id: it.id,
    name: it.name,
    price: typeof it.price === 'number' ? it.price : null,
    description: it.description ?? '',
    purchaseDate: it.purchaseDate ?? null,
    expiryDate: it.expiryDate ?? null,
    location: it.location ?? '',
    note: it.note ?? '',
    photo: it.photo ?? null,
    category: categoryOf(it.category).id,
    createdBy: it.createdBy ?? null,
    createdAt: it.createdAt ?? new Date().toISOString(),
    updatedAt: it.updatedAt ?? new Date().toISOString(),
  }
}

export function readLocalItems(): Item[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data.map(normalize).filter((x): x is Item => x !== null) : []
  } catch {
    return []
  }
}

function write(items: Item[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
  } catch {
    throw new Error('手机里的存储空间不够了，可以删掉几张照片再试')
  }
}

export function clearLocalItems() {
  localStorage.removeItem(LOCAL_KEY)
}

export const localStore: ItemStore = {
  async list() {
    return readLocalItems()
  },

  async save(input: ItemInput, id?: string) {
    const items = readLocalItems()
    const now = new Date().toISOString()
    if (id) {
      write(items.map((it) => (it.id === id ? { ...it, ...input, updatedAt: now } : it)))
    } else {
      write([...items, { ...input, id: crypto.randomUUID(), createdBy: null, createdAt: now, updatedAt: now }])
    }
  },

  async remove(id: string) {
    write(readLocalItems().filter((it) => it.id !== id))
  },

  subscribe(onChange) {
    const handler = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}
