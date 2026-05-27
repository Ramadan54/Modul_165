# KN-M-05: Administration von MongoDB

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 27.05.2026
**Thema:** Tuning-Werkstatt (Fortsetzung von KN-M-04)

---

## Inhaltsverzeichnis

- [Ausgangslage](#ausgangslage)
- [A) Rechte und Rollen](#a-rechte-und-rollen)
- [B) Backup und Restore](#b-backup-und-restore)
  - [Variante 1 — AWS EBS-Snapshot](#variante-1--aws-ebs-snapshot)
  - [Variante 2 — `mongodump` / `mongorestore`](#variante-2--mongodump--mongorestore)
- [C) Skalierung](#c-skalierung)
- [Abgabe-Dateien](#abgabe-dateien)

---

## Ausgangslage

Dieser Kompetenznachweis baut auf KN-M-01 bis KN-M-04 auf. Verwendet wird der MongoDB-Server auf der EC2-Instance aus KN-M-01 mit der Datenbank `tuningwerkstatt` und den vier Collections aus KN-M-02 (`kunde`, `tuningauftrag`, `tuningteil`, `mechaniker`).

Da die EC2-Instance keine Elastic IP zugewiesen hat, ändert sich die Public IPv4-Adresse bei jedem Stop/Start. In diesem KN wurden während der Bearbeitung zwei IPs verwendet:

- `32.197.237.28` — vor dem EC2-Stop für den Volume-Tausch in Teil B Variante 1
- `18.232.159.149` — nach dem EC2-Restart mit dem wiederhergestellten Volume

---

## A) Rechte und Rollen

In diesem Teil werden zwei neue Benutzer für die Datenbank `tuningwerkstatt` erstellt, und es wird gezeigt, dass die Angabe von `authSource` im Connection-String relevant ist.

### A.1 — Falscher `authSource` zeigen

Der `admin`-Benutzer wurde in KN-M-01 in der Datenbank `admin` erstellt. Wenn man im Connection-String aber eine andere existierende Datenbank als `authSource` angibt (z.B. `config`), sucht MongoDB den Benutzer in dieser Datenbank — und findet ihn nicht, weil er dort nicht existiert.

Verwendeter Connection-String mit falschem `authSource`:

```
mongodb://admin:M165_TBZ_2026!@32.197.237.28:27017/?authSource=config&readPreference=primary&ssl=false
```

#### Screenshot

![Authentication failed bei falschem authSource](./Bilder/A1_authSource_fehler.png)

Wie erwartet schlägt die Authentifizierung mit `Authentication failed` fehl, weil der `admin`-Benutzer in der `config`-Datenbank nicht existiert. Der Parameter `authSource` muss **immer** auf die Datenbank zeigen, in welcher der jeweilige Benutzer mit `db.createUser()` angelegt wurde.

### A.2 — Skript zur Benutzererstellung

Es wurden zwei Benutzer mit unterschiedlichen Rollen und unterschiedlichen Authentifizierungs-Datenbanken erstellt:

| Benutzer    | Rolle       | Auth-DB           | Rechte                                        |
| ----------- | ----------- | ----------------- | --------------------------------------------- |
| `leser`     | `read`      | `tuningwerkstatt` | Nur Lesen auf `tuningwerkstatt`               |
| `schreiber` | `readWrite` | `admin`           | Lesen **und** Schreiben auf `tuningwerkstatt` |

Beide Rollen sind **built-in MongoDB-Rollen ohne "Any" im Namen**, wie die Aufgabenstellung verlangt (also nicht `readAnyDatabase` oder `readWriteAnyDatabase`).

#### Skript `KN-M-05_A_createUsers.js`

```javascript
// Benutzer 1: nur Lesen
// Authentifizierungs-DB = tuningwerkstatt
use tuningwerkstatt
db.createUser({
  user: "leser",
  pwd:  "Leser2026!",
  roles: [
    { role: "read", db: "tuningwerkstatt" }
  ]
});

// Benutzer 2: Lesen und Schreiben
// Authentifizierungs-DB = admin
use admin
db.createUser({
  user: "schreiber",
  pwd:  "Schreiber2026!",
  roles: [
    { role: "readWrite", db: "tuningwerkstatt" }
  ]
});
```

Hinweis zur Ausführung in Compass: die Compass-MongoSH-Shell akzeptiert `use <db>` nicht innerhalb eines eingefügten JS-Blocks (sie erwartet dort syntaktisch reines JavaScript). Daher wurde `use` jeweils separat **vor** dem Block ausgeführt, und der Block selbst ohne `use` reingepastet.

#### Befehle erklärt

| Befehl                                                 | Funktion                                                                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db.createUser({ user, pwd, roles })`                  | Legt einen neuen Benutzer in der **aktuellen** Datenbank an (= Auth-DB). Die `roles` definieren **wo** und **wie** der Benutzer Daten verwenden darf. |
| `roles: [{ role: "read", db: "tuningwerkstatt" }]`     | Built-in Rolle `read` auf die DB `tuningwerkstatt`. Erlaubt `find`, `aggregate`, `count`, etc., aber **keine** Schreib-Operationen.                   |
| `roles: [{ role: "readWrite", db: "tuningwerkstatt"}]` | Built-in Rolle `readWrite` auf die DB `tuningwerkstatt`. Erlaubt zusätzlich `insert`, `update`, `delete` und `drop` auf Collections.                  |
| `db.dropUser("name")`                                  | Entfernt einen bestehenden Benutzer. Wurde vor dem `createUser` aufgerufen, um eine saubere Wiederholbarkeit des Skripts zu gewährleisten.            |

#### Screenshot

![Benutzer erfolgreich erstellt](./Bilder/A2_users_erstellt.png)

Der Screenshot zeigt die Ausführung beider `createUser`-Befehle in der MongoSH-Shell. Beide Aufrufe liefern `{ ok: 1 }` zurück — Bestätigung der erfolgreichen Erstellung.

### A.3 — Benutzer 1 (`leser`)

#### Verbindungstext

```
mongodb://leser:Leser2026!@32.197.237.28:27017/?authSource=tuningwerkstatt&readPreference=primary&ssl=false
```

Beachte: `authSource=tuningwerkstatt`, weil der `leser` in dieser Datenbank erstellt wurde.

#### Login

![Login als leser in Compass](./Bilder/A3_leser_login.png)

In Compass wurde die Verbindung zur besseren Übersichtlichkeit auf `Leser` umbenannt. Auffällig: der `leser` sieht in der Sidebar **nur** die Datenbank `tuningwerkstatt`. Die anderen Datenbanken (`admin`, `config`, `local`, `Asani`) sind für ihn unsichtbar, weil er auf diese keine Rechte hat. Das ist genau das gewünschte Verhalten.

#### Lesen funktioniert

![Leser kann Kunden anzeigen](./Bilder/A4_leser_lesen_ok.png)

In der Collection `kunde` werden alle drei Kunden (Hans Mueller, Lara Bucher, Marco Keller) ohne Fehler angezeigt — `read` reicht für `find()` aus.

#### Schreiben schlägt fehl

![Leser bekommt Unauthorized beim Insert](./Bilder/A5_leser_schreiben_fehler.png)

Beim Versuch einen neuen Datensatz einzufügen kommt die erwartete Fehlermeldung:

```
MongoServerError[Unauthorized]: not authorized on tuningwerkstatt to execute command { insert: "kunde", ... }
```

Damit ist nachgewiesen: die Rolle `read` lässt Schreibzugriffe sauber an der Datenbank scheitern.

### A.4 — Benutzer 2 (`schreiber`)

#### Verbindungstext

```
mongodb://schreiber:Schreiber2026!@32.197.237.28:27017/?authSource=admin&readPreference=primary&ssl=false
```

Hier ist `authSource=admin`, weil der `schreiber` in der DB `admin` angelegt wurde — auch wenn seine Rechte auf `tuningwerkstatt` zielen. Der Ort der Authentifizierung und der Ort der Rechte sind in MongoDB voneinander entkoppelt.

#### Login

![Login als schreiber in Compass](./Bilder/A6_schreiber_login.png)

Die Verbindung wurde in Compass auf `Schreiber` umbenannt.

#### Lesen funktioniert

![Schreiber kann Kunden anzeigen](./Bilder/A7_schreiber_lesen_ok.png)

Wie zu erwarten kann der `schreiber` ebenfalls lesen — `readWrite` umfasst `read`.

#### Schreiben funktioniert

![Schreiber kann erfolgreich insertOne](./Bilder/A8_schreiber_schreiben_ok.png)

In der `mongosh: Schreiber` Shell wurde ein Test-Dokument eingefügt:

```javascript
db.kunde.insertOne({
  vorname: "Test",
  nachname: "SchreiberOK",
  testRecord: true,
});
```

Antwort: `{ acknowledged: true, insertedId: ObjectId('...') }`. Eine anschliessende Abfrage `db.kunde.find({ testRecord: true })` liefert das eingefügte Dokument zurück.

Damit ist auch für den zweiten Benutzer nachgewiesen: `readWrite` erlaubt sowohl Lese- als auch Schreibzugriffe. Der Test-Eintrag wurde nach dem Screenshot wieder gelöscht, um die Daten konsistent für Teil B zu halten.

---

## B) Backup und Restore

In diesem Teil wurden **beide** geforderten Backup-/Restore-Varianten umgesetzt:

- **Variante 1:** EBS-Volume-Snapshot über die AWS Console — sichert die gesamte virtuelle Festplatte des Servers
- **Variante 2:** `mongodump` und `mongorestore` — sichert die MongoDB-Daten als BSON-Export auf Anwendungsebene

Beide Varianten haben eine andere Idee dahinter, was später in der Empfehlung in Teil C noch eine Rolle spielt.

### Variante 1 — AWS EBS-Snapshot

In dieser Variante wurde das EBS-Root-Volume der EC2-Instance über einen Snapshot gesichert. Der Snapshot wurde anschliessend als neues Volume erstellt und gegen das ursprüngliche Volume ausgetauscht. Damit ist das Backup auf **Infrastruktur-Ebene** umgesetzt — alle Daten, Konfigurationen und installierten Tools werden mitgesichert.

#### Ablauf

| Schritt | Aktion                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------- |
| 1       | EBS-Snapshot vom aktuell verwendeten Root-Volume erstellt                                         |
| 2       | Collection `mechaniker` in MongoDB gelöscht (simulierter Datenverlust)                            |
| 3       | Neues Volume aus dem Snapshot erstellt in der **gleichen Availability Zone** (`us-east-1d`)       |
| 4       | EC2-Instance gestoppt, altes Volume detached, neues Volume an `/dev/sda1` attached, EC2 gestartet |
| 5       | Verifikation: `mechaniker` ist wieder vorhanden                                                   |

#### Schritt 1 — Snapshot erstellen

In der AWS Console unter **EC2 → Volumes → Actions → Snapshot erstellen** wurde mit folgender Beschreibung ein Snapshot angelegt:

- **Description:** `m165-mongodb-backup-snapshot`
- **Tag:** `Name = m165-mongodb-backup`
- **Quell-Volume:** `vol-056daed03959fcbcd` (20 GiB, gp3, `us-east-1d`)

![Snapshot erfolgreich erstellt - Status Abgeschlossen 100%](./Bilder/B_var1_01_snapshot_erstellt.png)

Snapshot-ID: `snap-008de031e92a55f73`, Status: `Abgeschlossen`, Fortschritt: `100%`.

#### Schritt 2 — Collection `mechaniker` löschen

Nach abgeschlossenem Snapshot wurde die Collection `mechaniker` per Shell gelöscht:

```bash
mongosh --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" tuningwerkstatt \
  --eval "db.mechaniker.drop()"
```

Rückgabewert: `true`.

![Mechaniker-Collection gelöscht, nur noch 3 Collections](./Bilder/B_var1_02_mechaniker_geloescht.png)

Nach dem Drop sind nur noch drei Collections in der DB: `tuningauftrag` (4 docs), `tuningteil` (5 docs) und `kunde` (3 docs). `mechaniker` fehlt.

#### Schritt 3 — Neues Volume aus Snapshot

In der AWS Console unter **Snapshots → Actions → Volume aus Snapshot erstellen**:

- **Volume-Typ:** gp3, 20 GiB, 3000 IOPS, 125 MiB/s Durchsatz
- **Availability Zone:** ⚠️ **`us-east-1d`** — **muss zwingend** mit der AZ der EC2-Instance übereinstimmen, sonst kann das Volume später nicht attached werden
- **Tag:** `Name = m165-mongodb-restored`

![Neues Volume erstellt - beide Volumes sichtbar](./Bilder/B_var1_03_neues_volume.png)

Es existieren jetzt **zwei** Volumes in der gleichen AZ:

- `vol-056daed03959fcbcd` — das alte, weiterhin an die EC2 attached (`Wird verwendet`)
- `vol-06670a2f99324e734` — das neue aus dem Snapshot (`Verfügbar`)

#### Schritt 4 — Volume-Tausch

1. **EC2-Instance gestoppt** (Instance-Status → Instance stoppen).
2. **Altes Volume detached** (Volumes → altes Volume markieren → Aktionen → Volume trennen).
3. **Neues Volume attached** an Device `/dev/sda1` (das ist die Root-Device-Position für Ubuntu-AMIs — wichtig, damit die Instance vom neuen Volume booten kann).
4. **EC2-Instance gestartet**.

![Neues Volume erfolgreich an EC2 angefügt](./Bilder/B_var1_04_volume_tausch.png)

Bestätigung im grünen Erfolgs-Banner: _"Volume erfolgreich angefügt vol-06670a2f99324e734 an Instance i-006c3b4e0bb4e9fab."_ Das neue Volume hat Status `Wird verwendet`, das alte ist auf `Verfügbar` (bleibt als Sicherheitsnetz erhalten).

Nach dem Start der EC2-Instance erhielt diese eine **neue Public IP** (`18.232.159.149`), weil keine Elastic IP zugewiesen ist.

#### Schritt 5 — Verifikation

Per SSH auf den Server (mit der neuen IP) und Abfrage des DB-Status:

```bash
ssh -i m165-key.pem ubuntu@18.232.159.149

mongosh --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" tuningwerkstatt \
  --eval "db.getCollectionNames().forEach(c => print(c + ': ' + db.getCollection(c).countDocuments() + ' docs'))"
```

![Mechaniker ist wieder da nach Volume-Restore](./Bilder/B_var1_05_restored.png)

Resultat:

```
tuningauftrag: 4 docs
tuningteil:    5 docs
mechaniker:    3 docs   <-- wieder da!
kunde:         3 docs
```

Alle vier Collections sind wieder vorhanden, inklusive `mechaniker` mit allen drei Dokumenten. Das Backup-Restore über den EBS-Snapshot hat sauber funktioniert.

#### Verwendete AWS-Befehle (Console-Aktionen)

| Aktion              | Wo in der AWS Console                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| Snapshot erstellen  | EC2 → Volumes → Volume markieren → Aktionen → **Snapshot erstellen**                   |
| Volume aus Snapshot | EC2 → Snapshots → Snapshot markieren → Aktionen → **Volume aus Snapshot erstellen**    |
| EC2 stoppen         | EC2 → Instances → Instance markieren → Instance-Status → **Instance stoppen**          |
| Volume detachen     | EC2 → Volumes → Volume markieren → Aktionen → **Volume trennen**                       |
| Volume attachen     | EC2 → Volumes → Volume markieren → Aktionen → **Volume anfügen** (Device: `/dev/sda1`) |
| EC2 starten         | EC2 → Instances → Instance markieren → Instance-Status → **Instance starten**          |

### Variante 2 — `mongodump` / `mongorestore`

In dieser Variante wird das Backup über die MongoDB Database Tools auf Anwendungsebene gemacht. `mongodump` exportiert die Daten als BSON-Dateien (eine pro Collection plus zugehörige Index-Metadaten), `mongorestore` liest sie wieder in eine MongoDB-Instanz ein.

Die Tools wurden direkt auf dem Server installiert. Die Installation ging schnell, weil eine neuere Version (100.17.0) bereits über die System-Repositories verfügbar war. Eine eventuelle Downgrade-Aktion auf das in der MongoDB-Doku verlinkte Paket `.deb` wurde nicht durchgeführt — die installierte Version 100.17.0 ist neuer und voll kompatibel mit der MongoDB 8.0 auf dem Server.

Wichtige Voraussetzung am Anfang der Arbeit: das Home-Verzeichnis `/home/ubuntu` gehörte fälschlicherweise dem Benutzer `root` (Folge des Cloud-Init-Skripts aus KN-M-01). Das wurde mit `sudo chown ubuntu:ubuntu /home/ubuntu` korrigiert. Als Backup-Verzeichnis wurde anschliessend `/tmp/mongodb-backups/` verwendet, weil dieser Pfad systemweit schreibbar ist und für temporäre Operationen sauberer ist.

#### Schritt 1 — Status vorher + Backup mit `mongodump`

Vor dem Backup wurde der DB-Stand zur Kontrolle ausgegeben, anschliessend das Backup erstellt:

```bash
# Status vorher
mongosh --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" tuningwerkstatt \
  --eval "db.getCollectionNames().forEach(c => print(c + ': ' + db.getCollection(c).countDocuments() + ' docs'))"

# Backup erstellen
mongodump --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" \
  --db tuningwerkstatt --out /tmp/mongodb-backups/backup-$(date +%Y%m%d)
```

![mongodump erstellt - alle Collections gesichert](./Bilder/B_var2_01_dump.png)

`mongodump` schreibt für jede Collection zwei Dateien — eine `.bson` mit den Rohdaten und eine `.metadata.json` mit Index-Informationen. Zusätzlich wird eine `prelude.json` mit Metadaten zum Backup-Lauf abgelegt. Im Verzeichnis liegen nach dem Dump:

```
backup-20260527/tuningwerkstatt/
├── kunde.bson         (818 B)
├── kunde.metadata.json
├── mechaniker.bson    (377 B)
├── mechaniker.metadata.json
├── tuningauftrag.bson (862 B)
├── tuningauftrag.metadata.json
├── tuningteil.bson    (548 B)
├── tuningteil.metadata.json
└── prelude.json
```

#### Schritt 2 — Collection `kunde` löschen

```bash
mongosh --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" tuningwerkstatt \
  --eval "db.kunde.drop()"
```

Anschliessend Verifikation des Status:

![Kunde-Collection gelöscht](./Bilder/B_var2_02_geloescht.png)

Status nach dem Drop: nur noch drei Collections (`tuningauftrag`, `tuningteil`, `mechaniker`). `kunde` ist weg.

#### Schritt 3 — Restore mit `mongorestore`

```bash
mongorestore --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!" \
  --db tuningwerkstatt /tmp/mongodb-backups/backup-20260527/tuningwerkstatt/
```

![mongorestore wiederhergestellt - kunde ist zurück](./Bilder/B_var2_03_restored.png)

Wichtige Beobachtung im Output: `mongorestore` versucht **alle** vier Collections wiederherzustellen, weil sie alle im Backup-Ordner liegen. Die drei Collections, die noch im System sind, liefern `E11000 duplicate key error` zurück und werden übersprungen — das ist **kein Bug, sondern korrektes Verhalten**: `mongorestore` überschreibt standardmässig **nichts**, was schon existiert. Nur die fehlende Collection `kunde` wird mit ihren drei Dokumenten neu eingefügt.

Endstatus:

```
tuningauftrag: 4 docs
tuningteil:    5 docs
mechaniker:    3 docs
kunde:         3 docs   <-- wieder da!
```

#### Befehle erklärt

| Befehl                               | Funktion                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `mongodump --db <name> --out <pfad>` | Exportiert die genannte Datenbank als BSON-Dateien in den angegebenen Pfad. Pro Collection eine `.bson` und eine `.metadata.json`.             |
| `--authenticationDatabase admin`     | Gibt an, in welcher DB der angegebene Benutzer authentifiziert wird — analog zum `authSource` im Connection-String.                            |
| `mongorestore --db <name> <pfad>`    | Importiert die BSON-Dateien aus dem angegebenen Pfad in die Ziel-Datenbank. Bestehende Dokumente werden ohne `--drop` **nicht** überschrieben. |
| `$(date +%Y%m%d)`                    | Bash-Substitution: fügt das heutige Datum im Format `YYYYMMDD` in den Pfad ein (hier `20260527`).                                              |

#### Vergleich der beiden Varianten

| Aspekt                       | Variante 1 — EBS-Snapshot                              | Variante 2 — `mongodump`                                |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| **Ebene**                    | Infrastruktur (Festplatte)                             | Anwendung (MongoDB-Datenformat)                         |
| **Sichert mit**              | Alles: DB, Konfig, Tools, OS-Files                     | Nur MongoDB-Daten                                       |
| **Wiederherstellung dauert** | Länger (EC2 stoppen, Volume tauschen, EC2 starten)     | Sekunden (einfach `mongorestore` aufrufen)              |
| **Plattform-Abhängigkeit**   | An AWS/EBS gebunden                                    | Plattformunabhängig, läuft auch lokal oder gegen Atlas  |
| **Granularität**             | Nur ganzer Snapshot                                    | Pro DB oder Collection getrennt                         |
| **Live-Backup möglich**      | Ja, aber inkonsistent möglich (Pause writes empfohlen) | Ja, sauber konsistent über `--oplog` (bei Replica Sets) |

---

## C) Skalierung

Wenn die Last auf einer Datenbank wächst (mehr Benutzer, mehr Daten, mehr Anfragen pro Sekunde), reicht irgendwann der einzelne Server nicht mehr aus. MongoDB bietet zwei grundlegend verschiedene Strategien dafür, beide horizontal: **Replication** und **Sharding** (Partitionierung).

### Replication — eigenes Verständnis

Replication bedeutet, dass die **komplette Datenbank mehrfach gespiegelt** wird. Jeder beteiligte Server (Node) hält eine vollständige Kopie aller Daten. Ein Replica Set in MongoDB besteht typischerweise aus drei Nodes: einer **Primary**-Node, die alle Schreiboperationen entgegennimmt, und zwei **Secondary**-Nodes, die diese Schreiboperationen aus dem `oplog` (Operation Log) der Primary übernehmen und auf ihren eigenen Daten nachvollziehen.

Das löst zwei Probleme gleichzeitig:

1. **Ausfallsicherheit (High Availability):** wenn die Primary ausfällt, wählen die übrigen Nodes via Election eine der Secondaries zur neuen Primary, und die Applikation läuft ohne manuellen Eingriff weiter.
2. **Lese-Skalierung:** weil jede Secondary die kompletten Daten hat, können Lese-Anfragen auf alle Nodes verteilt werden (`read preference: nearest` oder ähnlich). Bei lese-lastigen Applikationen ist das ein riesiger Vorteil.

**Was Replication nicht löst:** den Speicherbedarf. Jede Node muss die **gesamte** Datenbank speichern können. Auch die Schreib-Skalierung ist begrenzt, weil schlussendlich nur die Primary Schreiboperationen annimmt.

```mermaid
flowchart TB
    Client(["Client / Applikation"])
    Client -->|write| Primary
    Client -.->|read optional| Secondary1
    Client -.->|read optional| Secondary2

    subgraph ReplicaSet["Replica Set"]
      Primary["Primary
(alle Writes)"]
      Secondary1["Secondary 1
(replizierte Kopie)"]
      Secondary2["Secondary 2
(replizierte Kopie)"]
      Primary -->|oplog| Secondary1
      Primary -->|oplog| Secondary2
    end
```

### Sharding — eigenes Verständnis

Sharding bedeutet, dass die Daten in **Stücke (Shards) aufgeteilt** werden, und jedes Stück auf einer anderen Node liegt. Das Aufteilen geschieht anhand eines **Shard Keys** — z.B. ein Feld wie `kundenId`, `region`, oder ein Bereich von `kennzeichen`. Eine zentrale Komponente (`mongos`, der Router) weiss, welcher Shard für welche Daten zuständig ist und leitet Anfragen entsprechend weiter.

Wichtig: jeder Shard ist in der Praxis selbst **kein einzelner Server**, sondern wieder ein Replica Set — Sharding und Replication werden meistens kombiniert eingesetzt, damit man beide Vorteile gleichzeitig hat (Skalierung **und** Ausfallsicherheit).

**Was Sharding löst:**

1. **Speicher-Skalierung:** das Total der Daten kann grösser sein als jeder einzelne Server, weil sie aufgeteilt sind.
2. **Schreib-Skalierung:** Schreiboperationen werden parallel auf verschiedene Shards verteilt — solange der Shard Key gut gewählt ist und die Last nicht auf einen einzelnen Shard fällt.
3. **Geografische Verteilung:** mit Zone-Sharding kann man Daten regional speichern, z.B. CH-Kunden auf einem Schweizer Shard, DE-Kunden auf einem deutschen.

**Was Sharding kompliziert macht:** die Wahl des Shard Keys ist nicht reversibel und kann massiv das Verhalten beeinflussen. Ein schlecht gewählter Key (z.B. zeitlich monoton steigende `_id`) führt zu **Hotspots** — alle neuen Daten landen auf einem Shard. Ausserdem brauchen Abfragen, die nicht den Shard Key enthalten, einen Scatter-Gather über alle Shards und sind dadurch langsamer.

```mermaid
flowchart TB
    Client(["Client / Applikation"])
    Client --> Router["mongos
(Query Router)"]
    Router --> Shard1
    Router --> Shard2
    Router --> Shard3

    subgraph Shards["Sharded Cluster"]
      Shard1["Shard 1
Kunden A–H"]
      Shard2["Shard 2
Kunden I–P"]
      Shard3["Shard 3
Kunden Q–Z"]
    end
```

### Vergleich auf einen Blick

| Aspekt                  | Replication                        | Sharding                                             |
| ----------------------- | ---------------------------------- | ---------------------------------------------------- |
| **Was wird verteilt?**  | Die ganze DB wird mehrfach kopiert | Die DB wird in disjunkte Teile zerlegt               |
| **Speicher-Skalierung** | Nein — jeder Node speichert alles  | Ja — Total kann grösser sein als ein Node            |
| **Lese-Skalierung**     | Ja                                 | Ja                                                   |
| **Schreib-Skalierung**  | Nein — nur Primary nimmt Writes    | Ja — Writes verteilt über Shards                     |
| **Ausfallsicherheit**   | Ja (automatischer Failover)        | Nur in Kombination mit Replication (Standard-Setup)  |
| **Komplexität**         | Mittel                             | Hoch (Shard Key, mongos, Config Server, Balancer)    |
| **Typischer Einsatz**   | Standard-Setup für Produktion      | Bei sehr grossen Datenmengen / hohem Schreib-Volumen |

### Quellen

- MongoDB Inc.: _Database Scaling_, abgerufen am 27.05.2026 unter https://www.mongodb.com/resources/basics/scaling
- MongoDB Inc.: _Replication — Database Manual_, https://www.mongodb.com/docs/manual/replication/
- MongoDB Inc.: _Sharding — Database Manual_, https://www.mongodb.com/docs/manual/sharding/

### Empfehlung an die Firma

#### Situation

Im Lehrbetrieb (Noser Young) wird eine fiktive interne Web-Applikation für einen Tuning-Werkstatt-Kunden betrieben (Datenmodell wie im KN-M-02 modelliert: Kunden mit eingebetteten Autos, Tuningaufträge, Tuningteile, Mechaniker). Die Applikation verwendet MongoDB als persistenten Datenspeicher. Aktueller Zustand:

- **ca. 50 aktive Mitarbeitende** der Werkstatt greifen täglich auf die App zu
- **ca. 2'000 Kunden**, **ca. 8'000 Aufträge** in der Datenbank, geschätztes Wachstum: +30 % pro Jahr
- Lastprofil: ca. **80 % Lese-Anfragen** (Auftragslisten, Auto-Historien, Mechaniker-Auslastung), **20 % Schreib-Anfragen** (neue Aufträge, Status-Updates)
- Aktuelles Setup: **eine einzelne MongoDB-Instanz** auf einer mittelgrossen EC2-Instance (vergleichbar mit der M-165-Test-Instanz, aber grösser dimensioniert)
- Bisher noch **kein automatisches Backup-Schema**, manuelle Snapshots werden unregelmässig gemacht

#### Empfehlung

**Wechsel von der Single-Instance auf ein Replica Set mit drei Nodes**, **kein** Sharding. Begründung:

1. **Datenvolumen ist klein.** Die Datenbank ist sehr klein im MongoDB-Massstab — der Hauptserver hat damit auch in fünf Jahren noch keinen Speicherengpass. Sharding wäre Overkill und würde mit Shard-Key-Auswahl, `mongos`, Config Servern und Balancing eine erhebliche Komplexität einführen, ohne dass der Bedarf da ist.
2. **Lesedominierter Workload.** 80 % Lesen passt ideal zu Replication: die Lese-Last lässt sich über `read preference: secondaryPreferred` auf die Secondary-Nodes verteilen, ohne dass dort die Schreib-Logik komplizierter werden muss.
3. **Ausfallsicherheit ist wichtig.** Die Werkstatt arbeitet mit der App täglich. Wenn die einzige MongoDB-Instanz ausfällt (Hardware, Netzwerk, Maintenance), steht der Betrieb. Mit einem Replica Set übernimmt automatisch eine Secondary innerhalb weniger Sekunden — keine manuelle Intervention nötig.
4. **Schreib-Skalierung wird absehbar nicht zum Engpass.** Bei 20 % Schreib-Anteil und der aktuellen Grösse läuft die Primary entspannt. Falls in Jahren doch ein Engpass entsteht, kann das Replica Set später jederzeit zu einem Sharded Cluster erweitert werden (jedes Shard ist sowieso ein Replica Set).
5. **Backup-Strategie kann gleichzeitig verbessert werden.** Mit einem Replica Set können Backups gegen eine Secondary laufen (z.B. `mongodump --readPreference=secondary`), ohne die Primary zu belasten. Zusätzlich empfohlen: ein **wöchentliches EBS-Snapshot via AWS Data Lifecycle Manager** für die Infrastruktur-Ebene, plus tägliches **`mongodump` in ein S3-Bucket** für die Anwendungs-Ebene. Beides automatisiert, beides mit Retention-Policy.

#### Konkretes Setup

| Komponente             | Empfehlung                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| **Anzahl Nodes**       | 3 (Primary + 2 Secondary), alle als Datenträger-Member                                                    |
| **Verteilung**         | Idealerweise über 3 Availability Zones in `eu-central-1` (Frankfurt), damit AZ-Ausfälle abgefangen werden |
| **Instance-Typ**       | `t3.large` oder `m6i.large` als Startgrösse, vertikal nach Bedarf skalierbar                              |
| **Backup-Ebene 1**     | AWS DLM: wöchentliche EBS-Snapshots, Retention 4 Wochen                                                   |
| **Backup-Ebene 2**     | Cronjob: tägliches `mongodump` gegen Secondary, Upload nach S3, Retention 30 Tage                         |
| **Monitoring**         | MongoDB Cloud Manager oder Atlas, alternativ Prometheus + Grafana auf der Infrastruktur                   |
| **Wann re-evaluieren** | Sobald die DB > 100 GB wird oder Schreiblast > 50 % ansteigt — dann Sharding prüfen                       |

---

## Abgabe-Dateien

| Datei                                       | Inhalt                                                                |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `KN-M-05_A_createUsers.js`                  | Skript zur Erstellung der Benutzer `leser` und `schreiber`            |
| `Bilder/A1_authSource_fehler.png`           | Authentication failed bei falschem `authSource=config`                |
| `Bilder/A2_users_erstellt.png`              | Beide Benutzer erfolgreich erstellt (zweimal `{ ok: 1 }`)             |
| `Bilder/A3_leser_login.png`                 | Login als `leser` in Compass (`Leser`-Verbindung)                     |
| `Bilder/A4_leser_lesen_ok.png`              | Leser kann Kunden lesen ohne Fehler                                   |
| `Bilder/A5_leser_schreiben_fehler.png`      | Leser bekommt `Unauthorized`-Fehler beim Insert                       |
| `Bilder/A6_schreiber_login.png`             | Login als `schreiber` in Compass (`Schreiber`-Verbindung)             |
| `Bilder/A7_schreiber_lesen_ok.png`          | Schreiber kann Kunden lesen ohne Fehler                               |
| `Bilder/A8_schreiber_schreiben_ok.png`      | Schreiber kann erfolgreich `insertOne` ausführen                      |
| `Bilder/B_var1_01_snapshot_erstellt.png`    | EBS-Snapshot abgeschlossen, 100 %                                     |
| `Bilder/B_var1_02_mechaniker_geloescht.png` | Collection `mechaniker` gedroppt, nur noch 3 Collections              |
| `Bilder/B_var1_03_neues_volume.png`         | Neues Volume aus Snapshot erstellt                                    |
| `Bilder/B_var1_04_volume_tausch.png`        | Neues Volume erfolgreich an EC2 angefügt                              |
| `Bilder/B_var1_05_restored.png`             | Alle 4 Collections inkl. `mechaniker` nach Volume-Restore wieder da   |
| `Bilder/B_var2_01_dump.png`                 | Status vorher + `mongodump`-Output + `ls`-Verifikation der BSON-Files |
| `Bilder/B_var2_02_geloescht.png`            | Collection `kunde` gedroppt, nur noch 3 Collections                   |
| `Bilder/B_var2_03_restored.png`             | `mongorestore` ausgeführt, alle 4 Collections inkl. `kunde` wieder da |
| `KN-M-05_Administration_MongoDB.md`         | Diese Dokumentation                                                   |
