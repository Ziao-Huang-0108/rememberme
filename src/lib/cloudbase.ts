import cloudbase from '@cloudbase/js-sdk'

const env = import.meta.env.VITE_CLOUDBASE_ENV as string | undefined
const region = (import.meta.env.VITE_CLOUDBASE_REGION as string | undefined) || 'ap-shanghai'

if (!env) {
  console.warn('还没有配置 VITE_CLOUDBASE_ENV，云端功能暂时不可用')
}

export const cloudEnvId = env ?? ''
export const cloudReady = Boolean(env)

export const app = cloudbase.init({
  env: env || 'missing-env',
  region,
})

export const auth = app.auth({ persistence: 'local' })

/** PostgreSQL 客户端（CloudBase SQL 型数据库） */
export const rdb = typeof app.rdb === 'function' ? app.rdb() : app.rdb

export function authErrorMessage(error: unknown): string {
  if (!error) return '出了点问题，请再试一次'
  if (typeof error === 'object' && error && 'message' in error) {
    const msg = String((error as { message?: string }).message || '')
    if (/safe|domain|来源|origin|cors/i.test(msg)) {
      return '网页域名还没加到 CloudBase 安全域名里。请在控制台加上 localhost，等几分钟再试。'
    }
    if (/username|password|用户名|密码|disabled|未开启|not enable/i.test(msg)) {
      return '还没打开用户名密码登录，或账号不对。请到 CloudBase 控制台打开「用户名密码登录」。'
    }
    if (/permission|policy|row-level|RLS|42501|not found|relation|does not exist/i.test(msg)) {
      return '数据库表或权限还没配好。请在 SQL 编辑器执行项目里的 cloudbase/schema.sql。'
    }
    if (msg) return msg
  }
  if (typeof error === 'object' && error && 'error' in error) {
    return authErrorMessage((error as { error: unknown }).error)
  }
  return '出了点问题，请再试一次'
}

export function throwIfDbError(error: unknown, fallback = '数据库操作失败') {
  if (!error) return
  throw new Error(authErrorMessage(error) || fallback)
}
