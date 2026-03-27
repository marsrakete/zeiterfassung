# Projekt-Zeiterfassung

![App-Icon](./icons/app-icon.svg)

Eine schlanke Progressive Web App zur Projekt-Zeiterfassung mit lokaler Speicherung, Live-Buchung und Excel-Export.

## Für wen ist die App gedacht?

Die App ist gedacht für Personen, die ihre Arbeitszeit projektbezogen auf einem einzelnen Gerät erfassen und dabei bewusst ohne Server, Datenbank oder Cloud-Synchronisation arbeiten wollen.

## Überblick

Die App ist bewusst einfach gehalten:

- Projekte anlegen, starten, stoppen und löschen
- Laufende Zeitblöcke direkt bearbeiten, stoppen und das zuletzt gestoppte Projekt fortsetzen
- Zeitblöcke manuell erfassen
- Zeitblöcke kompakt in einer Übersicht anzeigen
- Zeitanteile visuell als Balken- oder Tortendiagramm darstellen
- Zeitblöcke im Editor-Dialog bearbeiten oder löschen
- Zeitdaten als Excel-Datei, CSV oder Monatsbericht exportieren
- Offline nutzbar als installierbare PWA

Alle Daten werden lokal im Browser gespeichert. Es wird kein Server und keine Datenbank benötigt.

## Datenspeicherung

Die App speichert ihre Daten lokal im Browser auf dem jeweiligen Gerät.

- Speicherort: `localStorage` des verwendeten Browsers
- Gespeichert werden: Projekte, Zeitblöcke und ein eventuell aktuell laufendes Projekt
- Speicherdauer: grundsätzlich unbegrenzt, bis die Daten gelöscht, durch einen Import ersetzt oder der Browser-Speicher manuell entfernt wird
- Die Daten werden nicht automatisch mit anderen Geräten synchronisiert

Für einen Gerätewechsel oder eine Sicherung gibt es deshalb einen eigenen Datenexport und -import in den Einstellungen.

## Schnellstart

Im Projektordner ausführen:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

