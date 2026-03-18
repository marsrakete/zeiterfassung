# Projekt-Zeiterfassung

![App-Icon](./icons/app-icon.svg)

Eine schlanke Progressive Web App zur Projekt-Zeiterfassung mit lokaler Speicherung, Live-Buchung und Excel-Export.

## Überblick

Die App ist bewusst einfach gehalten:

- Projekte anlegen, starten, stoppen und löschen
- Zeitblöcke manuell erfassen
- Zeitblöcke kompakt in einer Übersicht anzeigen
- Zeitblöcke im Editor-Dialog bearbeiten oder löschen
- Zeitdaten als Excel-Datei exportieren
- Offline nutzbar als installierbare PWA

Alle Daten werden lokal im Browser gespeichert. Es wird kein Server und keine Datenbank benötigt.

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

## So funktioniert die App

### 1. Projekte verwalten

- Neue Projekte werden unterhalb der Projektliste angelegt
- In der Projektverwaltung werden nur die Zeitblöcke des aktuellen Tages je Projekt berücksichtigt
- Laufende Projekte bleiben sichtbar und als aktiv markiert

### 2. Zeiten live buchen

- `Einbuchen` startet die Zeitmessung
- Beim Wechsel auf ein anderes Projekt wird das bisher aktive Projekt automatisch beendet
- `Ausbuchen` stoppt das aktuell laufende Projekt explizit

### 3. Zeitblöcke manuell nachtragen

Ein Zeitblock kann mit folgenden Angaben gespeichert werden:

- Projekt
- Start
- Ende
- Notiz

### 4. Übersicht nutzen

Die Übersicht ist absichtlich kompakt und zeigt nur:

- Projekt
- Start
- Dauer
- Notiz
- `Editor`

Über den `Editor` öffnet sich ein Dialog zum Bearbeiten des ausgewählten Zeitblocks.

### 5. Zeitblöcke bearbeiten

Im Editor-Dialog lassen sich:

- Projekt ändern
- Start ändern
- Ende ändern
- Notiz ändern
- Zeitblock löschen

Zusätzlich können alle Zeitblöcke gesammelt mit Sicherheitsabfrage gelöscht werden.

### 6. Export nach Excel

Exportierbar sind:

- Tag
- Woche
- aktueller Monat
- frei wählbarer Monat

Die Exportdatei wird als `.xls` erzeugt und kann direkt in Excel geöffnet werden.

## PWA und Offline-Nutzung

Die Anwendung kann in unterstützten Browsern installiert werden.

- Über den Button `App installieren` lässt sich die App als Anwendung hinzufügen
- Der Service Worker hält die statischen Dateien offline verfügbar
- Nach der Installation wirkt die App wie eine eigenständige Desktop- oder Mobil-App

## Speicherung

- Speicherung erfolgt lokal im Browser über `localStorage`
- Es gibt keine automatische Cloud-Synchronisation
- Daten bleiben an das jeweilige Gerät und Browserprofil gebunden

Für wichtige Daten empfiehlt sich ein regelmäßiger Excel-Export.

## Dateien

- [index.html](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/index.html): Oberfläche
- [styles.css](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/styles.css): Layout und Design
- [app.js](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/app.js): Logik, Speicherung und Export
- [manifest.webmanifest](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/manifest.webmanifest): PWA-Metadaten
- [service-worker.js](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/service-worker.js): Offline-Cache
- [start-server.ps1](C:/Users/millenseer/OneDrive%20-%20conet.de/Projekte/zeiterfassung/start-server.ps1): Lokaler Start unter Windows

## Hinweise

- Beim Löschen eines Projekts werden auch alle zugehörigen Zeitblöcke entfernt
- Der Excel-Export enthält Einzelzeilen und Projektsummen
- Die App benötigt keinen Build-Prozess und kann direkt als statische Webanwendung betrieben werden
