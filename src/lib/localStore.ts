import type { Item, ItemInput, ItemStore } from './types'

export const LOCAL_KEY = 'remember-me:items:v1'

export function readLocalItems(): Item[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
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
