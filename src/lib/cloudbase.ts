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
export const db = app.database()

export function authErrorMessage(error: unknown): string {
  if (!error) return '出了点问题，请再试一次'
  if (typeof error === 'object' && error && 'message' in error) {
    const msg = String((error as { message?: string }).message || '')
    if (/safe|domain|来源|origin|cors/i.test(msg)) {
      return '网页域名还没加到 CloudBase 安全域名里。请在控制台加上 localhost，等几分钟再试。'
    }
    if (/匿名|anonymous|ANONYMOUS/i.test(msg)) {
      return '还没打开匿名登录。请到 CloudBase 控制台 → 身份认证 → 登录方式，打开「匿名登录」。'
    }
    if (msg) return msg
  }
  return '出了点问题，请再试一次'
}
