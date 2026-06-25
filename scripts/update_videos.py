import json
import sys

from yt_dlp import YoutubeDL

CHANNEL_URL = "https://www.youtube.com/@MagisthansSpielekiste/videos"

OPTIONS = {
    "extract_flat": True,
    "quiet": True,
    "playlistend": 3,
}

try:

    with YoutubeDL(OPTIONS) as ydl:

        info = ydl.extract_info(CHANNEL_URL, download=False)

except Exception as e:

    print(f"Fehler beim Abrufen: {e}")

    sys.exit(0)

videos = []

for entry in info.get("entries", [])[:3]:

    video_id = entry.get("id")

    if not video_id:
        continue

   thumbnail = ""

if entry.get("thumbnails"):
    thumbnail = entry["thumbnails"][-1]["url"]
else:
    thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

videos.append({
    "title": entry.get("title", "YouTube Video"),
    "videoId": video_id,
    "url": f"https://www.youtube.com/watch?v={video_id}",
    "thumbnail": thumbnail
})

if not videos:

    print("Keine Videos gefunden.")

    sys.exit(0)

with open(
    "data/latest-videos.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        videos,
        f,
        indent=2,
        ensure_ascii=False
    )

print(f"{len(videos)} Videos aktualisiert.")
