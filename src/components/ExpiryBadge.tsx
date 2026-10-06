import type { ExpiryInfo } from '../lib/expiry'

export function ExpiryBadge({ info }: { info: ExpiryInfo }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[13px] font-black leading-none whitespace-nowrap"
      style={{ background: info.color, color: info.textColor }}
    >
      {info.label.replace(/（.*）/, '')}
    </span>
  )
}
