#!/bin/bash
# REVIEWER — checks open PRs created by worker agents for quality
# Approves good ones, comments on issues
set -euo pipefail

PROJECT_DIR="$HOME/voice-journal"
LOG_DIR="$PROJECT_DIR/scripts/agents/logs"

mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

# Get open PRs from auto/ branches
OPEN_PRS=$(gh pr list --json number,title,headRefName --state open 2>/dev/null | \
    python3 -c "
import json, sys
prs = json.load(sys.stdin)
auto_prs = [p for p in prs if p['headRefName'].startswith('auto/')]
for p in auto_prs:
    print(f\"{p['number']}|{p['title']}|{p['headRefName']}\")
" 2>/dev/null)

if [ -z "$OPEN_PRS" ]; then
    echo "No auto-generated PRs to review."
    exit 0
fi

echo "Reviewing $(echo "$OPEN_PRS" | wc -l | tr -d ' ') PRs..."

while IFS='|' read -r PR_NUM PR_TITLE PR_BRANCH; do
    echo ""
    echo "Reviewing PR #$PR_NUM: $PR_TITLE"

    # Get the diff
    DIFF=$(gh pr diff "$PR_NUM" 2>/dev/null)

    if [ -z "$DIFF" ]; then
        echo "  No diff, skipping."
        continue
    fi

    REVIEW=$(claude --model haiku -p "$(cat <<PROMPT
You are a senior code reviewer. Review this pull request for Voice Journal.

PR Title: $PR_TITLE
Branch: $PR_BRANCH

Diff:
$DIFF

Check for:
1. Does the code actually do what the PR title says?
2. Any bugs, typos, or logic errors?
3. Security issues (SQL injection, XSS, etc)?
4. Does it follow existing patterns in the codebase?
5. Will it break existing functionality?

Respond with ONE of:
- APPROVE: (one sentence why it's good)
- CHANGES_NEEDED: (specific issues that must be fixed)

Be concise. Don't nitpick style.
PROMPT
)" --output-format json 2>/dev/null | jq -r '.result')

    echo "  Review: $REVIEW"

    if echo "$REVIEW" | grep -qi "^APPROVE"; then
        gh pr review "$PR_NUM" --approve --body "Auto-reviewed: $REVIEW" 2>/dev/null
        echo "  ✓ Approved"
    else
        gh pr review "$PR_NUM" --comment --body "Auto-review: $REVIEW" 2>/dev/null
        echo "  ✗ Changes requested"
    fi

    echo "[$(date)] PR #$PR_NUM: $REVIEW" >> "$LOG_DIR/reviewer.log"

done <<< "$OPEN_PRS"

echo ""
echo "Review complete."
