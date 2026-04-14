#!/bin/bash
# FULL PIPELINE — aggressive autonomous development + marketing
# Runs multiple times per day via cron
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG="$LOG_DIR/pipeline_$(date +%Y%m%d).log"

echo "════════════════════════════════════════════" | tee -a "$LOG"
echo "  Voice Journal Agent Pipeline — $TIMESTAMP" | tee -a "$LOG"
echo "════════════════════════════════════════════" | tee -a "$LOG"

# ─── Phase 1: STRATEGIST — research + plan ───
echo "▸ Phase 1: Strategist researching..." | tee -a "$LOG"
bash "$SCRIPT_DIR/strategist.sh" 2>&1 | tee -a "$LOG"

# ─── Phase 2: WORKERS — execute code tasks in parallel ───
echo "▸ Phase 2: Workers building..." | tee -a "$LOG"
bash "$SCRIPT_DIR/worker.sh" 2>&1 | tee -a "$LOG"

# ─── Phase 3: RESEARCHER — deep dives on product/market ───
echo "▸ Phase 3: Researcher exploring..." | tee -a "$LOG"
bash "$SCRIPT_DIR/researcher.sh" 2>&1 | tee -a "$LOG"

# ─── Phase 4: CONTENT — daily, not just mondays ───
echo "▸ Phase 4: Content generation..." | tee -a "$LOG"
bash "$SCRIPT_DIR/content-poster.sh" 2>&1 | tee -a "$LOG"

# ─── Phase 5: REVIEWER — check all open PRs for quality ───
echo "▸ Phase 5: PR review..." | tee -a "$LOG"
bash "$SCRIPT_DIR/reviewer.sh" 2>&1 | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "Pipeline complete. $(date)" | tee -a "$LOG"
echo "════════════════════════════════════════════" | tee -a "$LOG"
