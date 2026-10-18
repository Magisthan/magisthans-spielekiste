# Viewer-Redesign: Phase 1 – dokumentierter Ist-Zustand

Stand: 5. Oktober 2026

Diese Bestandsaufnahme beschreibt den Viewer von Gamebox Discovery vor dem geplanten Umbau. In Phase 1 wurden keine produktiven HTML-, CSS- oder JavaScript-Dateien verändert.

## 1. Geltungsbereich

Der geplante Umbau betrifft den Viewer in `retro-discovery/index.html`. Der Babylon-Viewer, die Verpackungs-Builder und die Materialzuordnung bleiben zunächst außerhalb des Umbaus.

Relevante Hauptdateien:

- `retro-discovery/index.html`
- `retro-discovery/js/viewer.js`
- `retro-discovery/js/community.js`
- `retro-discovery/js/navigation.js`
- `retro-discovery/js/events.js`
- `retro-discovery/js/console-scale.js`
- `retro-discovery/css/viewer.css`
- `retro-discovery/css/community.css`
- `retro-discovery/css/responsive.css`
- `assets/js/i18n/ui.de.js`
- `assets/js/i18n/ui.en.js`

## 2. Aktuelle DOM-Struktur

`#viewer-stage` ist der zentrale Viewer- und Fullscreen-Container. Darin befinden sich aktuell:

1. Viewer-Hintergrund und Vignette
2. `#community-panel`
3. Scan-Beitragsdialog
4. redaktioneller Lesedialog
5. `#viewer-container` mit `#viewer3d`
6. Titel- und Scan-Badge `#viewer-game-title`
7. Öffnen-Schaltfläche `#package-open-hint`
8. INFO-Panel `#viewer-info-panel`
9. INFO-Aktion `#viewer-actions`
10. Fullscreen-Schaltfläche
11. unteres Chassisbild
12. Bedienhinweis `#viewer-ui`

Nach dem Viewer existiert `#viewer-mobile-panels` als externer Zielcontainer für responsive DOM-Verschiebungen.

## 3. Aktuelle Zustände und Verantwortlichkeiten

### Viewer

`viewer.js` verwaltet unter anderem:

- Babylon `engine`, `scene`, `canvas` und Kamera
- aktuell dargestelltes Paket
- Showcase-Rotation
- INFO-Panel über `infoPanelOpen`
- redaktionellen Lesedialog
- Fullscreen über `isFullscreen`
- Titel-Typewriter und Scan-Angabe
- Box-Öffnen/-Schließen
- Beleuchtung und Präsentationsanimation

Die Boxposition wird über Kamera, Pivot und Konstanten wie `BOX_Y_OFFSET`, `CAMERA_*` sowie die Hero-Rotation bestimmt.

### Community

`community.js` verwaltet:

- Boxdesign und Spielbewertung
- Besitzstatus
- Bewertungsmodus und Slider
- Community-Demo-Datensatz
- Scan-Beitragsdialog und dessen Fokussteuerung
- E-Mail-Link mit aktuellem Spielnamen

Die Community-Daten liegen ausschließlich im Arbeitsspeicher in `const COMMUNITY`. Es existieren für diese Bewertungen derzeit weder eine dauerhafte Browser-Speicherung noch ein Serverzugriff. Ein Neuladen verwirft neue Bewertungen.

### INFO und redaktionelle Inhalte

Das bestehende INFO-Panel wird mit `updateInfoPanel()` befüllt. Vorhanden sind:

- Titel
- System, lokalisierte Genres und Jahr
- Entwickler
- Verleger
- Box-Art
- Review
- „Heute noch spielenswert?“
- externe Links
- Teilen/Kopieren

Review und „Heute noch spielenswert?“ öffnen bereits einen zugänglichen redaktionellen Dialog mit Fokusfang, Escape-Taste und Fokuswiederherstellung. Trivia besitzt im aktuellen INFO-Panel noch keinen eigenen Auslöser.

### Scan-Beitragsdialog

Der Mitmachdialog ist bereits als modaler Dialog umgesetzt. Er unterstützt:

- Hintergrundklick
- Escape-Taste
- Fokusfang und Fokuswiederherstellung
- interne DE/EN-Umschaltung
- dynamischen E-Mail-Betreff mit aktuellem Spieltitel

