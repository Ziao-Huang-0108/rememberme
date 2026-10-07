import { useEffect, useMemo, useState } from 'react'
import { BackgroundDots } from './components/BackgroundDots'
import { SongPlayer } from './components/SongPlayer'
import { useAuth } from './hooks/useAuth'
import { useItems } from './hooks/useItems'
import { useToday } from './hooks/useToday'
import { cloudReady } from './lib/cloudbase'
import { createCloudStore } from './lib/cloudStore'
import {
  createHousehold,
  findMyHousehold,
  joinHousehold,
  listMembers,
  setCachedHouseholdId,
  type Household,
} from './lib/household'
import { localStore } from './lib/localStore'
import type { Item } from './lib/types'
import { HouseholdPage, InviteBanner } from './pages/HouseholdPage'
import { ItemFormPage } from './pages/ItemFormPage'
import { ItemsPage } from './pages/ItemsPage'
import { LoginPage } from './pages/LoginPage'

type Screen = { name: 'list' } | { name: 'form'; item?: Item }

export default function App() {
  const today = useToday()
  const { user, loading: authLoading, error: authError, usernameHint, signIn, signOut } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [houseLoading, setHouseLoading] = useState(false)
  const [houseError, setHouseError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'list' })
  const [forceLocal, setForceLocal] = useState(() => localStorage.getItem('remember-me:force-local') === '1')

  useEffect(() => {
    if (!user || forceLocal || !cloudReady) {
      setHousehold(null)
      return
    }
    let cancelled = false
    setHouseLoading(true)
    setHouseError(null)
    findMyHousehold()
      .then(async (house) => {
        if (cancelled) return
        setHousehold(house)
        if (house) {
          const members = await listMembers(house.id)
          if (!cancelled) {
            setMemberNames(Object.fromEntries(members.map((m) => [m.userId, m.nickname])))
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setHouseError(e instanceof Error ? e.message : '读取家庭失败')
      })
      .finally(() => {
        if (!cancelled) setHouseLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, forceLocal])

  const store = useMemo(() => {
    if (household && !forceLocal) return createCloudStore(household.id)
    return localStore
  }, [household, forceLocal])

  const { items, loading, error, save, remove } = useItems(store)
  const locations = useMemo(() => [...new Set(items.map((i) => i.location).filter(Boolean))].sort(), [items])

  if (!forceLocal && cloudReady) {
    if (authLoading || (user && houseLoading)) {
      return (
        <>
          <BackgroundDots />
          <p className="relative z-10 grid min-h-dvh place-items-center font-bold text-muted">小六在开门…</p>
        </>
      )
    }

    if (!user) {
      return (
        <>
          <BackgroundDots />
          <SongPlayer />
          <LoginPage usernameHint={usernameHint} error={authError} onSignIn={signIn} />
        </>
      )
    }

    if (!household) {
      return (
        <>
          <BackgroundDots />
          <SongPlayer />
          <HouseholdPage
            nickname={user.nickname}
            onCreate={async (name, nick) => {
              const house = await createHousehold(name, nick)
              setHousehold(house)
              setMemberNames({ [user.id]: nick })
            }}
            onJoin={async (code, nick) => {
              const house = await joinHousehold(code, nick)
              setHousehold(house)
              const members = await listMembers(house.id)
              setMemberNames(Object.fromEntries(members.map((m) => [m.userId, m.nickname])))
            }}
            onSignOut={async () => {
              setCachedHouseholdId(null)
              setHousehold(null)
              await signOut()
            }}
          />
          {houseError && <p className="fixed bottom-6 left-4 right-4 z-30 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{houseError}</p>}
        </>
      )
    }
  }

  return (
    <>
      <BackgroundDots />
      <SongPlayer />
      {screen.name === 'form' ? (
        <ItemFormPage
          key={screen.item?.id ?? 'new'}
          item={screen.item}
          today={today}
          locations={locations}
          onCancel={() => setScreen({ name: 'list' })}
          onSave={async (input) => {
            await save(input, screen.item?.id)
            setScreen({ name: 'list' })
          }}
          onDelete={
            screen.item
              ? async () => {
                  await remove(screen.item!.id)
                  setScreen({ name: 'list' })
                }
              : undefined
          }
        />
      ) : (
        <ItemsPage
          items={items}
          today={today}
          loading={loading}
          error={error}
          memberNames={memberNames}
          notice={household ? <InviteBanner household={household} /> : forceLocal ? (
            <div className="mb-3 rounded-[24px] bg-surface px-4 py-3 text-sm ring-2 ring-ink/10">
              当前是本机模式，家人看不到。
              <button
                type="button"
                className="ml-2 font-bold text-accent underline"
                onClick={() => {
                  localStorage.removeItem('remember-me:force-local')
                  setForceLocal(false)
                }}
              >
                改回云端同步
              </button>
            </div>
          ) : null}
          headerAction={
            household ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('退出后要重新登录才能看到家里的清单')) {
                    setCachedHouseholdId(null)
                    setHousehold(null)
                    await signOut()
                  }
                }}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold ring-2 ring-ink/10"
              >
                {user?.nickname || '退出'}
              </button>
            ) : undefined
          }
          onAdd={() => setScreen({ name: 'form' })}
          onEdit={(item) => setScreen({ name: 'form', item })}
        />
      )}
    </>
  )
}
