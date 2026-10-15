# Fortschritt Jarvis Inoni

## Arbeitsregeln
- Nach jedem Schritt wird dieser Stand aktualisiert und im Claude-Projekt gespeichert.
- Gibt es etwas zum Hochladen, kommt es als fertige ZIP-Datei (Name: jarvis-inoni-vX.Y.zip).
- Claude Code baut, die Claude API denkt im Betrieb.

## v0.2, 15.10.2026
Neu:
- HUD heller und feiner: hellere Palette, Leuchteffekt, Wellenring um den Kern, Satelliten, Speichen, fein gezeichnete Skala.
- Statusleiste mit Modell, Verbindung, Stimme, Gedächtnis.
- Eingabezeile, Mikro-Taste und Vorlesen im HUD (Browser-Stimme als Übergang).
- Verbindung zum Worker einstellbar (Adresse und Zugangsschlüssel, nur im Browser gespeichert). Ohne Worker läuft der Beispieldialog.

Nicht getestet:
- Das HUD wurde nur auf Syntaxfehler geprüft, nicht im Browser angesehen.
- Worker-Verbindung, Mikro und Vorlesen sind ungeprüft. Mikro und Vorlesen hängen vom Browser ab.
- Der Worker ist nicht deployt, die API-Aufrufe sind ungeprüft.

GitHub: In dieser Sitzung ist kein GitHub-Konto verbunden, ich kann nicht direkt pushen. Upload läuft über die ZIP.

Nächste Schritte:
1. ZIP entpacken und auf GitHub hochladen, Web-App und Worker bei Cloudflare einrichten (siehe README).
2. Worker mit /api/health und /api/brain prüfen, danach im HUD Adresse und Schlüssel eintragen.
3. Stimme: Spracherkennung und Sprachausgabe über Cloudflare statt Browser, deutsche Stimme auswählen.
4. Zustände aus dem echten Ablauf steuern statt aus der Demo.

## v0.1, 15.10.2026
- Architektur festgelegt: HUD als statische Web-App, Worker mit Claude API, Gedächtnis als Markdown in GitHub.
- HUD-Entwurf, Worker-Gerüst (brain, memory, health, geschützt per ACCESS_TOKEN), Start-Gedächtnis.
