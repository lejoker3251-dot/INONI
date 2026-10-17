# Jarvis Inoni

Ein Sprachassistent im Iron-Man-Stil. Alles läuft gehostet, bedient wird er vom iPad.

```
iPad (HUD als Home-Bildschirm-App)
   |  Text, Sprache, Zustand
   v
Cloudflare Worker "inoni"  (liefert HUD und API aus)
   |--> Workers AI (Gemma 4, kostenloses Tageskontingent)   <- Standard
   |--> Claude API (nur wenn ANTHROPIC_API_KEY gesetzt ist)  <- optionaler Wechsel
   v
GitHub-Repo, Ordner memory/  (Gedächtnis, Markdown)
```

Ein einziger Worker mit dem Namen `inoni` liefert die Seite (Ordner `web`) und beantwortet Aufrufe unter `/api/` (Ordner `worker`). Die Konfiguration liegt in `wrangler.toml` im Hauptverzeichnis.

| Baustein | Ordner | Stand |
|---|---|---|
| Motor | worker/ | Workers AI als Standard, im Test mit Beispielantworten geprüft, noch nicht live |
| Gedächtnis | memory/ | Startdateien |
| Stimme | im HUD | Übergang: Browser-Stimme und Browser-Mikro, später Cloudflare |
| Gesicht | web/ | live auf workers.dev |

## Einrichtung bei Cloudflare

1. Workers & Pages: Worker `inoni` aus dem GitHub-Repo, Stammordner `/`, Deploy-Befehl `npx wrangler deploy`. Jeder Commit auf `main` baut neu.
2. Unter Settings > Variables and secrets (Laufzeit, nicht Build) ein Secret anlegen:
   - `ACCESS_TOKEN`: ein langer Zufallswert. Schützt alle Endpunkte. Mehr ist für den Start nicht nötig.
3. HUD öffnen, unter "Verbindung zum Worker" den `ACCESS_TOKEN` eintragen, auf "Speichern und testen" tippen. Die Adresse erkennt das HUD selbst. In der Statusleiste erscheint danach das Modell.

## Das Gehirn wechseln
- **Kostenlos (Standard):** Workers AI mit `AI_MODEL` in der `wrangler.toml`. Das kostenlose Tageskontingent beträgt laut Cloudflare 10.000 Neurons, danach schlagen Anfragen bis zum nächsten Tag (00:00 UTC) fehl. Eine kurze Antwort kostet nach grober Schätzung rund zehn Neurons, das reicht für viele hundert Antworten am Tag.
- **Andere Modelle ohne Bezahlung:** zum Beispiel `@cf/meta/llama-3.2-3b-instruct` oder `@cf/qwen/qwen3-30b-a3b-fp8`. Dazu `AI_MODEL` ändern und neu bauen lassen. Einige große Modelle verlangen bei Cloudflare eine Zahlungsmethode.
- **Claude:** Secret `ANTHROPIC_API_KEY` anlegen (Schlüssel aus der Claude Console, braucht Guthaben). Der Worker nimmt dann automatisch Claude, ohne Codeänderung. Secret löschen, und es antwortet wieder Workers AI.

## Später: Gedächtnis
Secret `GITHUB_TOKEN` (fein abgestuftes Token nur für dieses Repo, Berechtigung Contents). Dann liest Jarvis die Persona aus `memory/` und kann Notizen schreiben.

Schlüssel gehören nie in die Web-App, nur in die Secrets des Workers.

## Dateien
- `wrangler.toml` Konfiguration des einen Workers
- `web/index.html` das HUD, eine einzelne Datei ohne Build
- `worker/src/index.js` Endpunkte `/api/brain`, `/api/memory`, `/api/health`
- `memory/` Persona und Projektnotizen, werden von Jarvis gelesen
- `PROGRESS.md` Stand und nächste Schritte
- `scripts/make-zip.sh` baut die ZIP neu
