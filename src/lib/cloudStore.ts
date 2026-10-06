import { categoryOf } from './categories'
import { rdb, throwIfDbError } from './cloudbase'
import { currentUserId } from './household'
import type { Item, ItemInput, ItemStore } from './types'

function toItem(row: Record<string, unknown>): Item {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    description: String(row.description || ''),
    purchaseDate: row.purchase_date ? String(row.purchase_date) : null,
    expiryDate: row.expiry_date ? String(row.expiry_date) : null,
    location: String(row.location || ''),
    note: String(row.note || ''),
    photo: (row.photo as string | null) ?? null,
    category: categoryOf(String(row.category || 'other')).id,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }
}

export function createCloudStore(householdId: string): ItemStore {
  return {
    async list() {
      const { data, error } = await rdb.from('items').select().eq('household_id', householdId)
      throwIfDbError(error, '读取物品失败')
      return ((data as Array<Record<string, unknown>>) || []).map(toItem)
    },

    async save(input: ItemInput, id?: string) {
      const now = new Date().toISOString()
      const userId = await currentUserId()
      const payload = {
        name: input.name,
        price: input.price,
        description: input.description,
        purchase_date: input.purchaseDate,
        expiry_date: input.expiryDate,
        location: input.location,
        note: input.note,
        photo: input.photo,
        category: categoryOf(input.category).id,
        household_id: householdId,
        updated_at: now,
      }
      if (id) {
        const { error } = await rdb.from('items').update(payload).eq('id', id)
        throwIfDbError(error, '保存失败')
      } else {
        const { error } = await rdb.from('items').insert({
          ...payload,
          created_by: userId,
          created_at: now,
        })
        throwIfDbError(error, '保存失败')
      }
    },

    async remove(id: string) {
      const { error } = await rdb.from('items').delete().eq('id', id)
      throwIfDbError(error, '删除失败')
    },

    subscribe(onChange) {
      const poll = window.setInterval(onChange, 12000)
      return () => window.clearInterval(poll)
    },
  }
}
