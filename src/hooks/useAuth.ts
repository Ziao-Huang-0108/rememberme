import { useCallback, useEffect, useState } from 'react'
import { auth, authErrorMessage, cloudReady } from '../lib/cloudbase'

export interface AuthUser {
  id: string
  nickname: string
  isAnonymous: boolean
}

function mapUser(user: {
  uid?: string
  sub?: string
  id?: string
  is_anonymous?: boolean
  name?: string
  nickName?: string
  username?: string
  user_metadata?: { name?: string; nickName?: string; username?: string }
} | null): AuthUser | null {
  if (!user) return null
  const id = user.uid || user.sub || user.id
  if (!id) return null
  const nickname =
    user.nickName ||
    user.name ||
    user.username ||
    user.user_metadata?.nickName ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    '家人'
  return { id, nickname, isAnonymous: Boolean(user.is_anonymous) }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!cloudReady) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const current = await auth.getCurrentUser()
      setUser(mapUser(current as Parameters<typeof mapUser>[0]))
      setError(null)
    } catch (e) {
      setUser(null)
      setError(authErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const sub = auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => {
      sub.data.subscription.unsubscribe()
    }
  }, [refresh])

  const signInWithNickname = useCallback(async (nickname: string) => {
    setError(null)
    const name = nickname.trim()
    if (!name) throw new Error('请先写一个称呼，比如「妈妈」')
    const { error: anonError } = await auth.signInAnonymously({})
    if (anonError) throw new Error(authErrorMessage(anonError))
    try {
      await auth.updateUserBasicInfo({ nickname: name })
    } catch {
      try {
        await auth.updateUser({ nickname: name })
      } catch {
        /* 昵称写进家庭成员表也行 */
      }
    }
    localStorage.setItem('remember-me:nickname', name)
    await refresh()
  }, [refresh])

  const signInWithWechat = useCallback(async () => {
    setError(null)
    const redirectTo = `${window.location.origin}/`
    const { data, error: oauthError } = await auth.signInWithOAuth({
      provider: 'wechat',
      options: { redirectTo },
    })
    if (oauthError) throw new Error(authErrorMessage(oauthError))
    if (data?.url) {
      window.location.href = data.url
      return
    }
    throw new Error('微信登录还没在 CloudBase 控制台开通，或开放平台还没配好。')
  }, [])

  const signOut = useCallback(async () => {
    await auth.signOut()
    localStorage.removeItem('remember-me:nickname')
    await refresh()
  }, [refresh])

  return {
    user,
    loading,
    error,
    nicknameHint: localStorage.getItem('remember-me:nickname') || '',
    signInWithNickname,
    signInWithWechat,
    signOut,
    refresh,
  }
}
