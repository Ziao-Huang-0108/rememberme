const DOTS = [
  { top: '4%', left: '6%', size: 20, color: '#ffd38a', duration: '16s', delay: '0s' },
  { top: '8%', left: '90%', size: 16, color: '#ff8f73', duration: '19s', delay: '1.2s' },
  { top: '32%', left: '94%', size: 13, color: '#c9a0ff', duration: '14s', delay: '2.4s' },
  { top: '52%', left: '3%', size: 15, color: '#8aa7f5', duration: '21s', delay: '0.6s' },
  { top: '72%', left: '93%', size: 18, color: '#7ad0c4', duration: '17s', delay: '3s' },
  { top: '90%', left: '8%', size: 16, color: '#7ad0c4', duration: '15s', delay: '1.8s' },
  { top: '88%', left: '85%', size: 14, color: '#8aa7f5', duration: '18s', delay: '2.8s' },
]

/** 永远待在内容后面，不挡字、不挡卡片 */
export function BackgroundDots() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {DOTS.map((dot, i) => (
        <span
          key={i}
          className="bg-dot"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            background: dot.color,
            animationDuration: dot.duration,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  )
}
