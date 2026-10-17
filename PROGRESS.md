# Fortschritt Inoni

## Arbeitsregeln
- Das Projekt heißt Inoni. Der KI-Butler heißt Inoni und wird mit Inoni angesprochen. Der frühere Arbeitsname Jarvis wird nicht mehr verwendet.
- Antworten an den Nutzer ausschließlich auf Deutsch.
- Änderungen zum Hochladen gibt es ausschließlich als ZIP (Name: inoni-vX.Y.zip). Die Ordner liegen direkt im ZIP-Stamm, nach dem Entpacken kann alles in dieser Struktur hochgeladen werden.
- Nach jedem Schritt wird dieser Stand aktualisiert und im Claude-Projekt gespeichert.
- Kostenlos starten: Der Nutzer will kein Geld ausgeben. Das Gehirn läuft vorerst über Cloudflare Workers AI, die Stimme über die Gratis-Stufe von Fish Audio.
- Wir arbeiten im kostenlosen Claude-Tarif. Cloud-Sessions mit GitHub-Verknüpfung sind dort laut Doku nicht verfügbar, ich kann daher nicht direkt ins Repo schreiben.

## Stand 17.10.2026 (v0.6)
GitHub-Repo: lejoker3251-dot/INONI (öffentlich). Ich kann es lesen, aber nicht ändern.

Cloudflare:
- Ein Worker "inoni": HUD (web/) und API (/api/*). Adresse: https://inoni.420joker-68b.workers.dev
- Das HUD läuft dort live (Stand v0.5). Ob der Worker-Code mit AI-Binding gebaut wurde und der ACCESS_TOKEN gesetzt ist, ist offen.
- Der ACCESS_TOKEN wurde in einem früheren Chat ausgegeben. Neuen Wert setzen.

Neu in v0.6:
- Umbenennung: Alles heißt jetzt Inoni (HUD, Persona, Texte, ZIP-Name). Persona-Datei: memory/00-Inoni-Persona.md, Projektnotizen: memory/10-Projekt-Inoni.md. Die alten Dateien memory/00-Jarvis-Persona.md und memory/10-Projekt-Jarvis-Inoni.md im Repo bitte löschen.
- Stimme: neuer Endpunkt /api/speak (Fish Audio, Modell s2.1-pro-free) mit Secret FISH_API_KEY, optional FISH_VOICE_ID. Ohne Schlüssel oder bei Fehlern liest die Browser-Stimme vor. /api/health meldet voice und memory.
- Worker: Gemma-4-Budget auf 1500 Tokens (Denkmodus), Fehler "antwort_abgeschnitten", Verlauf beginnt immer mit user (wichtig für Claude), Persona fünf Minuten zwischengespeichert und auch ohne GITHUB_TOKEN aus dem öffentlichen Repo gelesen, klare Fehlermeldung ohne GITHUB_TOKEN beim Gedächtnis.
- HUD: Dokumentkopf korrigiert, Zustand bleibt "Spricht", bis das Vorlesen fertig ist, Mikro-Tipp stoppt das Vorlesen, Audio wird für iOS freigeschaltet, Statusleiste zeigt Stimme und Gedächtnis, Version v0.6, Symbol und Manifest für den Home-Bildschirm. Gespeicherte Adresse und Schlüssel aus v0.5 werden übernommen.
- Geprüft: Worker mit 32 Testaufrufen (Anmeldung, Health, Gemma- und Llama-Format, Verlauf, Persona-Cache, Claude-Wechsel, Stimme mit und ohne Schlüssel, Fish-Fehler, Gedächtnis ohne Token, Pfadschutz). HUD in Chromium mit simuliertem Worker: Übernahme der alten Speicherschlüssel, Statusleiste, Senden, Fish-Wiedergabe, Rückfall auf Browser-Stimme bei Fish-Fehler, Zustand kehrt auf "Bereit" zurück.
- Nicht geprüft: echter Deploy, echte Gemma-Antwort, Fish-API-Aufruf (Format JSON laut Blog-Beispiel, der Text spricht von msgpack), Audio-Wiedergabe auf dem iPad, deutsche Sprachqualität, Home-Bildschirm-Symbol.

Nächste Schritte:
1. v0.6 ins Repo laden (alle Dateien ersetzen, alte Jarvis-Memory-Dateien löschen), Build bei Cloudflare prüfen.
2. Secret ACCESS_TOKEN (neuer Wert) anlegen, im HUD eintragen, "Speichern und testen".
3. Fish-Konto, Secret FISH_API_KEY, deutsche Stimme aussuchen und FISH_VOICE_ID eintragen.
4. Danach, in dieser Reihenfolge: Freigabe-Karten, Schnellaktionen und Tagesübersicht (Markdown in memory/), Planer, Weckwort "Inoni".
5. Gratisphase von Fish endet laut Anbieter am 30.11.2026, vorher Preise prüfen.

## v0.5, 17.10.2026
- Gehirn auf Cloudflare Workers AI umgestellt (Gemma 4), Claude wird bei gesetztem ANTHROPIC_API_KEY automatisch benutzt.
- Worker robuster, HUD zeigt echtes Modell und Fehlertexte aus dem Worker.

## v0.4, 16.10.2026
- Ein Worker für HUD und API, wrangler.toml im Hauptverzeichnis, worker/wrangler.toml entfernt.

## v0.3, 16.10.2026
- wrangler.toml mit richtigem Repo, ZIP ohne Oberordner.

## v0.2, 15.10.2026
- HUD heller und feiner, Statusleiste, Eingabezeile, Mikro-Taste, Vorlesen, Verbindung zum Worker einstellbar.

## v0.1, 15.10.2026
- Architektur festgelegt, HUD-Entwurf, Worker-Gerüst, Start-Gedächtnis.
