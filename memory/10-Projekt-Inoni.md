# Projekt Inoni

Stand: 17.10.2026

## Name
- Das Projekt heißt Inoni. Der KI-Butler heißt Inoni und wird mit Inoni angesprochen (Weckwort "Inoni").
- Der Name Jarvis wird nicht mehr verwendet.

## Entscheidungen
- Alles läuft gehostet, kein eigener Rechner. Gearbeitet wird vom iPad aus mit GitHub.
- Kostenlos starten: Das Gehirn ist zunächst ein Modell von Cloudflare Workers AI (Gemma 4). Claude über die Claude API ist ein späterer Wechsel, der nur das Secret ANTHROPIC_API_KEY braucht.
- Claude Code baut das Projekt, läuft aber nicht im Betrieb mit.
- Gedächtnis sind Markdown-Dateien im Ordner memory/ dieses Repos. Obsidian auf dem iPad ist nur die Ansicht. Das Repo ist öffentlich, deshalb keine privaten Inhalte ablegen.
- Ein einziger Cloudflare-Worker namens inoni liefert das HUD und die API aus.
- Stimme: Fish Audio (Modell s2.1-pro-free) über den Worker, die Browser-Stimme bleibt als Rückfall. Die Gratisphase läuft laut Anbieter bis 30.11.2026.
- Inoni handelt nie von selbst. Aktionen werden vorgeschlagen und erst nach Freigabe im HUD ausgeführt.

## Ideen aus dem Vorbild-Video (TikTok von Marco Sieg)
- Freigabe-Karten im HUD (Ausführen oder Ablehnen).
- Schnellaktionen: Timer, Notiz speichern, Morgen-Briefing, Nachrichten, Wetter.
- Tagesübersicht mit Aufgaben und Wochenfortschritt, abgelegt als Markdown in memory/.
- Planer: Ziel eingeben, Plan mit Schritten, Vorschau, Freigabe.
- Weckwort "Inoni" erst ganz zuletzt, im Browser auf dem iPad unzuverlässig.

## Offen
- Deutsche Fish-Stimme aussuchen und anhören (FISH_VOICE_ID).
- Prüfen, wie gut das kostenlose Modell Deutsch spricht, gegebenenfalls Modell wechseln.
- Später GITHUB_TOKEN für das Gedächtnis.
