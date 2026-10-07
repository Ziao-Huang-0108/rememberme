const LIST_KEY = 'remember-me:usernames'
const LAST_KEY = 'remember-me:username'
const MAX = 20

export function listRememberedUsernames(): string[] {
  try {
    const raw = localStorage.getItem(LIST_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    const fromList = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
      : []
    const last = localStorage.getItem(LAST_KEY)?.trim()
    const merged = last ? [last, ...fromList.filter((u) => u !== last)] : fromList
    return [...new Set(merged.map((u) => u.trim()))]
  } catch {
    const last = localStorage.getItem(LAST_KEY)?.trim()
    return last ? [last] : []
  }
}

/** 登录成功后记到本机；最近用的排最前。只记用户名，不记密码。 */
export function rememberUsername(username: string) {
  const u = username.trim()
  if (!u) return
  const next = [u, ...listRememberedUsernames().filter((name) => name !== u)].slice(0, MAX)
  localStorage.setItem(LIST_KEY, JSON.stringify(next))
  localStorage.setItem(LAST_KEY, u)
}

/** 输入前缀匹配本机记过的用户名（例如 adm → administrator） */
export function matchRememberedUsernames(query: string): string[] {
  const q = query.trim().toLowerCase()
  const all = listRememberedUsernames()
  if (!q) return all.slice(0, 5)
  return all.filter((name) => {
    const lower = name.toLowerCase()
    return lower.startsWith(q) && lower !== q
  }).slice(0, 5)
}
