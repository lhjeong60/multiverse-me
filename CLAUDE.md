# Multiverse Me

사진 한 장으로 10개의 평행세계 버전을 만들어주는 웹앱.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Google Gemini API (gemini-2.5-flash-preview-05-20) — 이미지 변환 + 텍스트 생성

## Project Structure
```
src/
├── main.jsx              # Entry point
├── index.css             # Tailwind + global animations
├── App.jsx               # Main app (input → generating → results 3 phases)
├── components/
│   ├── Webcam.jsx        # Webcam capture component
│   ├── UniverseCard.jsx  # Individual universe result card
│   └── LoadingOverlay.jsx # Generation progress overlay
└── lib/
    ├── gemini.js         # Gemini API helpers (generateImage, generateStory)
    └── universes.js      # 10 universe preset configs
```

## Key Architecture Decisions
- API key is entered by user (client-side only, no backend)
- Gemini API called directly from browser (REST, no SDK)
- Sequential generation to avoid rate limits (1s delay between each)
- Each universe: image generation call + story generation call = 2 API calls × 10 = 20 total
- Webcam captures mirrored (scaleX -1) for selfie-style

## Commands
```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build to dist/
```

## Notes
- Gemini free tier: 500 requests/day
- Some face transformations may be blocked by Gemini safety filters
- Model used for image: gemini-2.5-flash-preview-05-20 (supports IMAGE output modality)
