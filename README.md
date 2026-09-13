# Berufe entdecken

60 echte Berufe in Deutschland kennenlernen und paarweise vergleichen: **Welchen Beruf würdest du lieber einmal ausprobieren?** Die eigenen Entscheidungen erzeugen eine persönliche Rangfolge. Die Liste zeigt aktuelle Interessen, keine gemessene berufliche Eignung. Kennzahlen beeinflussen die Sortierung nicht.

[App öffnen](https://rwetzold.github.io/berufswahl/)

Für Kinder ab etwa zehn Jahren: Kurzbeschreibungen, typische Tätigkeiten, Arbeitsumfelder, Tagesabläufe, Ausbildungswege und ungefährliche Entdeckeraufgaben. Informationen bleiben auch in der vollständigen Rangliste erreichbar. Rückgängig, Neustart mit Bestätigung und lokales Speichern sind enthalten.

Bei einem neuen Durchlauf zeigen die ersten 30 Vergleiche alle 60 Berufe jeweils einmal. Danach werden bevorzugt zwei andere Karten gewählt. Wiederholungen sind nur noch für die genauere Rangfolge nötig; bereits direkt oder indirekt geklärte Beziehungen werden nicht erneut abgefragt. Die Zwischenliste ist ausdrücklich vorläufig. Die Anzahl kennengelernter Berufe und der Fortschritt der Sortierung sind getrennt: Der Balken zeigt den Anteil bereits geklärter Reihenfolgebeziehungen.

Der Algorithmus speichert persönliche Präferenzen als gerichtete Beziehungen und berücksichtigt ihre transitiven Folgen. Bei der Paarwahl gelten in dieser Reihenfolge: ungesehene Berufe, Kartenwechsel gegenüber dem letzten Vergleich, erwarteter Informationsgewinn, seltenere bisherige Anzeige. Bei Gleichstand entscheidet die zu Beginn zufällig gemischte Reihenfolge. Bestehende Ranglisten aus dem früheren Einfügeverfahren werden mit ihren bekannten Reihenfolgen, noch offenen Einfügegrenzen und der Rückgängig-Historie übernommen.

## Lokal starten

Node.js 24:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`dist/` enthält die statische Website. Keine API-Schlüssel oder Backend-Dienste für den Betrieb erforderlich. GitHub Actions prüft Tests und Build; nur erfolgreiche Builds von `main` werden auf GitHub Pages veröffentlicht. Pull Requests veröffentlichen nichts.

## Daten und feste Skalen

`src/careers.json` enthält 60 stabile IDs, redaktionelle Texte und Einschätzungen, recherchierte Messwerte, Quellen, Bezugsgruppen und Bildnachweise. Abrufdatum: 13. September 2026. Die Website lädt keine laufenden externen Berufsdaten nach.

| Anzeige | Bedeutung und feste Stufenobergrenzen |
| --- | --- |
| Menschen im Beruf | Vollzeitbeschäftigte der Berufsgruppe: 5.000 / 10.000 / 25.000 / 50.000 / 100.000 / 200.000 / 400.000 / 700.000 / 1 Mio.; darüber Stufe 10. |
| Gehalt | Median des Bruttomonatsgehalts bei Vollzeit: 2.000 / 2.750 / 3.500 / 4.250 / 5.000 / 5.750 / 6.500 / 7.250 / 8.000 Euro; darüber Stufe 10. Brutto heißt vor Steuern und Abgaben. |
| Ausbildungsdauer | Beispielhafter typischer Weg nach dem erforderlichen Schulabschluss einschließlich verpflichtender Praxis. Aufgerundete Jahre, maximal Stufe 10; alternative Wege im Text. |
| Lernen für den Beruf | Redaktionelle Einschätzung zu Theorie, Stoffumfang und praktischer Komplexität. |
| Körperliche Belastung | Redaktionelle Einschätzung zu Bewegung, Kraft, Haltung und Arbeitsumgebung. |
| Geistige/emotionale Belastung | Redaktionelle Einschätzung zu Konzentration, Zeitdruck, Verantwortung und emotionalen Anforderungen. |
| Zukunftssicherheit | Redaktionelle Einschätzung für 10–15 Jahre unter Berücksichtigung von Bedarf und KI-Veränderungen. Keine Garantie oder Prozentwahrscheinlichkeit. |
| Aktuell gesucht | Gemeldete Stellen je 100 sozialversicherungspflichtig Beschäftigte einer Berufsgruppe: 0,5 / 1 / 2 / 3 / 4 / 5 / 6 / 8 / 10; darüber Stufe 10. Letzter verfügbarer IAB-Datenstand 2024. |
| Männer/Frauen | Neutraler Prozentbalken aus verfügbaren Beschäftigtenzahlen; keine Bewertung. |

**Mehr bedeutet nicht automatisch besser.** Redaktionelle Anker: 1–2 sehr gering, 3–4 eher gering, 5–6 mittel, 7–8 hoch, 9–10 sehr hoch. Erläuterungen nennen berufsspezifische Gründe und Unsicherheit. Diese Einschätzungen sind keine wissenschaftlich validierten Eignungstests.

### Quellen und Grenzen

- [BERUFENET](https://web.arbeitsagentur.de/berufenet/): Berufsprofile; der konkrete Link steht beim Beruf.
- [Entgeltatlas](https://web.arbeitsagentur.de/entgeltatlas/) und [Methodik](https://www.arbeitsagentur.de/hilfe-entgeltatlas): Datenjahr 2025. Zahlen betreffen sozialversicherungspflichtige Vollzeitbeschäftigte der zugeordneten Berufsgruppe, ohne Auszubildende. Teilzeitkräfte, Selbstständige und Beamte fehlen. Die Anzeige ist **keine Gesamtzahl aller Menschen im einzelnen Beruf**. Gerade bei Lehrkräften, Medizin und Beamtenberufen ist diese Einschränkung wesentlich. Werte an der statistischen Gehaltsgrenze werden als Untergrenze markiert.
- [IAB Job-Futuromat](https://job-futuromat.iab.de/): Beschäftigte und durchschnittlich gemeldete offene Stellen 2024 nach Berufsgruppe. Die Nachfrageanzeige ist eine erklärte Näherung, kein amtlicher Engpassindikator und keine Live-Stellenbörse. Nicht alle Stellen werden gemeldet; Personalwechsel und Meldeverhalten beeinflussen den Wert. Der direkte Download der BA-Engpassanalyse war beim Erstellen nicht erreichbar und wurde nicht durch erfundene Werte ersetzt.
- [IAB: KI-Szenarien](https://iab.de/publikationen/publikation/?id=15227157) und [Substituierbarkeit von Tätigkeiten](https://job-futuromat.iab.de/content/text/kb2024-05.pdf): Grundlage der vorsichtigen Zukunftseinordnung. Automatisierbare Tätigkeiten bedeuten nicht automatisch, dass ein Beruf verschwindet.

Fehlende oder unterdrückte Messwerte erscheinen als „Keine verlässliche Angabe“, ohne Nullwert oder Balken. Daten sind keine Vorhersage des persönlichen Einkommens. Erläuterungen funktionieren mit Tastatur, Maus und Tippen.

### Bilder

Mit OpenAI Imagegen erzeugte, fotorealistische Beispielszenen, in der App als **KI-Bild** gekennzeichnet. Keine Dokumentation echter Arbeitsplätze oder Personen und keine Arbeits- oder Sicherheitsanleitungen. Querformat 3:2, 768 × 512 Pixel im kompakten WebP-Format.

Bilddateien: `public/images/`. Datum, Werkzeug und vollständige Prompts: `docs/image-prompts.json`. Der Generator lieferte größere Ausgangsdateien als angefragt; die Auslieferungsgröße wurde separat optimiert. Es wird keine Creative-Commons-Lizenz oder fremde Urheberschaft für generierte Bilder behauptet.

## Pflege und Architektur

- `src/ranking.js`, `src/undo.js`, `src/shuffle.js`: abwechslungsreiche Paarwahl, Reihenfolgeberechnung, Rückgängig und zufälliger Start.
- `src/persistence.js`: Speicherschlüssel `berufswahl-careers-v1`, Datenformat Version 2 mit Migration von Version 1; alte Berufswahl-Beispieldaten und Eurovision-Einträge werden weder gelesen noch gelöscht.
- `src/metrics.js`: feste Skalen und Erläuterungen.
- `src/main.js`, `src/styles.css`: responsive Oberfläche.
- `tests/`: Ranking, Rückgängig, Persistenz, Datenvollständigkeit und Skalengrenzen.

Recherche-Skripte unter `scripts/` dienen der manuellen Datenpflege. Zuordnungen zu Berufsgruppen, Quellen und Ausbildungswege müssen redaktionell geprüft werden. Zwischenergebnisse liegen im ignorierten `output/`; geprüfte Laufzeitquelle bleibt `src/careers.json`. Bildoptimierung benötigt Python und Pillow; diese sind keine Abhängigkeiten der Website oder des Builds.

## Datenschutz

Keine Anmeldung, Analyse-Tracker oder öffentliches Backend. Entscheidungen bleiben im lokalen Browserspeicher. Das Löschen der Browserdaten entfernt den Fortschritt. GitHub Pages liefert Website und Bilder aus; externe Quellen werden erst beim Anklicken geöffnet.

## Herkunft und Lizenz

Eigenständiges Repository mit erhaltener Historie aus [Eurovision Playlist](https://github.com/rwetzold/eurovision-playlist). Eurovision-Inhalte, Jahresauswahl, YouTube-Einbettungen und Beispielmedien wurden entfernt. Keine schreibende Remote-Verbindung zum Ursprungsprojekt.

Ursprünglich erstellt von **Robert Wetzold und Anton Wetzold**. Quellcode: [MIT-Lizenz](LICENSE). Quellenangaben und Bildprovenienz gelten unabhängig davon; die Quellcodelizenz behauptet keine Rechte an Quellen-Websites oder fremden Inhalten.
