import json
import xml.etree.ElementTree as ET
import sys

try:

    with open("feed.xml", "r", encoding="utf-8") as f:
        content = f.read()

    if "<feed" not in content:
        print("Ungültiger Feed erhalten.")
        sys.exit(0)

    root = ET.fromstring(content)

except Exception as e:

    print(f"Feed Fehler: {e}")

    sys.exit(0)

ns = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015"
}

videos = []

for entry in root.findall("atom:entry", ns)[:3]:

    title = entry.find("atom:title", ns).text

    video_id = entry.find("yt:videoId", ns).text

    videos.append({
        "title": title,
        "videoId": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    })

if not videos:

    print("Keine Videos gefunden.")

    sys.exit(0)

with open("data/latest-videos.json", "w", encoding="utf-8") as f:

    json.dump(videos, f, indent=2)
