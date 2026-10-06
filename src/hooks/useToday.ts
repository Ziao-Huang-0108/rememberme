import { useEffect, useState } from 'react'
import { todayString } from '../lib/expiry'

/** 当天日期；页面一直开着时过了零点、或从后台切回来时会自动刷新 */
export function useToday(): string {
  const [today, setToday] = useState(todayString)

  useEffect(() => {
    const refresh = () => setToday(todayString())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return today
}
