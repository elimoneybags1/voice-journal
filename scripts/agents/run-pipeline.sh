#!/bin/bash
# FULL PIPELINE — run strategist → workers → content in one shot
# This is what the cron job calls
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "════════════════════════════════════════════"
echo "  Voice Journal Agent Pipeline"
echo "  $(date)"
echo "════════════════════════════════════════════"
echo ""

# Step 1: Strategist (Opus) researches and plans
echo "▸ Phase 1: Strategist thinking..."
bash "$SCRIPT_DIR/strategist.sh" 2>&1 | tee -a "$LOG_DIR/pipeline_$(date +%Y%m%d).log"
echo ""

# Step 2: Workers (Haiku/Sonnet) execute code tasks
echo "▸ Phase 2: Workers executing..."
bash "$SCRIPT_DIR/worker.sh" 2>&1 | tee -a "$LOG_DIR/pipeline_$(date +%Y%m%d).log"
echo ""

# Step 3: Content generation (weekly, skip if not Monday)
if [ "$(date +%u)" = "1" ]; then
    echo "▸ Phase 3: Weekly content batch..."
    bash "$SCRIPT_DIR/content-poster.sh" 2>&1 | tee -a "$LOG_DIR/pipeline_$(date +%Y%m%d).log"
else
    echo "▸ Phase 3: Content runs on Mondays, skipping."
fi

echo ""
echo "Pipeline complete. Check GitHub for PRs."
echo "════════════════════════════════════════════"
