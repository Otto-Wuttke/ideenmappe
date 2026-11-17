# ideenmappe

Eine mit KI entwickelte Ideen- und Skizzen-App im Stil von Concepts, mit weiteren Features. Sie läuft im Browser auf iPad, Mac, PC und Handy und wird auf dem eigenen Server betrieben.

**Was sie kann:**
- **Fläche und Inhalte:** unendliche Fläche, verschachtelte Boards, dunkles oder Papier-Design
- **Zeichnen:** Apple-Pencil-Unterstützung und Werkzeugrad mit 13 Stiftarten (Feinliner bis Aquarell, Schraffur, Strich-Punkt)
- **Farben:** drehbarer Farbfächer mit 358 Farben
- **Zeichenhilfen:** Linie, Rechteck, Ellipse, Lineal, Bogen-/Ellipsenlehre, Perspektiv-Raster (1-, 2-, 3-Punkt, Isometrie, Dimetrie, Kavalier)
- **Maße:** Maßstab und Einheiten (px, mm, cm, m)
- **Inhalte:** Bilder und PDFs mit Kommentaren direkt auf den Seiten, Text, Notizen, Formen und Pfeile
- **Export:** PNG, JPG, PDF
- **Sync:** Live-Abgleich zwischen allen Geräten, Anmeldung mit Passwort

## Aufbau

| Pfad | Zweck |
|---|---|
| `public/index.html` | die App (eine Datei) |
| `server.js` | Server (Node.js ≥ 18, keine weiteren Pakete) |
| `update.sh` | Update auf dem Server: neueste Version holen und neu starten |
| `docker-compose.yml`, `Dockerfile` | Betrieb mit Docker |
| `ideenmappe.service` | Betrieb als systemd-Dienst |
| `Caddyfile.example` | HTTPS mit automatischem Zertifikat |
| `.env.example` | Vorlage für Passwort und Einstellungen |
| `CHANGELOG.md` | was sich in welcher Version geändert hat |

**Daten** liegen nur auf dem Server im Datenordner und sind nie Teil des Repositorys (siehe `.gitignore`):

```
data/boards/     ein JSON pro Board
data/files/      Bilder und PDFs
data/session.key Schlüssel für die Anmelde-Cookies
```

---

## Installation auf dem VPS

**Voraussetzungen:** Linux-VPS (z. B. Ubuntu/Debian), eine (Sub-)Domain mit DNS-Eintrag auf den VPS (z. B. `mappe.deinedomain.de`), Ports 80/443 offen, Docker mit Compose-Plugin. Die App läuft direkt auf der Domain, nicht in einem Unterpfad.

### 1. Lesezugriff für den VPS (Deploy Key, einmalig)

Das Repository ist privat. Der VPS bekommt deshalb einen eigenen Schlüssel, der nur dieses Repository und nur lesen darf.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ideenmappe_deploy -N "" -C "vps-ideenmappe"
cat ~/.ssh/ideenmappe_deploy.pub
```

Die ausgegebene Zeile in GitHub eintragen: **Repository → Settings → Deploy keys → Add deploy key**. Titel z. B. „VPS“, **„Allow write access“ nicht ankreuzen**.

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-ideenmappe
  HostName github.com
  User git
  IdentityFile ~/.ssh/ideenmappe_deploy
  IdentitiesOnly yes
EOF
```

### 2. Holen und einrichten

```bash
git clone git@github-ideenmappe:Otto-Wuttke/ideenmappe.git ~/ideenmappe
cd ~/ideenmappe
cp .env.example .env
nano .env                 # APP_PASSWORD setzen (mindestens 10, besser 20+ Zeichen)
docker compose up -d --build
docker compose logs -f    # sollte "Ideenmappe läuft auf …" zeigen
```

### 3. HTTPS mit Caddy

```bash
sudo apt install -y caddy
sudo cp Caddyfile.example /etc/caddy/Caddyfile   # oder in eine bestehende Caddyfile einfügen
sudo nano /etc/caddy/Caddyfile                   # mappe.example.de durch deine Domain ersetzen
sudo systemctl reload caddy
```

Danach `https://mappe.deinedomain.de` öffnen und anmelden. Am iPad: Safari → **Teilen** → **Zum Home-Bildschirm**.

Mit nginx statt Caddy: `proxy_pass http://127.0.0.1:8080;`, dazu `proxy_buffering off;` und `proxy_read_timeout 1h;` (für die Live-Synchronisierung) sowie die Header `X-Forwarded-For` und `X-Forwarded-Proto $scheme`.

<details>
<summary>Ohne Docker: Node.js + systemd</summary>

```bash
sudo apt install -y nodejs                      # node -v muss ≥ 18 sein
sudo useradd --system --home /opt/ideenmappe --shell /usr/sbin/nologin ideenmappe
sudo mkdir -p /opt/ideenmappe /var/lib/ideenmappe && sudo chown "$USER" /opt/ideenmappe
git clone git@github-ideenmappe:Otto-Wuttke/ideenmappe.git /opt/ideenmappe
sudo chown -R ideenmappe:ideenmappe /var/lib/ideenmappe
sudo cp /opt/ideenmappe/.env.example /etc/ideenmappe.env && sudo chmod 600 /etc/ideenmappe.env
sudo nano /etc/ideenmappe.env                   # APP_PASSWORD setzen
sudo cp /opt/ideenmappe/ideenmappe.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now ideenmappe
```
</details>

---

## Updates

Neue Versionen kommen über dieses Repository. Auf dem VPS:

```bash
cd ~/ideenmappe && ./update.sh
```

Das Skript holt die neueste Version, startet neu (Docker oder systemd) und zeigt, was sich geändert hat. Die Daten bleiben unberührt. Was neu ist, steht in `CHANGELOG.md`.

## Pflege

- **Passwort ändern:** in `.env` anpassen, dann `docker compose up -d`. Um alle Geräte abzumelden, zusätzlich `data/session.key` löschen.
- **Backup:** Datenordner sichern, z. B. täglich per Cron:
  `tar czf ~/backup/ideenmappe-$(date +%F).tar.gz -C ~/ideenmappe data`

## Sicherheit

- Nur über HTTPS betreiben. Der Server lauscht nur lokal, erreichbar ist er über den Reverse Proxy.
- Langes Passwort wählen. Nach 8 Fehlversuchen wird die IP 15 Minuten gesperrt.
- Firewall: nur 22, 80, 443 öffnen (`sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable`).
- Hochgeladen werden nur Bilder (PNG, JPG, GIF, WebP) und PDFs.
- Ein gemeinsames Passwort, eine Mappe. Mehrere Benutzer sind nicht vorgesehen.

## Gut zu wissen

- Die App lädt Schriften und drei kleine Bibliotheken aus dem Internet (Google Fonts, jsDelivr, cdnjs): für Strichglättung, PDF-Anzeige und PDF-Export.
- Bearbeiten zwei Geräte gleichzeitig dasselbe Board, gewinnt der zuletzt gespeicherte Stand.