Diese Funktion kann später unverändert von einer neuen Viewer-Aktionsleiste ausgelöst werden.

## 4. Ereignisfluss beim Spin

Der aktuelle Hauptablauf lautet:

1. `spinShelf()` startet den Spin.
2. Titel, Viewer-Aktionen, Fullscreen und Community werden ausgeblendet.
3. Ziel- und Bremssequenz werden vorbereitet.
4. Nach dem Stillstand wird `gameChanged` ausgelöst.
5. `viewer.js` lädt und präsentiert die Box.
6. Titel und Scanquelle werden geschrieben.
7. Community-Panel wird verzögert nach 1800 ms eingeblendet.

Das Ereignis `gameChanged` ist bereits der geeignete zentrale Einstiegspunkt für das spätere Zurücksetzen auf:

```text
presentationMode = box
activeOverlay = null
```

## 5. Responsive Verhalten

`console-scale.js` verschiebt bei maximal 1200 Pixeln sowohl `#community-panel` als auch `#viewer-info-panel` physisch aus `#viewer-stage` nach `#viewer-mobile-panels`. Beim Überschreiten des Breakpoints werden beide Elemente über Kommentaranker zurückgesetzt.

Folgen für den Umbau:

- Die neue Oberfläche darf nicht zusätzlich von dieser alten Verschiebelogik erfasst werden.
- Die alte Logik darf erst entfernt werden, wenn Community- und INFO-Ersatz vollständig funktionieren.
- Neue Viewer-Aktionen und Overlays müssen innerhalb von `#viewer-stage` verbleiben, damit sie im Fullscreen sichtbar sind.

Relevante Breakpoints liegen bei 1200, 1024, 900, 768, 520 und 360 Pixeln.

## 6. Fullscreen-Verhalten

Fullscreen wird auf `#viewer-stage` gestartet. Der Browser zeigt daher nur dessen Nachfahren an.

Im aktuellen Fullscreen-Modus werden:

- Community-Panel explizit ausgeblendet
- unteres Chassisbild ausgeblendet
- Kamera und Engine nach dem Wechsel aktualisiert

Für das neue Konzept müssen Bewertung, Box-Inhalt, INFO und Mitmachen innerhalb von `#viewer-stage` liegen und dürfen im Fullscreen nicht mehr ausgeblendet werden.

## 7. Inhaltsbild

Retro Discovery besitzt aktuell keinen eigenen Contents-Modus für `content.webp`. Der vorhandene Mechanismus auf „Meine Sammlung“ ist konzeptionell nutzbar, sollte aber nicht direkt mit dessen DOM- und CSS-Struktur gekoppelt werden.

Der neue Retro-Discovery-Modus benötigt später:

- Ermittlung über den aktuellen `game.folder`-Wert
- Vorladen und `decode()` vor dem Einblenden
- bilingualen Platzhalter bei fehlender Datei
- Rückkehr zur bestehenden Babylon-Szene ohne deren Neuinitialisierung
- optionales Pausieren des Renderloops während der reinen Inhaltsansicht

## 8. Risiken und Schutzmaßnahmen

### Keine Kameraänderung beim INFO-Overlay

Das Overlay darf weder Canvasbreite noch Kamera-Target, Radius oder Pivot verändern. Die Abdunklung muss über eine eigene Ebene zwischen Canvas und Overlay erfolgen.

### Keine sofortige Entfernung alter Komponenten

Community-Panel und INFO-Drawer bleiben bis zur Funktionsparität bestehen. Zunächst wird eine neue UI-Hülle parallel aufgebaut und nur über eine gezielte Zustandsklasse aktiviert.

### Bewertungsdaten

Die gewünschte 👍/👎-Bewertung ist fachlich ein neues Datenmodell. Historische Sliderwerte dürfen nicht überschrieben oder stillschweigend umgerechnet werden. Besucherübergreifende Zähler benötigen später eine Server-/API-Entscheidung.

### Renderloop und WebGL

Ein Wechsel zu Contents darf keinen zweiten Babylon-Engine- oder Renderloop erzeugen. Die bestehende Szene muss erhalten bleiben.

### Dialoge und Fokus

Der vorhandene Scan- und Editorial-Dialog besitzen bereits Fokuslogik. Neue Overlays müssen eine gemeinsame Öffnungsreihenfolge erhalten, damit nie mehrere modale Oberflächen gleichzeitig aktiv sind.

