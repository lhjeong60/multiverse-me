import { useState, useEffect } from 'react'

const UNIVERSE_MESSAGES = [
  '당신이 태어날 수 있었던 세계를 탐색 중...',
  '시공간의 가능성을 계산하는 중...',
  '운명의 분기점을 찾아 헤매는 중...',
  '다른 차원의 문을 두드리는 중...',
  '무한한 우주에서 당신을 찾는 중...',
  '평행세계의 좌표를 설정하는 중...',
  '멀티버스의 지도를 그리는 중...',
  '수십억 개의 선택지를 분류하는 중...',
  '당신의 DNA에 숨겨진 가능성을 읽는 중...',
  '역사의 갈림길을 되짚는 중...',
  '존재하지 않았던 세계를 상상하는 중...',
  '당신이 걷지 않은 길을 찾는 중...',
  '평행우주의 주파수를 맞추는 중...',
  '다른 삶의 시나리오를 구상하는 중...',
  '우주의 설계도를 펼치는 중...',
  '가능성의 바다를 항해하는 중...',
  '시간의 실타래를 풀어내는 중...',
  '당신의 또 다른 운명을 직조하는 중...',
  '차원의 문 너머를 엿보는 중...',
  '우연과 필연의 경계를 탐색하는 중...',
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
  '평행세계의 당신에게 편지를 쓰는 중...',
  '또 다른 하늘 아래의 당신을 그리는 중...',
  '선택하지 않은 삶을 재구성하는 중...',
  '다른 시대의 당신을 깨우는 중...',
  '우주 저편의 당신과 교신하는 중...',
  '당신이 몰랐던 재능을 발견하는 중...',
  '또 다른 대륙에서의 삶을 펼치는 중...',
  '과거와 현재 사이의 당신을 잇는 중...',
  '평행세계의 일기장을 넘기는 중...',
  '차원의 거울에 비친 모습을 포착하는 중...',
  '다른 운명선을 따라 걷는 중...',
  '우주의 어딘가에서 당신을 소환하는 중...',
  '존재의 스펙트럼을 펼치는 중...',
  '시간 속에 숨겨진 당신을 찾는 중...',
  '또 다른 세계의 풍경을 그리는 중...',
  '평행우주의 사진첩을 넘기는 중...',
  '당신의 가능성을 현실로 바꾸는 중...',
  '다른 인생의 첫 페이지를 여는 중...',
  '우주가 감춰둔 당신을 꺼내는 중...',
  '시간여행자의 기록을 해독하는 중...',
  '또 다른 아침을 맞이하는 당신을 찾는 중...',
  '평행세계의 좌표를 미세 조정하는 중...',
  '차원의 파도를 타고 이동하는 중...',
  '당신의 멀티버스를 완성하는 중...',
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
