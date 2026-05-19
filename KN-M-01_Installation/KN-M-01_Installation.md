# KN-M-01: Installation und Verwaltung von MongoDB

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 19.05.2026

---

## Inhaltsverzeichnis

- [A) Installation](#a-installation)
- [B) Erste Schritte GUI](#b-erste-schritte-gui)
- [C) Erste Schritte Shell](#c-erste-schritte-shell)
- [D) Rechte und Rollen](#d-rechte-und-rollen)

---

## A) Installation

### Vorgehen

1. AWS Academy Learner Lab gestartet und in der AWS Console (Region: us-east-1) auf EC2 navigiert.
2. Neue EC2 Instance erstellt mit folgenden Einstellungen:
   - **Name:** m165-mongodb-asani
   - **AMI:** Ubuntu Server 24.04 LTS (noble)
   - **Instance Type:** t2.micro
   - **Key Pair:** m165-key (neu erstellt)
   - **Security Group:** m165-mongodb-sg mit Inbound Rules für Port 22 (SSH) und Port 27017 (MongoDB)
   - **Storage:** 20 GiB gp3
   - **User Data:** Cloud-Init Skript (siehe `cloudinit-mongodb.yaml`)
3. Cloud-Init hat MongoDB 8.0 automatisch installiert und konfiguriert.
4. MongoDB Compass installiert und Verbindung hergestellt mit folgendem Connection String:

```
mongodb://admin:M165_TBZ_2026!@32.192.213.153:27017/?authSource=admin&readPreference=primary&ssl=false
```

### Screenshot: Compass mit Datenbanken

![Compass mit bestehenden Datenbanken](./Bilder/A1_compass_databases.png)

In Compass sind die Standard-Datenbanken `admin`, `config` und `local` sichtbar.

### Screenshot: MongoDB Konfigurationsdatei

![mongod.conf nach sed Befehlen](./Bilder/A2_mongod_conf.png)

Die `/etc/mongod.conf` zeigt die beiden Änderungen durch die `sed` Befehle:

- `bindIp: 0.0.0.0` (vorher `127.0.0.1`)
- `security:` mit `authorization: enabled` (vorher kommentiert)

### Erklärung: `authSource=admin`

Der Parameter `authSource` definiert in welcher Datenbank die Anmeldedaten (Benutzer + Passwort) gespeichert sind. Da der `admin` Benutzer im Cloud-Init Skript in der `admin` Datenbank erstellt wurde (siehe `use admin;` im `mongodbuser.txt`), muss auch `authSource=admin` angegeben werden. MongoDB sucht ohne diesen Parameter den Benutzer in der aktuell verwendeten Datenbank, was zu einem Authentifizierungsfehler führen würde. Der Parameter ist also korrekt gesetzt, weil er auf genau die DB zeigt, in der der Benutzer existiert.

### Erklärung: Die zwei `sed` Befehle

**Befehl 1:**

```bash
sudo sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mongod.conf
```

Dieser Befehl ersetzt alle Vorkommen von `127.0.0.1` durch `0.0.0.0`. Konkret wird der Wert von `bindIp` geändert. Standardmässig lauscht MongoDB nur auf der Loopback-Adresse `127.0.0.1`, was bedeutet, dass nur Verbindungen vom Server selbst möglich sind. Durch die Änderung auf `0.0.0.0` lauscht MongoDB auf allen Netzwerk-Interfaces und ist somit von extern (z.B. von Compass auf dem eigenen PC) erreichbar.

**Befehl 2:**

```bash
sudo sed -i 's/#security:/security:\n  authorization: enabled/g' /etc/mongod.conf
```

Dieser Befehl entfernt das Kommentarzeichen `#` vor `security:` und fügt darunter die Zeile `authorization: enabled` ein. Damit wird die Authentifizierung in MongoDB aktiviert. Ohne diesen Schritt könnte sich jeder ohne Benutzername und Passwort verbinden. Da MongoDB durch den ersten `sed` Befehl von extern erreichbar ist, ist die Aktivierung der Authentifizierung zwingend notwendig.

---

## B) Erste Schritte GUI

### Vorgehen

1. In Compass eine neue Datenbank `Asani` mit der Collection `Ramadan` erstellt.
2. Ein Dokument mit verschiedenen Datentypen über das GUI eingefügt.
3. Das Feld `geburtsdatum` wurde nachträglich vom Typ `String` zu `Date` geändert.
4. Die Collection wurde als JSON-Datei exportiert (`B3_export.json`).

### Screenshot: Dokument vor dem Einfügen

![Insert Document Dialog](./Bilder/B1_dokument_vor_insert.png)

Das eingefügte Dokument enthält:

- `name` (String)
- `adresse` (String)
- `groesse` (Int32)
- `geburtsdatum` (zunächst String, später zu Date geändert)

### Screenshot: Compass nach Typ-Änderung

![Compass mit Datum als Date Typ](./Bilder/B2_compass_nach_update.png)

Das Feld `geburtsdatum` ist jetzt als `Date` gespeichert und wird im Format `2003-05-15T00:00:00.000+00:00` angezeigt.

### Export und Erklärung Datum

Inhalt der exportierten Datei `B3_export.json`:

```json
[
  {
    "_id": {
      "$oid": "6a0c5744c9507bd0775fb556"
    },
    "name": "Ramadan Asani",
    "adresse": "Musterstrasse 1, 8000 Zürich",
    "groesse": 178,
    "geburtsdatum": {
      "$date": "2003-05-15T00:00:00.000Z"
    }
  }
]
```

Um beim Einfügen direkt ein **Datum** statt eines Strings zu erhalten, hätte das `geburtsdatum` nicht als einfacher String `"2003-05-15"` eingefügt werden müssen, sondern mit dem MongoDB **Extended JSON Operator `$date`**:

```json
"geburtsdatum": { "$date": "2003-05-15T00:00:00.000Z" }
```

**Implikationen auf andere Datentypen:**

Das gleiche Prinzip gilt für andere spezielle MongoDB Datentypen, die im normalen JSON nicht existieren:

- `ObjectId` → `{ "$oid": "..." }`
- `Int32` / `Int64` → `{ "$numberInt": "178" }` / `{ "$numberLong": "..." }`
- `Decimal128` → `{ "$numberDecimal": "..." }`
- `Date` → `{ "$date": "..." }`

**Warum dieser komplizierte Weg notwendig ist:**

Standard-JSON kennt nur die Datentypen `string`, `number`, `boolean`, `null`, `array` und `object`. **Date gibt es in JSON nicht** – ein Wert wie `"2003-05-15"` kann nur als String interpretiert werden. MongoDB hat deshalb das **Extended JSON Format** mit speziellen Operatoren wie `$date`, `$oid` und `$numberInt` eingeführt, damit beim Importieren oder Einfügen die korrekten internen MongoDB-Datentypen verwendet werden können.

---

## C) Erste Schritte Shell

### Vorgehen

Die folgenden 7 Befehle wurden eingegeben:

1. `show dbs`
2. `show databases`
3. `use Asani`
4. `show collections`
5. `show tables`
6. `var test="hallo"`
7. `test`

### Screenshot: Compass MongoSH

![Compass Shell mit Befehlen](./Bilder/C1_compass_shell.png)

### Screenshot: MongoDB Shell auf dem Linux-Server

![Server Shell mit Befehlen](./Bilder/C2_server_shell.png)

Verbindung zum Server via SSH:

```bash
ssh -i m165-key.pem ubuntu@32.192.213.153
sudo mongosh --authenticationDatabase "admin" -u "admin" -p "M165_TBZ_2026!"
```

### Erklärung der Befehle 1-5

| #   | Befehl             | Funktion                                                                                  |
| --- | ------------------ | ----------------------------------------------------------------------------------------- |
| 1   | `show dbs`         | Listet alle Datenbanken des MongoDB-Servers mit ihrer Speichergrösse auf.                 |
| 2   | `show databases`   | Alias für `show dbs` – zeigt exakt das gleiche Resultat.                                  |
| 3   | `use Asani`        | Wechselt in die Datenbank `Asani`. Alle nachfolgenden Befehle beziehen sich auf diese DB. |
| 4   | `show collections` | Listet alle Collections in der aktuell ausgewählten Datenbank auf.                        |
| 5   | `show tables`      | Alias für `show collections` – zeigt die gleiche Liste.                                   |

### Unterschied zwischen Collections und Tables

In relationalen Datenbanken (SQL) heisst die Datenstruktur **Table** (Tabelle). In MongoDB (NoSQL) heisst sie **Collection**. Beide speichern Daten, unterscheiden sich aber grundlegend:

- **Tables (SQL)** haben ein festes Schema. Alle Zeilen (Rows) müssen die gleichen Spalten mit den gleichen Datentypen besitzen.
- **Collections (MongoDB)** sind schemalos. Jedes Dokument in einer Collection kann unterschiedliche Felder und Datentypen haben.

MongoDB akzeptiert `show tables` als Alias zu `show collections`, damit SQL-Benutzer sich schneller zurechtfinden. Technisch existiert in MongoDB aber keine "Table" – nur Collections.

---

## D) Rechte und Rollen

### Vorgehen

1. Eine Verbindung mit falschem `authSource` getestet → Authentifizierungsfehler.
2. Zwei neue Benutzer mit unterschiedlichen Rechten erstellt:
   - **`leser`** – nur Leserechte, Auth-DB = `Asani`
   - **`schreiber`** – Lese- und Schreibrechte, Auth-DB = `admin`
3. Beide Benutzer getestet (Login + Lesen + Schreiben).

### D.1 – Falscher authSource

Verbindungsversuch mit `authSource=config` statt `admin`:

```
mongodb://admin:M165_TBZ_2026!@32.192.213.153:27017/?authSource=config&readPreference=primary&ssl=false
```

![Authentication failed](./Bilder/D1b_auth_failed_error.png)

Wie erwartet schlägt die Authentifizierung fehl, weil der `admin` Benutzer nicht in der `config` Datenbank existiert, sondern in `admin`.

### D.2 – Skript zur Benutzererstellung

```javascript
// Benutzer 1: nur Lesen, Authentifizierungs-DB = Asani
use Asani
db.createUser({
  user: "leser",
  pwd: "Leser2026!",
  roles: [{ role: "read", db: "Asani" }]
})

// Benutzer 2: Lesen und Schreiben, Authentifizierungs-DB = admin
use admin
db.createUser({
  user: "schreiber",
  pwd: "Schreiber2026!",
  roles: [{ role: "readWrite", db: "Asani" }]
})
```

Verwendete built-in Rollen ohne "Any" im Namen:

- `read` → nur Lesen
- `readWrite` → Lesen und Schreiben

![Benutzer erstellt in der Shell](./Bilder/D2_users_erstellt.png)

### D.3 – Benutzer 1 (`leser`)

**Verbindungstext / Login:**

![Login als leser](./Bilder/D3_user1_login.png)

```
mongodb://leser:Leser2026!@32.192.213.153:27017/?authSource=Asani&readPreference=primary&ssl=false
```

**Lesen funktioniert:**

![Lesen mit User leser](./Bilder/D4_user1_lesen_ok.png)

Befehl `db.Ramadan.find()` liefert das Dokument zurück.

**Schreiben schlägt fehl (wie gewünscht):**

![Schreiben mit User leser fehlgeschlagen](./Bilder/D5_user1_schreiben_fehler.png)

Fehler:

```
MongoServerError[Unauthorized]: not authorized on Asani to execute command { insert: "Ramadan", ... }
```

### D.4 – Benutzer 2 (`schreiber`)

**Verbindungstext / Login:**

![Login als schreiber](./Bilder/D6_user2_login.png)

Login via Shell:

```bash
mongosh --authenticationDatabase "admin" -u "schreiber" -p "Schreiber2026!"
```

**Lesen und Schreiben funktionieren beide:**

![Lesen und Schreiben mit User schreiber](./Bilder/D7_user2_lesen_und_schreiben.png)

- `db.Ramadan.find()` → liefert das Dokument zurück
- `db.Ramadan.insertOne({test: "schreibversuch von schreiber"})` → `acknowledged: true`

---

## Abgabe-Dateien

- `cloudinit-mongodb.yaml` – Cloud-Init Skript mit angepasstem Passwort
- `B3_export.json` – Exportiertes Dokument aus Compass
- `Bilder/` – Alle Screenshots
- `KN-M-01_Installation.md` – Diese Dokumentation
