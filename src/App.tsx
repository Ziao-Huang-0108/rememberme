import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackgroundDots } from './components/BackgroundDots'
import { HouseholdSwitcher } from './components/HouseholdSwitcher'
import { SongPlayer } from './components/SongPlayer'
import { useAuth } from './hooks/useAuth'
import { useItems } from './hooks/useItems'
import { useToday } from './hooks/useToday'
import { cloudReady } from './lib/cloudbase'
import { createCloudStore } from './lib/cloudStore'
import {
  createHousehold,
  joinHousehold,
  listMembers,
  resolveCurrentHousehold,
  setCachedHouseholdId,
  type Household,
} from './lib/household'
import { localStore } from './lib/localStore'
import type { Item } from './lib/types'
import { HouseholdPage, InviteBanner } from './pages/HouseholdPage'
import { HouseholdPickerPage } from './pages/HouseholdPickerPage'
import { ItemFormPage } from './pages/ItemFormPage'
import { ItemsPage } from './pages/ItemsPage'
import { LoginPage } from './pages/LoginPage'

type Screen = { name: 'list' } | { name: 'form'; item?: Item }
type HouseGate = 'loading' | 'none' | 'pick' | 'setup' | 'ready'
type SetupMode = 'create' | 'join'

export default function App() {
  const today = useToday()
  const { user, loading: authLoading, error: authError, usernameHint, signIn, signOut } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [houseGate, setHouseGate] = useState<HouseGate>('loading')
  const [setupMode, setSetupMode] = useState<SetupMode>('create')
  const [houseError, setHouseError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'list' })
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [forceLocal, setForceLocal] = useState(() => localStorage.getItem('remember-me:force-local') === '1')

  const refreshMembers = useCallback(async (houseId: string) => {
    const members = await listMembers(houseId)
    setMemberNames(Object.fromEntries(members.map((m) => [m.userId, m.nickname])))
  }, [])

  const enterHousehold = useCallback(
    async (house: Household, list?: Household[]) => {
      setCachedHouseholdId(house.id)
      setHousehold(house)
      if (list) setHouseholds(list)
      else setHouseholds((prev) => (prev.some((h) => h.id === house.id) ? prev : [...prev, house]))
      await refreshMembers(house.id)
      setHouseGate('ready')
      setScreen({ name: 'list' })
      setSwitcherOpen(false)
    },
    [refreshMembers],
  )

  useEffect(() => {
    if (!user || forceLocal || !cloudReady) {
      setHousehold(null)
      setHouseholds([])
      setHouseGate('loading')
      return
    }
    let cancelled = false
    setHouseGate('loading')
    setHouseError(null)
    resolveCurrentHousehold()
      .then(async (resolved) => {
        if (cancelled) return
        setHouseholds(resolved.households)
        if (resolved.household) {
          setHousehold(resolved.household)
          const members = await listMembers(resolved.household.id)
          if (!cancelled) {
            setMemberNames(Object.fromEntries(members.map((m) => [m.userId, m.nickname])))
            setHouseGate('ready')
          }
        } else if (resolved.households.length === 0) {
          setHousehold(null)
          setHouseGate('none')
        } else {
          setHousehold(null)
          setHouseGate('pick')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setHouseError(e instanceof Error ? e.message : '读取家庭失败')
          setHouseGate('none')
        }
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

  async function handleCreate(name: string, nick: string) {
    const house = await createHousehold(name, nick)
    const resolved = await resolveCurrentHousehold()
    await enterHousehold(house, resolved.households)
  }

  async function handleJoin(code: string, nick: string) {
    const house = await joinHousehold(code, nick)
    const resolved = await resolveCurrentHousehold()
    await enterHousehold(house, resolved.households)
  }

  async function handleSignOut() {
    setCachedHouseholdId(null)
    setHousehold(null)
    setHouseholds([])
    setSwitcherOpen(false)
    setHouseGate('loading')
    await signOut()
  }

  if (!forceLocal && cloudReady) {
    if (authLoading || (user && houseGate === 'loading')) {
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

    if (houseGate === 'none' || houseGate === 'setup') {
      return (
        <>
          <BackgroundDots />
          <SongPlayer />
          <HouseholdPage
            nickname={user.nickname}
            initialMode={setupMode}
            onCreate={handleCreate}
            onJoin={handleJoin}
            onSignOut={handleSignOut}
            onBack={
              houseGate === 'setup' && households.length > 0
                ? () => setHouseGate('pick')
                : undefined
            }
          />
          {houseError && (
            <p className="fixed bottom-6 left-4 right-4 z-30 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {houseError}
            </p>
          )}
        </>
      )
    }

    if (houseGate === 'pick') {
      return (
        <>
          <BackgroundDots />
          <SongPlayer />
          <HouseholdPickerPage
            households={households}
            onSelect={(house) => void enterHousehold(house, households)}
            onCreateNew={() => {
              setSetupMode('create')
              setHouseGate('setup')
            }}
            onJoinNew={() => {
              setSetupMode('join')
              setHouseGate('setup')
            }}
            onSignOut={handleSignOut}
          />
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
          householdName={household?.name}
          notice={
            household ? (
              <InviteBanner household={household} />
            ) : forceLocal ? (
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
            ) : null
          }
          headerAction={
            household ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('退出后要重新登录才能看到家里的清单')) {
                    void handleSignOut()
                  }
                }}
                className="btn-ghost shrink-0 px-3 text-[14px]"
              >
                {user?.nickname || '退出'}
              </button>
            ) : undefined
          }
          onOpenHouseholdSwitcher={household ? () => setSwitcherOpen(true) : undefined}
          onAdd={() => setScreen({ name: 'form' })}
          onEdit={(item) => setScreen({ name: 'form', item })}
        />
      )}

      {household && user && (
        <HouseholdSwitcher
          open={switcherOpen}
          households={households}
          currentId={household.id}
          nickname={user.nickname}
          onClose={() => setSwitcherOpen(false)}
          onSelect={(house) => void enterHousehold(house, households)}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      )}
    </>
  )
}
