import { useRef, useCallback, useEffect, useState } from 'react'

const OUTPUT_SIZE = 1024
const CROP_VIEW_SIZE = 480

export default function CropModal({ imageSrc, onConfirm, onCancel }) {
  const cropRef = useRef(null)
  const imgRef = useRef(null)
  const [naturalSize, setNaturalSize] = useState(null)
  const [, tick] = useState(0)
  const rerender = () => tick((n) => n + 1)

  // All mutable in refs
  const state = useRef({ x: 0, y: 0, zoom: 1, baseW: 0, baseH: 0 })
  const dragRef = useRef(null)

  const cropSize = Math.min(CROP_VIEW_SIZE, typeof window !== 'undefined' ? window.innerWidth - 48 : CROP_VIEW_SIZE)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Load image
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      setNaturalSize({ w, h })

      const ratio = cropSize / Math.min(w, h)
      const bw = w * ratio
      const bh = h * ratio
      state.current = {
        baseW: bw,
        baseH: bh,
        zoom: 1,
        x: (cropSize - bw) / 2,
        y: (cropSize - bh) / 2,
      }
      rerender()
    }
    img.src = imageSrc
  }, [imageSrc, cropSize])

  function clamp(x, y, w, h) {
    return {
      x: w <= cropSize ? (cropSize - w) / 2 : Math.min(0, Math.max(cropSize - w, x)),
      y: h <= cropSize ? (cropSize - h) / 2 : Math.min(0, Math.max(cropSize - h, y)),
    }
  }

  // Drag
  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    const s = state.current
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y }

    function onMove(e) {
      const d = dragRef.current
      if (!d) return
      const s = state.current
      const w = s.baseW * s.zoom
      const h = s.baseH * s.zoom
      const pos = clamp(d.ox + (e.clientX - d.sx), d.oy + (e.clientY - d.sy), w, h)
      s.x = pos.x
      s.y = pos.y
      rerender()
    }

    function onUp() {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [cropSize])

  // Wheel zoom
  useEffect(() => {
    const el = cropRef.current
    if (!el) return

    function handler(e) {
      e.preventDefault()
      e.stopPropagation()

      const s = state.current
      if (!s.baseW) return

      const prevZoom = s.zoom
      const factor = e.deltaY > 0 ? 0.95 : 1.05
      const newZoom = Math.max(1, Math.min(prevZoom * factor, 5))
      s.zoom = newZoom

      const cx = cropSize / 2
      const cy = cropSize / 2
      const r = newZoom / prevZoom
      const nx = cx - (cx - s.x) * r
      const ny = cy - (cy - s.y) * r
      const w = s.baseW * newZoom
      const h = s.baseH * newZoom
      const pos = clamp(nx, ny, w, h)
      s.x = pos.x
      s.y = pos.y
      rerender()
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [cropSize])

  // Crop
  const handleConfirm = useCallback(() => {
    if (!naturalSize) return
    const s = state.current
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    const totalScale = (cropSize / Math.min(naturalSize.w, naturalSize.h)) * s.zoom
    const srcX = -s.x / totalScale
    const srcY = -s.y / totalScale
    const srcSize = cropSize / totalScale

    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onConfirm({
      base64: dataUrl.split(',')[1],
      mimeType: 'image/jpeg',
      preview: dataUrl,
    })
  }, [cropSize, naturalSize, onConfirm])

  const s = state.current
  const displayW = s.baseW * s.zoom
  const displayH = s.baseH * s.zoom

  return (
    <div
      className="fixed inset-0 bg-bg/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center px-6"
      onWheel={(e) => e.preventDefault()}
    >
      <p className="text-white text-sm mb-4">드래그하여 위치 조정 · 스크롤하여 확대/축소</p>

      <div
        ref={cropRef}
        className="relative overflow-hidden rounded-2xl border-2 border-accent2 cursor-grab active:cursor-grabbing"
        style={{ width: cropSize, height: cropSize, boxSizing: 'content-box' }}
        onPointerDown={onPointerDown}
      >
        {s.baseW > 0 && (
          <img
            ref={imgRef}
            src={imageSrc}
            alt="crop"
            draggable={false}
            className="absolute select-none pointer-events-none"
            style={{
              left: s.x,
              top: s.y,
              width: displayW,
              height: displayH,
              maxWidth: 'none',
              maxHeight: 'none',
            }}
          />
        )}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br" />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-transparent border border-border rounded-full text-dim text-sm hover:border-white hover:text-white transition"
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-3 bg-gradient-to-br from-accent to-[#ff8f65] rounded-full text-white text-sm font-medium hover:-translate-y-0.5 transition-all"
        >
          이 영역으로 선택
        </button>
      </div>
    </div>
  )
}
