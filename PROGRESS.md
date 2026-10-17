# Fortschritt Jarvis Inoni

## Arbeitsregeln
- Nach jedem Schritt wird dieser Stand aktualisiert und im Claude-Projekt gespeichert.
- Es gibt immer eine ZIP mit allen Dateien (Name: jarvis-inoni-vX.Y.zip). Die Ordner liegen direkt im ZIP-Stamm, nach dem Entpacken kann alles in dieser Struktur hochgeladen werden.
- Kostenlos starten: Der Nutzer will kein Geld ausgeben. Das Gehirn läuft vorerst über Cloudflare Workers AI.
- Wir arbeiten im kostenlosen Claude-Tarif. Cloud-Sessions mit GitHub-Verknüpfung sind dort laut Doku nicht verfügbar, ich kann daher nicht direkt ins Repo schreiben.

## Stand 17.10.2026 (v0.5)
GitHub-Repo: lejoker3251-dot/INONI (öffentlich). Ich kann es lesen, aber nicht ändern.

Cloudflare:
- Ein Worker "inoni": HUD (web/) und API (/api/*). Adresse: https://inoni.420joker-68b.workers.dev
- Das HUD läuft dort live. Eine Version mit Worker-Code war laut Doku noch nicht bestätigt, in Settings stand "Variables cannot be added to a Worker that only has static assets".
- Secret ACCESS_TOKEN wurde vorbereitet (Wert in diesem Chat ausgegeben, Nutzer kann ihn später tauschen). Ob er schon in Cloudflare eingetragen ist, ist offen.
- ANTHROPIC_API_KEY entfällt vorerst, der Nutzer will nichts bezahlen.

Neu in v0.5:
- Gehirn auf Cloudflare Workers AI umgestellt, Modell @cf/google/gemma-4-26b-a4b-it (AI_MODEL in wrangler.toml). Claude wird automatisch benutzt, sobald ANTHROPIC_API_KEY gesetzt ist.
- wrangler.toml: neues Binding [ai], neue Variable AI_MODEL.
- Worker: robuste Auswertung der Modell-Antwort, Verlauf auf 12 Nachrichten begrenzt, system-Nachrichten vom Client werden verworfen, health zeigt Gehirn und Modell.
- HUD: Statusleiste zeigt das echte Modell nach dem Verbinden, Fehlertexte aus dem Worker werden angezeigt.
- Geprüft mit Testaufrufen (21 Fälle, alle bestanden): Gemma- und Llama-Antwortformat, think-Tags, leere Antwort, KI-Fehler, Claude-Wechsel, fehlendes Binding, Pfadschutz.
- Nicht geprüft: echter Deploy mit Binding, echte Modellantwort, deutsche Sprachqualität, ob Gemma 4 eine Lizenzbestätigung bei Cloudflare verlangt, Mikro und Vorlesen im Browser.

Nächste Schritte:
1. v0.5 ins Repo laden (alle Dateien ersetzen), Build bei Cloudflare prüfen, es muss "Deployed inoni" mit AI-Binding melden.
2. Secret ACCESS_TOKEN unter Settings > Variables and secrets anlegen.
3. Im HUD den Zugangsschlüssel eintragen, "Speichern und testen", eine Nachricht an Jarvis schreiben. Bei Fehlern zeigt das HUD jetzt den Grund.
4. Stimme über Cloudflare statt Browser, deutsche Stimme auswählen.

## v0.4, 16.10.2026
- Ein Worker für HUD und API, wrangler.toml im Hauptverzeichnis, worker/wrangler.toml entfernt.

## v0.3, 16.10.2026
- wrangler.toml mit richtigem Repo, ZIP ohne Oberordner.

## v0.2, 15.10.2026
- HUD heller und feiner, Statusleiste, Eingabezeile, Mikro-Taste, Vorlesen, Verbindung zum Worker einstellbar.

## v0.1, 15.10.2026
- Architektur festgelegt, HUD-Entwurf, Worker-Gerüst, Start-Gedächtnis.
