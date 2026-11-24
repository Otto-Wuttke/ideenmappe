# Notizen für die Weiterentwicklung

## Projekt
Ideenmappe: Skizzen- und Ideen-App im Stil von Concepts. Der Besitzer arbeitet viel am iPad mit Apple Pencil, entwirft technisch (Maßstab, Perspektive) und spricht Deutsch. Oberfläche, Texte und Commit-Beschreibungen auf Deutsch.

## Aufbau
- `public/index.html`: die ganze App in einer Datei (HTML, CSS, JS, keine Build-Schritte). IBM Plex (woff2, Latin) und perfect-freehand 1.2.2 sind eingebettet. pdf.js 3.11.174 und jsPDF 2.5.1 liegen in `public/vendor/` und werden per `loadEither()` zuerst lokal geladen, sonst vom CDN (nur für die Einzeldatei).
- Grundsatz: Die Server-Version lädt nichts von fremden Servern; die CSP in `server.js` erlaubt nur `'self'`. Neue Bibliotheken deshalb nach `public/vendor/` legen, mit Lizenz in `LICENSES.md`.
- `server.js`: Node ≥ 18 ohne Abhängigkeiten. Statische Auslieferung, Passwort-Login (signierter Cookie), Boards als `data/boards/<id>.json`, Dateien in `data/files/`, Live-Updates per SSE (`/api/events`).
- Die App wählt ihren Speicher selbst:
  1. in Claude: Artifact-Fähigkeiten `db`, `assets`, `user`, `downloads`
  2. auf dem eigenen Server: `api/me` antwortet → `serverAdapter()` mit derselben Schnittstelle
  3. sonst: localStorage („Nur in diesem Browser“)

## Regeln
- Datenformat der Boards rückwärtskompatibel halten: neue Felder optional, alte Boards müssen weiter laden.
- Jede Änderung an `public/index.html` auch in der Claude-Version veröffentlichen, wenn die Session das Artifact-Tool hat (Slug `df992f2c-f09c-4de0-8561-31774ed9526b`).
- Neue Versionen in `CHANGELOG.md` eintragen, Version in `package.json` erhöhen.
- Kleine Änderungen nur lokal committen und in der Claude-Version veröffentlichen. Nach GitHub pushen erst in größeren Abständen (mehrere Änderungen gesammelt) oder wenn der Besitzer es möchte.
- Nichts aus `data/` oder `.env` committen.

## Testen
Headless mit Playwright (Python): Seite per `file://` oder gegen `node server.js` mit `APP_PASSWORD=… DATA_DIR=/tmp/… PORT=…`. CDN-Anfragen per `page.route` auf lokale Kopien umleiten (`npm pack perfect-freehand@1.2.2 pdfjs-dist@3.11.174 jspdf@2.5.1`). Für den Claude-Speicher `window.claude.use` in einem Init-Skript nachbilden. Vor jeder Veröffentlichung: `node --check` auf das extrahierte Skript, betroffene Funktionen im Browser durchspielen, Screenshot ansehen.
