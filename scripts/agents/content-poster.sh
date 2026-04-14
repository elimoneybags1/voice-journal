#!/bin/bash
# CONTENT POSTER — reviews generated content drafts and posts to social media
# For now: generates drafts. Add API keys to auto-post.
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
CONTENT_DIR="$PROJECT_DIR/scripts/agents/content"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"

mkdir -p "$CONTENT_DIR" "$LOG_DIR"

# ─── Generate a batch of content ───
claude --model sonnet -p "$(cat <<'PROMPT'
You are the Voice Journal social media manager. Generate a week of content.

Voice Journal is a voice-first journaling app — you record a voice note from your
phone, AI transcribes and organizes it into folders with tags, mood tracking,
and weekly summaries. Think: if Day One and Otter.ai had a baby.

Target audience: productivity nerds, journalers, self-improvement people, founders.

Generate these 7 pieces of content:

1. **Twitter/X thread** (5-7 tweets): "Why I switched from typing to voice journaling"
   - Hook first tweet hard
   - Include a personal-feeling anecdote
   - End with soft CTA

2. **Twitter/X single tweet**: Product update / feature announcement
   - Screenshot-worthy, concise

3. **Twitter/X single tweet**: Hot take about journaling
   - Contrarian, gets engagement

4. **LinkedIn post**: "Building in public" update about Voice Journal
   - Professional but authentic tone
   - What I built this week, what I learned

5. **Reddit post** (r/productivity or r/journaling):
   - Genuine, not salesy
   - "I built this thing because..." angle

6. **Instagram/TikTok caption**: For a screen recording demo
   - Short, punchy, emoji-ok
   - Hook + CTA

7. **Product Hunt tagline + description** (for future launch)
   - Tagline: under 60 chars
   - Description: 3 sentences

Format each as a separate section with a header. Include hashtags where relevant.
PROMPT
)" --allowedTools "Read,Write" \
  --output-format json 2>/dev/null | jq -r '.result' > "$CONTENT_DIR/weekly_content_$(date +%Y%m%d).md"

echo "[$(date)] Content batch generated" >> "$LOG_DIR/content.log"
echo "Content saved to: $CONTENT_DIR/weekly_content_$(date +%Y%m%d).md"
echo ""
echo "To auto-post, add these API keys to .env:"
echo "  TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN"
echo "  LINKEDIN_ACCESS_TOKEN"
echo "Then uncomment the posting section in this script."

# ─── AUTO-POST (uncomment when API keys are set) ───
# source "$PROJECT_DIR/scripts/agents/.env"
#
# # Post to Twitter/X using the API
# # pip install tweepy
# python3 - <<'PYTHON'
# import tweepy, os
# client = tweepy.Client(
#     consumer_key=os.environ["TWITTER_API_KEY"],
#     consumer_secret=os.environ["TWITTER_API_SECRET"],
#     access_token=os.environ["TWITTER_ACCESS_TOKEN"],
#     access_token_secret=os.environ["TWITTER_ACCESS_SECRET"],
# )
# # Read today's single tweet from the content file
# # Parse and post...
# PYTHON
