# ReactionStore und spätere Supabase-Anbindung

Der Viewer und Top Discoveries greifen ausschließlich über `window.ReactionStore`
auf Reaktionsdaten zu. Die UI kennt dadurch weder `localStorage` noch einen
späteren Backendanbieter.

## Aktiver lokaler Adapter

- `seed(entries)` übernimmt lokale Startwerte.
- `register(game)` legt bislang unbekannte Spiele an.
- `get(folder)` liefert Likes, Dislikes, Prozente und die lokale Auswahl.
- `vote(game, reaction)` verarbeitet neue, geänderte und entfernte Stimmen.
- `all()` liefert den aktuellen lokalen Datenbestand.
- `reactionstorechange` informiert Top Discoveries über Änderungen.

Die Auswahl des aktuellen Browsers und die lokalen Aggregate liegen getrennt in:

- `gamebox-reaction-choices-v1`
- `gamebox-reaction-aggregates-v1`

## Vorgesehener Supabase-Adapter

Der spätere Adapter implementiert dieselben öffentlichen Methoden. Empfohlen ist
eine Tabelle `game_reactions` mit `folder`, `likes`, `dislikes` und `updated_at`.
Das Abstimmen muss serverseitig über eine atomare RPC-Funktion erfolgen. Diese
erhält Spielordner, vorherige Auswahl und neue Auswahl und liefert danach den
vollständigen aktualisierten Datensatz zurück.

Eine anonyme Supabase-Identität oder eine vergleichbare serverseitige Zuordnung
soll Mehrfachstimmen besser begrenzen. `localStorage` bleibt lediglich für die
sofortige lokale Darstellung der eigenen Auswahl zuständig.

Top Discoveries berechnet den Wilson Score weiterhin im Browser aus `likes` und
`dislikes`. Ein Wechsel des Adapters erfordert daher keine Änderung an Viewer,
Animation oder Ranglistenanzeige.
