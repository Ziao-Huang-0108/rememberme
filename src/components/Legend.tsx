import { LEVELS, levelSwatch } from '../lib/expiry'

export function Legend() {
  return (
    <details className="text-[15px]">
      <summary className="cursor-pointer py-0.5 font-bold leading-snug text-ink">颜色点是什么意思？</summary>
      <ul className="mt-2 grid gap-2">
        {LEVELS.map(({ level, name, range }) => (
          <li key={level} className="flex items-center gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white" style={{ background: levelSwatch(level) }} />
            <span className="font-bold">{name}</span>
            <span className="text-muted">{range}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">同一种颜色里，越接近过期颜色越深。点卡片就能改写错的内容。</p>
    </details>
  )
}
