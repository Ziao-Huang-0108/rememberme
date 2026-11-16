import { describe, expect, it } from 'vitest'
import { ocrResultToText } from './packageOcr'
import type { OcrResult } from '@paddleocr/paddleocr-js'

function fakeResult(items: { text: string; y: number; x?: number }[]): OcrResult {
  return {
    image: { width: 100, height: 100 },
    items: items.map(({ text, y, x = 0 }) => ({
      text,
      score: 0.9,
      poly: [
        [x, y],
        [x + 10, y],
        [x + 10, y + 10],
        [x, y + 10],
      ],
    })),
    metrics: {
      detMs: 0,
      recMs: 0,
      totalMs: 0,
      detectedBoxes: items.length,
      recognizedCount: items.length,
    },
    runtime: {
      requestedBackend: 'wasm',
      detProvider: 'wasm',
      recProvider: 'wasm',
      webgpuAvailable: false,
    },
  }
}

describe('ocrResultToText', () => {
  it('joins lines in top-to-bottom reading order', () => {
    const text = ocrResultToText(
      fakeResult([
        { text: '保质期至2027年6月', y: 40 },
        { text: '布洛芬', y: 10 },
        { text: '退烧止痛', y: 25 },
      ]),
    )
    expect(text).toBe(['布洛芬', '退烧止痛', '保质期至2027年6月'].join('\n'))
  })

  it('skips blank lines', () => {
    const text = ocrResultToText(
      fakeResult([
        { text: '  ', y: 0 },
        { text: '阿莫西林', y: 10 },
      ]),
    )
    expect(text).toBe('阿莫西林')
  })
})
