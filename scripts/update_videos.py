import json
import xml.etree.ElementTree as ET

tree = ET.parse("feed.xml")
root = tree.getroot()

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

with open("data/latest-videos.json", "w", encoding="utf-8") as f:
    json.dump(videos, f, indent=2)