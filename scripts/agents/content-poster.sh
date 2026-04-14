#!/bin/bash
# CONTENT ENGINE — daily content generation, not just weekly
# Generates platform-specific content based on research + product updates
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
CONTENT_DIR="$PROJECT_DIR/scripts/agents/content"
RESEARCH_DIR="$PROJECT_DIR/scripts/agents/research"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"

mkdir -p "$CONTENT_DIR" "$LOG_DIR"

DATE=$(date +%Y%m%d)
DAY_OF_WEEK=$(date +%u)

# Load latest research for context
LATEST_RESEARCH=""
if ls "$RESEARCH_DIR"/*.md 1>/dev/null 2>&1; then
    LATEST_RESEARCH=$(cat "$RESEARCH_DIR"/*.md 2>/dev/null | tail -500)
fi

# Get recent git activity for "building in public" content
RECENT_COMMITS=$(cd "$PROJECT_DIR" && git log --oneline -10 2>/dev/null)

# Daily content varies by day
case $DAY_OF_WEEK in
    1) CONTENT_TYPE="twitter-thread"
       INSTRUCTIONS="Write a Twitter/X thread (5-8 tweets). Topic: a 'building in public' update about what was shipped last week. Use the git log below for real updates. Make it authentic, not corporate. Hook the first tweet HARD."
       ;;
    2) CONTENT_TYPE="hot-takes"
       INSTRUCTIONS="Write 3 standalone Twitter/X tweets. Each should be a hot take or insight about journaling, voice notes, or AI productivity. Contrarian > generic. Each tweet should stand alone and get engagement."
       ;;
    3) CONTENT_TYPE="linkedin-post"
       INSTRUCTIONS="Write a LinkedIn post about building Voice Journal. Professional but personal. Focus on one specific lesson learned or decision made. Include a question at the end to drive comments."
       ;;
    4) CONTENT_TYPE="reddit-post"
       INSTRUCTIONS="Write a Reddit post for r/productivity, r/journaling, or r/SideProject. Genuine, helpful tone. Lead with a problem you solved, not a product pitch. Include 'I built this because...' angle."
       ;;
    5) CONTENT_TYPE="tiktok-scripts"
       INSTRUCTIONS="Write 3 short-form video scripts (TikTok/Reels). Each 30-60 seconds. Format: HOOK (first 3 seconds) → CONTENT → CTA. Topics: voice journaling tips, app demo walkthrough, 'why I stopped typing my journal'."
       ;;
    6) CONTENT_TYPE="seo-blog"
       INSTRUCTIONS="Write a 500-word SEO blog post draft. Target keyword: 'voice journaling app' or 'AI journal'. Include H2 headers, natural keyword usage, and a CTA to try Voice Journal. Helpful > salesy."
       ;;
    7) CONTENT_TYPE="weekly-roundup"
       INSTRUCTIONS="Write a weekly content roundup: 1) Newsletter-style email (3 paragraphs), 2) A Product Hunt-ready tagline + 3-sentence description, 3) App Store description (200 words). Make each feel different."
       ;;
esac

echo "[$(date)] Content engine: $CONTENT_TYPE" >> "$LOG_DIR/content.log"

claude --model sonnet -p "$(cat <<PROMPT
You are the content creator for Voice Journal — a voice-first AI journaling app.
Record a voice note, AI transcribes and organizes it. Think Day One meets Otter.ai.

## Today's task: $CONTENT_TYPE

$INSTRUCTIONS

## Context from recent research:
$LATEST_RESEARCH

## Recent development activity:
$RECENT_COMMITS

## Brand voice:
- Authentic, builder-first (indie dev building for himself, then others)
- Smart but not pretentious
- Specific > vague ("I shipped voice commands today" not "exciting updates!")
- Slight edge / opinions welcome
- Emoji sparingly, never cringe

## Rules:
- Each piece should feel native to its platform
- Include hashtags where relevant
- Include a soft CTA (never "buy now", more like "been testing this, thoughts?")
- Reference real features that actually exist in the app
PROMPT
)" --allowedTools "Read,WebSearch" \
  --output-format json 2>/dev/null | jq -r '.result' > "$CONTENT_DIR/${CONTENT_TYPE}_${DATE}.md"

echo "Content saved: $CONTENT_DIR/${CONTENT_TYPE}_${DATE}.md"
echo "[$(date)] Content complete: $CONTENT_TYPE" >> "$LOG_DIR/content.log"
