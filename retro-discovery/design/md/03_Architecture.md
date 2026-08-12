# Retro Discovery
# Architecture 1.0

---

# Architektur-Philosophie

Retro Discovery besteht aus eigenständigen Modulen.

Jedes Modul besitzt genau eine Aufgabe.

Module kennen sich möglichst wenig gegenseitig.

Alle Module kommunizieren ausschließlich über definierte Datenstrukturen.

Dadurch bleibt das Projekt wartbar und leicht erweiterbar.

---

# Gesamtarchitektur

```
                  game.js
                     │
                     ▼
             Discovery Session
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼

 Discovery      Community        Viewer

     ▼               ▼                ▼

 Spielinformationen   Let's Plays   Bewertung
```

Alle Module lesen dieselbe Spielbasis.

Es gibt nur eine Quelle der Wahrheit.

---

# Core

## game.js

Aufgabe

Zentrale Spieldatenbank.

Enthält:

- Titel
- Entwickler
- Publisher
- Genre
- Systeme
- Beschreibung
- Bewertung
- Bilder
- Videos
- Seitenlinks

Es existiert keine zweite Datenquelle.

---

## Discovery Session

Die Session enthält den aktuellen Zustand.

Sie speichert:

- aktive Systeme
- aktive Genres
- aktuelle Trefferliste
- aktuelles Spiel
- Discovery Status

Die Session ersetzt globale Variablen.

---

# Module

## Discovery

Verantwortlich für:

- Discovery Knopf
- Zufallsauswahl
- Filter
- Session
- Statusdisplay

Discovery kennt keine Community.

Discovery kennt keinen Viewer.

Discovery liefert lediglich das gewählte Spiel.

---

## Viewer

Verantwortlich für:

- BabylonJS
- Boxaufbau
- Materialien
- Kamerasteuerung
- Vollbild
- Animationen

Der Viewer kennt keine Filter.

Der Viewer erhält lediglich:

```
game
```

---

## Carousel

Verantwortlich für:

- Regal
- Positionen
- Animation
- Auswahl

Keine Spielinformationen.

Keine Bewertungen.

---

## Community

Verantwortlich für:

- Bewertungen
- Durchschnitt
- Stimmen

Keine Discovery Logik.

Keine Viewer Logik.

---

## Spielinformationen

Verantwortlich für:

- Beschreibung

- Entwickler

- Publisher

- Jahr

- Genre

- Besonderheiten

- persönliche Einschätzung

- Screenshots

---

## Let's Plays

Verantwortlich für:

- YouTube Links

- Episoden

- Thumbnails

- Laufzeiten

---

## Rating Dialog

Verantwortlich für:

- Bewertungseingabe

- Sterne

- Speichern

- Rückmeldung

---

# Datenfluss

```
game.js

↓

Discovery Session

↓

aktuelles Spiel

↓

Viewer

Community

Spielinformationen

Let's Plays
```

Es existiert nur ein aktives Spiel.

Alle Module reagieren darauf.

---

# Ordnerstruktur

```
Retro Discovery

assets/

    images/

    textures/

    ui/

    icons/

    audio/

css/

js/

docs/

```

---

# CSS Struktur

```
style.css

layout.css

viewer.css

carousel.css

community.css

buttons.css

animation.css

responsive.css
```

Jede CSS-Datei besitzt nur eine Aufgabe.

---

# JavaScript Struktur

```
app.js

viewer.js

carousel.js

community.js

filters.js

events.js

navigation.js

ui.js

rating-dialog.js
```

Keine Datei übernimmt mehrere Hauptaufgaben.

---

# Design Assets

Alle UI-Komponenten liegen in

```
assets/ui/
```

Beispiele

```
console.webp

switch_on.webp

switch_off.webp

lcd_frame.webp

led_green.webp

led_red.webp

knob.webp

community_panel.webp
```

Design liegt niemals im JavaScript.

---

# Datenmodell

Alle Module arbeiten mit demselben Spielobjekt.

Beispiel

game

↓

title

system

genre

publisher

developer

year

description

rating

videos

textures

page

folder

featured

...

---

# Architektur-Regeln

## Single Source of Truth

Alle Informationen stammen aus game.js.

---

## Single Responsibility

Eine Datei

Eine Aufgabe.

---

## Lose Kopplung

Module kennen sich möglichst nicht gegenseitig.

---

## Wiederverwendbarkeit

Neue Module dürfen bestehende Module nicht verändern müssen.

---

## Erweiterbarkeit

Neue Systeme.

Neue Genres.

Neue Panels.

Neue Viewer.

Neue Community Funktionen.

Alles muss ohne Umbau möglich sein.

---

# Rendering

HTML

↓

CSS

↓

JavaScript

↓

BabylonJS

↓

Assets

Nicht umgekehrt.

---

# Discovery Ablauf

```
Benutzer

↓

Filter

↓

Discovery Session

↓

Spiel auswählen

↓

Viewer aktualisieren

↓

Community aktualisieren

↓

Spielinformationen aktualisieren

↓

Let's Play aktualisieren

↓

Statusdisplay aktualisieren
```

---

# Fehlerbehandlung

Kein Modul darf abstürzen.

Fehlen Daten,

werden Standardwerte verwendet.

Fehlt ein Bild,

erscheint ein Platzhalter.

Fehlt ein Video,

verschwindet der Bereich.

---

# Zukunft

Die Architektur soll Erweiterungen ermöglichen.

Beispiele

Favoriten

Discovery History

Top 100

Suche

Sammlungsstatistik

Achievements

Neue Systeme

Neue Viewer

Mehrsprachigkeit

Alle Erweiterungen sollen möglich sein,

ohne bestehende Module umzubauen.


# Architektur-Prinzipien

Nicht nur wie der Code aufgebaut ist, sondern wie wir grundsätzlich entwickeln.

Ich würde vier Grundregeln festschreiben:

Data first – Alle Informationen kommen aus game.js. Es gibt keine doppelten Datenquellen.
Design first – Neue Module werden zuerst konzipiert und gestaltet, erst danach programmiert.
Module first – Jede neue Funktion entsteht als eigenständiges Modul mit klarer Verantwortung.
Experience first – Bei jeder Entscheidung fragen wir nicht nur „Funktioniert es?“, sondern auch „Verbessert es das Erlebnis für den Besucher?“