## 9. Vorgeschlagenes Zustandsmodell für Phase 2

```javascript
const viewerUiState = {
    presentationMode: "box", // box | contents
    activeOverlay: null       // null | info | review | worthPlaying | trivia | contribute
};
```

Fullscreen bleibt ein abgeleiteter Browserzustand und wird nicht als konkurrierender Darstellungsmodus geführt.

## 10. Abnahmematrix für spätere Phasen

Zu prüfen sind mindestens:

- Desktop: 1920 und 1440 Pixel
- Tablet: 1024 Pixel sowie Hoch-/Querformat
- Mobile: 390, 360 und 320 Pixel
- normaler Viewer und Fullscreen
- geschlossene, Flatpack-, Hinged- und Has-Inside-Verpackung
- vorhandenes und fehlendes `content.webp`
- Deutsch und Englisch
- Spin bei geöffnetem Overlay
- Tastatur, Escape, Fokusfang und Fokuswiederherstellung
- lange Spieltitel und verlinkte Scanquelle

## 11. Ergebnis von Phase 1

Der Umbau kann ohne Eingriff in Package-Builder, Materialien oder Boxgeometrie erfolgen. Die größten Kopplungen liegen nicht in Babylon, sondern in der aktuellen DOM-Verschiebung für responsive Panels, dem Fullscreen-Container und der nur flüchtigen Community-Datenhaltung.

Phase 2 kann deshalb mit einer neuen, zunächst parallelen Viewer-UI-Hülle und einem zentralen UI-Controller beginnen.

## 12. Phase 2 – parallele UI-Hülle

Phase 2 wurde als inaktive, vom Produktivpfad getrennte Grundlage ergänzt:

- `viewer-redesign-shell` liegt innerhalb von `#viewer-stage` und damit innerhalb der Fullscreen-Grenze.
- Scrim, Contents-Fläche, Interaktionsbereich und Overlay besitzen eigene Ebenen.
- `viewer-ui-controller.js` verwaltet ausschließlich Präsentations- und Overlayzustände.
- Alle sichtbaren CSS-Regeln sind an `.viewer-redesign-enabled` gebunden.
- Die Hülle startet mit `hidden`, `inert` und `aria-hidden="true"`.
- Bestehender Viewer, Kamera, Community-Panel und INFO-Drawer bleiben unverändert aktiv.

## 13. Phase 3 – Titel und kompakte Bedienleiste

Die parallele Hülle ist für den ersten sichtbaren Teil aktiviert:

- Die bestehende Titel-/Scan-Ausgabe bleibt die einzige Datenquelle und wird über der neuen Hülle weiterverwendet.
- Das alte Community-Panel bleibt im DOM und im Code erhalten, wird bei aktiver Redesign-Hülle aber visuell ausgeblendet.
- Eine kompakte 👍/👎-Reaktionszeile wurde ergänzt.
- Reaktionen sind vorerst ausdrücklich nur flüchtige Laufzeitdaten; eine besucherübergreifende Speicherung benötigt später ein Backend.
- „Mitmachen“ öffnet weiterhin den bestehenden, geprüften Scan-Dialog.
- Der Schalter für Box-Inhalte ist bereits angelegt, bleibt aber bis zur Contents-Phase deaktiviert.
- INFO verbleibt bis zur Overlay-Phase an seiner bisherigen Position unten rechts.
- Die Redesign-Hülle liegt mit `z-index: 160` oberhalb des Chassisbildes (`120`), während Titel (`200`) und bestehende Viewer-Aktionen (`220`) darüber erhalten bleiben.

## 14. Phase 4 – INFO-Overlay

