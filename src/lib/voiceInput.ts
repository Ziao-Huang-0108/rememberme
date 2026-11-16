import { holdBackgroundSong, releaseBackgroundSong } from './songControl'

type SpeechRecognitionResultLike = {
  readonly isFinal: boolean
  readonly 0: { transcript: string }
}

type SpeechRecognitionEventLike = {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResultLike> & { length: number }
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function speechRecognitionAvailable(): boolean {
  return getSpeechRecognitionCtor() != null
}

export type VoiceListenHandle = {
  /** 再点一次结束；返回已认出的整段字 */
  stop: () => Promise<string>
}

/**
 * 点一下开始听（并暂停背景音乐若正在播），再点结束（并恢复音乐）。
 * 用系统自带语音识别；不支持时抛错。
 */
export function startVoiceListen(options?: {
  onPartial?: (text: string) => void
  /** 浏览器自己停、或用户点结束之后都会回调一次 */
  onEnded?: (text: string) => void
}): VoiceListenHandle {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    throw new Error('这台手机或浏览器还不支持语音输入，请改用拍包装、粘贴文字或手填')
  }

  holdBackgroundSong()

  const recognition = new Ctor()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let finalText = ''
  let interimText = ''
  let settled = false
  let userStopping = false
  let resolveStop: ((text: string) => void) | null = null
  let rejectStop: ((err: Error) => void) | null = null
  const stopPromise = new Promise<string>((resolve, reject) => {
    resolveStop = resolve
    rejectStop = reject
  })

  function emitPartial() {
    const combined = `${finalText}${interimText}`.trim()
    options?.onPartial?.(combined)
  }

  function finish(ok: boolean, err?: Error) {
    if (settled) return
    settled = true
    releaseBackgroundSong()
    const text = `${finalText}${interimText}`.trim()
    if (ok) {
      resolveStop?.(text)
      if (!userStopping) options?.onEnded?.(text)
    } else {
      rejectStop?.(err ?? new Error('语音识别失败，请再试一次'))
    }
  }

  recognition.onresult = (ev) => {
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const piece = ev.results[i]
      const transcript = piece[0]?.transcript ?? ''
      if (piece.isFinal) finalText += transcript
      else interim += transcript
    }
    interimText = interim
    emitPartial()
  }

  recognition.onerror = (ev) => {
    const code = ev.error ?? ''
    if (code === 'aborted' || code === 'no-speech') {
      // 用户主动停、或暂时没说话：不当成硬错误，交给 onend 收尾
      return
    }
    if (code === 'not-allowed') {
      finish(false, new Error('没有麦克风权限，请在系统设置里允许本站使用麦克风后再试'))
      return
    }
    finish(false, new Error('语音识别出了点问题，请再试一次或改用手填'))
  }

  recognition.onend = () => {
    // 浏览器有时会自己停；若用户还没点结束，也当作本轮结束
    finish(true)
  }

  try {
    recognition.start()
  } catch {
    finish(false, new Error('没法开始听，请再点一次「说话填写」'))
  }

  return {
    stop: () => {
      userStopping = true
      try {
        recognition.stop()
      } catch {
        finish(true)
      }
      return stopPromise
    },
  }
}
