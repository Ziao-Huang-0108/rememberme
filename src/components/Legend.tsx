import { LEVELS, levelSwatch } from '../lib/expiry'

export function Legend() {
  return (
    <details className="rounded-[24px] bg-surface px-4 py-3 text-sm shadow-[0_6px_0_0_rgba(28,20,12,0.08)] ring-2 ring-ink/10">
      <summary className="cursor-pointer font-bold">颜色点是什么意思？</summary>
      <ul className="mt-3 grid gap-2">
        {LEVELS.map(({ level, name, range }) => (
          <li key={level} className="flex items-center gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white" style={{ background: levelSwatch(level) }} />
            <span className="font-bold">{name}</span>
            <span className="text-muted">{range}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-muted">同一种颜色里，越接近过期颜色越深。点卡片就能改写错的内容。</p>
    </details>
  )
}
