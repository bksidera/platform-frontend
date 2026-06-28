import { useEffect, useState } from 'react'

/**
 * Derives the mat color from the poster itself (Addendum 2 §2): a deep,
 * desaturated pull from the work's palette — darker than the work, never pure
 * black, never a default gray. Samples the image on a small canvas, averages,
 * then drops saturation and lightness into mat territory.
 */
export function useMatColor(imageUrl: string, fallback = '#1c1812') {
  const [matColor, setMatColor] = useState(fallback)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        const n = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          r += data[i] ?? 0
          g += data[i + 1] ?? 0
          b += data[i + 2] ?? 0
        }
        const [h, s] = rgbToHsl(r / n, g / n, b / n)
        // Deep desaturated pull: keep the hue, drain most saturation, sink
        // the lightness well below the work's.
        setMatColor(hslToCss(h, Math.min(s * 0.45, 0.22), 0.11))
      } catch {
        // Canvas tainted (no CORS) — keep the fallback.
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  return matColor
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToCss(h: number, s: number, l: number) {
  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
}
