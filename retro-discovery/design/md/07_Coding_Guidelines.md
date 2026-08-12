# Retro Discovery
# Development Guidelines

Version 1.0

---

# Zweck

Dieses Dokument definiert die Regeln für die Entwicklung von Retro Discovery.

Ziel ist nicht nur funktionierender Code.

Ziel ist langfristig wartbarer, verständlicher und konsistenter Code.

Jede Änderung am Projekt soll sich nahtlos in die bestehende Architektur einfügen.

---

# Entwicklungsphilosophie

Code wird nicht geschrieben, um möglichst schnell fertig zu werden.

Code wird geschrieben, damit er auch in einem Jahr noch leicht verstanden und erweitert werden kann.

Lesbarkeit hat Vorrang vor Kürze.

Klarheit hat Vorrang vor Cleverness.

---

# Entwicklungsprozess

Jede neue Funktion folgt diesem Ablauf:

1. Concept
2. Design
3. Integration
4. Testing
5. Polish
6. Documentation

Erst danach gilt eine Funktion als abgeschlossen.

---

# Grundprinzipien

## Single Responsibility

Eine Datei besitzt genau eine Hauptaufgabe.

Keine Datei wird zum Sammelplatz für beliebigen Code.

---

## Single Source of Truth

Alle Spieldaten stammen ausschließlich aus:

game.js

Es werden keine doppelten Datenstrukturen erzeugt.

---

## Modularität

Neue Funktionen werden als eigenständige Module entwickelt.

Bestehende Module werden nur erweitert, wenn dies wirklich notwendig ist.

---

## Erweiterbarkeit

Neue Systeme

Neue Genres

Neue Panels

Neue Funktionen

dürfen möglichst ohne Änderungen an bestehenden Modulen ergänzt werden.

---

# Dateistruktur

Jede JavaScript-Datei besitzt denselben Aufbau.

1. Konstanten

2. Zustände

3. Initialisierung

4. Öffentliche Funktionen

5. Private Hilfsfunktionen

6. Event Handler

7. Export

Dadurch besitzen alle Dateien dieselbe Struktur.

---

# Variablennamen

Beschreibend.

Keine Abkürzungen.

Gut

currentGame

activeSystems

filteredGames

currentGenre

Nicht

cg

tmp

x

test1

---

# Konstanten

Konstanten werden immer groß geschrieben.

Beispiele

VISIBLE_BOXES

MAX_RESULTS

DEFAULT_SYSTEM

---

# Funktionen

Jede Funktion erledigt genau eine Aufgabe.

Wenn eine Funktion länger als ungefähr 50–80 Zeilen wird, prüfen wir, ob sie aufgeteilt werden sollte.

---

# Kommentare

Kommentare erklären das Warum.

Nicht das Was.

Schlecht

// Erhöhe i um eins

Gut

// Überspringt doppelte Treffer, um Mehrfachanzeigen zu vermeiden.

---

# HTML

HTML beschreibt ausschließlich die Struktur.

Keine Logik.

Keine Inline-JavaScripts.

Keine Inline-Styles.

---

# CSS

CSS definiert ausschließlich Darstellung.

Keine Layout-Hacks.

Keine !important-Regeln, außer wenn technisch unvermeidbar.

Farben werden über Variablen verwaltet.

Abstände folgen einem festen Raster.

---

# JavaScript

JavaScript steuert ausschließlich Verhalten.

Keine HTML-Fragmente mit langen String-Konstruktionen, wenn sich die Struktur sauber erzeugen lässt.

DOM-Zugriffe werden möglichst gebündelt.

---

# Assets

Assets werden niemals hart kodiert.

Alle Pfade werden zentral verwaltet.

Dateinamen bleiben konsistent.

---

# Fehlerbehandlung

Fehlende Daten dürfen niemals die Anwendung stoppen.

Wenn Inhalte fehlen:

→ Platzhalter anzeigen

Wenn Bilder fehlen:

→ Standardbild anzeigen

Wenn Videos fehlen:

→ Bereich ausblenden

---

# Performance

Keine unnötigen DOM-Updates.

Keine mehrfachen Berechnungen derselben Daten.

Animationen erfolgen bevorzugt über CSS.

Teure Berechnungen werden nur ausgeführt, wenn sie wirklich notwendig sind.

---

# Responsive Design

Desktop ist die Referenz.

Tablet und Smartphone werden anschließend gezielt angepasst.

Responsive Verhalten gehört zu jeder neuen Funktion dazu.

---

# Animationen

Animationen unterstützen die Bedienung.

Sie sind niemals Selbstzweck.

Sie sollen ruhig, hochwertig und dezent wirken.

---

# Benutzererlebnis

Bei jeder neuen Funktion stellen wir uns folgende Fragen:

Verbessert sie das Erlebnis?

Passt sie zur Projektvision?

Passt sie zur Design Language?

Fühlt sie sich wie Teil derselben Discovery-Station an?

Wenn eine dieser Fragen mit "Nein" beantwortet wird, wird die Lösung überarbeitet.

---

# Code Review

Vor Abschluss eines Sprints prüfen wir:

✓ Lesbarkeit

✓ Struktur

✓ Wiederverwendbarkeit

✓ Performance

✓ Responsiveness

✓ Dokumentation

✓ Design Language eingehalten

✓ Keine unnötigen Abhängigkeiten

---

# Definition of Done

Code gilt erst als fertig, wenn:

✓ Funktion vollständig

✓ Architektur eingehalten

✓ Design umgesetzt

✓ Responsive getestet

✓ Dokumentation aktualisiert

✓ Keine bekannten Fehler

✓ Entspricht der Vision von Retro Discovery

# Ich würde noch einen Abschnitt ergänzen, den wir in unseren bisherigen Sprints bereits intuitiv angewendet haben:
Entscheidungsregeln

Nicht jede technisch mögliche Lösung ist automatisch die richtige. Deshalb würde ich festhalten, nach welchen Kriterien wir Entscheidungen treffen:

Benutzererlebnis vor Technik – Die beste technische Lösung ist nicht automatisch die beste Lösung für den Nutzer.
Einfachheit vor Komplexität – Wenn zwei Lösungen gleich gut sind, wählen wir die einfachere.
Konsistenz vor Individualität – Ein neues UI-Element soll sich vertraut anfühlen und zur bestehenden Designsprache passen.
Evolution statt Revolution – Bestehende Module werden behutsam weiterentwickelt, anstatt sie ohne guten Grund komplett neu zu schreiben.
Dokumentation ist Teil der Entwicklung – Architektur, Design und Roadmap werden gemeinsam mit dem Code gepflegt.