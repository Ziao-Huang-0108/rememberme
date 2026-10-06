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

function validateUsername(username: string) {
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,23}$/.test(username)) {
    throw new Error('用户名请用英文开头，3～24 位，可含数字、下划线、横线，不要用中文')
  }
}

function validatePassword(password: string) {
  if (password.length < 6) throw new Error('密码至少 6 位')
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
        // 兼容旧接口
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

  const signUp = useCallback(
    async (username: string, password: string, nickname: string) => {
      setError(null)
      const u = username.trim()
      const nick = nickname.trim() || u
      validateUsername(u)
      validatePassword(password)

      const result = await auth.signUp({
        username: u,
        password,
        name: nick,
      })

      if (result && 'error' in result && result.error) {
        const msg = authErrorMessage(result.error)
        if (/username|用户名|password|密码|not allow|不允许|just by/i.test(msg)) {
          throw new Error(
            '腾讯云不允许网页上直接用「用户名+密码」注册。请打开 CloudBase 控制台 → 用户管理 → 添加用户，给家人建好账号后，再用这个页面登录。',
          )
        }
        throw new Error(msg)
      }

      // 有的版本 signUp 不会自动登录
      try {
        await auth.signInWithPassword({ username: u, password })
      } catch {
        try {
          await auth.signIn({ username: u, password })
        } catch {
          /* signUp 已自动登录时忽略 */
        }
      }

      try {
        await auth.updateUserBasicInfo({ nickname: nick })
      } catch {
        /* 称呼会写进家庭成员表 */
      }
      localStorage.setItem('remember-me:username', u)
      localStorage.setItem('remember-me:nickname', nick)
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
    signUp,
    signOut,
    refresh,
  }
}
