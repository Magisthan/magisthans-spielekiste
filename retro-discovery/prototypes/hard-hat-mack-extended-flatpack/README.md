# Extended-Flatpack-Test: One on One und Hard Hat Mack

Dieser isolierte Prototyp bildet zunächst ausschließlich die vorhandene Standardkonfiguration ab:

```js
hasInside: true,
width: 222,
height: 222,
depth: 7,
package: {
    type: "flatpack",
    spineTexture: "right"
}
```

Die Testseite bindet direkt die produktiven Module `package-materials.js`, `package-builder.js`, `flatpack-builder.js` und `package.js` ein. Damit verwendet Hard Hat Mack dieselbe Materialkalibrierung, geschlossene Standardbox, Öffnungsgeometrie und Umschaltung wie The Seven Cities of Gold.

Die Quelldimensionen bleiben `222 × 222 × 7`. Vor dem Aufbau werden sie wie im produktiven Viewer mit `SCALE = 0.014` in Babylon-Welteinheiten umgerechnet. Dadurch funktionieren auch die im FlatpackBuilder kalibrierten Flächenabstände ohne Z-Fighting.

Die normale Öffnung verwendet `front`, `back`, `left`, `right`, `top`, `bottom`, `inside_left` und `inside_right`. Darauf setzt ein ausschließlich im Prototyp vorhandener zweiter Flügel auf: Im gefalteten Zustand liegt `inside_right` vor `inside_middle`; nach dem Aufklappen wird `inside_middle` freigelegt und `inside_right_right` auf der Rückseite des Flügels sichtbar.

Wegen der gespiegelten Hero-Präsentationsachse des produktiven Viewers liegt die visuell rechte Scharnierkante in den lokalen Geometriedaten auf der negativen X-Seite. Der Zusatzflügel hängt deshalb an dieser Außenkante und nicht an der inneren Naht zur `inside_left`-Fläche.

## Öffnen

Projektwurzel über einen lokalen HTTP-Server ausliefern und aufrufen:

Standardmäßig wird One on One geladen:

`http://localhost:<PORT>/retro-discovery/prototypes/hard-hat-mack-extended-flatpack/`

Hard Hat Mack bleibt über einen URL-Parameter vergleichbar:

`http://localhost:<PORT>/retro-discovery/prototypes/hard-hat-mack-extended-flatpack/?game=hard_hat_mack`

Das direkte Öffnen über `file://` ist wegen Browserregeln für Texturen nicht zuverlässig.

## Bedienung

- `Box öffnen / Box schließen`: Standardanimation
- `Zusatzflügel öffnen / schließen`: zweite Faltstufe, erst nach vollständiger Standardöffnung verfügbar
- `Scharnier zeigen`: markiert die automatisch ermittelte visuell rechte Außenkante und die zweite Drehachse
- Beide Regler: jeweilige Öffnung manuell von 0 bis 100 Prozent prüfen
- `Grauen Rand links beschneiden`: verkürzt ausschließlich das bewegliche Blatt und beschneidet dessen `inside_right`-Textur zwischen 0 und 5 Prozent; Ausgangswert 2,7 Prozent
- Doppelklick auf den Viewer: zunächst Hauptbox, danach Zusatzflügel öffnen oder schließen
- `Ansicht zurücksetzen`: Kamera auf Ausgangsposition setzen

Produktive Viewer- und Flatpack-Dateien werden nicht verändert.
