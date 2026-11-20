# Änderungen

## 1.0.5 Beta – 20. November 2026

- Führungslinien für Textboxen: Textbox auswählen, den Griff links daneben auf ein Objekt oder eine Stelle ziehen. Die Linie beginnt am Text mit einem kurzen waagrechten Ansatz und endet mit Punkt oder Pfeil (umschaltbar in der Leiste). Endet sie auf einem Objekt, wandert sie mit, wenn es verschoben oder vergrößert wird. Mehrere Linien pro Textbox; ein Ende zurück auf die Textbox ziehen entfernt die Linie. Auch im Export.
- Dunkelmodus: Alle Farben werden hell dargestellt, auch die aus dem Farbfächer (Helligkeit umgekehrt, Farbton bleibt): Schwarz auf Papier ist im Dunkelmodus hell. Gespeichert wird immer die Papierfarbe.
- Export (PNG, JPG, PDF) sieht immer aus wie auf Papier, auch wenn er im Dunkelmodus erstellt wird.
- Skizzen und Notizen auf PDF-Seiten und Bildern behalten im Dunkelmodus ihre Papierfarben, weil die Seite darunter hell bleibt.
- Textboxen: Der Cursor ist beim Bearbeiten gut sichtbar (kräftiges Blau statt Akzentfarbe), auch in Safari und Firefox, und steht gleich am Textende.
- Kopien herausziehen: Mit gedrückter Strg-Taste (Mac: ⌘ oder ⌥) ein Objekt oder eine Auswahl ziehen erzeugt eine Kopie, das Original bleibt liegen. An Bildern und PDF-Seiten angeheftete Skizzen und Verbindungen innerhalb der Auswahl kommen mit. Ein Klick ohne Ziehen erzeugt keine Kopie; Rückgängig entfernt die Kopie in einem Schritt.

## 1.0.4 Beta – 18. November 2026

- Lineal wie in Concepts: endlos, es geht bei jeder Zoomstufe durch den ganzen Bildschirm. Die Drehpunkte haben einen festen Abstand zum Verschiebepunkt und sind so immer bedienbar. Die Teilung wird je nach Zoom feiner oder gröber; die Zahlen zählen vom Verschiebepunkt aus.
- Drehen läuft gleichmäßiger: kein Sprung mehr beim Greifen eines Drehpunkts, sanfteres Einrasten bei 15°-Schritten (Umschalttaste rastet immer ein), die Gradanzeige zeigt Zehntelgrad.
- Bogenlehre: bleibt beim Hinein- und Herauszoomen gleich groß auf dem Bildschirm, wie das Lineal. Das angezeigte Maß passt sich dem Zoom an.
- Striche an Bogenlehre, Lineal und Formen liegen exakt auf ihrer Bahn: keine Nachlauf-Glättung mehr bei geführten Strichen, Bögen mit Stützpunkten alle 1,5 Bildpunkte, beim Hineinzoomen werden Strichpunkte feiner gespeichert.
- Handballen verschiebt Bogenlehre und Lineal nicht mehr: Ein Finger auf dem Ring der Lehre oder auf dem Lineal wird in den 2 Sekunden nach dem Stift ignoriert, und mit dem Finger verschoben wird erst ab einer deutlichen Bewegung (12 Bildpunkte). Verschiebe- und Drehpunkte reagieren wie bisher sofort.
- Liegt der Verschiebepunkt außerhalb des Bildes oder unter Werkzeugrad, Werkzeugleiste oder Kopfzeile, rückt er in den freien Bereich.
- Die Teilungsstriche von Lineal und Bogenlehre sowie die Linien des Perspektivrasters bleiben bei jeder Zoomstufe gleich fein. Bisher wurden sie in Safari und Chrome beim Hineinzoomen dicker.

## 1.0.3 Beta – 18. November 2026

- Aquarell wirkt jetzt wässrig: ausgefranste Ränder, Papierkörnung, ungleichmäßig verteiltes Pigment und ein leicht dunklerer Trocknungsrand nur außen. Zum Strichende hin reißt die Farbe wie bei einem trockenen Pinsel in Borstenspuren auf. Wo der Pinsel über sich selbst geht, entstehen keine Spuren quer durch die Fläche.
- Aquarell-Striche haben stumpfe statt spitzer Enden.
- Der Export zeigt Aquarell genauso wie die Fläche.

## 1.0.2 Beta – 18. November 2026

- Aquarell: keine Linien mehr in der Farbfläche, wenn der Pinsel über sich selbst geht. Die Kontur fällt weg, der Strich besteht nur noch aus versetzten, transparenten Farbschichten. Bestehende Aquarell-Striche werden automatisch neu dargestellt.

## 1.0.1 Beta – 17. November 2026

**Keine Verbindungen zu fremden Servern mehr**
- Schrift IBM Plex in die App eingebettet statt von Google Fonts geladen
- Strichglättung in die App eingebettet statt von jsDelivr geladen
- PDF-Anzeige (pdf.js) und PDF-Export (jsPDF) liegen in `public/vendor/` statt bei cdnjs
- Der Server erlaubt dem Browser nur noch Inhalte vom eigenen Server (Content Security Policy)
- Lizenzen der mitgelieferten Teile in `public/vendor/LICENSES.md`

## 1.0.0 Beta – 17. November 2026

Erste Version im Repository, als Beta zum Ausprobieren im Alltag.

**Fläche und Inhalte**
- Unendliche Fläche mit Zoomen und Verschieben (Finger, Trackpad, Maus), Boards in Boards
- Text, Notizkarten, Formen (Rechteck, Ellipse, Raute), Pfeile gerade oder gewinkelt
- Bilder und PDFs per Einfügen, Drag & Drop oder Datei-Auswahl
- PDFs: blättern über eine feste Leiste. Skizzen, Texte und Notizen hängen an der jeweiligen Seite, Seiten lassen sich samt Notizen als Bilder auslegen
- Erscheinungsbild Dunkel oder Papier

**Zeichnen**
- Werkzeugrad mit fünf frei belegbaren Plätzen und Radierer
- 13 Stiftarten: Feinliner, Stift, Bleistift, Marker, Pinsel, Aquarell, Breitfeder, Kreide, Spray, Schraffur, Kreuzschraffur, Strichlinie, Strich-Punkt
- Größe, Glättung, Deckkraft je Stiftart. Drehbarer Farbfächer mit 358 Farben, HSL, Hex, zuletzt verwendete Farben
- Radierer wie ein echter Radiergummi (kürzt und trennt Striche)
- Apple Pencil zeichnet immer, der Finger wählt aus und verschiebt

**Zeichenhilfen und Maße**
- Linie, Rechteck, Ellipse mit Maß- und Winkelanzeige, Halten am Strichende macht gerade
- Lineal, Bogen- und Ellipsenlehre, Perspektiv-Raster (1-, 2-, 3-Punkt, Isometrie, Dimetrie, Kavalier) mit Einrasten
- Maßstab und Einheiten pro Board (px, mm, cm, m), Raster mit Einrasten

**Export und Betrieb**
- Export als PNG, JPG oder PDF: ganzes Board, Auswahl oder aufgezogener Bereich
- Eigener Server mit Passwort-Anmeldung, Live-Abgleich zwischen Geräten, Docker- und systemd-Betrieb, Update-Skript
