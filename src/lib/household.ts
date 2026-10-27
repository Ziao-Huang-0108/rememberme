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

/** 当前用户加入的全部家庭 */
export async function listMyHouseholds(): Promise<Household[]> {
  const userId = await currentUserId()
  if (!userId) return []

  const { data, error } = await rdb.from('members').select().eq('user_id', userId)
  throwIfDbError(error)
  const memberRows = (data as Array<Record<string, unknown>>) || []
  if (memberRows.length === 0) return []

  const ids = [...new Set(memberRows.map((row) => String(row.household_id)))]
  const houses: Household[] = []
  for (const id of ids) {
    const house = await loadHousehold(id)
    if (house) houses.push(house)
  }
  return houses
}

/**
 * 解析「当前家」：
 * - 缓存仍在自己的成员列表里 → 用缓存
 * - 只有一家 → 自动选中并写入缓存
 * - 多家且无合法缓存 → null（交给选家 UI）
 * - 零家 → null
 */
export async function resolveCurrentHousehold(
  households?: Household[],
): Promise<{ households: Household[]; household: Household | null }> {
  const list = households ?? (await listMyHouseholds())
  if (list.length === 0) {
    setCachedHouseholdId(null)
    return { households: list, household: null }
  }

  const cached = getCachedHouseholdId()
  if (cached) {
    const match = list.find((h) => h.id === cached)
    if (match) return { households: list, household: match }
    setCachedHouseholdId(null)
  }

  if (list.length === 1) {
    setCachedHouseholdId(list[0].id)
    return { households: list, household: list[0] }
  }

  return { households: list, household: null }
}

/** @deprecated 请用 resolveCurrentHousehold；保留给旧调用兼容 */
export async function findMyHousehold(): Promise<Household | null> {
  const { household } = await resolveCurrentHousehold()
  return household
}
