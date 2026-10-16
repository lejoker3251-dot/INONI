# Projekt Jarvis Inoni

Stand: 16.10.2026

## Entscheidungen
- Alles läuft gehostet, kein eigener Rechner. Gearbeitet wird vom iPad aus mit GitHub.
- Die Stimme denkt mit Claude (Claude API), nicht mit einem anderen Modell.
- Claude Code baut das Projekt, läuft aber nicht im Betrieb mit.
- Gedächtnis sind Markdown-Dateien im Ordner memory/ dieses Repos. Obsidian auf dem iPad ist nur die Ansicht.
- Hören und Sprechen laufen über gehostete Dienste (Cloudflare), nicht lokal.
- Ein einziger Cloudflare-Worker namens inoni liefert das HUD und die API aus.

## Offen
- Deutsche Stimme auswählen und anhören.
- Secrets im Worker setzen (ACCESS_TOKEN, ANTHROPIC_API_KEY), später GITHUB_TOKEN.
- Sprachanbindung an das HUD über Cloudflare.
