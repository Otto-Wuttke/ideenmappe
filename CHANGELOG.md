# Änderungen

## 1.0.1 – 17. November 2026

**Keine Verbindungen zu fremden Servern mehr**
- Schrift IBM Plex in die App eingebettet statt von Google Fonts geladen
- Strichglättung in die App eingebettet statt von jsDelivr geladen
- PDF-Anzeige (pdf.js) und PDF-Export (jsPDF) liegen in `public/vendor/` statt bei cdnjs
- Der Server erlaubt dem Browser nur noch Inhalte vom eigenen Server (Content Security Policy)
- Lizenzen der mitgelieferten Teile in `public/vendor/LICENSES.md`

## 1.0.0 – 17. November 2026

Erste Version im Repository.

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
