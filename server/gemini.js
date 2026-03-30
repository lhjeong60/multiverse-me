const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview'
const TEXT_MODEL = 'gemini-2.5-flash'

function getApiKey() {
  return process.env.GEMINI_API_KEY
}

async function callGemini(model, contents, { responseModalities, systemInstruction, maxTokens = 1024, signal } = {}) {
  const body = {
    contents: [{ role: 'user', parts: contents }],
    generationConfig: {
      temperature: 1.0,
      ...(responseModalities && { responseModalities }),
      ...(maxTokens && { maxOutputTokens: maxTokens }),
    },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${getApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal && { signal }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini API error: ${res.status}`)
  }

  return res.json()
}

export async function generateImage(imageBase64, mimeType, prompt, signal) {
  const contents = [
    {
      text:
        prompt +
        '\n\nIMPORTANT: Keep the person recognizable but naturally blend them into the scene. Do NOT copy-paste or cut-and-paste the face onto another body — the entire image must be a cohesive, unified composition. Subtle changes to facial features are acceptable to match the setting (e.g. aging, skin tone adaptation, expressions). The result should look like a single photorealistic photograph, not a collage.',
    },
    { inlineData: { mimeType, data: imageBase64 } },
  ]

  const data = await callGemini(IMAGE_MODEL, contents, { responseModalities: ['TEXT', 'IMAGE'], signal })

  const blockReason = data.promptFeedback?.blockReason
  if (blockReason) throw new Error(`프롬프트 차단: ${blockReason}`)

  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason
  if (finishReason && finishReason !== 'STOP') throw new Error(`생성 중단: ${finishReason}`)

  const parts = candidate?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType }
    }
  }

  throw new Error('이미지가 생성되지 않았습니다')
}

export async function generateStory(storyPrompt, userName, signal) {
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

  const data = await callGemini(TEXT_MODEL, [{ text: storyPrompt }], { systemInstruction, signal })
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '이 세계의 이야기를 불러올 수 없었습니다...'
}
