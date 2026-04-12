# Voice Journal

Voice journal SaaS — record voice notes from any device, transcribed and organized by AI. Eventually a product people pay for. For now, personal tool to dogfood.

## Project Location
`~/voice-journal/`

## Architecture
```
Phone/Laptop → Record audio (browser MediaRecorder)
  → Upload to FastAPI backend
  → Store audio in Supabase Storage (bucket: "recordings")
  → Groq Whisper transcribes (~1-2s)
  → Groq Llama 3.3 70B extracts: title, summary, tags, mood, category, subcategory, people, action items
  → Save to Supabase Postgres
  → Entry appears in feed with folder auto-sort
```

## Stack
| Layer | Tech | Where |
|-------|------|-------|
| Backend | Python FastAPI | `backend/` → Railway ($5/mo) |
| Frontend | Next.js 16 PWA (App Router) | `frontend/` → Vercel (free) |
| Database | Supabase Postgres | Free tier |
| Auth | Supabase Auth (email/password) | Free tier |
| Audio Storage | Supabase Storage (bucket: `recordings`) | Free tier |
| Transcription | Groq Whisper API | Free tier (4hrs/day) |
| AI Tagging | Groq Llama 3.3 70B | Free tier |
| AI Summaries | Groq Llama 3.3 70B | Free tier |

## File Structure
```
~/voice-journal/
├── CLAUDE.md                    ← YOU ARE HERE
├── .gitignore
├── backend/
│   ├── .env                     ← API keys (never commit)
│   ├── .env.example
│   ├── pyproject.toml
│   ├── Dockerfile               ← Railway deployment
│   └── app/
│       ├── main.py              ← FastAPI app, CORS, router includes
│       ├── config.py            ← Pydantic settings from .env
│       ├── deps.py              ← Auth: verifies Supabase JWT via auth.get_user()
│       ├── routers/
│       │   ├── recordings.py    ← POST /recordings/upload (main pipeline)
│       │   ├── entries.py       ← CRUD: list, get, update, delete entries
│       │   ├── search.py        ← GET /search/?q= (Postgres full-text)
│       │   └── insights.py     ← GET /insights/weekly, POST /insights/ask
│       └── services/
│           ├── transcription.py ← Groq Whisper API client
│           ├── tagger.py        ← Groq Llama 3.3 70B for metadata extraction
│           └── summarizer.py    ← Groq Llama 3.3 70B for weekly digests + Q&A
├── frontend/
│   ├── .env.local               ← Supabase public keys (safe to expose)
│   ├── package.json
│   ├── next.config.ts
│   ├── public/manifest.json     ← PWA add-to-homescreen
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       ← Root layout, Inter font, dark theme
│       │   ├── globals.css      ← Design system CSS vars, animations, press states
│       │   ├── page.tsx         ← Redirects to /journal
│       │   ├── login/page.tsx
│       │   ├── journal/page.tsx ← Home: greeting, recorder, stats, recap, entry feed
│       │   ├── journal/[id]/page.tsx ← Entry detail
│       │   ├── search/page.tsx  ← Full-text search with live results
│       │   └── insights/page.tsx ← Weekly summary + Ask Your Journal chat
│       ├── components/
│       │   ├── AudioRecorder.tsx ← Mic button, waveform, timer
│       │   ├── EntryCard.tsx     ← Entry card with mood dot, tags, category
│       │   ├── AskJournal.tsx    ← Chat interface for journal Q&A
│       │   ├── FolderIcon.tsx    ← SVG icons for category folders
│       │   └── Nav.tsx           ← Bottom tab bar (Home, Search, Insights)
│       └── lib/
│           ├── api.ts           ← Backend fetch wrapper with auth headers
│           ├── supabase.ts      ← Supabase client init
│           └── mock-data.ts     ← Demo mode mock entries (remove in production)
├── supabase/
│   └── schema.sql               ← Full DB schema (run in Supabase SQL Editor)
└── scripts/
    └── ingest_dev_recaps.py     ← Feed text files as journal entries
```

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=https://jrbnpuffyesxzlsoyosp.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...  ← secret key from Supabase Settings > API
GROQ_API_KEY=gsk_...               ← from console.groq.com (used for Whisper + Llama)
FRONTEND_URL=http://localhost:3000  ← or production Vercel URL
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://jrbnpuffyesxzlsoyosp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...  ← publishable key from Supabase
NEXT_PUBLIC_API_URL=http://localhost:8000          ← or production Railway URL
```

## Supabase Project
- **Org**: Personal
- **Project**: voice-journal
- **Region**: (whatever was selected)
- **Dashboard**: https://supabase.com/dashboard/project/jrbnpuffyesxzlsoyosp
- **Storage bucket**: `recordings` (public, audio/* only, 25MB limit)

### Database Tables
1. `entries` — transcript, title, summary, tags[], mood, category, subcategory, people[], action_items[], audio_url
2. `profiles` — extends auth.users (timezone, preferences)
3. `weekly_summaries` — cached AI weekly digests
4. `ask_journal_messages` — conversation history for journal Q&A

Full-text search via Postgres tsvector + trigram indexes. RLS enabled on all tables.
`search_entries()` RPC function for combined FTS + ILIKE search.

## Dev Commands
```bash
# Start backend (from ~/voice-journal/)
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Start frontend (from ~/voice-journal/)
cd frontend && npm run dev

