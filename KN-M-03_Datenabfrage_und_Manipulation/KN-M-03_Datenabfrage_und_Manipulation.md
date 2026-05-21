# KN-M-03: Datenmanipulation und Abfragen I

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 21.05.2026
**Thema:** Tuning-Werkstatt (Fortsetzung von KN-M-02)

---

## Inhaltsverzeichnis

- [Ausgangslage](#ausgangslage)
- [A) Daten hinzufügen](#a-daten-hinzufügen)
- [B) Daten löschen](#b-daten-löschen)
- [C) Daten abfragen](#c-daten-abfragen)
- [D) Daten verändern](#d-daten-verändern)
- [Abgabe-Dateien](#abgabe-dateien)

---

## Ausgangslage

Dieser Kompetenznachweis baut auf KN-M-02 auf. Verwendet wird die Datenbank `tuningwerkstatt` mit den vier Collections, die in KN-M-02 angelegt wurden:

- `kunde` (mit eingebettetem Array `autos[]`)
- `tuningauftrag` (mit Referenz-Arrays `tuningteilIds[]` und `mechanikerIds[]`)
- `tuningteil`
- `mechaniker`

Die Verbindung wurde über MongoDB Compass zum MongoDB-Server auf der EC2-Instance aus KN-M-01 hergestellt. Nach dem Neustart der EC2-Instance hatte sich die Public IPv4-Adresse geändert auf `3.81.161.252`, weshalb der Connection-String entsprechend angepasst werden musste:

```
mongodb://admin:M165_TBZ_2026!@3.81.161.252:27017/?authSource=admin&readPreference=primary&ssl=false
```

Alle Skripte wurden über die in MongoDB Compass integrierte MongoSH-Shell ausgeführt. Vor dem Einfügen jedes Skripts wurde einmal `use tuningwerkstatt` separat abgesetzt, damit die Befehle in der korrekten Datenbank landen.

---

## A) Daten hinzufügen

### Vorgehen

In diesem Teil wurden alle vier Collections mit sinnvollen Testdaten gefüllt. Die wichtigsten Bedingungen waren:

- Für jedes `_id` wurde `new ObjectId()` verwendet.
- Die ObjectIds wurden in **Variablen** abgelegt, damit sie an mehreren Stellen wiederverwendet werden können (z.B. die `_id` eines Autos als `autoId` im Tuningauftrag).
- Mindestens einmal `insertOne()` (für den ersten Tuningauftrag "AMG-Styling Paket einbauen").
- Mindestens einmal `insertMany()` (für die übrigen drei Collections sowie die restlichen Aufträge).

### Skript-Aufbau

Das Skript `KN-M-03_A_insert.js` besteht aus sechs Abschnitten:

1. **ObjectId-Variablen**: Alle `_id`s werden vorab als Variablen deklariert (Kunden, eingebettete Autos, Tuningteile, Mechaniker, Tuningaufträge).
2. **`kunde`** mit `insertMany()` — drei Kunden mit eingebetteten Autos
3. **`tuningteil`** mit `insertMany()` — fünf Teile (Fahrwerk, Auspuff, Felgen, Chiptuning, Folierung)
4. **`mechaniker`** mit `insertMany()` — drei Mechaniker
5. **`tuningauftrag`** mit gemischten Befehlen — der erste Auftrag (AMG-Paket) mit `insertOne()`, die übrigen drei mit `insertMany()`
6. **Kontroll-Ausgabe** mit `countDocuments()` pro Collection

### Wichtige Designentscheidung: Auto-IDs als separate Variablen

Die Autos sind im Kunde-Dokument **eingebettet** (laut Modell aus KN-M-02). Trotzdem brauchen sie eine eigene `_id`, weil das Feld `autoId` in der Collection `tuningauftrag` darauf verweist. Beispiel:

```javascript
var autoMuellerGolfId = new ObjectId();

db.kunde.insertOne({
    _id: kundeMuellerId,
    vorname: "Hans",
    autos: [
        { _id: autoMuellerGolfId, kennzeichen: "ZH 123456", ... }
    ]
});

db.tuningauftrag.insertOne({
    _id: auftragFahrwerkId,
    autoId: autoMuellerGolfId,   // <-- Referenz auf das eingebettete Auto
    bezeichnung: "Tieferlegung mit Gewindefahrwerk",
    ...
});
```

So bleibt die Verbindung zwischen Auftrag und konkretem Auto eindeutig.

### Befehle erklärt

| Befehl                           | Funktion                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `new ObjectId()`                 | Erzeugt einen neuen 12-Byte BsonId-Wert. Bei jedem Aufruf wird eine andere ID generiert.                           |
| `db.<collection>.insertOne(doc)` | Fügt **ein** Dokument in die Collection ein. Gibt `{ acknowledged: true, insertedId: ... }` zurück.                |
| `db.<collection>.insertMany([])` | Fügt mehrere Dokumente auf einmal ein. Schneller als mehrere einzelne `insertOne()`-Aufrufe.                       |
| `new Date("YYYY-MM-DD")`         | Erzeugt einen MongoDB-Date-Wert. Ohne `new Date()` würde der Wert als String gespeichert (vgl. KN-M-01 Erklärung). |
| `db.<col>.countDocuments()`      | Liefert die Anzahl Dokumente in der Collection — hier zur Kontrolle nach den Inserts verwendet.                    |

### Resultat

Nach Ausführung enthält die Datenbank die folgenden Dokumentmengen:

| Collection      | Anzahl Dokumente |
| --------------- | ---------------- |
| `kunde`         | 3                |
| `tuningteil`    | 5                |
| `mechaniker`    | 3                |
| `tuningauftrag` | 4                |

### Screenshot

![Datenbank tuningwerkstatt mit gefüllten Collections](./Bilder/A1_insert.png)

Der Screenshot zeigt MongoDB Compass mit der Datenbank `tuningwerkstatt` und allen vier Collections in der Sidebar. Die Übersichtstabelle bestätigt die korrekte Anzahl Dokumente pro Collection (kunde: 3, mechaniker: 3, tuningauftrag: 4, tuningteil: 5).

---

## B) Daten löschen

Dieser Teil besteht aus **zwei separaten Skripten**, wie in der Aufgabenstellung verlangt.

### B.1 — Skript 1: Alle Collections droppen

Das Skript `KN-M-03_B1_dropAll.js` löscht alle vier Collections der Datenbank `tuningwerkstatt` mit `db.<collection>.drop()`. Dieses Skript dient als universelles "Aufräum-Skript" und wird in den Teilen C und D auch intern als erster Schritt verwendet, damit die Skripte auf einer leeren Datenbank starten können.

#### Inhalt

```javascript
db.kunde.drop();
db.tuningteil.drop();
db.mechaniker.drop();
db.tuningauftrag.drop();

print("=== Alle Collections gedroppt ===");
print("Verbleibende Collections in der DB:");
db.getCollectionNames().forEach(function (name) {
  print(" - " + name);
});
```

#### Befehle erklärt

| Befehl                          | Funktion                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `db.<collection>.drop()`        | Entfernt die gesamte Collection (inkl. aller Dokumente und Indizes). Gibt `true` zurück bei Erfolg. |
| `db.getCollectionNames()`       | Liefert ein Array mit den Namen aller Collections in der aktuellen Datenbank.                       |
| `.forEach(function(name){...})` | Iteriert über das Array. Hier wird jeder Collection-Name ausgegeben.                                |

#### Screenshot

![Alle Collections gedropped](./Bilder/B1_dropAll.png)

Der Screenshot zeigt die Shell-Ausgabe nach dem Drop: vier `true`-Werte (eines pro `drop()`-Aufruf), gefolgt von der Bestätigung und einer leeren Liste der verbleibenden Collections.

### B.2 — Skript 2: Einzelne Datensätze löschen

Das Skript `KN-M-03_B2_delete.js` ist **self-contained**: es räumt zuerst alle Collections aus (damit es bekannte `_id`-Werte gibt), füllt die Daten neu und führt dann zwei gezielte Löschoperationen aus.

#### deleteOne() mit \_id-Filterung

Es wird der Kunde **Lara Bucher** anhand seiner `_id` gelöscht. Vor der Operation hat die Collection `kunde` 3 Dokumente, danach noch 2 (Mueller und Asani bleiben).

```javascript
db.kunde.deleteOne({ _id: kundeBucherId });
```

#### deleteMany() mit ODER-Verknüpfung auf mehrere \_id's

Aus der Collection `tuningteil` werden **zwei der fünf** Teile gelöscht — die Felgen und die Folierung. Es werden bewusst nicht alle Teile gelöscht, sondern nur die in der OR-Liste angegebenen.

```javascript
db.tuningteil.deleteMany({
  $or: [{ _id: teilFelgenId }, { _id: teilFolierungId }],
});
```

#### Befehle erklärt

| Befehl                        | Funktion                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `db.<col>.deleteOne(filter)`  | Löscht **das erste** Dokument, das den Filter erfüllt. Optimal in Kombination mit `_id`, weil diese garantiert eindeutig ist.                          |
| `db.<col>.deleteMany(filter)` | Löscht **alle** Dokumente, die den Filter erfüllen. Ohne Filter `{}` würden alle Dokumente gelöscht — daher hier mit einer eingrenzenden OR-Bedingung. |
| `$or: [ {...}, {...} ]`       | Logischer ODER-Operator. Es reicht, wenn eine der Bedingungen zutrifft.                                                                                |

#### Resultat

| Collection   | Vor deleteOne / deleteMany | Nach Löschung |
| ------------ | -------------------------- | ------------- |
| `kunde`      | 3                          | 2             |
| `tuningteil` | 5                          | 3             |

#### Screenshot

![Einzelne Datensätze gelöscht](./Bilder/B2_delete.png)

Der Screenshot zeigt die Shell-Ausgabe mit den Vorher/Nachher-Counts: `kunde-Anzahl = 3 → 2` (nach deleteOne) und `tuningteil-Anzahl = 5 → 3` (nach deleteMany).

---

## C) Daten abfragen

### Vorgehen

Das Skript `KN-M-03_C_find.js` ist ebenfalls self-contained: es dropt zuerst alle Collections, füllt sie mit den Testdaten neu und führt anschliessend **vier Abfragen** mit dem `find()`-Befehl aus. Jede Abfrage erfüllt mehrere der von der Aufgabenstellung geforderten Bedingungen.

### Bedingungsübersicht

| Bedingung                               | Wo erfüllt                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Mindestens 1 Abfrage pro Collection     | Q1 (kunde), Q2 (tuningteil), Q3 (mechaniker), Q4 (tuningauftrag)             |
| DateTime-Filter                         | Q3 — `eintrittsdatum: { $gte: new Date("2020-01-01") }`                      |
| ODER, **nicht** auf `_id`               | Q2 — `$or` auf `kategorie`                                                   |
| UND, **andere Collection** als die ODER | Q4 — `$and` auf `status` und `gesamtpreis` (tuningauftrag, nicht tuningteil) |
| Regex (Teilstring)                      | Q1 — `{ $regex: "uell" }` findet "Mueller"                                   |
| Projektion **mit** `_id`                | Q1 — `{ _id: 1, vorname: 1, nachname: 1 }`                                   |
| Projektion **ohne** `_id`               | Q2 — `{ _id: 0, name: 1, preis: 1, kategorie: 1 }`                           |

### Q1 — Regex auf Nachname (Collection `kunde`)

Sucht alle Kunden, deren `nachname` die Zeichenfolge `"uell"` enthält. Das ist eine Teilstring-Suche über einen regulären Ausdruck. Trifft auf "Mueller" zu.

```javascript
db.kunde
  .find({ nachname: { $regex: "uell" } }, { _id: 1, vorname: 1, nachname: 1 })
  .forEach(printjson);
```

Die Projektion `{ _id: 1, vorname: 1, nachname: 1 }` gibt nur diese drei Felder zurück — inklusive `_id` (das ist die Bedingung "Projektion mit `_id`").

### Q2 — ODER-Verknüpfung auf Kategorie (Collection `tuningteil`)

Sucht alle Tuningteile, deren `kategorie` entweder `"Auspuff"` **oder** `"Fahrwerk"` ist. Erwartet werden zwei Treffer (Akrapovic-Auspuff und KW-Fahrwerk).

```javascript
db.tuningteil
  .find(
    {
      $or: [{ kategorie: "Auspuff" }, { kategorie: "Fahrwerk" }],
    },
    { _id: 0, name: 1, preis: 1, kategorie: 1 },
  )
  .forEach(printjson);
```

Die Projektion `{ _id: 0, ... }` schliesst `_id` explizit aus (Bedingung "Projektion ohne `_id`"). Die `_id` ist das einzige Feld, das standardmässig ausgegeben wird und explizit ausgeschaltet werden muss.

### Q3 — DateTime-Filter (Collection `mechaniker`)

Sucht alle Mechaniker, die **am oder nach dem 01.01.2020** in die Werkstatt eingetreten sind. Trifft auf Marko Kovac (2020) und Daniela Schmid (2023) zu. Thomas Meyer (2018) wird ausgeschlossen.

```javascript
db.mechaniker
  .find({ eintrittsdatum: { $gte: new Date("2020-01-01") } })
  .forEach(printjson);
```

`$gte` steht für "greater than or equal" (≥). Wichtig: der Vergleichswert muss ein echtes `Date`-Objekt sein, kein String — sonst würde MongoDB den String alphabetisch vergleichen, was falsche Resultate liefert.

### Q4 — UND-Verknüpfung (Collection `tuningauftrag`)

Sucht alle Aufträge, die **gleichzeitig** Status `"F"` (fertig) und einen Gesamtpreis von **mindestens 4000 CHF** haben. Trifft genau auf den AMG-Auftrag (5400 CHF, F) zu. Der Folierungsauftrag ist zwar auch fertig, kostet aber nur 3200 CHF und fällt deshalb raus.

```javascript
db.tuningauftrag
  .find({
    $and: [{ status: "F" }, { gesamtpreis: { $gte: 4000 } }],
  })
  .forEach(printjson);
```

Die UND-Verknüpfung läuft auf einer **anderen Collection** als die OR-Verknüpfung aus Q2 — das war die explizite Vorgabe.

### Befehle erklärt

| Befehl                              | Funktion                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `db.<col>.find(filter, projection)` | Sucht Dokumente, die den Filter erfüllen. Optionaler zweiter Parameter steuert, welche Felder zurückkommen.                     |
| `{ $regex: "..." }`                 | Regulärer Ausdruck. Findet Teilstrings im Feldwert. Standardmässig case-sensitive (kann mit `$options: "i"` umgestellt werden). |
| `{ $or: [ ... ] }`                  | Logisches ODER: mindestens eine der Teilbedingungen muss zutreffen.                                                             |
| `{ $and: [ ... ] }`                 | Logisches UND: alle Teilbedingungen müssen zutreffen.                                                                           |
| `{ $gte: wert }`                    | "greater than or equal" — Vergleichsoperator (auch für Datumswerte verwendbar).                                                 |
| `{ feld: 1, _id: 0 }`               | Projektion: `1` = Feld einschliessen, `0` = ausschliessen. `_id` ist das einzige Feld, das standardmässig drin ist.             |
| `.forEach(printjson)`               | Iteriert über den Cursor und gibt jedes Dokument als formatiertes JSON aus.                                                     |

### Resultat-Übersicht

| Query | Erwartete Anzahl Treffer | Resultat                               |
| ----- | ------------------------ | -------------------------------------- |
| Q1    | 1                        | Hans Mueller                           |
| Q2    | 2                        | KW Fahrwerk, Akrapovic Auspuff         |
| Q3    | 2                        | Marko Kovac, Daniela Schmid            |
| Q4    | 1                        | AMG-Styling Paket (5400 CHF, Status F) |

### Screenshot

![Find-Abfragen mit Resultaten](./Bilder/C_find.png)

Der Screenshot zeigt die Shell-Ausgaben der vier Queries. Sichtbar sind unter anderem die DateTime-gefilterten Mechaniker Kovac und Schmid (Q3) sowie der über UND-Verknüpfung gefilterte AMG-Auftrag (Q4).

---

## D) Daten verändern

### Vorgehen

Das Skript `KN-M-03_D_update.js` ist wiederum self-contained und führt **drei verschiedene Update-Operationen auf drei unterschiedlichen Collections** aus. Jede Operation erfüllt eine spezifische Bedingung der Aufgabenstellung.

### Aufteilung

| Update | Collection   | Operation      | Bedingung erfüllt                        |
| ------ | ------------ | -------------- | ---------------------------------------- |
| U1     | `mechaniker` | `updateOne()`  | mit `_id`-Filterung                      |
| U2     | `tuningteil` | `updateMany()` | ohne `_id`, mit OR, ändert > 1 Datensatz |
| U3     | `kunde`      | `replaceOne()` | komplette Ersetzung eines Dokuments      |

### U1 — updateOne() auf `mechaniker` mit \_id

Der Mechaniker Thomas Meyer erhält eine erweiterte Spezialisierung und ein neues Feld `telefon`.

```javascript
db.mechaniker.updateOne(
  { _id: mechMeyerId },
  {
    $set: {
      spezialisierung: "Fahrwerktechnik & Bremsen",
      telefon: "0445551122",
    },
  },
);
```

Mit `$set` werden die genannten Felder geändert, ohne dass die übrigen Felder verloren gehen. Das neue Feld `telefon` wird hinzugefügt (in MongoDB darf jedes Dokument einer Collection unterschiedliche Felder haben — schemalos).

### U2 — updateMany() auf `tuningteil` ohne \_id, mit OR

Alle Tuningteile der Kategorie `"Auspuff"` **oder** `"Fahrwerk"` bekommen 10% Preisaufschlag und einen Zeitstempel im neuen Feld `preisUpdate`. Das trifft auf zwei Datensätze zu (KW Fahrwerk und Akrapovic Auspuff), wie es die Bedingung verlangt.

```javascript
db.tuningteil.updateMany(
  {
    $or: [{ kategorie: "Auspuff" }, { kategorie: "Fahrwerk" }],
  },
  {
    $mul: { preis: 1.1 },
    $set: { preisUpdate: new Date() },
  },
);
```

`$mul` multipliziert den bestehenden Wert mit 1.10 (also +10%). Das Resultat-Objekt enthält `modifiedCount: 2`, was bestätigt, dass tatsächlich mehr als ein Datensatz verändert wurde.

### U3 — replaceOne() auf `kunde`

Der Kunde Lara Bucher wird komplett ersetzt — neuer Nachname (Heirat), neue Telefonnummer und ein anderes Auto. `replaceOne()` ersetzt das gesamte Dokument bis auf die `_id`.

```javascript
db.kunde.replaceOne(
  { nachname: "Bucher" },
  {
    vorname: "Lara",
    nachname: "Steiner",
    telefon: "0791112233",
    kundenSeit: new Date("2023-11-20"),
    autos: [
      {
        _id: new ObjectId(),
        kennzeichen: "ZH 222333",
        marke: "Porsche",
        modell: "911 GT3",
        baujahr: 2024,
        leistungPS: 510,
      },
    ],
  },
);
```

### Unterschied: updateOne / updateMany / replaceOne

| Befehl         | Verändert                          | Behält andere Felder?                                         |
| -------------- | ---------------------------------- | ------------------------------------------------------------- |
| `updateOne()`  | **Ein** Dokument (das erste Match) | Ja — nur die in `$set` etc. genannten Felder werden geändert. |
| `updateMany()` | **Alle** passenden Dokumente       | Ja — gleich wie updateOne, nur auf mehreren Treffern.         |
| `replaceOne()` | **Ein** Dokument (das erste Match) | Nein — das ganze Dokument wird ersetzt (ausser `_id`).        |

### Befehle erklärt

| Befehl                               | Funktion                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `db.<col>.updateOne(filter, update)` | Aktualisiert das erste passende Dokument. Benötigt einen Update-Operator wie `$set`.              |
| `db.<col>.updateMany(filter, upd)`   | Aktualisiert alle passenden Dokumente.                                                            |
| `db.<col>.replaceOne(filter, doc)`   | Ersetzt das erste passende Dokument vollständig — alle nicht enthaltenen Felder gehen verloren.   |
| `{ $set: { feld: wert } }`           | Setzt das Feld auf den Wert. Erstellt es, falls es noch nicht existiert.                          |
| `{ $mul: { feld: faktor } }`         | Multipliziert den bestehenden numerischen Wert mit dem Faktor. Hier verwendet für +10% Aufschlag. |

### Resultat-Übersicht

| Update | Geänderte Datensätze                                         |
| ------ | ------------------------------------------------------------ |
| U1     | 1 (Mechaniker Meyer mit neuer Spezialisierung + Telefon)     |
| U2     | 2 (Akrapovic-Auspuff und KW-Fahrwerk mit +10% Preis)         |
| U3     | 1 (Kunde Bucher → ersetzt durch Steiner mit Porsche 911 GT3) |

### Screenshot

![Update-Operationen mit Vorher/Nachher](./Bilder/D_update.png)

Der Screenshot zeigt den `replaceOne()`-Teil mit Vorher/Nachher-Ausgabe: aus Lara Bucher (Audi RS3) wird Lara Steiner (Porsche 911 GT3). Am Ende der Ausgabe steht die Bestätigung `=== Alle Update-Operationen abgeschlossen ===`.

---

## Abgabe-Dateien

| Datei                                      | Inhalt                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `KN-M-03_A_insert.js`                      | Skript für Teil A — Daten einfügen mit `insertOne()` und `insertMany()` |
| `KN-M-03_B1_dropAll.js`                    | Skript für Teil B — alle Collections droppen (Aufräum-Skript)           |
| `KN-M-03_B2_delete.js`                     | Skript für Teil B — `deleteOne()` mit `_id`, `deleteMany()` mit OR      |
| `KN-M-03_C_find.js`                        | Skript für Teil C — `find()` mit Regex, OR, AND, DateTime, Projektionen |
| `KN-M-03_D_update.js`                      | Skript für Teil D — `updateOne()`, `updateMany()`, `replaceOne()`       |
| `Bilder/A1_insert.png`                     | Screenshot: gefüllte Collections nach Teil A                            |
| `Bilder/B1_dropAll.png`                    | Screenshot: alle Collections gedropped                                  |
| `Bilder/B2_delete.png`                     | Screenshot: einzelne Datensätze gelöscht                                |
| `Bilder/C_find.png`                        | Screenshot: Resultate der vier Find-Queries                             |
| `Bilder/D_update.png`                      | Screenshot: Vorher/Nachher der Update-Operationen                       |
| `KN-M-03_Datenabfrage_und_Manipulation.md` | Diese Dokumentation                                                     |
