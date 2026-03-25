import { useRef, useState, useCallback, useEffect } from 'react'

export default function Webcam({ onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | streaming | captured
  const [preview, setPreview] = useState(null)

  const startCamera = useCallback(async () => {
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStatus('streaming')
    } catch {
      setStatus('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setPreview(dataUrl)
    setStatus('captured')
    stopCamera()
  }

  const retake = () => {
    setPreview(null)
    setStatus('idle')
    startCamera()
  }

  const confirm = () => {
    if (preview) onCapture(preview)
  }

  return (
    <div className="w-full max-w-[480px] aspect-[4/3] border border-border rounded-b-2xl bg-surface flex flex-col items-center justify-center overflow-hidden relative">
      {/* Video */}
      {status !== 'captured' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
          style={{ display: status === 'streaming' ? 'block' : 'none' }}
        />
      )}

      {/* Preview */}
      {status === 'captured' && preview && (
        <img src={preview} alt="captured" className="w-full h-full object-cover scale-x-[-1]" />
      )}

      {/* Canvas (hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Starting message */}
      {(status === 'idle' || status === 'starting') && (
        <p className="text-dim text-sm">카메라를 켜는 중...</p>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center px-6">
          <p className="text-dim text-sm">카메라 접근이 거부되었습니다.</p>
          <p className="text-dim text-xs mt-1">브라우저 설정에서 카메라를 허용해주세요.</p>
          <button
            onClick={startCamera}
            className="mt-3 text-xs text-accent2 border border-accent2/30 rounded-full px-4 py-1.5 hover:bg-accent2/10 transition"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Capture button */}
      {status === 'streaming' && (
        <div className="absolute bottom-4 flex gap-3">
          <button
            onClick={capture}
            className="w-14 h-14 rounded-full border-[3px] border-white bg-accent/80 hover:bg-accent hover:scale-110 transition flex items-center justify-center text-xl"
            title="촬영"
          >
            📸
          </button>
        </div>
      )}

      {/* Retake / Confirm */}
      {status === 'captured' && (
        <div className="absolute bottom-4 flex gap-3">
          <button
            onClick={retake}
            className="w-10 h-10 rounded-full border-2 border-white/40 bg-white/15 hover:scale-110 transition flex items-center justify-center text-sm"
            title="다시 찍기"
          >
            ↻
          </button>
          <button
            onClick={confirm}
            className="w-14 h-14 rounded-full border-[3px] border-white bg-accent3/80 hover:bg-accent3 hover:scale-110 transition flex items-center justify-center text-xl"
            title="이 사진 사용"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  )
}
