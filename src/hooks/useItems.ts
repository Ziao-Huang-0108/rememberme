import { useCallback, useEffect, useState } from 'react'
import type { Item, ItemInput, ItemStore } from '../lib/types'

export function useItems(store: ItemStore) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setItems(await store.list())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败')
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    setLoading(true)
    reload()
    return store.subscribe(reload)
  }, [store, reload])

  const save = useCallback(
    async (input: ItemInput, id?: string) => {
      await store.save(input, id)
      await reload()
    },
    [store, reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id)
      await reload()
    },
    [store, reload],
  )

  return { items, loading, error, save, remove, reload }
}
