export async function startGeneration({ photo, userName }, callbacks) {
  const { onSession, onUniverses, onCard, onError, onDone } = callbacks

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo, userName }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    onError?.(err.error || `Server error: ${response.status}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Parse SSE events from buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete line

    let eventType = null
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ') && eventType) {
        try {
          const data = JSON.parse(line.slice(6))
          switch (eventType) {
            case 'session': onSession?.(data); break
            case 'universes': onUniverses?.(data); break
            case 'card': onCard?.(data); break
            case 'error': onError?.(data.message); break
            case 'done': onDone?.(data); break
          }
        } catch {
          // skip malformed JSON
        }
        eventType = null
      } else if (line === '') {
        eventType = null
      }
    }
  }
}

export async function loadSession(id) {
  const res = await fetch(`/api/sessions/${id}`)
  if (!res.ok) return null
  return res.json()
}