Danach ist die App unter [http://localhost:4173/](http://localhost:4173/) erreichbar.

Optional mit anderem Port:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1 -Port 8080
```

## Installation als App

### iPhone und iPad (iOS / iPadOS)

1. Die App in `Safari` öffnen.
2. Auf das `Teilen`-Symbol tippen.
3. `Zum Home-Bildschirm` auswählen.
4. Namen prüfen und mit `Hinzufügen` bestätigen.

Danach erscheint die Zeiterfassung wie eine normale App auf dem Home-Bildschirm.

### Android

1. Die App in `Chrome`, `Edge` oder einem anderen unterstützten Browser öffnen.
2. Im Browser-Menü `App installieren` oder `Zum Startbildschirm hinzufügen` auswählen.
3. Installation bestätigen.

Danach erscheint die Zeiterfassung im App-Launcher und kann wie eine normale App gestartet werden.

### PC / Notebook

1. Die App in einem unterstützten Browser wie `Edge` oder `Chrome` öffnen.
2. Im Browser die Installationsfunktion der Website aufrufen.
   In Edge meist über das App-Symbol in der Adressleiste oder über Menü > `Apps` > `Diese Website als App installieren`.
   In Chrome meist über das Installieren-Symbol in der Adressleiste oder über Menü > `Übertragen, speichern und teilen` > `Seite installieren`.
3. Installation bestätigen.

Danach startet die Zeiterfassung in einem eigenen Fenster und kann an Taskleiste oder Startmenü angeheftet werden.

## So funktioniert die App

### 1. Projekte verwalten

- Neue Projekte werden über den Button `Neues Projekt` in einem Popup angelegt
- Projektnamen müssen eindeutig sein; doppelte Namen werden nicht gespeichert
- Projekte können Notizen erhalten
- Projekte bekommen automatisch eine freie Standardfarbe und können später aus einer festen Farbpalette umgefärbt werden
- In der Projektverwaltung werden nur die Zeitblöcke des aktuellen Tages je Projekt berücksichtigt
- Laufende Projekte bleiben sichtbar und als aktiv markiert
- Die Reihenfolge der Projekte kann per Drag-and-drop direkt in der Liste geändert werden
- Für Touch-Geräte gibt es zusätzlich Verschieben-Buttons nach oben und unten
- Über den Drag-Handle ist auch eine mobile Touch-Sortierung möglich
- Eine Suche und Filter für aktive, heutige oder noch ungebuchte Projekte helfen bei vielen Projekten
- Projekte können umbenannt und ihre Notizen bearbeitet werden

### 2. Zeiten live buchen

- `Einbuchen` startet die Zeitmessung
- Beim Wechsel auf ein anderes Projekt wird das bisher aktive Projekt automatisch beendet
- `Ausbuchen` stoppt das aktuell laufende Projekt explizit
- Start- und Endzeit der Live-Buchung werden beim Ein- und Ausbuchen auf das eingestellte Zeitraster aufgerundet
- Wenn ein Start wegen Rundung erst in Kürze beginnt, zeigt die App den Zustand als geplanten Start mit Countdown an
- Laufende Zeitblöcke können direkt bearbeitet oder gestoppt werden
- Ein gestopptes Projekt kann danach über `Letztes Projekt fortsetzen` direkt wieder gestartet werden
- Optional kann eine Systembenachrichtigung aktiviert werden: nach 1 Stunde Laufzeit und danach alle 30 Minuten erscheint `Es läuft noch ein Projekt-Timer`
- Die Erinnerung läuft über den Service Worker; ein Klick auf die Benachrichtigung fokussiert oder öffnet die App

### 3. Zeitblöcke manuell nachtragen

Ein Zeitblock kann mit folgenden Angaben gespeichert werden:

- Projekt
- Start
- Ende
- Notiz
- Bei Überschneidungen mit vorhandenen Zeitblöcken zeigt die App vor dem Speichern eine Warnung an

### 4. Übersicht nutzen

Die Übersicht ist absichtlich kompakt und zeigt nur:

- Projekt
- Zeitraum
- Dauer
- Notiz
- `Editor`

Über den `Editor` öffnet sich ein Dialog zum Bearbeiten des ausgewählten Zeitblocks.

Projekt-Notizen werden in der Projektkachel gekürzt angezeigt und lassen sich per Klick vollständig im Popup lesen.
Zeitblöcke lassen sich außerdem nach Zeit, Projekt oder Dauer sortieren und werden in Tagesgruppen angezeigt.

### 5. Statistik anzeigen

Die Statistik zeigt die Verteilung der gebuchten Zeit pro Projekt.

- umschaltbar zwischen Balkendiagramm und Tortendiagramm
- Zeitraum wählbar für heute, diese Woche oder diesen Monat
- Mouse-Over-Tooltip mit Projektname und Dauer
- Legende mit Farbzuordnung und Dauer

### 6. Kalenderansicht

Es gibt eine visuelle Kalenderansicht für:

- Tag
- Woche
- Monat

Die Kalenderansicht ist einklappbar und bei Bedarf per Aufklappen sichtbar.

Wochenenden und bundeseinheitliche Feiertage in Deutschland werden markiert.

### 7. Zeitblöcke bearbeiten

Im Editor-Dialog lassen sich:

- Projekt ändern
- Start ändern
- Ende ändern
- Notiz ändern
- Zeitblock löschen

Zusätzlich können alle Zeitblöcke gesammelt mit Sicherheitsabfrage gelöscht werden.

### 8. Daten & Export

Exportierbar sind:

- Tag
- Woche
- aktueller Monat
- frei wählbarer Monat

Verfügbare Formate:

- Excel
- CSV
- HTML-Bericht mit Tagesabschnitten, Projektsummen und eingebetteter Statistik

Projektfarben werden dabei in Summen und Statistik auch im Export sichtbar mitgeführt.

Die Exportdateien werden über die Teilen-Funktion des Geräts oder Browsers angeboten. Dadurch können sie direkt an E-Mail, Messenger oder andere kompatible Apps übergeben werden. Falls die Teilen-Funktion nicht verfügbar ist, wird automatisch ein normaler Download verwendet.

Beim Monats-Excel-Export für alle Projekte wird zusätzlich eine Sammelmappe mit einzelnen Projekt-Blättern erzeugt.

### 9. Einstellungen

Im Bereich `Einstellungen` gibt es zusätzlich diese Einstellungen:

- eine Sprachwahl mit `Automatisch`, `Deutsch`, `Englisch` oder `Französisch`
- eine Rundungseinstellung mit `Keine Rundung`, 5, 10 oder 15 Minuten
- eine zuschaltbare Stundenerinnerung für laufende Projekte über die Notification-API des Browsers
- tägliche und wöchentliche Sollzeiten
- einen Backup-Status mit Hinweis auf das letzte exportierte App-Daten-Backup

### 10. App-Daten übertragen

Ebenfalls im Bereich `App-Daten` gibt es:

- `App-Daten exportieren`: erstellt eine JSON-Datei mit allen lokal gespeicherten Projekten und Zeitblöcken
- `App-Daten importieren`: führt Daten zusammen und überspringt erkannte Dubletten

Damit lassen sich Daten auf ein anderes Gerät übertragen oder als Sicherung aufbewahren.

## PWA und Offline-Nutzung

Die Anwendung kann in unterstützten Browsern installiert werden.

- Die Installation erfolgt über die native Installationsfunktion des Browsers
- Der Service Worker hält die statischen Dateien offline verfügbar
- Nach der Installation wirkt die App wie eine eigenständige Desktop- oder Mobil-App
- Die sichtbare Versionsanzeige und die Update-Prüfung lesen denselben Stand aus `version.json`
- Im Bereich `Einstellungen` kann die App zusätzlich per `Auf Update prüfen` die lokale Version mit `version.json` vom Server vergleichen und bei einer neuen Version direkt `Neu laden` anbieten

## Speicherung

- Speicherung erfolgt lokal im Browser über `localStorage`
- Es gibt keine automatische Cloud-Synchronisation
- Daten bleiben an das jeweilige Gerät und Browserprofil gebunden

Für wichtige Daten empfiehlt sich zusätzlich ein regelmäßiger Export der App-Daten als JSON-Datei.

## Dateien

- [index.html](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/index.html): Oberfläche
- [styles.css](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/styles.css): Layout und Design
- [app.js](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/app.js): Logik, Speicherung und Export
- [README.md](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/README.md): Dokumentation
- [manifest.webmanifest](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/manifest.webmanifest): PWA-Metadaten
- [service-worker.js](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/service-worker.js): Offline-Cache
- [start-server.ps1](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/start-server.ps1): Lokaler Start unter Windows

## Hinweise

- Beim Löschen eines Projekts werden auch alle zugehörigen Zeitblöcke entfernt
- Der Excel-Export enthält Einzelzeilen und Projektsummen
- Der Excel-Export enthält zusätzlich ein Statistik-Blatt mit den aggregierten Projektwerten
- Beim Monats-Excel-Export für alle Projekte werden zusätzliche Projekt-Blätter erzeugt
- CSV und ein HTML-Bericht stehen zusätzlich als Exportformate zur Verfügung
- Der Import von App-Daten führt Daten zusammen und erkennt Dubletten
- Die integrierte Hilfe rendert das README direkt in der App und bleibt dadurch mit der Dokumentation synchron
- Die App benötigt keinen Build-Prozess und kann direkt als statische Webanwendung betrieben werden