# Both at once
cd ~/voice-journal && (cd backend && uv run uvicorn app.main:app --reload --port 8000 &) && cd frontend && npm run dev
```

## Deploy Commands
```bash
# Backend → Railway (push to GitHub, Railway auto-deploys from Dockerfile)
# Frontend → Vercel (push to GitHub, Vercel auto-deploys)

# Manual Railway deploy
cd backend && railway up

# Manual Vercel deploy
cd frontend && vercel --prod
```

## API Accounts & Billing
| Service | URL | Plan | Cost | What for |
|---------|-----|------|------|----------|
| Supabase | supabase.com/dashboard | Free | $0 | DB, Auth, Storage |
| Groq | console.groq.com | Free | $0 | Whisper transcription + Llama 3.3 70B tagging/summaries |
| Railway | railway.app | Hobby | $5/mo | Backend hosting |
| Vercel | vercel.com | Free | $0 | Frontend hosting |

## Frontend Design
- Dark theme with layered surfaces (#1A1A1A → #242424 → #2C2C2C)
- Inter font, strict type scale (24/17/15/13/12/11px)
- Press feedback on all interactive elements (btn-press, card-press, nav-press)
- Home screen: greeting → recorder → stats → weekly recap → date-grouped entries
- Folder view: AI auto-categorizes into Trading, Projects, Health, People, Ideas, Daily Life
- Currently in **demo mode** with mock data in `lib/mock-data.ts`

## Current Status
- [x] Backend scaffolded (FastAPI, all routers and services)
- [x] Frontend built (Next.js PWA, all pages, demo mode working)
- [x] Supabase project created, storage bucket live
- [x] Groq API key configured (Whisper + Llama 3.3 70B)
- [x] Switched from MiniMax to Groq for all AI (free tier, no $25 minimum)
- [ ] Run schema.sql in Supabase SQL Editor
- [ ] Test full pipeline locally (record → transcribe → tag → save)
- [ ] Switch frontend from demo mode to real API calls
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Add to phone home screen and dogfood

## Product Roadmap
### Phase 1 (current): Core loop
Record → transcribe → tag → organize → search → weekly summary

### Phase 2: Intelligence
- Pattern detection across weeks/months
- Commitment tracking (did you follow through?)
- Proactive nudges ("you haven't mentioned exercise in 2 weeks")
- Knowledge graph of people, projects, goals

### Phase 3: Monetize
- Stripe billing, free/pro/premium tiers
- Usage limits per plan
- Landing page
- Therapist partnership angle
- Couples/family shared journals

### Phase 4: Scale
- Native iOS app (or keep PWA if good enough)
- Offline recording + sync
- Real-time streaming transcription
- Semantic search with embeddings
