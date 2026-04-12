"""Feed dev recaps or text files into the voice journal as entries.

Usage:
    python scripts/ingest_dev_recaps.py --file recap.txt
    python scripts/ingest_dev_recaps.py --dir ./recaps/

Requires BACKEND_URL and SUPABASE_* env vars to be set.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
EMAIL = os.getenv("JOURNAL_EMAIL")
PASSWORD = os.getenv("JOURNAL_PASSWORD")


def get_token() -> str:
    """Get auth token from Supabase."""
    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def ingest_text(text: str, token: str, filename: str = "recap") -> dict:
    """Create a journal entry from text by wrapping it as a fake audio upload.

    For text, we skip the audio upload and call a hypothetical text endpoint,
    or we can just insert directly via the entries API.
    """
    # For text ingestion, we'll tag it directly using the backend's tagger
    # Since there's no dedicated text endpoint, we create the entry manually
    from datetime import datetime, timezone

    resp = httpx.post(
        f"{BACKEND_URL}/entries/ingest-text",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"text": text, "source": filename},
        timeout=30,
    )
    if resp.status_code == 404:
        print(f"  Text ingest endpoint not available. Skipping {filename}")
        return {}
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Ingest text files as journal entries")
    parser.add_argument("--file", type=str, help="Single file to ingest")
    parser.add_argument("--dir", type=str, help="Directory of files to ingest")
    args = parser.parse_args()

    if not args.file and not args.dir:
        parser.error("Provide --file or --dir")

    for var in ["SUPABASE_URL", "SUPABASE_ANON_KEY", "JOURNAL_EMAIL", "JOURNAL_PASSWORD"]:
        if not os.getenv(var):
            print(f"Missing env var: {var}")
            sys.exit(1)

    token = get_token()
    print("Authenticated.")

    files = []
    if args.file:
        files.append(Path(args.file))
    if args.dir:
        files.extend(sorted(Path(args.dir).glob("*.txt")))

    for f in files:
        print(f"Ingesting {f.name}...")
        text = f.read_text()
        result = ingest_text(text, token, f.name)
        if result:
            print(f"  Created: {result.get('entry', {}).get('title', 'unknown')}")


if __name__ == "__main__":
    main()
