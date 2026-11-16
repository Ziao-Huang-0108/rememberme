import type { OcrResult, OcrResultItem } from '@paddleocr/paddleocr-js'

type OcrEngine = {
  predict: (image: Blob | File) => Promise<OcrResult[]>
}

const MODEL_CACHE = 'remember-me-ocr-v1'

let enginePromise: Promise<OcrEngine> | null = null

/** Cache model / wasm GETs so the first download is enough on this phone. */
async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init)
  if (request.method !== 'GET') return fetch(request)
  try {
    const cache = await caches.open(MODEL_CACHE)
    const hit = await cache.match(request)
    if (hit) return hit
    const res = await fetch(request)
    if (res.ok) {
      void cache.put(request, res.clone()).catch(() => {
        /* quota / private mode — ignore */
      })
    }
    return res
  } catch {
    return fetch(request)
  }
}

function sortItemsReadingOrder(items: OcrResultItem[]): OcrResultItem[] {
  return [...items].sort((a, b) => {
    const ay = a.poly[0]?.[1] ?? 0
    const by = b.poly[0]?.[1] ?? 0
    if (Math.abs(ay - by) > 12) return ay - by
    const ax = a.poly[0]?.[0] ?? 0
    const bx = b.poly[0]?.[0] ?? 0
    return ax - bx
  })
}

/** Join OCR lines into plain text for the shared hy3 fill step. */
export function ocrResultToText(result: OcrResult): string {
  return sortItemsReadingOrder(result.items)
    .map((item) => item.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
}

async function createEngine(): Promise<OcrEngine> {
  const { PaddleOCR } = await import('@paddleocr/paddleocr-js')
  const ocr = await PaddleOCR.create({
    lang: 'ch',
    ocrVersion: 'PP-OCRv5',
    worker: true,
    fetch: cachedFetch,
    ortOptions: {
      backend: 'wasm',
      // Match package worker CDN fallback; Cache API still applies via custom fetch.
      wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
      numThreads: 1,
      simd: true,
    },
  })
  return ocr
}

/** Lazy-load PaddleOCR (models download on first call, then cached). */
export function ensurePackageOcr(): Promise<OcrEngine> {
  if (!enginePromise) {
    enginePromise = createEngine().catch((err) => {
      enginePromise = null
      throw err
    })
  }
  return enginePromise
}

export async function recognizePackageText(
  image: Blob | File,
  onStatus?: (message: string) => void,
): Promise<string> {
  onStatus?.('首次会下载识别模型，请稍候…')
  const ocr = await ensurePackageOcr()
  onStatus?.('正在认包装上的字…')
  const [result] = await ocr.predict(image)
  const text = ocrResultToText(result)
  if (!text.trim()) {
    throw new Error('图片上没认出字，请靠近一点再拍，或换光线更亮的地方')
  }
  return text
}
