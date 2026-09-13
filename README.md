# Berufswahl

Grundlage für eine Anwendung zur Berufswahl von Schülern: Durch paarweise Präferenzentscheidungen entsteht schrittweise eine persönliche Rangliste.

## Stand der Vorbereitung

Dieses eigenständige Repository wurde aus [Eurovision Playlist](https://github.com/rwetzold/eurovision-playlist) übernommen und behält dessen Git-Historie. **Die Oberfläche und Eurovision-Songdaten sind vorläufige Beispielinhalte.** Berufskategorien, Texte und die Gestaltung für Schüler werden im nächsten Schritt gemeinsam festgelegt; die Anwendung bietet derzeit noch keine Berufswahlinhalte.

Der vorhandene Vergleichsmechanismus einschließlich Rückgängig-Funktion, Neustart und lokal gespeicherten Ranglisten bleibt funktionsfähig. Dieses Projekt verwendet eigene Browserspeicherschlüssel mit dem Präfix `berufswahl-ranking-`; Eurovision-Spielstände werden weder übernommen noch verändert.

## Lokal starten

Voraussetzungen: Node.js 24 und Git.

```sh
git clone https://github.com/rwetzold/berufswahl.git
cd berufswahl
npm ci
npm run dev
```

Die im Terminal angezeigte lokale URL öffnen. Es werden keine API-Schlüssel, Umgebungsvariablen oder Backend-Dienste benötigt.

```sh
npm test
npm run build
npm run preview
```

Der Produktionsbuild liegt in `dist/` und muss über HTTP ausgeliefert werden. `dist/` und `node_modules/` werden nicht eingecheckt.

## Automatische Prüfung und Hosting

GitHub Actions führt bei Pushes auf `main`, Pull Requests gegen `main` und manuellem Start die Installation, Tests und den Build aus. Eine automatische Veröffentlichung ist nicht eingerichtet. Hosting wird nach der Inhaltsbesprechung festgelegt.

## Technische Grundlage

Die Anwendung verwendet JavaScript, CSS, Vite und Vitest. `src/ranking.js` enthält den Vergleichsmechanismus, `src/undo.js` die Rückgängig-Funktion und `src/persistence.js` die lokale Speicherung. Oberfläche und Styling liegen in `src/main.js` und `src/styles.css`; die vorläufigen Songdaten stehen in `src/songs.js`. Verhaltenstests liegen in `tests/`.

## Medien und Datenschutz der Beispielanwendung

Die Anwendung hat kein Backend und keine Anwendungsanalyse. Entscheidungen werden nur im lokalen Browserspeicher gespeichert. Das Löschen der Browserdaten entfernt den Fortschritt. Die vorläufigen Eurovision-Inhalte laden Vorschaubilder von YouTube; beim Abspielen werden YouTube-Videos eingebettet. Dafür werden Verbindungen zu YouTube aufgebaut. Die Verfügbarkeit hängt unter anderem von Region und Einbettungsrechten ab.

Das übernommene Eurovision-Beispiel ist ein inoffizielles Fanprojekt ohne Verbindung zum Eurovision Song Contest oder zur EBU. Videos, Vorschaubilder, Songtitel, Künstlernamen und Marken gehören den jeweiligen Rechteinhabern. Die Quellcodelizenz gewährt keine Rechte an Drittmedien, auch nicht am übernommenen Screenshot in `docs/screenshot.png`.

## Urheber und Lizenz

Ursprünglich erstellt von **Robert Wetzold und Anton Wetzold**.

Der Quellcode steht unter der [MIT-Lizenz](LICENSE).
