import { categoryOf } from './categories'
import { db } from './cloudbase'
import { currentUserId } from './household'
import type { Item, ItemInput, ItemStore } from './types'

function toItem(doc: Record<string, unknown>): Item {
  return {
    id: String(doc._id),
    name: String(doc.name || ''),
    price: typeof doc.price === 'number' ? doc.price : null,
    description: String(doc.description || ''),
    purchaseDate: (doc.purchaseDate as string | null) ?? null,
    expiryDate: (doc.expiryDate as string | null) ?? null,
    location: String(doc.location || ''),
    note: String(doc.note || ''),
    photo: (doc.photo as string | null) ?? null,
    category: categoryOf(String(doc.category || 'other')).id,
    createdBy: (doc.createdBy as string | null) ?? null,
    createdAt: String(doc.createdAt || new Date().toISOString()),
    updatedAt: String(doc.updatedAt || new Date().toISOString()),
  }
}

export function createCloudStore(householdId: string): ItemStore {
  const col = () => db.collection('items')

  return {
    async list() {
      const res = await col().where({ householdId }).get()
      return (res.data as Array<Record<string, unknown>>).map(toItem)
    },

    async save(input: ItemInput, id?: string) {
      const now = new Date().toISOString()
      const userId = await currentUserId()
      const payload = {
        ...input,
        category: categoryOf(input.category).id,
        householdId,
        updatedAt: now,
      }
      if (id) {
        await col().doc(id).update(payload)
      } else {
        await col().add({ ...payload, createdBy: userId, createdAt: now })
      }
    },

    async remove(id: string) {
      await col().doc(id).remove()
    },

    subscribe(onChange) {
      let closed = false
      let watcher: { close: () => void } | null = null
      try {
        watcher = col()
          .where({ householdId })
          .watch({
            onChange() {
              if (!closed) onChange()
            },
            onError() {
              // 实时通道偶发失败时，退回轮询
            },
          }) as { close: () => void }
      } catch {
        // 不支持 watch 时用轮询
      }
      const poll = window.setInterval(() => {
        if (!closed) onChange()
      }, 15000)
      return () => {
        closed = true
        window.clearInterval(poll)
        try {
          watcher?.close()
        } catch {
          /* ignore */
        }
      }
    },
  }
}
