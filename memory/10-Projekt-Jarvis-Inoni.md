# Projekt Jarvis Inoni

Stand: 17.10.2026

## Entscheidungen
- Alles läuft gehostet, kein eigener Rechner. Gearbeitet wird vom iPad aus mit GitHub.
- Kostenlos starten: Das Gehirn ist zunächst ein Modell von Cloudflare Workers AI (Gemma 4). Claude über die Claude API ist ein späterer Wechsel, der nur das Secret ANTHROPIC_API_KEY braucht.
- Claude Code baut das Projekt, läuft aber nicht im Betrieb mit.
- Gedächtnis sind Markdown-Dateien im Ordner memory/ dieses Repos. Obsidian auf dem iPad ist nur die Ansicht.
- Hören und Sprechen laufen über gehostete Dienste (Cloudflare), nicht lokal.
- Ein einziger Cloudflare-Worker namens inoni liefert das HUD und die API aus.

## Offen
- Deutsche Stimme auswählen und anhören.
- Prüfen, wie gut das kostenlose Modell Deutsch spricht, gegebenenfalls Modell wechseln.
- Sprachanbindung an das HUD über Cloudflare.
- Später GITHUB_TOKEN für das Gedächtnis.
