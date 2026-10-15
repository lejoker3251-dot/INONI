# Jarvis Inoni

Ein Sprachassistent im Iron-Man-Stil. Alles läuft gehostet, bedient wird er vom iPad.

```
iPad (HUD als Home-Bildschirm-App)
   |  Text, Sprache, Zustand
   v
Cloudflare Worker  --->  Claude API (denkt)
   |
   v
GitHub-Repo, Ordner memory/  (Gedächtnis, Markdown)
```

| Baustein | Ordner | Stand |
|---|---|---|
| Motor | worker/ | Gerüst, ungetestet |
| Gedächtnis | memory/ | Startdateien |
| Stimme | im HUD | Übergang: Browser-Stimme und Browser-Mikro, später Cloudflare |
| Gesicht | web/ | Entwurf v0.2 |

## Einrichtung (vom iPad, nicht von mir ausgeführt)

1. **GitHub:** Neues Repo anlegen. Die ZIP in der Dateien-App entpacken (GitHub entpackt ZIPs nicht selbst) und den Inhalt über "Add file > Upload files" hochladen. Lässt Safari auf dem iPad keine Ordner zu, legst du jede Datei über "Add file > Create new file" an und schreibst den Pfad in den Namen, zum Beispiel `web/index.html`, dann den Inhalt einfügen. In `worker/wrangler.toml` den Wert `MEMORY_REPO` auf `DEIN-NAME/REPO-NAME` ändern.
2. **HUD:** In Cloudflare unter Workers & Pages ein Projekt aus dem GitHub-Repo erstellen, als Stammordner `web` angeben. Danach die Seite in Safari öffnen und "Zum Home-Bildschirm" wählen.
3. **Worker:** Zweites Projekt aus demselben Repo, Stammordner `worker`. Unter Einstellungen die Secrets `ACCESS_TOKEN`, `ANTHROPIC_API_KEY` und `GITHUB_TOKEN` setzen.
   - `ACCESS_TOKEN`: ein langer Zufallswert, den du dir ausdenkst.
   - `ANTHROPIC_API_KEY`: aus der Claude Console, wird nach Nutzung abgerechnet.
   - `GITHUB_TOKEN`: fein abgestuftes Token, nur Zugriff auf dieses Repo, Berechtigung Contents.
4. **Verbinden:** Im HUD unter "Verbindung zum Worker" Adresse und `ACCESS_TOKEN` eintragen und auf "Speichern und testen" tippen. Danach schreibst du Jarvis im Textfeld oder sprichst über die Mikro-Taste.

Der API-Schlüssel gehört nie in die Web-App, nur in die Secrets des Workers.

## Dateien
- `web/index.html` das HUD, eine einzelne Datei ohne Build
- `worker/src/index.js` Endpunkte `/api/brain`, `/api/memory`, `/api/health`
- `memory/` Persona und Projektnotizen, werden von Jarvis gelesen
- `PROGRESS.md` Stand und nächste Schritte
- `scripts/make-zip.sh` baut die ZIP neu
