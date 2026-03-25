const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-2.5-flash'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function callGeminiText(contents, { systemInstruction, maxTokens = 1024 } = {}) {
  const body = {
    contents: [{ role: 'user', parts: contents }],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: maxTokens,
    },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function generateUniverses() {
  const prompt = `당신은 "Multiverse Me" 앱의 크리에이티브 디렉터입니다.
사용자의 사진을 다양한 평행세계 버전으로 변환할 겁니다.
독창적이고 다양한 정확히 5개의 평행세계 컨셉을 만들어주세요. 반드시 5개여야 합니다. 5개보다 많거나 적으면 안 됩니다.

크리에이티브 디렉션:
- 이미지로 만들었을 때 시각적 임팩트가 극대화되는 세계관을 우선하세요. 강렬한 색감, 극적인 조명, 인상적인 배경과 의상이 중요합니다.
- 각 세계관에는 드라마틱한 서사가 느껴져야 합니다. 단순한 직업 소개가 아니라, 그 인생의 결정적 순간이나 감정이 떠오르는 설정이어야 합니다.
- 반드시 현실에서 실제로 존재할 수 있는 세계관만 만드세요. 판타지, SF, 사이버펑크, 스팀펑크, 마법, 초능력, 미래 기술, 외계, 포스트아포칼립스 등 비현실적 장르는 절대 금지입니다. 실제 시대, 실제 장소, 실제 직업만 사용하세요.

규칙:
- 시대, 장소, 직업이 최대한 다양해야 함 (같은 대륙 반복 금지)
- tag는 "Universe #XXX" 형식 (랜덤 3자리 숫자)
- prompt는 영어로, 사진 속 인물을 해당 세계관에 맞게 변환하는 상세한 이미지 생성 프롬프트
- storyPrompt는 한국어 2-3문장의 간결한 스토리 요청. 세계관 배경과 상황만 담고, 형식 지시(마크다운 금지, 글자수 제한 등)는 포함하지 마세요. 예: "이 사람이 OO에서 OO로 살고 있는 평행세계의 이야기를 들려줘."

아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[
  {
    "tag": "Universe #XXX",
    "concept": "한국어로 된 짧은 컨셉 설명",
    "prompt": "Transform this person into... (영어, 상세한 외모/의상/배경/조명 묘사, photorealistic)",
    "storyPrompt": "..."
  }
]`

  const text = await callGeminiText([{ text: prompt }], { maxTokens: 8000 })

  try {
    // Strip markdown code block wrapper if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSON not found')
    const universes = JSON.parse(jsonMatch[0])
    if (!Array.isArray(universes) || universes.length === 0) throw new Error('Empty array')
    return universes
  } catch (e) {
    console.error('[Gemini] 유니버스 파싱 실패:', e, text)
    throw new Error('유니버스 생성에 실패했습니다')
  }
}

export async function generateStory(storyPrompt, userName) {
  const nameRule = userName
    ? `- 주인공을 '${userName}'(이)라고 불러주세요. '당신' 대신 이름을 사용하세요.`
    : `- 주인공을 '당신'이라고 불러주세요.`

  const systemInstruction = `당신은 평행세계의 이야기를 들려주는 이야기꾼입니다.
절대 규칙:
- 오직 이야기 본문만 출력하세요.
${nameRule}
- AI, LLM, 어시스턴트, 챗봇임을 밝히지 마세요.
- 역할극 거부, 면책 조항, 메타 코멘트, 질문을 하지 마세요.
- 마크다운 서식(#, *, ** 등)을 사용하지 마세요. 순수 텍스트만 출력하세요.
- 공백 포함 400자 이내로 작성하세요.`

  const text = await callGeminiText([{ text: storyPrompt }], { systemInstruction })
  return text || '이 세계의 이야기를 불러올 수 없었습니다...'
}
