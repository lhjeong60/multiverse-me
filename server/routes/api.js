import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { createSession, getSession, insertUniverses, updateImage, updateStory } from '../db.js'
import { generateImage, generateStory } from '../gemini.js'
import { uploadImage } from '../r2.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const allPresets = JSON.parse(readFileSync(path.join(__dirname, '..', 'presets.json'), 'utf-8'))

// Group presets by category
const presetsByCategory = {}
for (const p of allPresets) {
  if (!presetsByCategory[p.category]) presetsByCategory[p.category] = []
  presetsByCategory[p.category].push(p)
}
const categories = Object.keys(presetsByCategory)

function pickRandomUniverses() {
  return categories.map((cat) => {
    const pool = presetsByCategory[cat]
    return pool[Math.floor(Math.random() * pool.length)]
  })
}

const router = Router()

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

router.post('/generate', async (req, res) => {
  const { photo, userName = '' } = req.body
  if (!photo?.base64 || !photo?.mimeType) {
    return res.status(400).json({ error: 'photo.base64 and photo.mimeType are required' })
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const abortController = new AbortController()
  const { signal } = abortController

  res.on('close', () => {
    abortController.abort()
  })

  try {
    // 1. Create session
    const sessionId = uuidv4()
    createSession(sessionId, userName)
    sendSSE(res, 'session', { sessionId })

    // 2. Pick random universes from presets (1 per category)
    const universes = pickRandomUniverses()

    insertUniverses(sessionId, universes)
    sendSSE(res, 'universes', universes.map((u, i) => ({
      orderIndex: i,
      tag: u.tag,
      concept: u.concept,
    })))

    // 3. Generate image + story in parallel, send together after both complete
    for (let i = 0; i < universes.length; i++) {
      if (signal.aborted) break

      const universe = universes[i]
      let imageResult = { status: 'error', imageUrl: null, message: '' }
      let storyResult = { status: 'error', story: '이 세계의 이야기는 아직 전해지지 않았습니다...' }

      const imagePromise = generateImage(
        photo.base64, photo.mimeType, universe.prompt, signal
      ).then(async ({ base64, mimeType }) => {
        const imageBuffer = Buffer.from(base64, 'base64')
        const imageUrl = await uploadImage(sessionId, i, imageBuffer, mimeType)
        updateImage(sessionId, i, imageUrl)
        imageResult = { status: 'done', imageUrl }
      }).catch((e) => {
        console.error(`[Image ${i}] 실패:`, e.message)
        updateImage(sessionId, i, null, 'error')
        imageResult = { status: 'error', message: e.message }
      })

      const storyPromise = generateStory(universe.storyPrompt, userName, signal)
        .then((story) => {
          updateStory(sessionId, i, story)
          storyResult = { status: 'done', story }
        }).catch((e) => {
          console.error(`[Story ${i}] 실패:`, e.message)
          updateStory(sessionId, i, storyResult.story, 'error')
        })

      await Promise.all([imagePromise, storyPromise])

      // Send both at once after parallel completion
      sendSSE(res, 'card', {
        index: i,
        imageUrl: imageResult.imageUrl,
        imageStatus: imageResult.status,
        story: storyResult.story,
        storyStatus: storyResult.status,
      })

      // Rate limit buffer
      if (i < universes.length - 1 && !signal.aborted) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    sendSSE(res, 'done', { sessionId })
  } catch (e) {
    if (!signal.aborted) {
      sendSSE(res, 'error', { message: e.message })
    }
  } finally {
    res.end()
  }
})

router.get('/sessions/:id', (req, res) => {
  const session = getSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  res.json({
    id: session.id,
    userName: session.user_name,
    createdAt: session.created_at,
    universes: session.universes.map((u) => ({
      orderIndex: u.order_index,
      tag: u.tag,
      concept: u.concept,
      imageUrl: u.image_url,
      imageStatus: u.image_status,
      story: u.story,
      storyStatus: u.story_status,
    })),
  })
})

export default router
