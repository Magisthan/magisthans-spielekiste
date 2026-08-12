# Retro Discovery
# UI Components 1.0

---

# Ziel

Dieses Dokument beschreibt sämtliche UI-Komponenten von Retro Discovery.

Jede Komponente besitzt:

- eine Aufgabe
- ein Erscheinungsbild
- definierte Zustände
- Animationen
- Assets
- Regeln

Neue Komponenten müssen diesem Dokument hinzugefügt werden.

---

# Komponentenübersicht

## Discovery Console

Status:
Concept

Beschreibung:

Zentrale Bedieneinheit der Discovery Station.

Hier startet jede Spielsuche.

Enthält:

- Discovery Knopf
- Systeme
- Genres
- Statusdisplay

---

## Viewer Panel

Status:
Prototype

Beschreibung:

Präsentiert die ausgewählte Spielbox als hochwertiges 3D-Objekt.

Komponenten:

- 3D Viewer
- Fullscreen
- Kamera
- Bedienhilfe

---

## Community Panel

Status:
Prototype

Beschreibung:

Zeigt die Bewertungen der Community.

Komponenten:

- Balken
- Durchschnitt
- Stimmen
- Bewertungsbutton

---

## Game Information Panel

Status:
Planned

Beschreibung:

Museumstafel zum aktuellen Spiel.

Enthält:

Titel

Publisher

Developer

Jahr

Genre

Kurzbeschreibung

Persönliche Einschätzung

Besonderheiten

---

## Let's Play Panel

Status:
Planned

Beschreibung:

Verknüpfung zu vorhandenen Videos.

Anzeige:

Thumbnail

Titel

Laufzeit

YouTube Button

Playlist

---

## Rating Dialog

Status:
Prototype

Beschreibung:

Dialog zum Bewerten eines Spiels.

Komponenten:

Sterne

Texte

Buttons

Bestätigung

---

# Discovery Console

Das Herzstück von Retro Discovery.

---

## Discovery Knob

Typ

Drehregler

Beschreibung

Zentrales Bedienelement.

Größtes UI-Element.

Material

Gebürstetes Aluminium

gerändelter Außenring

Gravur

LED Ring

Animation

Sanfte Rotation

Trägheit

Leichter Druckeffekt

Assets

knob.webp

knob_shadow.webp

knob_glow.webp

---

## System Switch

Typ

Kippschalter

Beschreibung

Aktiviert Systeme.

Mehrfachauswahl.

Material

Metallhebel

Metallplatte

Beschriftung

LED

Zustände

OFF

ON

DISABLED

Animation

Mechanisches Umschalten

Leichter Feder-Effekt

Assets

switch_on.webp

switch_off.webp

led_green.webp

---

## Genre Button

Typ

Drucktaster

Beschreibung

Aktiviert Genres.

Mehrfachauswahl.

Material

Mattes Kunststoffgehäuse

Leichte Erhöhung

LED

Zustände

OFF

ON

HOVER

Animation

Druckbewegung

Glow

Assets

genre_on.webp

genre_off.webp

---

## LCD Display

Beschreibung

Informationsdisplay.

Anzeige

READY

Spielanzahl

aktive Systeme

aktive Genres

keine Treffer

Animation

Zählt Werte hoch

Blinkt niemals

Assets

lcd_frame.webp

lcd_overlay.webp

---

# Viewer Panel

## Viewer Frame

Material

Metall

Glas

Beschreibung

Rahmen um den Babylon Viewer.

Assets

viewer_frame.webp

---

## Fullscreen Button

Material

Metalltaster

Animation

Leichter Druck

Assets

fullscreen_button.webp

---

## Viewer Guide

Beschreibung

Bedienhinweise.

Nur Desktop.

Animation

Einblenden

Ausblenden

---

# Community Panel

## Community Display

Anzeige

Spiel

Boxdesign

Kultstatus

Bewertungen

---

## Rating Bars

Material

Eingelassene Anzeige

LED Füllung

Animation

Sanftes Hochlaufen

---

## Vote Button

Material

Metalltaster

Animation

Leichter Druck

---

# Game Information Panel

Beschreibung

Museumstafel.

Nicht Datenbank.

Enthält

Titel

Untertitel

Publisher

Developer

Jahr

Genre

Beschreibung

Persönliche Einschätzung

Besonderheiten

Links

---

# Let's Play Panel

Beschreibung

Medienbereich.

Nicht einfacher Link.

Anzeige

Thumbnail

Titel

Episode

Playlist

YouTube

Status

Nicht vorhanden

Ein Video

Mehrere Videos

---

# Rating Dialog

Beschreibung

Overlay.

Keine Browser-Dialogoptik.

Material

Metallrahmen

Display

Taster

Komponenten

Sterne

Bewertungstexte

Buttons

Animation

Einblenden

Ausblenden

---

# LEDs

Amber

Auswahl

Discovery

---

Grün

READY

Online

---

Rot

Warnung

Fehler

Keine Treffer

---

# Schrauben

Einheitliches Asset.

Nur dekorativ.

Nie anklickbar.

---

# Divider

Gravierte Linie.

Zur Strukturierung.

---

# Statusanzeigen

READY

DISCOVERING

LOADING

NO MATCHES

VIDEO FOUND

NO VIDEO

COMMUNITY ONLINE

---

# Animationen

Discovery

Rotation

Viewer

Fade

Community

Bars

Display

Counter

LED

Glow

---

# Sounds

Kippschalter

Relais

Motor

Button

optional

---

# Asset Library

assets/ui/

console.webp

knob.webp

switch_on.webp

switch_off.webp

genre_on.webp

genre_off.webp

lcd_frame.webp

viewer_frame.webp

community_panel.webp

rating_panel.webp

fullscreen_button.webp

led_green.webp

led_amber.webp

led_red.webp

divider.webp

screw.webp

---

# Entwicklungsstatus

Concept

Design

Rendering

Integration

Polish

Fertig

Jede Komponente durchläuft diese fünf Phasen.

Neue Komponenten beginnen immer bei "Concept".

# Komponenten-Regeln

Jede neue UI-Komponente muss künftig dieselbe Struktur haben:

Zweck – Warum gibt es sie?
Verhalten – Wie reagiert sie auf den Nutzer?
Design – Materialien, Farben, Form.
Assets – Welche WebP-/SVG-Dateien gehören dazu?
Animationen – Welche Bewegungen sind vorgesehen?
Responsive Verhalten – Wie verändert sie sich auf Tablet und Smartphone?
Abhängigkeiten – Mit welchen Modulen kommuniziert sie?
