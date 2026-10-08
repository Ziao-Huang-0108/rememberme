import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const MUTE_KEY = 'remember-me:song-muted'
const POS_KEY = 'remember-me:song-pos'
const SONG_SRC = '/song.mp3'
const SONG_TITLE = '4am'
const DRAG_THRESHOLD = 8
/** 松手时离边缘多近就自动贴边（播放中、静音都适用） */
const EDGE_SNAP_PX = 40

/** 淡黄油色，和陶土橙主按钮区分开 */
const BTN_BG = '#FFF3C4'
const BTN_RING = '#E8D48A'

type Pos = { x: number; y: number }

function defaultPos(): Pos {
  if (typeof window === 'undefined') return { x: 12, y: 16 }
  return {
    x: Math.max(12, window.innerWidth - 96),
    y: 16,
  }
}

function clampPos(pos: Pos, size = { w: 88, h: 40 }): Pos {
  if (typeof window === 'undefined') return pos
  const maxX = Math.max(8, window.innerWidth - size.w - 8)
  const maxY = Math.max(8, window.innerHeight - size.h - 8)
  return {
    x: Math.min(maxX, Math.max(8, pos.x)),
    y: Math.min(maxY, Math.max(8, pos.y)),
  }
}

function readPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return defaultPos()
    const parsed = JSON.parse(raw) as Partial<Pos>
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return clampPos(parsed as Pos)
    }
  } catch {
    /* ignore */
  }
  return defaultPos()
}

function edgeDistances(from: Pos, size: { w: number; h: number }) {
  const left = from.x
  const right = window.innerWidth - (from.x + size.w)
  const top = from.y
  const bottom = window.innerHeight - (from.y + size.h)
  return { left, right, top, bottom, nearest: Math.min(left, right, top, bottom) }
}

/** 是否靠近边缘，松手后应贴边 */
function shouldDock(from: Pos, size: { w: number; h: number }) {
  if (typeof window === 'undefined') return false
  return edgeDistances(from, size).nearest <= EDGE_SNAP_PX
}

/** 贴最近边缘，只露出大约一半 */
function dockPos(from: Pos, size: { w: number; h: number }): Pos {
  if (typeof window === 'undefined') return from
  const { left, right, top, bottom, nearest } = edgeDistances(from, size)

  let next = { ...from }
  if (nearest === left) next = { x: -size.w / 2, y: from.y }
  else if (nearest === right) next = { x: window.innerWidth - size.w / 2, y: from.y }
  else if (nearest === top) next = { x: from.x, y: -size.h / 2 }
  else if (nearest === bottom) next = { x: from.x, y: window.innerHeight - size.h / 2 }

  const maxY = Math.max(8, window.innerHeight - size.h / 2)
  const maxX = Math.max(8, window.innerWidth - size.w / 2)
  next.x = Math.min(maxX, Math.max(-size.w / 2, next.x))
  next.y = Math.min(maxY, Math.max(-size.h / 2, next.y))
  return next
}

