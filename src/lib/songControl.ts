/** 语音录入时临时停歌，结束后恢复（不改用户「静音」偏好） */

const HOLD = 'remember-me:song-hold'
const RELEASE = 'remember-me:song-release'

export function holdBackgroundSong() {
  window.dispatchEvent(new Event(HOLD))
}

export function releaseBackgroundSong() {
  window.dispatchEvent(new Event(RELEASE))
}

export function onSongHold(handler: () => void) {
  window.addEventListener(HOLD, handler)
  return () => window.removeEventListener(HOLD, handler)
}

export function onSongRelease(handler: () => void) {
  window.addEventListener(RELEASE, handler)
  return () => window.removeEventListener(RELEASE, handler)
}
