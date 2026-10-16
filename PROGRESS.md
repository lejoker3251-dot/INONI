# Fortschritt Jarvis Inoni

## Arbeitsregeln
- Nach jedem Schritt wird dieser Stand aktualisiert und im Claude-Projekt gespeichert.
- Es gibt immer eine ZIP mit allen Dateien (Name: jarvis-inoni-vX.Y.zip). Die Ordner liegen direkt im ZIP-Stamm, nach dem Entpacken kann alles in dieser Struktur hochgeladen werden.
- Claude Code baut, die Claude API denkt im Betrieb.
- Wir arbeiten im kostenlosen Claude-Tarif. Cloud-Sessions mit GitHub-Verknüpfung sind dort laut Doku nicht verfügbar, ich kann daher nicht direkt ins Repo schreiben.

## Stand 16.10.2026, nachts (v0.4)
GitHub-Repo: lejoker3251-dot/INONI (öffentlich). Ich kann es lesen, aber nicht ändern.

Cloudflare:
- Konto steht, eingeloggt.
- Ein Worker "inoni": liefert HUD (web/) und API (/api/*). Adresse: https://inoni.420joker-68b.workers.dev
- Das HUD läuft dort schon live (Stand vor v0.4, vom Nutzer geprüft).
- Entscheidung: kein zweites Projekt. Statt eines Workers "jarvis-inoni" wurde alles in "inoni" zusammengelegt.

Umbau in v0.4 (muss noch ins Repo):
- NEU: wrangler.toml im Hauptverzeichnis (name inoni, main worker/src/index.js, assets web, run_worker_first nur /api/*).
- GEÄNDERT: worker/src/index.js (alles außerhalb /api/ geht an die Seite), web/index.html (erkennt die Adresse selbst, Demo läuft, bis der Schlüssel eingetragen ist), README.md, memory/10-Projekt-Jarvis-Inoni.md, PROGRESS.md.
- ZU LÖSCHEN im Repo: worker/wrangler.toml (wird nicht mehr gebraucht).
- Geprüft mit Beispielaufrufen: Seite wird ausgeliefert, /api/health ohne Schlüssel 401, mit Schlüssel 200, /api/brain liefert Text und ruft die Claude API mit dem Schlüssel auf, ungültiger Memory-Pfad 400, unbekannter API-Pfad 404. HUD-Skript auf Syntaxfehler geprüft.
- Nicht geprüft: echter Deploy mit der neuen wrangler.toml, echte Claude-Antwort, Mikro und Vorlesen im Browser.

Nächste Schritte:
1. v0.4 ins Repo laden, worker/wrangler.toml löschen. Cloudflare baut automatisch neu.
2. Build-Log prüfen, danach Secrets setzen: ACCESS_TOKEN und ANTHROPIC_API_KEY. GITHUB_TOKEN später.
3. Im HUD den Zugangsschlüssel eintragen, "Speichern und testen", eine Nachricht an Jarvis schreiben.
4. Stimme über Cloudflare statt Browser, deutsche Stimme auswählen.

## v0.3, 16.10.2026
- Inhalt wie v0.2, dazu wrangler.toml mit richtigem Repo und aktuelles PROGRESS.md. ZIP ohne Oberordner.

## v0.2, 15.10.2026
- HUD heller und feiner, Statusleiste, Eingabezeile, Mikro-Taste, Vorlesen (Browser-Stimme als Übergang), Verbindung zum Worker einstellbar.

## v0.1, 15.10.2026
- Architektur festgelegt, HUD-Entwurf, Worker-Gerüst, Start-Gedächtnis.
