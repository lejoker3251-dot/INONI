# Inoni

Ein persönlicher KI-Butler im Iron-Man-Stil. Er heißt Inoni und wird mit Inoni angesprochen. Alles läuft gehostet, bedient wird er vom iPad.

```
iPad (HUD als Home-Bildschirm-App)
   |  Text, Sprache, Zustand
   v
Cloudflare Worker "inoni"  (liefert HUD und API aus)
   |--> Workers AI (Gemma 4, kostenloses Tageskontingent)   <- Gehirn, Standard
   |--> Claude API (nur wenn ANTHROPIC_API_KEY gesetzt ist)  <- Gehirn, optionaler Wechsel
   |--> Fish Audio (nur wenn FISH_API_KEY gesetzt ist)       <- Stimme, sonst Browser-Stimme
   v
GitHub-Repo, Ordner memory/  (Gedächtnis, Markdown)
```

Ein einziger Worker mit dem Namen `inoni` liefert die Seite (Ordner `web`) und beantwortet Aufrufe unter `/api/` (Ordner `worker`). Die Konfiguration liegt in `wrangler.toml` im Hauptverzeichnis.

| Baustein | Ordner | Stand |
|---|---|---|
| Gehirn | worker/ | Workers AI als Standard, im Test mit Beispielantworten geprüft, noch nicht live |
| Gedächtnis | memory/ | Startdateien, Persona wird aus dem Repo gelesen |
| Stimme | worker/ und web/ | Fish Audio über den Worker, Browser-Stimme als Rückfall, noch nicht live geprüft |
| Gesicht | web/ | live auf workers.dev |

## Einrichtung bei Cloudflare

1. Workers & Pages: Worker `inoni` aus dem GitHub-Repo, Stammordner `/`, Deploy-Befehl `npx wrangler deploy`. Jeder Commit auf `main` baut neu.
2. Unter Settings > Variables and secrets (Laufzeit, nicht Build) ein Secret anlegen:
   - `ACCESS_TOKEN`: ein langer Zufallswert. Schützt alle Endpunkte. Mehr ist für den Start nicht nötig.
3. HUD öffnen, unter "Verbindung zum Worker" den `ACCESS_TOKEN` eintragen, auf "Speichern und testen" tippen. Die Adresse erkennt das HUD selbst. In der Statusleiste erscheinen danach Modell, Stimme und Gedächtnis.

## Die Stimme: Fish Audio

Ohne weiteres Zutun liest Inoni mit der Browser-Stimme vor. Für eine bessere Stimme:

1. Bei fish.audio ein Konto anlegen und unter API-Schlüssel einen Schlüssel erzeugen (laut Anbieter keine Kreditkarte nötig).
2. In Cloudflare das Secret `FISH_API_KEY` anlegen. Danach zeigt die Statusleiste "Fish Audio".
3. Optional in der Stimmenbibliothek eine deutsche Stimme aussuchen und ihre ID in `wrangler.toml` bei `FISH_VOICE_ID` eintragen. Leer bedeutet Standardstimme, die nicht unbedingt Deutsch spricht.

Zu wissen:
- Das Modell `s2.1-pro-free` ist laut Anbieter bis 30.11.2026 kostenlos, danach Preise prüfen. Secret löschen, und es gilt wieder die Browser-Stimme.
- Das Gratis-Modell hat keine Verfügbarkeitsgarantie, Anfragen können zur Modellverbesserung gespeichert werden, und für gewerbliche Nutzung gelten Einschränkungen.
- Alles, was Inoni vorliest, geht an Fish Audio. Keine privaten Inhalte vorlesen lassen.
- Fällt Fish aus, schaltet das HUD für diese Antwort automatisch auf die Browser-Stimme.

## Das Gehirn wechseln

- **Kostenlos (Standard):** Workers AI mit `AI_MODEL` in der `wrangler.toml`. Das kostenlose Tageskontingent beträgt laut Cloudflare 10.000 Neurons, danach schlagen Anfragen bis zum nächsten Tag (00:00 UTC) fehl. Gemma 4 denkt vor der Antwort, das kostet Zeit und Neurons.
- **Andere Modelle ohne Bezahlung:** zum Beispiel `@cf/meta/llama-3.2-3b-instruct` oder `@cf/qwen/qwen3-30b-a3b-fp8`. Dazu `AI_MODEL` ändern und neu bauen lassen. Einige große Modelle verlangen bei Cloudflare eine Zahlungsmethode.
- **Claude:** Secret `ANTHROPIC_API_KEY` anlegen (Schlüssel aus der Claude Console, braucht Guthaben). Der Worker nimmt dann automatisch Claude, ohne Codeänderung. Secret löschen, und es antwortet wieder Workers AI.

## Gedächtnis

Die Persona liegt in `memory/00-Inoni-Persona.md` und wird beim Antworten aus dem Repo gelesen (fünf Minuten zwischengespeichert). Das Repo ist öffentlich, deshalb keine privaten Inhalte in `memory/` ablegen oder das Repo auf privat stellen. Dann braucht der Worker das Secret `GITHUB_TOKEN`.

Später: Secret `GITHUB_TOKEN` (fein abgestuftes Token nur für dieses Repo, Berechtigung Contents). Dann kann Inoni auch Notizen in `memory/` schreiben.

Schlüssel gehören nie in die Web-App, nur in die Secrets des Workers.

## Dateien

- `wrangler.toml` Konfiguration des einen Workers
- `web/index.html` das HUD, eine einzelne Datei ohne Build
- `web/manifest.webmanifest`, `web/icon-*.png` Symbol für den Home-Bildschirm
- `worker/src/index.js` Endpunkte `/api/brain`, `/api/speak`, `/api/memory`, `/api/health`
- `memory/` Persona und Projektnotizen, werden von Inoni gelesen
- `PROGRESS.md` Stand und nächste Schritte
- `scripts/make-zip.sh` baut die ZIP neu