export function SongPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const restPosRef = useRef<Pos>(readPos())
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1')
  const [ready, setReady] = useState(false)
  const [missing, setMissing] = useState(false)
  const [pos, setPos] = useState<Pos>(() => {
    const rest = readPos()
    restPosRef.current = rest
    if (localStorage.getItem(MUTE_KEY) === '1') {
      return dockPos(rest, { w: 40, h: 40 })
    }
    return rest
  })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    lastX: number
    lastY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = true
    audio.volume = 0.55

    const tryPlay = () => {
      if (localStorage.getItem(MUTE_KEY) === '1') return
      audio.muted = false
      void audio.play().catch(() => {
        const unlock = () => {
          if (localStorage.getItem(MUTE_KEY) === '1') return
          void audio.play().catch(() => undefined)
        }
        window.addEventListener('pointerdown', unlock, { once: true })
      })
    }

    tryPlay()
  }, [])

  useEffect(() => {
    function onResize() {
      const size = measure()
      if (muted) {
        setPos(dockPos(restPosRef.current, size))
      } else {
        setPos((p) => {
          const next = clampPos(p, size)
          restPosRef.current = next
          localStorage.setItem(POS_KEY, JSON.stringify(next))
          return next
        })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [muted])

  function measure() {
    const el = btnRef.current
    if (!el) return { w: muted ? 40 : 88, h: 40 }
    const rect = el.getBoundingClientRect()
    return { w: rect.width || 40, h: rect.height || 40 }
  }

  function applyMute(nextMuted: boolean) {
    const audio = audioRef.current
    setMuted(nextMuted)
    localStorage.setItem(MUTE_KEY, nextMuted ? '1' : '0')
    if (audio) {
      if (nextMuted) {
        audio.pause()
      } else {
        audio.muted = false
        void audio.play().catch(() => undefined)
      }
    }

    const size = measure()
    if (nextMuted) {
      // 先记下当前可见位置，再贴边只露一半
      if (!dragging) {
        restPosRef.current = clampPos(pos, size)
        localStorage.setItem(POS_KEY, JSON.stringify(restPosRef.current))
      }
      // 下一帧用实际按钮尺寸贴边
      requestAnimationFrame(() => {
        const s = measure()
        setPos(dockPos(restPosRef.current, s))
      })
    } else {
      const restored = clampPos(restPosRef.current, size)
      setPos(restored)
    }
  }

  function toggle() {
    applyMute(!muted)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      lastX: pos.x,
      lastY: pos.y,
      moved: false,
    }
    setDragging(true)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    drag.moved = true
    drag.lastX = drag.originX + dx
    drag.lastY = drag.originY + dy
    setPos({ x: drag.lastX, y: drag.lastY })
  }

  function endPointer(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }

    if (drag.moved) {
      const size = measure()
      const raw = { x: drag.lastX, y: drag.lastY }
      // 播放中拖到边界、或静音状态：松手都自动贴边只露一半
      if (muted || shouldDock(raw, size)) {
        restPosRef.current = clampPos(raw, size)
        localStorage.setItem(POS_KEY, JSON.stringify(restPosRef.current))
        setPos(dockPos(raw, size))
      } else {
        const next = clampPos(raw, size)
        restPosRef.current = next
        localStorage.setItem(POS_KEY, JSON.stringify(next))
        setPos(next)
      }
    } else {
      toggle()
    }
    dragRef.current = null
    setDragging(false)
  }

  const label = missing ? '暂无歌曲' : muted ? '打开音乐' : '静音'
  const showTitle = !missing && !muted

  return (
    <>
      <audio
        ref={audioRef}
        src={SONG_SRC}
        preload="auto"
        onCanPlay={() => setReady(true)}
        onError={() => setMissing(true)}
      />
      <button
        ref={btnRef}
        type="button"
        aria-label={`${label}（可拖动）`}
        aria-pressed={muted}
        title={missing ? '还没找到歌曲文件' : muted ? '点一下打开声音' : `正在播放 ${SONG_TITLE}，点按静音，可拖动`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className={`fixed z-40 flex min-h-10 touch-none select-none items-center justify-center gap-1 rounded-full px-2.5 py-2 shadow-[var(--shadow-soft)] active:scale-[0.98] ${
          showTitle ? 'min-w-10 px-3' : 'h-10 w-10 min-w-10 px-0'
        } ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${dragging ? '' : 'transition-[left,top] duration-300 ease-out'}`}
        style={{
          left: pos.x,
          top: pos.y,
          background: BTN_BG,
          boxShadow: `0 4px 12px rgba(180, 140, 40, 0.18), inset 0 0 0 1px ${BTN_RING}`,
        }}
      >
        <span
          className={`leading-none ${missing ? 'text-[12px] font-bold text-muted' : 'text-[15px]'}`}
          aria-hidden="true"
        >
          {missing ? '—' : '🎵'}
        </span>
        {showTitle && (
          <span className="max-w-20 truncate text-[12px] font-bold leading-none text-ink">
            {ready ? SONG_TITLE : '…'}
          </span>
        )}
      </button>
    </>
  )
}
