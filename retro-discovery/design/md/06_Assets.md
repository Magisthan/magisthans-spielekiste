# Retro Discovery
# Asset Library

Version 1.0

---

# Zweck

Dieses Dokument definiert sämtliche grafischen und akustischen Assets von Retro Discovery.

Alle Assets folgen einer gemeinsamen Designsprache und unterstützen den Eindruck einer hochwertigen Discovery-Station aus dem späten Commodore-Zeitalter.

Assets sind keine Dekoration.

Jedes Asset besitzt eine klare Funktion innerhalb der Benutzeroberfläche.

---

# Asset-Prinzipien

Alle Assets müssen:

✓ hochwertig wirken

✓ zur Design Language passen

✓ einheitliche Lichtquellen besitzen

✓ dieselben Materialien verwenden

✓ dieselbe Alterung besitzen

✓ konsistente Farben verwenden

✓ verlustfrei skalierbar sein

---

# Dateiformate

## UI

Format

WEBP

Auflösung

2x Basisgröße

Transparenz

Ja

Farbraum

sRGB

---

## Icons

Format

SVG

Fallback

WEBP

---

## Texturen

Format

WEBP

Nahtlos

wenn erforderlich

---

## Audio

Format

OGG

Optional

WAV für Masterdateien

---

# Ordnerstruktur

assets/

    ui/

    textures/

    icons/

    audio/

    fonts/

    screenshots/

    thumbnails/

---

# UI Assets

## Discovery Console

Status

Concept

Assets

console_background.webp

console_shadow.webp

console_overlay.webp

Beschreibung

Grundkörper der Discovery Console.

---

## Discovery Knob

Status

Concept

Assets

knob.webp

knob_shadow.webp

knob_glow.webp

knob_center.webp

Beschreibung

Zentrales Bedienelement.

---

## Kippschalter

Status

Concept

Assets

switch_on.webp

switch_off.webp

switch_plate.webp

switch_shadow.webp

Beschreibung

Schalter für Systemauswahl.

---

## Genre Buttons

Status

Concept

Assets

genre_button.webp

genre_button_pressed.webp

genre_glow.webp

Beschreibung

Taster für Genrefilter.

---

## LCD Display

Status

Concept

Assets

lcd_frame.webp

lcd_overlay.webp

lcd_glass.webp

lcd_mask.webp

Beschreibung

Statusanzeige der Discovery Console.

---

## LEDs

Status

Concept

Assets

led_green.webp

led_red.webp

led_amber.webp

led_off.webp

Beschreibung

Statusanzeigen.

---

## Schrauben

Status

Concept

Assets

screw.webp

screw_dark.webp

Beschreibung

Dekorative Gehäuseschrauben.

---

## Divider

Status

Concept

Assets

divider_horizontal.webp

divider_vertical.webp

Beschreibung

Trennt Panels optisch.

---

# Viewer Assets

viewer_frame.webp

viewer_shadow.webp

viewer_overlay.webp

fullscreen_button.webp

loading_indicator.webp

---

# Community Assets

community_panel.webp

rating_bar.webp

rating_star.webp

vote_button.webp

community_led.webp

---

# Game Information Assets

info_panel.webp

info_header.webp

museum_label.webp

description_background.webp

---

# Let's Play Assets

video_panel.webp

youtube_button.webp

playlist_badge.webp

episode_badge.webp

---

# Icons

system_c64.svg

system_amiga.svg

system_pc.svg

publisher.svg

developer.svg

calendar.svg

genre.svg

video.svg

rating.svg

community.svg

---

# Hintergrundtexturen

brushed_aluminium.webp

painted_metal.webp

dark_plastic.webp

lcd_noise.webp

rubber_surface.webp

wood_shelf.webp

glass_overlay.webp

---

# Animation Assets

loading_spinner.webp

discovery_glow.webp

led_glow.webp

panel_shadow.webp

button_shadow.webp

---

# Audio Assets

switch.ogg

button.ogg

knob.ogg

motor.ogg

relay.ogg

success.ogg

error.ogg

---

# Benennung

Dateinamen werden ausschließlich:

kleingeschrieben

englisch

snake_case

Beispiele

viewer_frame.webp

genre_button.webp

rating_star.webp

---

# Asset-Regeln

Keine eingebrannten Texte.

Keine eingebrannten Farben.

Keine festen Schatten.

Keine perspektivischen Verzerrungen.

Assets müssen universell wiederverwendbar sein.

---

# Wiederverwendung

Ein Asset darf beliebig oft verwendet werden.

Beispiel

Die gleiche Schraube wird für sämtliche Panels verwendet.

Die gleiche LED wird überall verwendet.

Dadurch entsteht ein konsistentes Gesamtbild.

---

# Entwicklungsstatus

Jedes Asset besitzt einen Status.

Concept

Design

Rendering

Review

Ready

Implemented

---

# Qualitätskontrolle

Vor der Integration wird jedes Asset geprüft.

✓ Richtige Größe

✓ Transparenz

✓ Einheitliche Lichtquelle

✓ Farbpalette eingehalten

✓ Design Language eingehalten

✓ Optimierte Dateigröße

✓ Benennung korrekt

# Ich würde noch einen Schritt weitergehen

Da wir beschlossen haben, dass Retro Discovery wie ein echtes Produkt entwickelt wird, würde ich den Assets eine Priorität geben. So wissen wir immer, woran wir zuerst arbeiten.

Priorität	Asset	Warum?
⭐⭐⭐⭐⭐	Discovery Console	Herzstück der Anwendung
⭐⭐⭐⭐⭐	Discovery Knob	Zentrales Bedienelement
⭐⭐⭐⭐☆	Kippschalter	Hauptnavigation
⭐⭐⭐⭐☆	Genre Buttons	Filtersteuerung
⭐⭐⭐⭐☆	Viewer Frame	3D-Bereich
⭐⭐⭐☆☆	Community Panel	Sekundäre Funktion
⭐⭐⭐☆☆	Info Panel	Inhaltliche Ergänzung
⭐⭐☆☆☆	Let's Play Panel	Medienintegration
⭐⭐☆☆☆	Audio Assets	Feinschliff
⭐☆☆☆☆	Zusätzliche Animationen	Optional für Version 1.0