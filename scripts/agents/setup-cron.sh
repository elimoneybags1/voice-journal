#!/bin/bash
# Set up the cron job for the agent pipeline
# Run this once to install the schedule
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIPELINE="$SCRIPT_DIR/run-pipeline.sh"

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

echo "Choose a schedule:"
echo "  1) Daily at 9am (recommended)"
echo "  2) Every 6 hours"
echo "  3) Twice a day (9am + 6pm)"
echo "  4) Manual only (just make scripts executable)"
read -p "Choice [1-4]: " choice

case $choice in
    1) CRON="0 9 * * *" ;;
    2) CRON="0 */6 * * *" ;;
    3) CRON="0 9,18 * * *" ;;
    4)
        echo "Scripts ready. Run manually with:"
        echo "  bash $PIPELINE"
        exit 0
        ;;
    *) CRON="0 9 * * *" ;;
esac

# Add to crontab (preserving existing entries)
(crontab -l 2>/dev/null | grep -v "voice-journal.*run-pipeline"; \
 echo "$CRON bash $PIPELINE >> $SCRIPT_DIR/logs/cron.log 2>&1") | crontab -

echo ""
echo "Cron installed: $CRON"
echo "Pipeline: $PIPELINE"
echo "Logs: $SCRIPT_DIR/logs/"
echo ""
echo "To verify: crontab -l"
echo "To remove: crontab -l | grep -v voice-journal | crontab -"
