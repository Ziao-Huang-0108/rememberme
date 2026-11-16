interface Props {
  src: string
  open: boolean
  onClose: () => void
}

/** 全屏看大图：点背景或「关掉」关闭 */
export function PhotoPreview({ src, open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/85"
      role="dialog"
      aria-modal="true"
      aria-label="照片预览"
    >
      <button
        type="button"
        aria-label="关掉预览"
        className="absolute inset-0 cursor-zoom-out"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
        <img
          src={src}
          alt=""
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="relative z-10 flex justify-center px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClose} className="btn-ghost min-h-12 bg-white/95 px-6 text-[16px]">
          关掉
        </button>
      </div>
    </div>
  )
}
