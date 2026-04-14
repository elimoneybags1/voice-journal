"""Post to LinkedIn using their API. No browser needed."""
import os
import sys
import json
import re
import urllib.request


def get_profile_id():
    """Get the authenticated user's LinkedIn profile URN."""
    url = "https://api.linkedin.com/v2/userinfo"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {os.environ['LINKEDIN_ACCESS_TOKEN']}",
    })
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    return data["sub"]  # This is the member ID


def post_update(text):
    """Post a text update to LinkedIn."""
    profile_id = get_profile_id()

    url = "https://api.linkedin.com/v2/ugcPosts"
    payload = {
        "author": f"urn:li:person:{profile_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {os.environ['LINKEDIN_ACCESS_TOKEN']}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    })

    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        print(f"  Posted to LinkedIn: {result.get('id', 'success')}")
        return True
    except urllib.error.HTTPError as e:
        print(f"  LinkedIn failed: {e.code} — {e.read().decode()}")
        return False


def parse_linkedin_content(filepath):
    """Extract LinkedIn post from content file."""
    with open(filepath) as f:
        content = f.read()

    # Look for LinkedIn section
    match = re.search(
        r'(?:linkedin|LinkedIn)[^\n]*\n+(.*?)(?=\n##|\n#|\Z)',
        content, re.DOTALL | re.IGNORECASE
    )
    if match:
        return match.group(1).strip()

    # Fallback: use the whole content if it's reasonable length
    if len(content) < 3000:
        return content.strip()

    return None


if __name__ == "__main__":
    if not os.environ.get("LINKEDIN_ACCESS_TOKEN"):
        print("Missing LINKEDIN_ACCESS_TOKEN env var")
        print("Get one from linkedin.com/developers")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python linkedin.py <content-file.md>")
        print("   or: python linkedin.py --post 'Your update text'")
        sys.exit(1)

    if sys.argv[1] == "--post":
        text = " ".join(sys.argv[2:])
        post_update(text)
    else:
        text = parse_linkedin_content(sys.argv[1])
        if text:
            print("Posting to LinkedIn...")
            post_update(text)
        else:
            print("No LinkedIn content found in file.")
