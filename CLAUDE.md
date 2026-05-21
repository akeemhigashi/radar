# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
pip install -r requirements.txt

# Frontend
cd frontend
npm run dev         # localhost:5173, proxies /api → localhost:8000
npm run build
npx vercel deploy --prod   # from frontend/
```

## Architecture

**Backend** — Python 3.12 + FastAPI + SQLModel + SQLite

Three-stage pipeline, always 4 threads (no depth toggle — interview prep always needs all four):
1. `app/agents/planner.py` — Haiku, decomposes company+role into exactly 4 threads: strategy, culture, competitive, role intelligence
2. `app/agents/researcher.py` — Haiku + Tavily tool use, parallel via `asyncio.gather`, findings evaluated for interview-prep usefulness
3. `app/agents/synthesiser.py` — Sonnet, streams the structured 5-section brief

All prompts in `app/agents/prompts.py`. All ≥ 2,048 tokens for prompt caching eligibility.

Single router: `app/routers/brief.py`. Routes: `POST /brief`, `GET /brief/stream/{id}`, `GET /brief/{id}`, `GET /brief` (list).

**Frontend** — React 18 + Vite + react-markdown

Amber palette. All styles inline in JSX (matches global project convention).
Two pages: NewRadarPage (form → pipeline → report) and SavedRadarsPage (list + detail view).

State lives in NewRadarPage — `useState` + `useCallback`. No external state management.

## Palette

Amber: `#0a0c10` bg · `#f59e0b` accent · `#fbbf24` hover · `rgba(245,158,11,0.1)` dim

## Key constraints

- `jd_text` is capped at 3,000 chars before sending to Planner, 2,000 chars to Researcher — prevents token overflow
- Planner must return exactly 4 threads. If it returns ≠ 4, it raises `ValueError` and the pipeline errors cleanly
- `X-Accel-Buffering: no` on all SSE responses — required for Railway nginx
- Single uvicorn worker — SQLite is file-locked
- `frontend/vercel.json` has `RAILWAY_URL` placeholder — replace before deploying to Vercel
