# Radar — PM Interview Prep

Enter a company and role. Four parallel agents research it. A structured brief streams back in under 90 seconds.

Radar solves the 2-hour browser-tab problem: company blog, Glassdoor, LinkedIn, TechCrunch, the JD, Reddit — all at once, synthesised into one actionable document with smart questions you couldn't have found by Googling.

---

## What it produces

A five-section brief, streamed in real time:

1. **Company Snapshot** — three facts you must know walking in, prioritising recent strategic moves
2. **What They're Likely Building Next** — a research-grounded hypothesis
3. **What They Optimise For in PM Hiring** — derived from JD language patterns and culture research
4. **Five Questions That Show Depth** — specific to this company, each with the reasoning behind it
5. **Stories to Prepare** — themes detected in the JD with specific prompts for each

---

## Quick start

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in your API keys
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

API docs: `http://localhost:8000/docs`

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `TAVILY_API_KEY` | Yes | Tavily search API key — free tier at tavily.com |
| `CORS_ORIGINS` | Yes in prod | Comma-separated allowed origins |
| `DATABASE_URL` | No | Defaults to `sqlite:///./brief.db` |

---

## What this demonstrates

| Feature | Implementation |
|---|---|
| **Multi-agent orchestration** | Planner → 4 parallel Researchers → Synthesiser |
| **Tool use** | Each Researcher calls Tavily web search 2–3 times |
| **SSE streaming** | Synthesiser streams the brief token by token via FastAPI on Railway |
| **Prompt caching** | System prompts marked `cache_control: ephemeral`; cache savings shown in UI |
| **Domain-specific prompting** | All agents are interview-prep aware — findings evaluated for candidate usefulness |

---

## Stack

- **Backend**: Python 3.12 · FastAPI · SQLModel · SQLite
- **Frontend**: React 18 · Vite · react-markdown
- **Search**: Tavily API
- **Models**: Claude Haiku (Planner, Researchers) · Claude Sonnet (Synthesiser)
- **Backend hosting**: Railway
- **Frontend hosting**: Vercel (proxy rewrites `/api/*` → Railway)
