import { useMemo, useState } from 'react'
import { useItems } from './hooks/useItems'
import { useToday } from './hooks/useToday'
import { localStore } from './lib/localStore'
import type { Item } from './lib/types'
import ItemFormPage from './pages/ItemFormPage'
import ItemsPage from './pages/ItemsPage'

type Screen = { name: 'list' } | { name: 'form'; item?: Item }

export default function App() {
  const today = useToday()
  const { items, loading, error, save, remove } = useItems(localStore)
  const [screen, setScreen] = useState<Screen>({ name: 'list' })
  const locations = useMemo(() => [...new Set(items.map((i) => i.location).filter(Boolean))].sort(), [items])

  if (screen.name === 'form') {
    const { item } = screen
    const back = () => setScreen({ name: 'list' })
    return (
      <ItemFormPage
        key={item?.id ?? 'new'}
        item={item}
        today={today}
        locations={locations}
        onCancel={back}
        onSave={async (input) => {
          await save(input, item?.id)
          back()
        }}
        onDelete={
          item
            ? async () => {
                await remove(item.id)
                back()
              }
            : undefined
        }
      />
    )
  }

  return (
    <ItemsPage
      items={items}
      today={today}
      loading={loading}
      error={error}
      onAdd={() => setScreen({ name: 'form' })}
      onEdit={(item) => setScreen({ name: 'form', item })}
    />
  )
}
