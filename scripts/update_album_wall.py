#!/usr/bin/env python3
"""Refresh the public Spotify playlist album wall.

Spotify's public playlist embed supplies current track URIs and names. The
public oEmbed endpoint supplies each track's artwork URL, so no API secret is
needed and no credentials are written to the generated JSON.
"""

from __future__ import annotations

import concurrent.futures
import html
import json
import logging
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "albumwall.json"
PLAYLIST_ID = os.environ.get("SPOTIFY_PLAYLIST_ID", "37i9dQZF1Epp7akT4x0KST")
PLAYLIST_URL = f"https://open.spotify.com/playlist/{PLAYLIST_ID}"
EMBED_URL = f"https://open.spotify.com/embed/playlist/{PLAYLIST_ID}"
USER_AGENT = "Mozilla/5.0 (compatible; AlbumWallUpdater/1.0; +https://github.com/adhiirraj/adhiirraj.github.io)"


def read_url(url: str, *, accept: str = "*/*", attempts: int = 5) -> bytes:
    """Read a URL with a browser-like user agent and retry transient failures."""
    for attempt in range(attempts):
        request = Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": accept,
            },
        )
        try:
            with urlopen(request, timeout=35) as response:
                return response.read()
        except HTTPError as error:
            retryable = error.code == 429 or 500 <= error.code < 600
            if not retryable or attempt == attempts - 1:
                raise
            retry_after = error.headers.get("Retry-After", "")
            try:
                delay = min(max(float(retry_after), 1.0), 30.0)
            except ValueError:
                delay = min(2 ** attempt, 20)
            logging.warning("HTTP %s from Spotify; retrying in %.1fs", error.code, delay)
            time.sleep(delay)
        except (URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            delay = min(2 ** attempt, 20)
            logging.warning("Network error from Spotify; retrying in %ss", delay)
            time.sleep(delay)

    raise RuntimeError("URL retry loop ended unexpectedly")


def fetch_playlist_tracks() -> list[dict[str, str]]:
    raw_html = read_url(EMBED_URL, accept="text/html").decode("utf-8", errors="replace")
    match = re.search(
        r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>',
        raw_html,
        flags=re.DOTALL,
    )
    if not match:
        raise RuntimeError("Spotify's playlist embed did not contain its expected page data")

    page_data = json.loads(html.unescape(match.group(1)))
    tracks: list[dict[str, str]] = []
    seen_ids: set[str] = set()

    def walk(value: object) -> None:
        if isinstance(value, dict):
            uri = value.get("uri")
            title = value.get("title")
            if (
                isinstance(uri, str)
                and uri.startswith("spotify:track:")
                and isinstance(title, str)
            ):
                track_id = uri.rsplit(":", 1)[-1]
                if track_id not in seen_ids:
                    seen_ids.add(track_id)
                    artist = value.get("subtitle") or "Unknown artist"
                    tracks.append(
                        {
                            "id": track_id,
                            "title": title.strip(),
                            "artist": str(artist).replace("\u00a0", " ").strip(),
                            "spotifyUrl": f"https://open.spotify.com/track/{track_id}",
                        }
                    )
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(page_data)

    if not tracks:
        raise RuntimeError("No tracks could be extracted from Spotify's playlist embed")

    return tracks


def add_artwork(track: dict[str, str]) -> dict[str, str] | None:
    query = urlencode({"url": track["spotifyUrl"]})
    endpoint = f"https://open.spotify.com/oembed?{query}"
    try:
        metadata = json.loads(read_url(endpoint, accept="application/json").decode("utf-8"))
        image_url = metadata.get("thumbnail_url")
        if not isinstance(image_url, str) or not image_url.startswith("https://"):
            logging.warning("Spotify returned no artwork for %s — %s", track["title"], track["artist"])
            return None
        return {**track, "image": image_url}
    except Exception as error:  # A single unavailable track should not block the others.
        logging.warning("Could not resolve artwork for %s: %s", track["title"], error)
        return None


def build_album_list(tracks: list[dict[str, str]]) -> list[dict[str, str]]:
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        resolved = list(executor.map(add_artwork, tracks))

    albums: list[dict[str, str]] = []
    seen_covers: set[str] = set()
    for track in resolved:
        if not track:
            continue
        # Spotify returns the same thumbnail URL for tracks on the same album.
        if track["image"] in seen_covers:
            continue
        seen_covers.add(track["image"])
        albums.append(track)

    if not albums:
        raise RuntimeError("Spotify returned no usable album artwork; existing data was left untouched")
    if len(albums) < max(1, len(tracks) // 2):
        raise RuntimeError(
            f"Only {len(albums)} of {len(tracks)} tracks produced unique artwork; "
            "refusing to publish a potentially incomplete refresh"
        )

    return albums


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    tracks = fetch_playlist_tracks()
    albums = build_album_list(tracks)

    payload = {
        "playlistId": PLAYLIST_ID,
        "playlistUrl": PLAYLIST_URL,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "tracks": albums,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=OUTPUT.parent, delete=False
    ) as temporary:
        json.dump(payload, temporary, ensure_ascii=False, indent=2)
        temporary.write("\n")
        temporary_path = Path(temporary.name)

    temporary_path.replace(OUTPUT)
    logging.info(
        "Updated %s with %d unique album covers from %d playlist tracks",
        OUTPUT.relative_to(ROOT),
        len(albums),
        len(tracks),
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        logging.error("Album wall refresh failed: %s", error)
        raise SystemExit(1)