- Der bestehende INFO-Button öffnet bei aktivem Redesign das neue Glass-Overlay statt des alten Drawers.
- Das Overlay liegt rechts über der Bühne; Canvasgröße, Kamera, Pivot und Boxposition bleiben unverändert.
- Eine eigene Scrim-Ebene dunkelt nur den Bühnenhintergrund ab.
- Titel, System, Genre, Jahr, Entwickler, Verleger und Box-Art werden aus den lokalisierten Spieldaten übernommen.
- Review und „Heute noch spielenswert?“ verwenden den bestehenden redaktionellen Lesedialog. Trivia wird im INFO-Overlay nicht angeboten.
- Teilen kopiert weiterhin den spielbezogenen Discovery-Link.
- Schließen funktioniert über X, Escape und Hintergrundklick; Fokusfang und Fokuswiederherstellung sind integriert.
- Auf Mobilgeräten wird das Overlay als kompakte, intern scrollbar begrenzte Fläche dargestellt.
- INFO ist als mittlere Aktion direkt zwischen „Box-Inhalt“ und „Mitmachen“ angeordnet; der frühere separate INFO-Button wird im Redesign ausgeblendet.
- Die kompakte Interaktionsgruppe ist oberhalb der unteren Chassiskante positioniert, damit sie nicht mit Titel und Scanangabe kollidiert.
- Der redaktionelle Lesedialog verwendet im geöffneten Zustand `pointer-events: auto`, damit X, Schließen-Schaltfläche und Hintergrundklick tatsächlich erreichbar sind.
- MobyGames, Wikipedia, GOG und Let's Play werden im neuen Overlay nur dann eingeblendet, wenn der jeweilige Link im Spieleintrag vorhanden ist.

## 15. Phase 5 – Inhaltspräsentation

- „Box-Inhalt“ lädt `content.webp` anhand des aktuellen Spieleordners und wartet vor dem Wechsel auf `decode()`.
- Während des Ladens bleibt die 3D-Box sichtbar; erst das vorbereitete Bild aktiviert den Contents-Modus.
- Die Babylon-Szene, Kamera und der Renderloop werden nicht neu erzeugt.
- Das Inhaltsbild erscheint als zentriertes Exponat mit Überschrift, Spieltitel und Bildunterschrift.
- Fehlende Dateien verwenden den bilingualen Standardplatzhalter.
- Der gemeinsame Content-Image-Enhancer verbessert vorhandene Scans anhand ihrer Helligkeit und ihres Kontrasts.
- „Zurück zur Box“ stellt dieselbe 3D-Szene und ihren bestehenden Zustand wieder her.
- Box-Öffnen, Viewer-Hinweis und Zoomsteuerung werden nur während der Inhaltsansicht ausgeblendet.
- Die normale Exponatansicht folgt dem Muster der Spielseiten und ist auf einen Rahmen von maximal 480 Pixeln sowie eine Bildhöhe von maximal 420 Pixeln begrenzt.
- Auf Tablet und Mobilgeräten beträgt die Rahmenbreite maximal 380 Pixel, die Bildhöhe maximal 340 Pixel.
- Ein eigener Vergrößerungsbutton öffnet das Inhaltsbild unverzerrt in einer bildschirmfüllenden Lightbox; der Platzhalter besitzt keine Vergrößerungsfunktion.
- Überschrift, Bildunterschrift, Lade- und Fehlermeldung, Rückkehrbutton sowie Lightbox-Beschriftungen folgen dem globalen DE/EN-Sprachzustand.

## 16. Phase 6 – Mitmachen

- Der kompakte „Mitmachen“-Button öffnet den vorhandenen Scan-Dialog nun über eine ausdrückliche Dialog-API statt über einen simulierten Klick auf den versteckten Community-Button.
- Der Dialogzustand wird mit dem zentralen Viewer-UI-Controller synchronisiert.
- INFO und Mitmachen schließen sich gegenseitig aus; der Scan-Dialog verwendet weiterhin seine eigene Abdunklungsebene.
- `aria-expanded`, Fokusfang, Fokuswiederherstellung, Escape, X und Hintergrundklick bleiben erhalten.
- Der Dialog übernimmt ausschließlich die global gewählte Sprache; die frühere interne DE/EN-Auswahl wurde entfernt.
- Sämtliche Dialogtexte liegen im gemeinsamen Übersetzungskatalog `ui.de.js` beziehungsweise `ui.en.js`.
- Der aktuelle Spieltitel wird weiterhin in Betreff und Nachricht des vorbereiteten E-Mail-Links eingesetzt.

## 17. Phase 7 – Vollbild und Responsive

