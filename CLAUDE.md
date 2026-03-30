# Multiverse Me

사진 한 장으로 5개의 평행세계 버전을 만들어주는 웹앱.

## Tech Stack
- React 18 + Vite (frontend)
- Express.js (backend)
- SQLite (better-sqlite3) — 세션/유니버스 메타데이터
- Cloudflare R2 — 생성 이미지 저장
- Google Gemini API — 이미지 변환 (gemini-3.1-flash-image-preview) + 텍스트 생성 (gemini-2.5-flash)
- Tailwind CSS

## Project Structure
```
server/
├── index.js              # Express 엔트리 (dev: API만, prod: 정적파일+API)
├── db.js                 # SQLite 초기화 + CRUD
├── gemini.js             # Gemini API 호출
├── r2.js                 # R2 업로드 헬퍼
└── routes/
    └── api.js            # POST /api/generate (SSE), GET /api/sessions/:id
src/
├── main.jsx              # Entry point
├── index.css             # Tailwind + global animations
├── App.jsx               # Main app (input → generating → results 3 phases)
├── components/
│   ├── Webcam.jsx        # Webcam capture
│   ├── CropModal.jsx     # Image crop (1024x1024)
│   ├── TypeWriter.jsx    # Typing animation
│   └── LoadingOverlay.jsx # Loading overlay
└── lib/
    └── api.js            # Server API 호출 + SSE 파싱
data/
└── multiverse.db         # SQLite (gitignored)
```

## Key Architecture Decisions
- Single server: Express serves API + static files (production)
- API keys server-side only (no client exposure)
- SSE (Server-Sent Events) for real-time generation progress
- Sequential generation with 1s delay (Gemini rate limit)
- Each session: 1 universe gen + 5 × (image + story) = 11 API calls
- Images: Gemini generates base64 → server decodes → R2 upload → public URL

## Commands
```bash
npm install
npm run dev          # Vite (5173) + Express (3001) concurrent
npm run dev:client   # Vite only
npm run dev:server   # Express only
npm run build        # Vite production build
npm start            # Production: Express serves dist/ + API
```

## Environment Variables (.env)
```
GEMINI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
PORT=3001
```

## Notes
- Gemini free tier: 500 requests/day
- Some face transformations may be blocked by Gemini safety filters
- Dev mode: Vite proxies /api to Express (vite.config.js)
