import { useState, useEffect } from 'react'

const UNIVERSE_MESSAGES = [
  '당신이 태어날 수 있었던 세계를 탐색 중...',
  '시공간의 가능성을 계산하는 중...',
  '운명의 분기점을 찾아 헤매는 중...',
  '다른 차원의 문을 두드리는 중...',
  '무한한 우주에서 당신을 찾는 중...',
  '평행세계의 좌표를 설정하는 중...',
  '멀티버스의 지도를 그리는 중...',
]

const CONTENT_MESSAGES = [
  '시공간의 균열을 찾는 중...',
  '평행세계의 문을 여는 중...',
  '당신의 다른 가능성을 탐색 중...',
  '운명의 분기점을 추적하는 중...',
  '다른 세계의 당신을 불러오는 중...',
  '시간의 갈래를 따라가는 중...',
  '멀티버스 좌표를 계산하는 중...',
  '차원 간 연결을 수립하는 중...',
  '당신의 무한한 가능성을 펼치는 중...',
  '다른 인생의 조각을 맞추는 중...',
  '평행세계의 기억을 읽어오는 중...',
  '또 다른 당신의 흔적을 추적하는 중...',
  '차원의 경계를 넘어가는 중...',
  '운명이 갈라진 순간을 포착하는 중...',
  '다른 우주의 빛을 모으는 중...',
  '마지막 세계를 탐색하는 중...',
]

export default function LoadingOverlay({ current, total, phase }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const messages = phase === 'universes' ? UNIVERSE_MESSAGES : CONTENT_MESSAGES

  useEffect(() => {
    setMsgIndex(0)
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, messages.length])

  const message = messages[msgIndex]

  if (phase === 'universes') {
    return (
      <div className="fixed inset-0 bg-bg/92 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        <p
          className="font-serif text-2xl mt-8 transition-opacity duration-500"
          key={msgIndex}
          style={{ animation: 'pulse-slow 2s ease-in-out infinite' }}
        >
          {message}
        </p>
      </div>
    )
  }

  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="fixed inset-0 bg-bg/92 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-border border-t-accent rounded-full animate-spin" />
      <p
        className="font-serif text-2xl mt-8 transition-opacity duration-500"
        key={msgIndex}
        style={{ animation: 'pulse-slow 2s ease-in-out infinite' }}
      >
        {message}
      </p>
      <p className="text-dim text-sm mt-2">
        {current + 1} / {total}
      </p>
      <div className="w-48 h-0.5 bg-border rounded-full mt-8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff6b35, #c4a1ff)',
          }}
        />
      </div>
    </div>
  )
}
