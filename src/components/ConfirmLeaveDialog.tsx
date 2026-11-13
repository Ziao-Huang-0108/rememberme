interface Props {
  open: boolean
  householdName: string
  isLastMember: boolean
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmLeaveDialog({
  open,
  householdName,
  isLastMember,
  busy,
  error,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-household-title"
    >
      <button
        type="button"
        aria-label="先留着"
        className="absolute inset-0 bg-ink/30"
        onClick={onCancel}
        disabled={busy}
      />
      <div className="relative z-10 w-full max-w-xl rounded-t-[24px] bg-bg px-4 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[var(--shadow-soft)]">
        <h2 id="leave-household-title" className="text-xl font-bold">
          要退出「{householdName}」吗？
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed">
          退出后你看不到这家的清单。东西还在，其他家人不受影响，邀请码还能再加入。
        </p>
        {isLastMember && (
          <p className="mt-2 text-[16px] leading-relaxed">这家会空着，邀请码仍可以把人加回来。</p>
        )}
        {error && (
          <p className="mt-3 rounded-[var(--radius-card)] bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>
        )}
        <button type="button" className="btn-primary mt-5 w-full" onClick={onCancel} disabled={busy}>
          先留着
        </button>
        <button type="button" className="btn-ghost mt-3 w-full disabled:opacity-50" onClick={onConfirm} disabled={busy}>
          {busy ? '正在退出…' : '确认退出'}
        </button>
      </div>
    </div>
  )
}
