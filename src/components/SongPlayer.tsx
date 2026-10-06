import { useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'remember-me:song-muted'
const SONG_SRC = '/song.mp3'

export function SongPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1')
  const [ready, setReady] = useState(false)
  const [missing, setMissing] = useState(false)

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

  function toggle() {
    const audio = audioRef.current
    const next = !muted
    setMuted(next)
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    if (!audio) return
    if (next) {
      audio.pause()
    } else {
      audio.muted = false
      void audio.play().catch(() => undefined)
    }
  }

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
        type="button"
        onClick={toggle}
        className="fixed top-[calc(10px+env(safe-area-inset-top))] right-3 z-30 rounded-full bg-surface px-3 py-2 text-sm font-black shadow-[0_4px_0_0_rgba(28,20,12,0.12)] ring-2 ring-ink/10"
        aria-pressed={muted}
        title={missing ? '还没找到歌曲文件' : muted ? '打开声音（4am）' : '静音'}
      >
        {missing ? '暂无歌曲' : muted ? '🔇 静音中' : ready ? '🔊 4am' : '🔊 准备唱'}
      </button>
    </>
  )
}
