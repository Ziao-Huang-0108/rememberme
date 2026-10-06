import type { ExpiryInfo } from '../lib/expiry'

export function ExpiryBadge({ info }: { info: ExpiryInfo }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none whitespace-nowrap"
      style={{ background: info.color.bg, color: info.color.fg }}
    >
      {info.label.replace(/（.*）/, '')}
    </span>
  )
}
