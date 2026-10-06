import { auth, rdb, throwIfDbError } from './cloudbase'

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

function mapHousehold(row: Record<string, unknown>): Household {
  return {
    id: String(row.id),
    name: String(row.name || '我们家'),
    inviteCode: String(row.invite_code || ''),
    createdBy: String(row.created_by || ''),
  }
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

  const { data, error } = await rdb
    .from('households')
    .insert({
      name: trimmed,
      invite_code: code,
      created_by: userId,
    })
    .select()
  throwIfDbError(error, '创建家庭失败')

  const row = (data as Array<Record<string, unknown>> | null)?.[0]
  if (!row?.id) throw new Error('创建家庭失败，没有返回家庭编号')
  const householdId = String(row.id)

  const { error: memError } = await rdb.from('members').insert({
    household_id: householdId,
    user_id: userId,
    nickname: nickname.trim() || '家人',
  })
  throwIfDbError(memError, '加入家庭成员失败')

  setCachedHouseholdId(householdId)
  return mapHousehold(row)
}

export async function joinHousehold(code: string, nickname: string): Promise<Household> {
  const userId = await currentUserId()
  if (!userId) throw new Error('请先登录')
  const normalized = code.trim().toUpperCase()
  if (!normalized) throw new Error('请填写邀请码')

  const { data, error } = await rdb.from('households').select().eq('invite_code', normalized).limit(1)
  throwIfDbError(error, '查找邀请码失败')
  const row = (data as Array<Record<string, unknown>> | null)?.[0]
  if (!row) throw new Error('邀请码不对，请再核对一下')

  const householdId = String(row.id)
  const { data: existing, error: existError } = await rdb
    .from('members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .limit(1)
  throwIfDbError(existError)

  if (!(existing as unknown[] | null)?.length) {
    const { error: memError } = await rdb.from('members').insert({
      household_id: householdId,
      user_id: userId,
      nickname: nickname.trim() || '家人',
    })
    throwIfDbError(memError, '加入家庭失败')
  }

  setCachedHouseholdId(householdId)
  return mapHousehold(row)
}

export async function loadHousehold(householdId: string): Promise<Household | null> {
  const { data, error } = await rdb.from('households').select().eq('id', householdId).limit(1)
  throwIfDbError(error)
  const row = (data as Array<Record<string, unknown>> | null)?.[0]
  return row ? mapHousehold(row) : null
}

export async function listMembers(householdId: string): Promise<Member[]> {
  const { data, error } = await rdb.from('members').select().eq('household_id', householdId)
  throwIfDbError(error)
  return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
    id: String(row.id),
    householdId: String(row.household_id),
    userId: String(row.user_id),
    nickname: String(row.nickname || '家人'),
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
  const { data, error } = await rdb.from('members').select().eq('user_id', userId).limit(1)
  throwIfDbError(error)
  const first = (data as Array<Record<string, unknown>> | null)?.[0]
  if (!first) return null
  const householdId = String(first.household_id)
  setCachedHouseholdId(householdId)
  return loadHousehold(householdId)
}
