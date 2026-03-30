import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'multiverse.db')

const db = new Database(DB_PATH)

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS universe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    tag TEXT NOT NULL,
    concept TEXT NOT NULL,
    prompt TEXT NOT NULL,
    story_prompt TEXT NOT NULL,
    image_url TEXT,
    image_status TEXT NOT NULL DEFAULT 'pending',
    story TEXT,
    story_status TEXT NOT NULL DEFAULT 'pending',
    UNIQUE(session_id, order_index)
  );

  CREATE INDEX IF NOT EXISTS idx_universe_session ON universe(session_id);
`)

// Prepared statements
const stmts = {
  insertSession: db.prepare(
    'INSERT INTO session (id, user_name) VALUES (?, ?)'
  ),
  getSession: db.prepare(
    'SELECT * FROM session WHERE id = ?'
  ),
  insertUniverse: db.prepare(
    `INSERT INTO universe (session_id, order_index, tag, concept, prompt, story_prompt)
     VALUES (@sessionId, @orderIndex, @tag, @concept, @prompt, @storyPrompt)`
  ),
  getUniverses: db.prepare(
    'SELECT * FROM universe WHERE session_id = ? ORDER BY order_index'
  ),
  updateImage: db.prepare(
    'UPDATE universe SET image_url = ?, image_status = ? WHERE session_id = ? AND order_index = ?'
  ),
  updateStory: db.prepare(
    'UPDATE universe SET story = ?, story_status = ? WHERE session_id = ? AND order_index = ?'
  ),
}

export function createSession(id, userName) {
  stmts.insertSession.run(id, userName)
}

export function getSession(id) {
  const session = stmts.getSession.get(id)
  if (!session) return null
  const universes = stmts.getUniverses.all(id)
  return { ...session, universes }
}

export const insertUniverses = db.transaction((sessionId, universes) => {
  for (let i = 0; i < universes.length; i++) {
    const u = universes[i]
    stmts.insertUniverse.run({
      sessionId,
      orderIndex: i,
      tag: u.tag,
      concept: u.concept,
      prompt: u.prompt,
      storyPrompt: u.storyPrompt,
    })
  }
})

export function updateImage(sessionId, index, imageUrl, status = 'done') {
  stmts.updateImage.run(imageUrl, status, sessionId, index)
}

export function updateStory(sessionId, index, story, status = 'done') {
  stmts.updateStory.run(story, status, sessionId, index)
}

export default db
