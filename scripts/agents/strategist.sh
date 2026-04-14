#!/bin/bash
# STRATEGIST — runs on cron, uses Opus to think + plan
# Researches the codebase, analytics, competitors, then queues tasks for cheap workers
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
QUEUE_DIR="$PROJECT_DIR/scripts/agents/queue"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$QUEUE_DIR" "$LOG_DIR"

echo "[$(date)] Strategist starting..." >> "$LOG_DIR/strategist.log"

# ─── 1. RESEARCH PHASE (Opus thinks) ───
claude --model opus -p "$(cat <<'PROMPT'
You are the Voice Journal product strategist. Your job is to research and plan improvements.

## Your context
- Project: ~/voice-journal/ — a voice-first journaling PWA (FastAPI + Next.js + Supabase)
- Read ~/voice-journal/CLAUDE.md for full architecture
- Check recent git log for what's been done
- Read the codebase to understand current state

## What to evaluate
1. **Product gaps**: What features would make this 10x more useful for daily journaling?
2. **Code quality**: Any bugs, performance issues, missing error handling?
3. **Growth ideas**: What would make someone share this with a friend?
4. **Content ideas**: What social media posts could promote this? (Twitter threads, demo videos, etc.)

## Output format
Return ONLY a JSON array of tasks. Each task has:
{
  "id": "unique-slug",
  "type": "code" | "content" | "test" | "research",
  "priority": 1-5 (1=highest),
  "title": "short title",
  "description": "detailed description with specific files/changes needed",
  "estimated_complexity": "trivial" | "small" | "medium" | "large",
  "model": "haiku" | "sonnet" (haiku for simple, sonnet for complex)
}

Rules:
- Max 5 tasks per run (focused > scattered)
- Prefer small, shippable improvements over big rewrites
- Code tasks must reference specific files
- Content tasks should include draft copy
- Don't repeat tasks that were recently completed (check git log)
PROMPT
)" --allowedTools "Read,Glob,Grep,Bash(git log*),Bash(git diff*)" \
  --output-format json 2>/dev/null | jq -r '.result' > "$QUEUE_DIR/plan_$TIMESTAMP.json"

echo "[$(date)] Strategist generated plan: $QUEUE_DIR/plan_$TIMESTAMP.json" >> "$LOG_DIR/strategist.log"

# ─── 2. DISPATCH PHASE — launch workers for each task ───
# Parse tasks and spawn workers
python3 - "$QUEUE_DIR/plan_$TIMESTAMP.json" "$QUEUE_DIR" "$LOG_DIR" <<'PYTHON'
import json, sys, subprocess, os

plan_file = sys.argv[1]
queue_dir = sys.argv[2]
log_dir = sys.argv[3]

try:
    with open(plan_file) as f:
        content = f.read().strip()
        # Handle case where JSON is wrapped in markdown fences
        if "```" in content:
            import re
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
        tasks = json.loads(content)
except Exception as e:
    print(f"Failed to parse plan: {e}")
    sys.exit(1)

if not isinstance(tasks, list):
    tasks = tasks.get("tasks", [])

for task in tasks:
    task_id = task.get("id", "unknown")
    task_type = task.get("type", "code")
    model = task.get("model", "haiku")
    title = task.get("title", "")
    description = task.get("description", "")

    # Write task file
    task_file = os.path.join(queue_dir, f"task_{task_id}.json")
    with open(task_file, "w") as f:
        json.dump(task, f, indent=2)

    print(f"Queued: [{model}] {title}")

print(f"\n{len(tasks)} tasks queued. Run worker.sh to execute them.")
PYTHON

echo "[$(date)] Strategist done. Tasks queued." >> "$LOG_DIR/strategist.log"
