#!/bin/bash
# AUTO-POST — reads today's content and posts to all platforms
# Called by content-poster.sh after generating content
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"
CONTENT_DIR="$AGENTS_DIR/content"
LOG_DIR="$AGENTS_DIR/logs"
ENV_FILE="$AGENTS_DIR/.env"

# Load API keys
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "No .env file found at $ENV_FILE"
    echo "Copy .env.example to .env and add your API keys"
    exit 1
fi

# Find today's content
TODAY=$(date +%Y%m%d)
CONTENT_FILES=$(find "$CONTENT_DIR" -name "*${TODAY}*" -type f 2>/dev/null)

if [ -z "$CONTENT_FILES" ]; then
    echo "No content generated today. Run content-poster.sh first."
    exit 0
fi

for FILE in $CONTENT_FILES; do
    FILENAME=$(basename "$FILE")
    echo "Processing: $FILENAME"

    # Post to Twitter if keys are set
    if [ -n "${TWITTER_API_KEY:-}" ] && [ -n "${TWITTER_ACCESS_TOKEN:-}" ]; then
        echo "  → Twitter/X..."
        python3 "$SCRIPT_DIR/twitter.py" "$FILE" 2>&1 | tee -a "$LOG_DIR/posting.log"
    fi

    # Post to LinkedIn if key is set
    if [ -n "${LINKEDIN_ACCESS_TOKEN:-}" ]; then
        echo "  → LinkedIn..."
        python3 "$SCRIPT_DIR/linkedin.py" "$FILE" 2>&1 | tee -a "$LOG_DIR/posting.log"
    fi

    echo ""
done

echo "[$(date)] Auto-post complete" >> "$LOG_DIR/posting.log"
