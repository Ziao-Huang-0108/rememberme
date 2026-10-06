import { auth, db } from './cloudbase'

export interface Household {
  id: string
  name: string
  inviteCode: string
  createdBy: string
}

export interface Member {
  id: string
  householdId: string
  userId: string
  nickname: string
}

const HOUSEHOLD_KEY = 'remember-me:household-id'

export function getCachedHouseholdId(): string | null {
  return localStorage.getItem(HOUSEHOLD_KEY)
}

export function setCachedHouseholdId(id: string | null) {
  if (id) localStorage.setItem(HOUSEHOLD_KEY, id)
  else localStorage.removeItem(HOUSEHOLD_KEY)
}

function inviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

export async function currentUserId(): Promise<string | null> {
  const user = await auth.getCurrentUser()
  if (!user) return null
  return user.uid || (user as { id?: string }).id || null
}

export async function createHousehold(name: string, nickname: string): Promise<Household> {
  const userId = await currentUserId()
  if (!userId) throw new Error('请先登录')
  const trimmed = name.trim() || '我们家'
  const code = inviteCode()
  const now = new Date().toISOString()
  const houseRes = await db.collection('households').add({
    name: trimmed,
    inviteCode: code,
    createdBy: userId,
    createdAt: now,
  })
  const householdId = (houseRes as { id: string }).id
  await db.collection('members').add({
    householdId,
    userId,
    nickname: nickname.trim() || '家人',
    createdAt: now,
  })
  setCachedHouseholdId(householdId)
  return { id: householdId, name: trimmed, inviteCode: code, createdBy: userId }
}

export async function joinHousehold(code: string, nickname: string): Promise<Household> {
  const userId = await currentUserId()
  if (!userId) throw new Error('请先登录')
  const normalized = code.trim().toUpperCase()
  if (!normalized) throw new Error('请填写邀请码')

  const found = await db.collection('households').where({ inviteCode: normalized }).limit(1).get()
  const doc = (found.data as Array<Record<string, unknown>>)[0]
  if (!doc) throw new Error('邀请码不对，请再核对一下')

  const householdId = String(doc._id)
  const existing = await db.collection('members').where({ householdId, userId }).limit(1).get()
  if ((existing.data as unknown[]).length === 0) {
    await db.collection('members').add({
      householdId,
      userId,
      nickname: nickname.trim() || '家人',
      createdAt: new Date().toISOString(),
    })
  }
  setCachedHouseholdId(householdId)
  return {
    id: householdId,
    name: String(doc.name || '我们家'),
    inviteCode: String(doc.inviteCode || normalized),
    createdBy: String(doc.createdBy || ''),
  }
}

export async function loadHousehold(householdId: string): Promise<Household | null> {
  const res = await db.collection('households').doc(householdId).get()
  const doc = (res.data as Array<Record<string, unknown>>)[0]
  if (!doc) return null
  return {
    id: String(doc._id),
    name: String(doc.name || '我们家'),
    inviteCode: String(doc.inviteCode || ''),
    createdBy: String(doc.createdBy || ''),
  }
}

export async function listMembers(householdId: string): Promise<Member[]> {
  const res = await db.collection('members').where({ householdId }).get()
  return (res.data as Array<Record<string, unknown>>).map((doc) => ({
    id: String(doc._id),
    householdId: String(doc.householdId),
    userId: String(doc.userId),
    nickname: String(doc.nickname || '家人'),
  }))
}

export async function findMyHousehold(): Promise<Household | null> {
  const cached = getCachedHouseholdId()
  if (cached) {
    const house = await loadHousehold(cached)
    if (house) return house
  }
  const userId = await currentUserId()
  if (!userId) return null
  const mem = await db.collection('members').where({ userId }).limit(1).get()
  const first = (mem.data as Array<Record<string, unknown>>)[0]
  if (!first) return null
  const householdId = String(first.householdId)
  setCachedHouseholdId(householdId)
  return loadHousehold(householdId)
}
