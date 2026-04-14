"""Post to Twitter/X using their API. No browser needed."""
import os
import sys
import json
import re
import time
import urllib.request
import urllib.parse
import hmac
import hashlib
import base64
import uuid

def oauth_sign(method, url, params, consumer_key, consumer_secret, token, token_secret):
    """Generate OAuth 1.0a signature."""
    oauth_params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": token,
        "oauth_version": "1.0",
    }
    all_params = {**params, **oauth_params}
    sorted_params = "&".join(f"{urllib.parse.quote(k, '')}={urllib.parse.quote(str(v), '')}"
                             for k, v in sorted(all_params.items()))
    base_string = f"{method}&{urllib.parse.quote(url, '')}&{urllib.parse.quote(sorted_params, '')}"
    signing_key = f"{urllib.parse.quote(consumer_secret, '')}&{urllib.parse.quote(token_secret, '')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
    ).decode()
    oauth_params["oauth_signature"] = signature
    auth_header = "OAuth " + ", ".join(
        f'{urllib.parse.quote(k, "")}="{urllib.parse.quote(v, "")}"'
        for k, v in sorted(oauth_params.items())
    )
    return auth_header


def post_tweet(text):
    """Post a single tweet."""
    url = "https://api.twitter.com/2/tweets"
    data = json.dumps({"text": text}).encode()
    auth = oauth_sign(
        "POST", url, {},
        os.environ["TWITTER_API_KEY"],
        os.environ["TWITTER_API_SECRET"],
        os.environ["TWITTER_ACCESS_TOKEN"],
        os.environ["TWITTER_ACCESS_SECRET"],
    )
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": auth,
        "Content-Type": "application/json",
    })
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        tweet_id = result["data"]["id"]
        print(f"  Posted: https://x.com/i/status/{tweet_id}")
        return tweet_id
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f"  Failed: {e.code} — {error}")
        return None


def post_thread(tweets):
    """Post a thread — each tweet replies to the previous."""
    prev_id = None
    for i, text in enumerate(tweets):
        url = "https://api.twitter.com/2/tweets"
        payload = {"text": text}
        if prev_id:
            payload["reply"] = {"in_reply_to_tweet_id": prev_id}

        data = json.dumps(payload).encode()
        auth = oauth_sign(
            "POST", url, {},
            os.environ["TWITTER_API_KEY"],
            os.environ["TWITTER_API_SECRET"],
            os.environ["TWITTER_ACCESS_TOKEN"],
            os.environ["TWITTER_ACCESS_SECRET"],
        )
        req = urllib.request.Request(url, data=data, headers={
            "Authorization": auth,
            "Content-Type": "application/json",
        })
        try:
            resp = urllib.request.urlopen(req)
            result = json.loads(resp.read())
            prev_id = result["data"]["id"]
            print(f"  Tweet {i+1}/{len(tweets)}: https://x.com/i/status/{prev_id}")
            time.sleep(1)  # Rate limit safety
        except urllib.error.HTTPError as e:
            print(f"  Tweet {i+1} failed: {e.code} — {e.read().decode()}")
            return
    print(f"  Thread posted ({len(tweets)} tweets)")


def parse_content_file(filepath):
    """Extract tweets/threads from a content markdown file."""
    with open(filepath) as f:
        content = f.read()

    tweets = []

    # Look for numbered tweets (thread format): "1. ...", "2. ..."
    thread_matches = re.findall(r'^\d+[\.\)]\s*(.+?)(?=\n\d+[\.\)]|\n\n|\Z)', content, re.MULTILINE | re.DOTALL)
    if len(thread_matches) >= 3:
        return "thread", [t.strip() for t in thread_matches if t.strip()]

    # Look for standalone tweets (separated by ---)
    sections = re.split(r'\n---+\n', content)
    for section in sections:
        section = section.strip()
        if section and len(section) <= 280:
            tweets.append(section)

    if tweets:
        return "tweets", tweets

    # Fallback: treat first 280 chars as a single tweet
    first_para = content.split("\n\n")[0].strip()
    if first_para and len(first_para) <= 280:
        return "tweets", [first_para]

    return "none", []


if __name__ == "__main__":
    # Check env vars
    required = ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print(f"Missing env vars: {', '.join(missing)}")
        print("Copy scripts/agents/.env.example to .env and fill in your Twitter API keys")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python twitter.py <content-file.md>")
        print("   or: python twitter.py --tweet 'Hello world'")
        sys.exit(1)

    if sys.argv[1] == "--tweet":
        text = " ".join(sys.argv[2:])
        post_tweet(text)
    else:
        content_type, items = parse_content_file(sys.argv[1])
        if content_type == "thread":
            print(f"Posting thread ({len(items)} tweets)...")
            post_thread(items)
        elif content_type == "tweets":
            for tweet in items:
                print(f"Posting tweet...")
                post_tweet(tweet)
                time.sleep(2)
        else:
            print("No tweetable content found in file.")
