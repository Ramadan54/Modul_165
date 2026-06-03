# KN-M-07: Programmierung mit MongoDB

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 03.06.2026
**Thema:** Tuning-Werkstatt (Fortsetzung von KN-M-06)

---

## Inhaltsverzeichnis

- [Ausgangslage](#ausgangslage)
- [A) Projekt-Setup](#a-projekt-setup)
- [B) Verbindung und Treiber-Grundgerüst](#b-verbindung-und-treiber-grundgerüst)
- [C) Daten lesen (READ)](#c-daten-lesen-read)
- [D) Daten schreiben (CREATE / UPDATE / DELETE)](#d-daten-schreiben-create--update--delete)
- [E) Aggregation](#e-aggregation)
- [Treiber-Konzepte erklärt](#treiber-konzepte-erklärt)
- [Vergleich: mongosh vs. Node.js-Treiber](#vergleich-mongosh-vs-nodejs-treiber)
- [Abgabe-Dateien](#abgabe-dateien)

---

## Ausgangslage

Dieser Kompetenznachweis baut auf KN-M-01 bis KN-M-06 auf. Bisher wurden alle Befehle direkt über die MongoSH-Shell (in MongoDB Compass) abgesetzt. In diesem KN wird stattdessen aus einer **Programmiersprache** auf die Datenbank zugegriffen.

Verwendet wird der **offizielle MongoDB-Treiber für Node.js** (npm-Paket `mongodb`). Diese Wahl ist naheliegend, weil im Lehrbetrieb (NoQui) ohnehin mit JavaScript/TypeScript gearbeitet wird und sich der Treiber so direkt in eine bestehende Node-Umgebung einbinden lässt. Einstiegspunkt war die offizielle Übersicht der MongoDB-Treiber unter <https://www.mongodb.com/docs/drivers/>.

Es geht in diesem KN nicht um spezielle Architektur-Patterns, sondern darum, ein Paket kennenzulernen, mit dem man auf die Datenbank zugreifen kann. Das Skript führt deshalb dieselben Arten von Abfragen aus, die in den früheren KNs als MongoSH-Skripte gespeichert wurden (`find()` mit Filter/Projektion und eine `$group`-Aggregation), und ergänzt diese um einen vollständigen CRUD-Durchlauf (`insertOne`, `updateOne`, `deleteOne`).

Verwendet wird weiterhin die Datenbank `tuningwerkstatt` mit den vier Collections aus KN-M-02 (`kunde`, `tuningauftrag`, `tuningteil`, `mechaniker`), inklusive der in KN-M-06 hinterlegten Validierungsregeln.

Da die EC2-Instance keine Elastic IP zugewiesen hat, ändert sich die Public IPv4-Adresse bei jedem Stop/Start. Beim Bearbeiten dieses KN lautete sie `54.175.153.86`. Der Connection-String im Skript muss bei einer neuen IP entsprechend angepasst werden:

```
mongodb://admin:M165_TBZ_2026!@54.175.153.86:27017/?authSource=admin
```

### Voraussetzungen

| Voraussetzung              | Prüfung / Hinweis                                                       |
| -------------------------- | ----------------------------------------------------------------------- |
| Node.js installiert        | Kontrolle mit `node -v` (verwendet wurde Node.js 18+)                   |
| EC2-Instance läuft         | MongoDB-Server muss erreichbar sein (Security Group erlaubt Port 27017) |
| Aktuelle Public IP bekannt | Wird im Skript in der Variable `IP` eingetragen                         |

---

## A) Projekt-Setup

Zuerst wurde ein neues Projektverzeichnis angelegt und der MongoDB-Treiber per npm installiert.

```bash
mkdir KN-M-07
cd KN-M-07
npm init -y
npm install mongodb
```

| Befehl                | Funktion                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm init -y`         | Legt eine `package.json` mit Standardwerten an. Diese Datei beschreibt das Projekt und die Abhängigkeiten.                                                   |
| `npm install mongodb` | Lädt den offiziellen MongoDB-Treiber aus der npm-Registry und trägt ihn als Abhängigkeit in `package.json` ein. Die Dateien landen im Ordner `node_modules`. |

Nach der Installation steht das Paket `mongodb` (Treiber-Version 7.x) als Abhängigkeit in der `package.json`:

```json
"dependencies": {
  "mongodb": "^7.2.0"
}
```

### Screenshot

![npm install mongodb erfolgreich](./Bilder/01_npm_install.png)

Der Screenshot zeigt die erfolgreiche Installation des Pakets `mongodb` über npm sowie die installierte Node.js-Version (`node -v`).

---

## B) Verbindung und Treiber-Grundgerüst

Das gesamte KN wird in einer einzigen Datei `KN-M-07_app.js` umgesetzt. Das Grundgerüst besteht aus dem Importieren des Treibers, dem Erstellen eines `MongoClient`, dem Aufbau der Verbindung und dem sauberen Schliessen am Ende.

```javascript
const { MongoClient } = require("mongodb");

const IP = "54.175.153.86"; // aktuelle Public IPv4 der EC2-Instance
const uri = `mongodb://admin:M165_TBZ_2026!@${IP}:27017/?authSource=admin`;

const DB_NAME = "tuningwerkstatt";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db(DB_NAME).command({ ping: 1 });
    const db = client.db(DB_NAME);
    const kunde = db.collection("kunde");
    // ... weitere Operationen ...
  } catch (err) {
    console.error("FEHLER:", err.message);
  } finally {
    await client.close();
  }
}

main();
```

### Aufbau erklärt

| Element                        | Funktion                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `require("mongodb")`           | Lädt den Treiber. `MongoClient` ist die zentrale Klasse für die Verbindung.                                                              |
| `new MongoClient(uri)`         | Erstellt den Client mit dem Connection-String. Der Treiber verwaltet intern einen Connection-Pool — ein Client genügt für die ganze App. |
| `await client.connect()`       | Baut die Verbindung zum Server auf. `await`, weil die Operation asynchron ist (Netzwerkzugriff).                                         |
| `client.db("tuningwerkstatt")` | Wählt die Datenbank aus (entspricht `use tuningwerkstatt` in der Shell).                                                                 |
| `db.collection("kunde")`       | Gibt ein Collection-Handle zurück, über das die Abfragen laufen.                                                                         |
| `try / catch / finally`        | Zentrale Fehlerbehandlung. `finally` stellt sicher, dass die Verbindung **immer** geschlossen wird, auch im Fehlerfall.                  |
| `await client.close()`         | Schliesst die Verbindung und gibt die Ressourcen frei.                                                                                   |

Wichtig: Fast alle Treiber-Methoden sind **asynchron** und geben ein Promise zurück. Deshalb wird durchgehend mit `async`/`await` gearbeitet, und der gesamte Ablauf steckt in einer `async`-Funktion `main()`.

---

## C) Daten lesen (READ)

Der Lese-Teil führt zwei Abfragen aus: eine Zählung der Dokumente pro Collection und eine gefilterte `find()`-Abfrage mit Projektion.

### READ 1 — Dokumente zählen

```javascript
console.log("kunde:        ", await kunde.countDocuments());
console.log("tuningteil:   ", await tuningteil.countDocuments());
console.log("tuningauftrag:", await tuningauftrag.countDocuments());
console.log("mechaniker:   ", await mechaniker.countDocuments());
```

### READ 2 — find() mit Filter und Projektion

Diese Abfrage entspricht der Abfrage C2 aus KN-M-04: gesucht werden alle Kunden mit mindestens einem Auto über 400 PS. Über die Dot-Notation `"autos.leistungPS"` wird in das eingebettete Array hineingegriffen. Die Projektion wird beim Treiber als eigenes Optionen-Objekt (`{ projection: { ... } }`) übergeben — anders als in der Shell, wo sie der zweite Parameter von `find()` ist.

```javascript
const starkeAutos = await kunde
  .find(
    { "autos.leistungPS": { $gt: 400 } },
    {
      projection: {
        _id: 0,
        nachname: 1,
        "autos.marke": 1,
        "autos.modell": 1,
        "autos.leistungPS": 1,
      },
    },
  )
  .toArray();
console.log(JSON.stringify(starkeAutos, null, 2));
```

`find()` gibt einen **Cursor** zurück. Mit `.toArray()` werden alle Treffer in ein JavaScript-Array geladen, das dann z.B. mit `JSON.stringify(..., null, 2)` formatiert ausgegeben werden kann.

### Screenshot

![READ: Verbindung, Zählung und find-Abfrage](./Bilder/02_read.png)

Der Screenshot zeigt die erfolgreiche Verbindung, die Anzahl Dokumente pro Collection und das Resultat der `find()`-Abfrage (Kunden mit einem Auto über 400 PS) als formatiertes JSON. Die konkreten Zahlen hängen vom aktuellen Datenstand der Datenbank ab.

---

## D) Daten schreiben (CREATE / UPDATE / DELETE)

Dieser Teil demonstriert einen vollständigen Schreib-Lebenszyklus auf der Collection `tuningteil`: ein neuer Datensatz wird eingefügt, anschliessend verändert und am Ende wieder gelöscht. Dadurch greifen die in KN-M-06 hinterlegten Validierungsregeln, und die Datenbank befindet sich nach dem Lauf wieder im Ausgangszustand.

### WRITE 1 — insertOne()

Der eingefügte Datensatz erfüllt das Validierungsschema aus KN-M-06: `kategorie` liegt im erlaubten `enum` (`"Bremsen"`), `preis` ist eine Kommazahl und `lagerbestand` eine Ganzzahl.

```javascript
const insertRes = await tuningteil.insertOne({
  bezeichnung: "Brembo GT Bremsanlage",
  kategorie: "Bremsen",
  hersteller: "Brembo",
  preis: 3290.5,
  lagerbestand: 4,
});
const neueId = insertRes.insertedId;
```

**Hinweis zum Typmapping (Anknüpfung an KN-M-06):** Der Node.js-Treiber wandelt JavaScript-Zahlen automatisch in BSON-Typen um. Eine Ganzzahl wie `4` wird als `int32` abgelegt, eine Kommazahl wie `3290.5` als `double`. Genau deshalb erfüllt das Dokument die Validierung (`lagerbestand` erwartet `int`, `preis` akzeptiert `double`), ohne dass man wie in der Shell explizit `NumberInt()` oder `NumberDecimal()` schreiben muss.

### WRITE 2 — updateOne()

Der Preis des soeben eingefügten Teils wird mit dem Operator `$mul` um 10% erhöht.

```javascript
const updateRes = await tuningteil.updateOne(
  { _id: neueId },
  { $mul: { preis: 1.1 } },
);
console.log(
  "matchedCount:",
  updateRes.matchedCount,
  "| modifiedCount:",
  updateRes.modifiedCount,
);
```

Das zurückgegebene Resultat enthält `matchedCount` (Anzahl gefundener Dokumente) und `modifiedCount` (Anzahl tatsächlich veränderter Dokumente) — beide sollten `1` sein.

### WRITE 3 — deleteOne()

Zum Schluss wird der Demo-Datensatz wieder entfernt, damit die Datenbank unverändert bleibt.

```javascript
const deleteRes = await tuningteil.deleteOne({ _id: neueId });
console.log("deletedCount:", deleteRes.deletedCount);
```

### Screenshot

![WRITE und Aggregation](./Bilder/03_write_aggregation.png)

Der Screenshot zeigt den vollständigen Schreib-Durchlauf: die `_id` des eingefügten Dokuments, das Update-Resultat (`modifiedCount: 1`) mit dem neuen Preis (3290.5 × 1.1 = 3619.55) sowie die erfolgreiche Löschung (`deletedCount: 1`) und die Bestätigung, dass `tuningteil` wieder gleich viele Dokumente enthält wie vorher. Im unteren Teil ist zusätzlich das Resultat der Aggregation aus Teil E zu sehen (siehe nächstes Kapitel).

---

## E) Aggregation

Abschliessend wird eine Aggregations-Pipeline ausgeführt, die der Pipeline A4 aus KN-M-04 entspricht: die Aufträge werden nach ihrem `status`-Feld gruppiert, und pro Gruppe werden die Anzahl und der Durchschnittspreis berechnet.

```javascript
const proStatus = await tuningauftrag
  .aggregate([
    {
      $group: {
        _id: "$status",
        anzahl: { $sum: 1 },
        durchschnittPreis: { $avg: "$gesamtpreis" },
      },
    },
    { $sort: { _id: 1 } },
  ])
  .toArray();
console.log(JSON.stringify(proStatus, null, 2));
```

Wie bei `find()` gibt auch `aggregate()` einen Cursor zurück, der mit `.toArray()` ausgelesen wird. Die Pipeline ist identisch zu jener aus der Shell — der Treiber übernimmt das JavaScript-Objekt eins zu eins.

### Screenshot

![Aggregation: Gruppierung nach Status](./Bilder/03_write_aggregation.png)

Der untere Teil des Screenshots aus Teil D zeigt das Resultat der `$group`-Aggregation: pro Status eine Gruppe mit Anzahl und Durchschnittspreis, gefolgt von der Abschlussmeldung und dem sauberen Schliessen der Verbindung.

---

## Treiber-Konzepte erklärt

| Konzept                         | Beschreibung                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Asynchronität (`async`/`await`) | Treiber-Methoden mit Netzwerkzugriff geben Promises zurück. `await` wartet auf das Resultat, ohne den Code zu blockieren.                   |
| Connection-Pool                 | Der `MongoClient` hält intern mehrere Verbindungen offen und verteilt Anfragen darauf. Man erstellt ihn einmal und nutzt ihn wieder.        |
| Cursor                          | `find()` und `aggregate()` liefern keinen fertigen Array, sondern einen Cursor. Mit `.toArray()` lädt man alle Treffer auf einmal.          |
| Resultat-Objekte                | Schreib-Operationen geben Status-Objekte zurück (`insertedId`, `matchedCount`, `modifiedCount`, `deletedCount`) statt der Dokumente selbst. |
| BSON-Typmapping                 | JavaScript-Werte werden automatisch in BSON-Typen übersetzt (Ganzzahl → `int32`, Kommazahl → `double`, `Date` → BSON-`date`).               |
| Fehlerbehandlung                | Fehler (z.B. fehlgeschlagene Validierung) werden als Exception geworfen und im `try/catch` abgefangen.                                      |

---

## Vergleich: mongosh vs. Node.js-Treiber

| Aspekt           | mongosh (Shell, frühere KNs)               | Node.js-Treiber (dieses KN)               |
| ---------------- | ------------------------------------------ | ----------------------------------------- |
| Datenbank wählen | `use tuningwerkstatt`                      | `client.db("tuningwerkstatt")`            |
| Abfrage          | `db.kunde.find({...})`                     | `db.collection("kunde").find({...})`      |
| Projektion       | 2. Parameter von `find()`                  | Optionen-Objekt `{ projection: {...} }`   |
| Resultat lesen   | direkt iterierbar / `.forEach()`           | Cursor → `await ... .toArray()`           |
| Ablauf           | synchron / interaktiv in der Shell         | asynchron mit `async`/`await`             |
| Zahlentypen      | explizit `NumberInt()` / `NumberDecimal()` | automatisches Mapping aus JS-Zahlen       |
| Einsatzgebiet    | Administration, schnelle Tests             | Integration in eine Applikation / Backend |

Die Abfrage-Syntax (Filter, Operatoren wie `$gt` und `$mul`, Aggregations-Stages) ist in beiden Fällen identisch — der Unterschied liegt vor allem in der Einbettung in eine asynchrone Programmiersprache statt einer interaktiven Shell.

---

## Abgabe-Dateien

| Datei                                   | Inhalt                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `KN-M-07_app.js`                        | Node.js-Skript — Verbindung, READ, CRUD und Aggregation über den Treiber |
| `package.json`                          | Projekt-Definition mit der Abhängigkeit `mongodb`                        |
| `Bilder/01_npm_install.png`             | Screenshot: `npm install mongodb` erfolgreich + Node-Version             |
| `Bilder/02_read.png`                    | Screenshot: Verbindung, Dokument-Zählung und `find()`-Resultat           |
| `Bilder/03_write_aggregation.png`       | Screenshot: insert / update / delete sowie `$group`-Aggregation          |
| `KN-M-07_Programmierung_mit_MongoDB.md` | Diese Dokumentation                                                      |
