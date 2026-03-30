import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from './components/Webcam'
import LoadingOverlay from './components/LoadingOverlay'
import CropModal from './components/CropModal'
import TypeWriter from './components/TypeWriter'
import { startGeneration as apiGenerate, loadSession } from './lib/api'

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [userName, setUserName] = useState('')
  const [inputMode, setInputMode] = useState('upload') // upload | webcam
  const [rawImage, setRawImage] = useState(null) // dataUrl shown in crop modal
  const [originalImage, setOriginalImage] = useState(null) // original dataUrl before any crop
  const [photo, setPhoto] = useState(null) // { base64, mimeType, preview } after crop
  const [phase, setPhase] = useState('input') // input | generating | results
  const [universes, setUniverses] = useState([])
  const [results, setResults] = useState([]) // [{ image, story }]
  const [currentCard, setCurrentCard] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [seenCards, setSeenCards] = useState(new Set())
  const [genProgress, setGenProgress] = useState(0) // tracks how many cards done during generation
  const fileInputRef = useRef(null)

  // Restore session from URL
  const restoreSession = useCallback((id) => {
    if (!id) return
    loadSession(id).then((session) => {
      if (!session) return
      setSessionId(session.id)
      setUserName(session.userName || '')
      setUniverses(session.universes.map((u) => ({ tag: u.tag, concept: u.concept })))
      setResults(session.universes.map((u) => ({
        image: u.imageUrl || 'error',
        story: u.story || '이 세계의 이야기는 아직 전해지지 않았습니다...',
      })))
      setTypingDone(true)
      setSeenCards(new Set(session.universes.map((_, i) => i)))
      setPhase('results')
    })
  }, [])

  // Load session from URL on mount
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) restoreSession(id)
  }, [restoreSession])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const id = new URLSearchParams(window.location.search).get('id')
      if (id) {
        restoreSession(id)
      } else {
        // Back to input screen
        setPhase('input')
        setSessionId(null)
        setResults([])
        setUniverses([])
        setCurrentCard(0)
        setTypingDone(false)
        setSeenCards(new Set())
        setGenProgress(0)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [restoreSession])

  const isReady = !!photo

  const handleFile = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target.result)
      setRawImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith('image/')) handleFile(file)
    },
    [handleFile]
  )

  const handleWebcamCapture = useCallback((dataUrl) => {
    setOriginalImage(dataUrl)
    setRawImage(dataUrl)
    setInputMode('upload')
  }, [])

  const handleCropConfirm = useCallback((croppedPhoto) => {
    setPhoto(croppedPhoto)
    setRawImage(null)
  }, [])

  const handleCropCancel = useCallback(() => {
    setRawImage(null)
  }, [])

  const startGeneration = async () => {
    if (!isReady) return

    setPhase('generating')
    setGenProgress(0)

    let isFirstCard = true

    await apiGenerate({ photo, userName }, {
      onSession: ({ sessionId }) => {
        setSessionId(sessionId)
      },
      onUniverses: (univs) => {
        setUniverses(univs)
        setCurrentCard(0)
        setTypingDone(false)
        setResults(univs.map(() => ({ image: 'loading', story: 'loading' })))
      },
      onCard: ({ index, imageUrl, imageStatus, story, storyStatus }) => {
        setResults((prev) => {
          const next = [...prev]
          next[index] = {
            image: imageStatus === 'error' ? 'error' : imageUrl,
            story: storyStatus === 'error' ? '이 세계의 이야기는 아직 전해지지 않았습니다...' : story,
          }
          return next
        })
        setGenProgress(index + 1)
        if (isFirstCard) {
          isFirstCard = false
          setPhase('results')
        }
      },
      onDone: ({ sessionId }) => {
        window.history.replaceState(null, '', `?id=${sessionId}`)
      },
      onError: (msg) => {
        console.error('생성 실패:', msg)
        setPhase('input')
      },
    })
  }

  const reset = () => {
    setPhase('input')
    setSessionId(null)
    setPhoto(null)
    setRawImage(null)
    setOriginalImage(null)
    setResults([])
    setUniverses([])
    setCurrentCard(0)
    setTypingDone(false)
    setSeenCards(new Set())
    setGenProgress(0)
    setInputMode('upload')
    window.history.pushState(null, '', window.location.pathname)
  }

  // ── Input Screen ──
  if (phase === 'input' || phase === 'generating') {
    return (
      <>
        {rawImage && (
          <CropModal imageSrc={rawImage} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
        )}
        {phase === 'generating' && (
          <LoadingOverlay current={genProgress} total={5} phase="content" />
        )}

        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
          {/* Glow */}
          <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,107,53,0.08)_0%,transparent_70%)] top-[10%] left-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Logo */}
          <h1
            className="font-serif text-[clamp(3rem,8vw,6rem)] tracking-tight mb-2"
            style={{
              background: 'linear-gradient(135deg, #e8e6e1 0%, #c4a1ff 50%, #ff6b35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Multiverse Me
          </h1>
          <p className="text-sm text-dim tracking-[0.15em] uppercase mb-10">
            다른 세계의 나를 만나다
          </p>

          {/* Name */}
          <div className="w-full max-w-[480px] mb-6">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3.5 bg-surface border border-border rounded-lg text-white text-sm outline-none focus:border-accent2 transition placeholder:text-dim/50 text-center"
            />
          </div>

          {/* Tabs */}
          <div className="flex w-full max-w-[480px] rounded-t-xl overflow-hidden border border-border border-b-0">
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-3 text-sm transition ${
                inputMode === 'upload' ? 'bg-surface2 text-white' : 'bg-surface text-dim hover:bg-white/[0.03]'
              }`}
            >
              📁 파일 업로드
            </button>
            <button
              onClick={() => setInputMode('webcam')}
              className={`flex-1 py-3 text-sm border-l border-border transition ${
                inputMode === 'webcam' ? 'bg-surface2 text-white' : 'bg-surface text-dim hover:bg-white/[0.03]'
              }`}
            >
              📷 웹캠 촬영
            </button>
          </div>

          {/* Upload Zone */}
          {inputMode === 'upload' && !photo && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="w-full max-w-[480px] aspect-[4/3] border border-border border-dashed bg-surface rounded-b-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-accent hover:bg-accent/[0.03]"
            >
              <div className="text-5xl mb-4 opacity-30">📸</div>
              <p className="text-sm text-dim">
                <strong className="text-accent">클릭</strong>하거나 사진을 드래그하세요
              </p>
              <p className="text-xs text-dim mt-2">정면 얼굴이 잘 보이는 사진이 좋아요</p>
            </div>
          )}

          {/* Selected Photo Preview */}
          {inputMode === 'upload' && photo && (
            <div className="w-full max-w-[480px] rounded-b-2xl border border-accent2 overflow-hidden">
              <div className="relative aspect-square">
                <img src={photo.preview} alt="selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex border-t border-accent2/30">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 text-sm text-dim hover:text-white hover:bg-white/[0.05] transition"
                >
                  다시 고르기
                </button>
                <button
                  onClick={() => setRawImage(originalImage)}
                  className="flex-1 py-3 text-sm text-dim hover:text-white hover:bg-white/[0.05] transition border-l border-accent2/30"
                >
                  다시 자르기
                </button>
              </div>
            </div>
          )}

          {/* Webcam */}
          {inputMode === 'webcam' && <Webcam onCapture={handleWebcamCapture} />}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onClick={(e) => { e.target.value = '' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />

          {/* Generate Button */}
          <button
            onClick={startGeneration}
            disabled={!isReady}
            className={`mt-8 px-10 py-4 rounded-full text-white font-medium tracking-wide transition-all ${
              isReady
                ? 'bg-gradient-to-br from-accent to-[#ff8f65] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,107,53,0.3)] cursor-pointer'
                : 'bg-gradient-to-br from-accent to-[#ff8f65] opacity-30 cursor-not-allowed'
            }`}
          >
            평행세계 열기 ✦
          </button>
        </section>
      </>
    )
  }

  // ── Results Screen (Carousel) ──
  const universe = universes[currentCard]
  const result = results[currentCard]
  const imageReady = result?.image && result.image !== 'loading'
  const storyReady = result?.story && result.story !== 'loading'
  const cardComplete = imageReady && storyReady && typingDone
  const isLast = currentCard === universes.length - 1

  const goNext = () => {
    if (!cardComplete || isLast) return
    const next = currentCard + 1
    setTypingDone(seenCards.has(next))
    setCurrentCard(next)
  }

  const goPrev = () => {
    if (currentCard === 0) return
    const prev = currentCard - 1
    setTypingDone(seenCards.has(prev))
    setCurrentCard(prev)
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {universes.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentCard ? 'bg-accent w-6' : i < currentCard ? 'bg-accent2' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {universe && (
        <div className="w-full max-w-[560px] bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Image */}
          <div className="w-full aspect-square bg-surface2 flex items-center justify-center overflow-hidden">
            {!imageReady && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
                <span className="text-xs text-dim">세계를 여는 중...</span>
              </div>
            )}
            {result?.image === 'error' && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🌀</span>
                <span className="text-xs text-dim">이 세계는 접근이 차단되었습니다</span>
              </div>
            )}
            {imageReady && result.image !== 'error' && (
              <img src={result.image} alt={universe.concept} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Body */}
          <div className="p-8">
            <span className="inline-block text-[0.65rem] tracking-widest uppercase text-accent3 border border-accent3/30 px-3 py-1 rounded-full mb-3">
              {universe.tag}
            </span>
            <h3 className="font-serif text-2xl font-normal mb-4 leading-tight">
              {universe.concept}
            </h3>
            <div className="text-sm leading-relaxed text-dim font-light min-h-[4rem]">
              {!storyReady && <span className="italic">스토리 생성 중...</span>}
              {storyReady && seenCards.has(currentCard) ? (
                <span>{result.story}</span>
              ) : storyReady ? (
                <TypeWriter
                  key={`${currentCard}-${universe.tag}`}
                  text={result.story}
                  speed={25}
                  onComplete={() => {
                    setTypingDone(true)
                    setSeenCards((prev) => new Set(prev).add(currentCard))
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={goPrev}
          disabled={currentCard === 0}
          className={`px-6 py-3 border rounded-full text-sm transition ${
            currentCard === 0
              ? 'border-border text-dim/30 cursor-not-allowed'
              : 'border-border text-dim hover:border-white hover:text-white'
          }`}
        >
          ← 이전 세계
        </button>

        <span className="text-dim text-sm">
          {currentCard + 1} / {universes.length}
        </span>

        {isLast && cardComplete ? (
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-br from-accent to-[#ff8f65] rounded-full text-white text-sm font-medium hover:-translate-y-0.5 transition-all"
          >
            ↻ 다시 만들기
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!cardComplete}
            className={`px-6 py-3 border rounded-full text-sm transition ${
              !cardComplete
                ? 'border-border text-dim/30 cursor-not-allowed'
                : 'border-accent text-accent hover:bg-accent hover:text-white'
            }`}
          >
            다음 세계 →
          </button>
        )}
      </div>
    </section>
  )
}
