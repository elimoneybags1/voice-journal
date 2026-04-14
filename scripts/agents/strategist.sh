#!/bin/bash
# STRATEGIST — Sonnet thinks hard about what to build next
# Runs 3x/day, generates 5-10 tasks per run
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
QUEUE_DIR="$PROJECT_DIR/scripts/agents/queue"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"
IDEAS_DIR="$PROJECT_DIR/scripts/agents/ideas"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$QUEUE_DIR" "$LOG_DIR" "$IDEAS_DIR"

echo "[$(date)] Strategist starting..." >> "$LOG_DIR/strategist.log"

# Load previous ideas to avoid repeats
PREV_IDEAS=""
if ls "$IDEAS_DIR"/*.md 1>/dev/null 2>&1; then
    PREV_IDEAS=$(cat "$IDEAS_DIR"/*.md 2>/dev/null | tail -200)
fi

# Load done tasks to avoid repeats
DONE_TASKS=""
DONE_DIR="$PROJECT_DIR/scripts/agents/done"
if ls "$DONE_DIR"/task_*.json 1>/dev/null 2>&1; then
    DONE_TASKS=$(cat "$DONE_DIR"/task_*.json 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        t = json.loads(line)
        print(f\"- {t.get('title','')}\")
    except: pass
" 2>/dev/null | tail -50)
fi

claude --model sonnet -p "$(cat <<PROMPT
You are the Voice Journal product strategist + growth hacker. Think BIG.

## Project context
Read ~/voice-journal/CLAUDE.md for full architecture.
Check git log --oneline -20 for recent changes.
Read the codebase to understand current state.

## Previously completed (don't repeat these):
$DONE_TASKS

## Previous ideas explored:
$PREV_IDEAS

## Your mission: generate 8-10 high-impact tasks across these categories:

### 1. PRODUCT (3-4 tasks)
Think about what makes a journaling app indispensable:
- What would make someone open this app every single day?
- What's the "aha moment" for a new user?
- What features do Day One, Otter.ai, Reflect, Bear have that we don't?
- What can we do that NONE of them can? (voice-first advantage)
- Offline support, sharing, export, integrations, widgets
- AI features: pattern detection, commitment tracking, proactive nudges

### 2. GROWTH (2-3 tasks)
- Landing page / marketing site
- SEO content (blog posts about voice journaling)
- Product Hunt launch prep
- Referral mechanics
- Free tier vs paid tier design
- App Store / PWA optimization

### 3. POLISH (2-3 tasks)
- Performance, loading states, animations
- Error handling edge cases
- Mobile UX issues (test on phone)
- Accessibility
- Onboarding flow for new users

### 4. INFRASTRUCTURE (1-2 tasks)
- Monitoring, logging, alerts
- Backup strategy
- Cost optimization
- CI/CD improvements
- Testing coverage

## Output format
Return ONLY a JSON array. Each task:
{
  "id": "kebab-case-slug",
  "type": "code" | "content" | "test" | "research" | "design",
  "category": "product" | "growth" | "polish" | "infrastructure",
  "priority": 1-5,
  "title": "clear actionable title",
  "description": "detailed spec — specific files, specific changes, acceptance criteria",
  "estimated_complexity": "trivial" | "small" | "medium" | "large",
  "model": "haiku" | "sonnet",
  "why": "one sentence on why this matters for growth"
}

Use sonnet for anything creative or architectural. Use haiku for mechanical changes.
Be specific — "improve the UI" is bad. "Add skeleton loading states to journal/page.tsx and search/page.tsx" is good.
PROMPT
)" --allowedTools "Read,Glob,Grep,Bash(git log*),Bash(git diff*),Bash(ls *),WebSearch" \
  --output-format json 2>/dev/null | jq -r '.result' > "$QUEUE_DIR/plan_$TIMESTAMP.json"

# Save ideas summary for future dedup
python3 - "$QUEUE_DIR/plan_$TIMESTAMP.json" "$IDEAS_DIR" "$QUEUE_DIR" <<'PYTHON'
import json, sys, os, re
from datetime import datetime

plan_file = sys.argv[1]
ideas_dir = sys.argv[2]
queue_dir = sys.argv[3]

try:
    with open(plan_file) as f:
        content = f.read().strip()
        if "```" in content:
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
        tasks = json.loads(content)
except Exception as e:
    print(f"Failed to parse plan: {e}")
    sys.exit(1)

if not isinstance(tasks, list):
    tasks = tasks.get("tasks", [])

# Write individual task files
for task in tasks:
    task_id = task.get("id", "unknown")
    task_file = os.path.join(queue_dir, f"task_{task_id}.json")
    with open(task_file, "w") as f:
        json.dump(task, f, indent=2)

# Save ideas log
ideas_file = os.path.join(ideas_dir, f"ideas_{datetime.now().strftime('%Y%m%d')}.md")
with open(ideas_file, "a") as f:
    f.write(f"\n## {datetime.now().strftime('%H:%M')} — {len(tasks)} tasks\n")
    for t in tasks:
        f.write(f"- [{t.get('priority','?')}] {t.get('title','')} ({t.get('category','')})\n")

print(f"{len(tasks)} tasks queued.")
for t in sorted(tasks, key=lambda x: x.get('priority', 5)):
    model = t.get('model', 'haiku')
    print(f"  [{model}] P{t.get('priority','?')}: {t.get('title','')}")
PYTHON

echo "[$(date)] Strategist done." >> "$LOG_DIR/strategist.log"
