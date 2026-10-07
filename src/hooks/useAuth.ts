import { useCallback, useEffect, useState } from 'react'
import { auth, authErrorMessage, cloudReady } from '../lib/cloudbase'

export interface AuthUser {
  id: string
  nickname: string
  username: string
}

function mapUser(user: {
  uid?: string
  id?: string
  username?: string
  name?: string
  nickName?: string
  nickname?: string
  user_metadata?: { name?: string; nickName?: string; nickname?: string; username?: string }
} | null): AuthUser | null {
  if (!user) return null
  const id = user.uid || user.id
  if (!id) return null
  const username = user.username || user.user_metadata?.username || ''
  const nickname =
    user.nickname ||
    user.nickName ||
    user.name ||
    user.user_metadata?.nickname ||
    user.user_metadata?.nickName ||
    user.user_metadata?.name ||
    username ||
    '家人'
  return { id, nickname, username }
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
    try {
      const sub = auth.onAuthStateChange(() => {
        void refresh()
      })
      return () => {
        sub.data.subscription.unsubscribe()
      }
    } catch {
      return undefined
    }
  }, [refresh])

  const signIn = useCallback(
    async (username: string, password: string) => {
      setError(null)
      const u = username.trim()
      if (!u || !password) throw new Error('请填写用户名和密码')
      const { error: loginError } = await auth.signInWithPassword({ username: u, password })
      if (loginError) {
        try {
          await auth.signIn({ username: u, password })
        } catch (e) {
          throw new Error(authErrorMessage(loginError) || authErrorMessage(e) || '用户名或密码不对')
        }
      }
      localStorage.setItem('remember-me:username', u)
      await refresh()
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    await auth.signOut()
    await refresh()
  }, [refresh])

  return {
    user,
    loading,
    error,
    usernameHint: localStorage.getItem('remember-me:username') || '',
    signIn,
    signOut,
    refresh,
  }
}
