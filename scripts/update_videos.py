import json
import re
import sys
import html
import requests

CHANNEL_URL = "https://www.youtube.com/@MagisthansSpielekiste/videos"

try:
    response = requests.get(
        CHANNEL_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/137.0 Safari/537.36"
            )
        },
        timeout=20
    )

    response.raise_for_status()
    page = response.text

except Exception as e:
    print(f"Fehler beim Abrufen der Kanalseite: {e}")
    sys.exit(0)

# ytInitialData aus der Seite extrahieren
match = re.search(
    r"var ytInitialData = (.*?);</script>",
    page,
    re.DOTALL
)

if not match:
    print("ytInitialData nicht gefunden.")
    sys.exit(0)

try:
    data = json.loads(match.group(1))

except Exception as e:
    print(f"JSON konnte nicht gelesen werden: {e}")
    sys.exit(0)


videos = []


def search(obj):

    if isinstance(obj, dict):

        if "videoRenderer" in obj:

            videos.append(obj["videoRenderer"])

        for value in obj.values():
            search(value)

    elif isinstance(obj, list):

        for item in obj:
            search(item)


search(data)

result = []
seen = set()

for video in videos:

    try:

        video_id = video["videoId"]

        if video_id in seen:
            continue

        seen.add(video_id)

        title = video["title"]["runs"][0]["text"]
        title = html.unescape(title)

        thumbnail = video["thumbnail"]["thumbnails"][-1]["url"]

        result.append({
            "title": title,
            "videoId": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": thumbnail
        })

        if len(result) == 3:
            break

    except Exception:
        pass

if not result:
    print("Keine Videos gefunden.")
    sys.exit(0)

with open(
    "data/latest-videos.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        result,
        f,
        indent=2,
        ensure_ascii=False
    )

print(f"{len(result)} Videos aktualisiert.")
