const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-3.1-flash-image-preview'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function callGemini(contents, responseModalities) {
  const res = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: contents }],
      generationConfig: {
        responseModalities,
        temperature: 1.0,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${res.status}`)
  }

  return res.json()
}

export async function generateImage(imageBase64, mimeType, prompt) {
  const contents = [
    {
      text:
        prompt +
        '\n\nIMPORTANT: Keep the person recognizable but naturally blend them into the scene. Do NOT copy-paste or cut-and-paste the face onto another body — the entire image must be a cohesive, unified composition. Subtle changes to facial features are acceptable to match the setting (e.g. aging, skin tone adaptation, expressions). The result should look like a single photorealistic photograph, not a collage.',
    },
    { inlineData: { mimeType, data: imageBase64 } },
  ]

  const data = await callGemini(contents, ['TEXT', 'IMAGE'])

  const blockReason = data.promptFeedback?.blockReason
  if (blockReason) {
    console.warn('[Gemini] 프롬프트 차단:', blockReason)
    throw new Error(`프롬프트 차단: ${blockReason}`)
  }

  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason
  if (finishReason && finishReason !== 'STOP') {
    console.warn('[Gemini] 생성 중단:', finishReason)
    throw new Error(`생성 중단: ${finishReason}`)
  }

  const parts = candidate?.content?.parts || []

  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
    }
  }

  console.warn('[Gemini] 전체 응답:', JSON.stringify(data).slice(0, 500))
  throw new Error('이미지가 생성되지 않았습니다')
}
