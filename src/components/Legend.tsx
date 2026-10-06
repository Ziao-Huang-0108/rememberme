import { LEVELS, levelSwatch } from '../lib/expiry'

export default function Legend() {
  return (
    <details className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <summary className="cursor-pointer text-muted">颜色是什么意思？</summary>
      <ul className="mt-3 grid gap-2">
        {LEVELS.map(({ level, name, range }) => (
          <li key={level} className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: levelSwatch(level) }} />
            <span className="font-medium">{name}</span>
            <span className="text-muted">{range}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-muted">同一种颜色里，越接近过期颜色越深。</p>
    </details>
  )
}
