#!/bin/bash
# Set up cron for the agent pipeline
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIPELINE="$SCRIPT_DIR/run-pipeline.sh"

chmod +x "$SCRIPT_DIR"/*.sh

echo "Voice Journal Agent Pipeline Setup"
echo "==================================="
echo ""
echo "Choose a schedule:"
echo "  1) 3x daily — 8am, 1pm, 7pm (recommended, ~$20-25/mo)"
echo "  2) 2x daily — 9am, 6pm (~$15-18/mo)"
echo "  3) 1x daily — 9am (~$8-10/mo)"
echo "  4) Every 4 hours — aggressive (~$30-40/mo)"
echo "  5) Manual only"
read -p "Choice [1-5]: " choice

case $choice in
    1) CRON="0 8,13,19 * * *" ; DESC="3x daily (8am, 1pm, 7pm)" ;;
    2) CRON="0 9,18 * * *" ; DESC="2x daily (9am, 6pm)" ;;
    3) CRON="0 9 * * *" ; DESC="1x daily (9am)" ;;
    4) CRON="0 */4 * * *" ; DESC="every 4 hours" ;;
    5)
        echo ""
        echo "Scripts ready. Run manually:"
        echo "  bash $PIPELINE"
        echo ""
        echo "Or run individual agents:"
        echo "  bash $SCRIPT_DIR/strategist.sh   # plan tasks"
        echo "  bash $SCRIPT_DIR/worker.sh       # execute tasks"
        echo "  bash $SCRIPT_DIR/researcher.sh   # deep research"
        echo "  bash $SCRIPT_DIR/content-poster.sh # content"
        echo "  bash $SCRIPT_DIR/reviewer.sh     # review PRs"
        exit 0
        ;;
    *) CRON="0 8,13,19 * * *" ; DESC="3x daily (8am, 1pm, 7pm)" ;;
esac

# Install cron (preserve existing, remove old voice-journal entries)
(crontab -l 2>/dev/null | grep -v "voice-journal.*run-pipeline"; \
 echo "$CRON bash $PIPELINE >> $SCRIPT_DIR/logs/cron.log 2>&1") | crontab -

echo ""
echo "Cron installed: $DESC"
echo "Pipeline: $PIPELINE"
echo "Logs: $SCRIPT_DIR/logs/"
echo ""
echo "What runs each cycle:"
echo "  1. Strategist (Sonnet) — researches + plans 8-10 tasks"
echo "  2. Workers (Haiku/Sonnet) — executes tasks, creates PRs"
echo "  3. Researcher (Sonnet) — deep dive (rotates topic daily)"
echo "  4. Content (Sonnet) — daily social media content"
echo "  5. Reviewer (Haiku) — reviews open PRs"
echo ""
echo "Estimated cost: depends on schedule"
echo "  3x/day: ~$20-25/mo"
echo "  1x/day: ~$8-10/mo"
echo ""
echo "To check: crontab -l"
echo "To remove: crontab -l | grep -v voice-journal | crontab -"