- `#viewer-stage` bleibt das einzige Fullscreen-Ziel; im Vollbild füllt der Babylon-Canvas die gesamte verfügbare Fläche aus.
- Zoom, Box öffnen, Reaktionen, Box-Inhalt, INFO und Mitmachen verbleiben innerhalb der Fullscreen-Grenze und bleiben bedienbar.
- Spieltitel und Scanquelle sitzen im Vollbild mit Safe-Area-Abstand am unteren Rand; die kompakte Bedienleiste liegt kollisionsfrei darüber.
- Das INFO-Overlay bleibt auf Desktop und Tablet rechts als Museumskarte sichtbar und wird auf Mobile zu einer nahezu vollflächigen, intern scrollbar begrenzten Fläche.
- Die Inhaltspräsentation nutzt im Vollbild mehr Ausstellungsfläche, hält aber Abstand zu Titel und Bedienleiste.
- Auf Tablet wird der Titel ebenfalls am unteren Bühnenrand geführt; die Bedienleiste bleibt darüber und verschiebt die Box nicht.
- Auf Mobile erhält die Bühne eine höhere Mindesthöhe, damit 3D-Box, Reaktionen, Aktionen und Titel nicht übereinanderliegen.
- Bedienelemente erhalten auf Touchgeräten mindestens 40 Pixel Höhe und berücksichtigen die Safe Areas von Geräten mit Notch oder Home-Indikator.
- Der Vollbildbutton besitzt sprachabhängige Zugänglichkeitsbeschriftungen für Öffnen und Schließen.
- Browser-Resize, Orientierungswechsel und Fullscreen-Wechsel verwenden weiterhin die bestehende Engine- und Kameraaktualisierung; die Babylon-Szene wird nicht neu aufgebaut.

## 18. Phase 8 – Alten Aufbau entfernen

- Das frühere Community-Rating-Panel wurde vollständig aus dem Viewer-DOM entfernt; die kompakte Reaktionszeile ist nun die einzige Bewertungsoberfläche.
- Der alte rechte INFO-Drawer und sein separater INFO-Aktionsbutton wurden entfernt. Daten, Links und redaktionelle Aktionen werden ausschließlich vom neuen INFO-Overlay dargestellt.
- Die mobile JavaScript-Umsortierung der alten Community- und INFO-Panels wurde entfernt.
- `community.js` enthält nur noch die weiterhin benötigte, zugängliche Steuerung des Mitmachen-Dialogs und seines dynamischen E-Mail-Links.
- Das nicht mehr eingebundene alte Bewertungsdialog-Skript wurde gelöscht.
- Die frühere umfangreiche Community-Stylesheet-Datei wurde durch das gezielte `scan-dialog.css` ersetzt; damit verbleiben keine Rating-Panel-Regeln im aktiven CSS-Pfad.
- `viewer.js` hält keine Fallback-Steuerung für den alten INFO-Drawer mehr vor. Spielinformationen werden direkt an den zentralen Viewer-UI-Controller übergeben.
- Spin, Sprachwechsel, Fullscreen und Dialoge verwenden damit nur noch den neuen Viewer-Aufbau.

## 19. Phase 9 – Regressionstest

Automatisierte Prüfung vom 6. Oktober 2026:

- Syntaxprüfung aller JavaScript-Dateien unter `retro-discovery/js`: bestanden.
- Neuer Validator `scripts/validate-retro-viewer-redesign.js`: bestanden, null Fehler.
- 13 erforderliche Viewer-Ziele sind jeweils genau einmal vorhanden.
- Sechs ausgemusterte UI-Ziele sowie alte Rating-Funktionsaufrufe sind nicht mehr im aktiven Pfad vorhanden.
- Fullscreen-, INFO-, Inhalts- und Mitmachen-Anbindung wurden strukturell geprüft.
- CSS-Klammerprüfung für Viewer, Responsive, Redesign und Scan-Dialog: bestanden.
- Gemeinsamer DE/EN-Validator: null Fehler; ein unabhängiger Hinweis auf die nicht in `game.js` registrierte Seite `spiele/mega-lo-mania.html`.
- Spielübersetzungsprüfung: 262 von 262 Einträgen in Deutsch und Englisch vollständig, null Fehler.
- Startseite und alle neuen lokalen CSS-/JavaScript-Ressourcen antworten im lokalen Testserver mit HTTP 200.
- Eine browsergesteuerte Pixel- und Interaktionsprüfung konnte in dieser Sitzung nicht ausgeführt werden, weil kein steuerbarer Browser verbunden war. Sie bleibt als manuelle Endkontrolle für Desktop, Tablet, Mobile und Fullscreen offen.
