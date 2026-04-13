# Voice Journal — AI Agents

Simple Python scripts that run as cron jobs. Each script is standalone — run with `python agents/<script>.py`.

## Agents

| Agent | What it does | Schedule |
|-------|-------------|----------|
| `analytics_agent.py` | Queries Supabase for user/entry stats, generates a daily briefing via Gemini | Daily 8am |
| `content_agent.py` | Generates Twitter/X threads and SEO blog posts about voice journaling | Weekly Monday 9am |
| `support_agent.py` | Answers user questions using product FAQ + Gemini | On-demand |

## Setup

```bash
cp agents/.env.example agents/.env
# Fill in your keys
pip install httpx supabase python-dotenv
```

## Config

All agents share `config.py` which loads env vars and inits the Supabase client.

LLM calls go through Gemini 2.0 Flash via the REST API (no SDK needed, just httpx).
