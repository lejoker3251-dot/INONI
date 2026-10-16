# Jarvis Inoni

Ein Sprachassistent im Iron-Man-Stil. Alles läuft gehostet, bedient wird er vom iPad.

```
iPad (HUD als Home-Bildschirm-App)
   |  Text, Sprache, Zustand
   v
Cloudflare Worker "inoni"  (liefert HUD und API aus)  --->  Claude API (denkt)
   |
   v
GitHub-Repo, Ordner memory/  (Gedächtnis, Markdown)
```

Ein einziger Worker mit dem Namen `inoni` liefert die Seite (Ordner `web`) und beantwortet Aufrufe unter `/api/` (Ordner `worker`). Die Konfiguration liegt in `wrangler.toml` im Hauptverzeichnis.

| Baustein | Ordner | Stand |
|---|---|---|
| Motor | worker/ | Gerüst, im Test mit Beispielaufrufen geprüft, noch nicht live |
| Gedächtnis | memory/ | Startdateien |
| Stimme | im HUD | Übergang: Browser-Stimme und Browser-Mikro, später Cloudflare |
| Gesicht | web/ | live auf workers.dev |

## Einrichtung bei Cloudflare

1. Workers & Pages: Projekt `inoni` aus dem GitHub-Repo, Stammordner leer lassen (Hauptverzeichnis), Deploy-Befehl `npx wrangler deploy`.
2. Unter Settings > Variables and Secrets (Laufzeit, nicht Build) zwei Secrets anlegen:
   - `ACCESS_TOKEN`: ein langer Zufallswert, den du dir ausdenkst. Schützt alle Endpunkte.
   - `ANTHROPIC_API_KEY`: aus der Claude Console, wird nach Nutzung abgerechnet.
3. Später für das Gedächtnis: `GITHUB_TOKEN`, fein abgestuftes Token nur für dieses Repo, Berechtigung Contents (Lesen und Schreiben).
4. HUD öffnen, unter "Verbindung zum Worker" den `ACCESS_TOKEN` eintragen, auf "Speichern und testen" tippen. Die Adresse erkennt das HUD selbst.

Der API-Schlüssel gehört nie in die Web-App, nur in die Secrets des Workers.

## Dateien
- `wrangler.toml` Konfiguration des einen Workers
- `web/index.html` das HUD, eine einzelne Datei ohne Build
- `worker/src/index.js` Endpunkte `/api/brain`, `/api/memory`, `/api/health`
- `memory/` Persona und Projektnotizen, werden von Jarvis gelesen
- `PROGRESS.md` Stand und nächste Schritte
- `scripts/make-zip.sh` baut die ZIP neu
