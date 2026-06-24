import json
import re
import sys
import requests

CHANNEL_URL = "https://www.youtube.com/@MagisthansSpielekiste/videos"

try:
    response = requests.get(
        CHANNEL_URL,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
        timeout=20
    )

    response.raise_for_status()
    html = response.text

    with open("youtube_debug.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("Debug-Datei geschrieben")

except Exception as e:
    print(f"Fehler beim Abrufen der Kanalseite: {e}")
    sys.exit(0)

videos = []

matches = re.findall(
    r'"videoId":"([^"]+)".*?"title":\{"runs":\[\{"text":"([^"]+)"',
    html
)

seen = set()

for video_id, title in matches:

    if video_id in seen:
        continue

    seen.add(video_id)

    videos.append({
        "title": title,
        "videoId": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    })

    if len(videos) >= 3:
        break

if not videos:
    print("Keine Videos gefunden.")
    sys.exit(0)

with open("data/latest-videos.json", "w", encoding="utf-8") as f:
    json.dump(videos, f, indent=2, ensure_ascii=False)

print(f"{len(videos)} Videos aktualisiert.")
