#!/bin/bash
# RESEARCHER — deep dives on competitors, trends, user needs
# Outputs actionable reports the strategist reads next cycle
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
RESEARCH_DIR="$PROJECT_DIR/scripts/agents/research"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"

mkdir -p "$RESEARCH_DIR" "$LOG_DIR"

DATE=$(date +%Y%m%d)

# Rotate topics — different research each day of the week
DAY_OF_WEEK=$(date +%u)

case $DAY_OF_WEEK in
    1) TOPIC="competitor-analysis"
       PROMPT_BODY="Research the top 5 voice journaling and AI journaling apps (Day One, Otter.ai, Reflect, Bear, Rosebud). For each: key features, pricing, what users love, what they complain about on Reddit/Twitter/App Store reviews. Identify gaps we can exploit."
       ;;
    2) TOPIC="growth-channels"
       PROMPT_BODY="Research the best growth channels for a journaling/productivity app in 2026. What's working on Twitter/X, TikTok, Reddit, Product Hunt, Indie Hackers? Find 5 specific communities, subreddits, or accounts where our target users hang out. Include engagement strategies."
       ;;
    3) TOPIC="ai-journaling-trends"
       PROMPT_BODY="Research the latest AI-powered journaling trends. What are people building? Any new papers on AI for mental health / self-reflection? What voice AI capabilities are emerging? Any new APIs we should integrate? Look at HuggingFace, arXiv, Twitter AI community."
       ;;
    4) TOPIC="monetization"
       PROMPT_BODY="Research monetization strategies for journaling apps. What do people actually pay for? Compare pricing of Day One, Reflect, Notion, Otter. What's the ideal free vs paid split? Research Stripe integration patterns for Next.js PWAs. Find real conversion rate data."
       ;;
    5) TOPIC="user-psychology"
       PROMPT_BODY="Research the psychology of journaling habits. What makes people stick with a journal vs abandon it? What are the top reasons people quit journaling apps? What triggers and rewards create lasting habits? Reference BJ Fogg, James Clear, or actual studies."
       ;;
    6) TOPIC="technical-opportunities"
       PROMPT_BODY="Research cutting-edge features we could add: on-device whisper models (running locally), real-time streaming transcription, semantic search with embeddings, knowledge graphs from journal entries, proactive AI insights. What's feasible with our stack? Cost estimates."
       ;;
    7) TOPIC="content-strategy"
       PROMPT_BODY="Research content marketing strategies for developer-built productivity tools. What worked for Notion, Linear, Raycast? Find 10 high-traffic keywords related to voice journaling, AI journaling, voice notes app. Draft SEO blog post outlines."
       ;;
esac

echo "[$(date)] Researcher starting: $TOPIC" >> "$LOG_DIR/researcher.log"

claude --model sonnet -p "$(cat <<PROMPT
You are a product researcher for Voice Journal — a voice-first AI journaling PWA.

## Your research task: $TOPIC

$PROMPT_BODY

## Output format
Write a structured research report in markdown:

# $TOPIC — Research Report ($(date +%B\ %d,\ %Y))

## Key Findings
(3-5 bullet points — the most actionable insights)

## Detailed Analysis
(Organized sections with specifics, data, examples)

## Recommendations for Voice Journal
(5 specific, actionable next steps based on this research)

## Sources & Links
(URLs, accounts, communities referenced)

Be specific and actionable. No fluff. Include real data points, URLs, and names.
PROMPT
)" --allowedTools "WebSearch,WebFetch,Read" \
  --output-format json 2>/dev/null | jq -r '.result' > "$RESEARCH_DIR/${TOPIC}_${DATE}.md"

echo "[$(date)] Research complete: $RESEARCH_DIR/${TOPIC}_${DATE}.md" >> "$LOG_DIR/researcher.log"
echo "Research saved: $RESEARCH_DIR/${TOPIC}_${DATE}.md"
