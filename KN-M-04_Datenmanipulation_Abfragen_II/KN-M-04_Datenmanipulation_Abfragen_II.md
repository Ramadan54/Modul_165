# KN-M-04: Datenmanipulation und Abfragen II

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 27.05.2026
**Thema:** Tuning-Werkstatt (Fortsetzung von KN-M-03)

---

## Inhaltsverzeichnis

- [Ausgangslage](#ausgangslage)
- [A) Aggregationen](#a-aggregationen)
- [B) Join-Aggregation mit `$lookup`](#b-join-aggregation-mit-lookup)
- [C) Unter-Dokumente / Arrays](#c-unter-dokumente--arrays)
- [Abgabe-Dateien](#abgabe-dateien)

---

## Ausgangslage

Dieser Kompetenznachweis baut direkt auf KN-M-03 auf und verwendet dieselbe Datenbank `tuningwerkstatt` mit den vier Collections aus KN-M-02:

- `kunde` (mit eingebettetem Array `autos[]`)
- `tuningauftrag` (mit Referenz-Arrays `tuningteilIds[]` und `mechanikerIds[]`)
- `tuningteil`
- `mechaniker`

Nach dem Neustart der EC2-Instance hatte sich die Public IPv4-Adresse erneut geändert, weshalb der Connection-String entsprechend angepasst werden musste:

```
mongodb://admin:M165_TBZ_2026!@32.197.237.28:27017/?authSource=admin&readPreference=primary&ssl=false
```

Alle Skripte wurden über die in MongoDB Compass integrierte MongoSH-Shell ausgeführt. Da MongoDB Compass den Shell-Befehl `use tuningwerkstatt` innerhalb eines eingefügten Skript-Blocks nicht akzeptiert (Compass erwartet hier valides JavaScript), wurde der `use`-Befehl jeweils **vor** dem Einfügen separat abgesetzt. Im gespeicherten Skript bleibt `use tuningwerkstatt` aber als Doku-Hinweis stehen.

### Setup-Skript

Bevor die eigentlichen Aufgaben gelöst wurden, wurde das Skript `KN-M-04_setup.js` ausgeführt. Es ist eine zusammengefasste Variante von KN-M-03 Teil A und dropt zuerst alle vier Collections, legt anschliessend die `ObjectId`-Variablen an und füllt die Collections mit denselben Testdaten wie in KN-M-03. So sind alle Abfragen in den Teilen A, B und C reproduzierbar und auf demselben Datenstand wie zuvor.

Nach dem Setup enthält die Datenbank:

| Collection      | Anzahl Dokumente |
| --------------- | ---------------- |
| `kunde`         | 3                |
| `tuningteil`    | 5                |
| `mechaniker`    | 3                |
| `tuningauftrag` | 4                |

---

## A) Aggregationen

### Vorgehen

Das Skript `KN-M-04_A_aggregation.js` enthält **vier Aggregations-Pipelines**, die alle in der Aufgabenstellung geforderten Stages mindestens einmal verwenden. Jede Pipeline arbeitet auf einer der Collections aus dem Modell.

### Bedingungsübersicht

| Bedingung                                                  | Wo erfüllt                             |
| ---------------------------------------------------------- | -------------------------------------- |
| `$match`-Anweisung einzeln hintereinander statt UND-Filter | A1 — zwei `$match` auf `tuningauftrag` |
| `$match`, `$project` und `$sort` in einer Pipeline         | A2 — auf `tuningteil`                  |
| `$sum` für count **und** sum                               | A3 — auf `tuningauftrag`               |
| Mindestens eine `$group`-Aggregation                       | A3 und A4 (A4 mit echter Gruppierung)  |
| Mehr als ein Datensatz im Resultat                         | A2 (4 Treffer), A4 (3 Gruppen)         |

### A1 — Zwei `$match`-Stages hintereinander (Collection `tuningauftrag`)

In KN-M-03 Q4 wurden Aufträge mit Status `"F"` UND einem Gesamtpreis von mindestens 4000 CHF über eine `$and`-Verknüpfung im `find()` gesucht. In dieser Aufgabe wird dasselbe Resultat über eine Pipeline mit zwei aufeinanderfolgenden `$match`-Stages erreicht — jede Stage filtert eine Bedingung.

```javascript
db.tuningauftrag
  .aggregate([
    { $match: { status: "F" } },
    { $match: { gesamtpreis: { $gte: 4000 } } },
  ])
  .forEach(printjson);
```

**Resultat:** ein Treffer — der AMG-Styling-Auftrag (5400 CHF, Status `F`). Der zweite fertige Auftrag (Vollfolierung, 3200 CHF) wird durch die zweite `$match`-Stage herausgefiltert.

### A2 — `$match` + `$project` + `$sort` (Collection `tuningteil`)

Sucht alle Tuningteile, die teurer als 2000 CHF sind, projiziert nur Name, Preis und Kategorie (also ohne `_id` und ohne `hersteller`) und sortiert das Ergebnis absteigend nach Preis.

```javascript
db.tuningteil
  .aggregate([
    { $match: { preis: { $gt: 2000 } } },
    { $project: { _id: 0, name: 1, preis: 1, kategorie: 1 } },
    { $sort: { preis: -1 } },
  ])
  .forEach(printjson);
```

**Resultat:** vier Treffer in der Reihenfolge Akrapovic Evolution (3500), KW Gewindefahrwerk V3 (2800), BBS CH-R 20 Zoll (2400) und Vollfolierung matt (2200). Nur das Stage-2-Chiptuning (1500) fällt unter die Schwelle.

### A3 — `$sum` für count und sum (Collection `tuningauftrag`)

Über eine `$group`-Stage mit `_id: null` werden **alle Dokumente** der Collection in eine einzige Gruppe zusammengefasst. Innerhalb dieser Gruppe werden zwei Aggregationen berechnet: `$sum: 1` zählt die Dokumente (entspricht einem `COUNT(*)` in SQL), und `$sum: "$gesamtpreis"` summiert das Feld `gesamtpreis` auf.

```javascript
db.tuningauftrag
  .aggregate([
    {
      $group: {
        _id: null,
        anzahlAuftraege: { $sum: 1 },
        gesamtUmsatz: { $sum: "$gesamtpreis" },
      },
    },
  ])
  .forEach(printjson);
```

**Resultat:** `{ _id: null, anzahlAuftraege: 4, gesamtUmsatz: 15900 }`. Damit ist sowohl der Zähler (4 Aufträge) als auch die Summe (15'900 CHF Gesamtumsatz) in einem einzigen Pipeline-Lauf berechnet.

### A4 — `$group`-Aggregation nach Status (Collection `tuningauftrag`)

Aufträge werden nach ihrem `status`-Feld (`O` = offen, `A` = in Arbeit, `F` = fertig) gruppiert. Pro Gruppe werden die Anzahl Aufträge und der durchschnittliche Preis berechnet. Abschliessend wird nach Status alphabetisch sortiert.

```javascript
db.tuningauftrag
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
  .forEach(printjson);
```

**Resultat:**

| Status | Anzahl | Durchschnittspreis (CHF) |
| ------ | ------ | ------------------------ |
| `A`    | 1      | 3200                     |
| `F`    | 2      | 4300                     |
| `O`    | 1      | 4100                     |

### Befehle erklärt

| Befehl                            | Funktion                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `db.<col>.aggregate([ … ])`       | Führt eine Aggregations-Pipeline aus. Jede Stage erhält die Ausgabe der vorherigen Stage als Eingabe.        |
| `$match: { feld: wert }`          | Filter-Stage. Funktioniert syntaktisch identisch zum Filter in `find()`.                                     |
| `$project: { feld: 1 }`           | Wählt aus, welche Felder im Resultat enthalten sind. `1` = einschliessen, `0` = ausschliessen.               |
| `$sort: { feld: 1 / -1 }`         | Sortiert das Resultat. `1` = aufsteigend, `-1` = absteigend.                                                 |
| `$group: { _id: …, feld: { … } }` | Gruppiert Dokumente nach `_id`. `_id: null` heisst „alle in eine Gruppe". Innerhalb berechnet man Aggregate. |
| `$sum: 1`                         | Zählt die Dokumente in der Gruppe (analog `COUNT(*)`).                                                       |
| `$sum: "$feld"`                   | Summiert den Wert des Feldes über alle Dokumente der Gruppe.                                                 |
| `$avg: "$feld"`                   | Bildet den Mittelwert des Feldes über alle Dokumente der Gruppe.                                             |

### Screenshot

![A — Aggregationen](./Bilder/A_aggregation.png)

Der Screenshot zeigt die Ausgaben aller vier Pipelines: den gefilterten AMG-Auftrag (A1), die vier sortierten Teile (A2), das eine `$group`-Resultat mit Anzahl und Gesamtumsatz (A3) sowie die drei Status-Gruppen mit Anzahl und Durchschnittspreis (A4).

---

## B) Join-Aggregation mit `$lookup`

### Vorgehen

Das Skript `KN-M-04_B_lookup.js` enthält zwei Pipelines, die jeweils einen Join über die `$lookup`-Anweisung durchführen. In der ersten Pipeline werden die Tuningteile zu den Aufträgen geholt; in der zweiten Pipeline wird zusätzlich gefiltert und das Resultat über `$unwind` verflacht.

### B1 — Einfacher Join Auftrag ↔ Tuningteil

Jeder `tuningauftrag` enthält im Feld `tuningteilIds[]` ein Array von ObjectIds. Mit `$lookup` werden die zugehörigen Dokumente aus der Collection `tuningteil` direkt in das Auftrag-Dokument unter einem neuen Array-Feld `teile` eingebettet. Anschliessend wird das Resultat mit `$project` auf die relevanten Felder reduziert, sodass **Felder aus beiden Collections** im Output sichtbar sind.

```javascript
db.tuningauftrag
  .aggregate([
    {
      $lookup: {
        from: "tuningteil", // Ziel-Collection
        localField: "tuningteilIds", // Feld im Auftrag (Array von ObjectIds)
        foreignField: "_id", // Feld in tuningteil
        as: "teile", // Name des neuen Array-Feldes
      },
    },
    {
      $project: {
        _id: 0,
        bezeichnung: 1,
        gesamtpreis: 1,
        status: 1,
        "teile.name": 1,
        "teile.preis": 1,
        "teile.kategorie": 1,
      },
    },
  ])
  .forEach(printjson);
```

**Resultat:** vier Dokumente, jeweils mit Bezeichnung, Gesamtpreis und Status aus `tuningauftrag` plus dem Sub-Array `teile` mit den ausgewählten Feldern aus `tuningteil`. Der AMG-Auftrag enthält dabei zwei Teile (BBS Felgen und Akrapovic Auspuff), die anderen drei jeweils ein Teil.

### B2 — `$lookup` mit anschliessender Filterung und `$unwind`

Diese Pipeline kombiniert mehrere Stages: zuerst werden über `$lookup` die zugewiesenen Mechaniker geholt, dann wird das resultierende Array per `$unwind` auf einzelne Dokumente aufgesplittet (eine Zeile pro Auftrag-Mechaniker-Kombination), anschliessend wird über `$match` nach der Spezialisierung gefiltert, und am Schluss wird das Resultat mit `$project` aufgeräumt.

```javascript
db.tuningauftrag
  .aggregate([
    {
      $lookup: {
        from: "mechaniker",
        localField: "mechanikerIds",
        foreignField: "_id",
        as: "mechaniker",
      },
    },
    { $unwind: "$mechaniker" },
    { $match: { "mechaniker.spezialisierung": { $regex: "Fahrwerktechnik" } } },
    {
      $project: {
        _id: 0,
        bezeichnung: 1,
        status: 1,
        "mechaniker.vorname": 1,
        "mechaniker.nachname": 1,
        "mechaniker.spezialisierung": 1,
      },
    },
  ])
  .forEach(printjson);
```

**Resultat:** zwei Treffer — der AMG-Auftrag und der Tieferlegungs-Auftrag, jeweils mit Thomas Meyer als Mechaniker (Spezialisierung „Fahrwerktechnik"). Der Folierungs-Auftrag fällt heraus, weil dort Daniela Schmid mit Spezialisierung „Karosserie & Folierung" zugewiesen ist; der Akrapovic-Auspuff-Auftrag fällt heraus, weil dort Marko Kovac mit Spezialisierung „Motorelektronik" arbeitet.

Wichtig: die `$match`-Stage **nach** dem `$lookup` filtert auf die hinzugefügten Felder. Das ist genau der Vorteil, dass alle Stages in einer Pipeline laufen und MongoDB sie intern optimieren kann.

### Befehle erklärt

| Befehl                                            | Funktion                                                                                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$lookup: { from, localField, foreignField, as }` | Führt einen Left-Outer-Join zur Collection `from` durch. Verbindet `localField` der aktuellen Collection mit `foreignField` der Ziel-Collection. Das Ergebnis landet als Array im Feld `as`. |
| `localField`                                      | Feld in der **aktuellen** Pipeline-Collection, das verglichen wird (z.B. `tuningteilIds`).                                                                                                   |
| `foreignField`                                    | Feld in der **Ziel-Collection** (`from`), gegen das verglichen wird (z.B. `_id`).                                                                                                            |
| `as`                                              | Name des neuen Array-Feldes, in dem die gejointen Dokumente landen.                                                                                                                          |
| `$unwind: "$feldname"`                            | Verflacht ein Array-Feld: aus einem Dokument mit Array der Länge N werden N Dokumente, jedes mit einem einzelnen Element statt dem Array.                                                    |

### Screenshot

![B — Join-Aggregation mit lookup](./Bilder/B_lookup.png)

Der Screenshot zeigt am Anfang das Ende der B1-Ausgabe (vier Aufträge mit den eingejointen `teile`-Subarrays) und anschliessend die beiden B2-Treffer mit Thomas Meyer als Fahrwerktechniker auf dem AMG- und dem Tieferlegungs-Auftrag.

---

## C) Unter-Dokumente / Arrays

### Vorgehen

Das Skript `KN-M-04_C_subdocs.js` arbeitet auf dem eingebetteten Array `autos[]` in der Collection `kunde`. Dieses Array wurde in KN-M-02 bewusst als Einbettung modelliert, weil ein Auto immer zu genau einem Kunden gehört und praktisch nie ohne dessen Kontext abgefragt wird.

Drei Abfragen decken die geforderten Bedingungen ab:

| Bedingung                               | Wo erfüllt                                        |
| --------------------------------------- | ------------------------------------------------- |
| Nur einzelne Felder von Unterdokumenten | C1 — Projektion `"autos.marke"`, `"autos.modell"` |
| Filter auf Felder von Unterdokumenten   | C2 — Filter `"autos.leistungPS": { $gt: 400 }`    |
| `$unwind` zur Verflachung               | C3 — `$unwind` auf `autos[]`                      |

### C1 — Nur einzelne Subdokument-Felder ausgeben

Über die Projektion werden vom Kunde-Dokument nur der Nachname und aus jedem eingebetteten Auto nur `marke` und `modell` zurückgegeben. Alle anderen Felder (Telefon, Kundenseit, Kennzeichen, Baujahr, PS, Auto-`_id`) werden unterdrückt.

```javascript
db.kunde
  .find({}, { _id: 0, nachname: 1, "autos.marke": 1, "autos.modell": 1 })
  .forEach(printjson);
```

**Resultat:** drei Kunden mit nur den gewünschten Feldern. Mueller hat in `autos[]` zwei Einträge (Golf GTI, RS6), Bucher und Keller je einen.

### C2 — Nach Feldern von Subdokumenten filtern

Sucht alle Kunden, die mindestens ein Auto mit mehr als 400 PS besitzen. Die Dot-Notation `"autos.leistungPS"` greift in das eingebettete Array hinein — MongoDB prüft, ob in mindestens einem Auto-Element die Bedingung erfüllt ist.

```javascript
db.kunde
  .find(
    { "autos.leistungPS": { $gt: 400 } },
    {
      _id: 0,
      nachname: 1,
      "autos.marke": 1,
      "autos.modell": 1,
      "autos.leistungPS": 1,
    },
  )
  .forEach(printjson);
```

**Resultat:** zwei Treffer — Mueller (wegen Audi RS6 mit 600 PS) und Keller (BMW M3 mit 510 PS). Bucher fällt heraus, weil ihr Audi RS3 „nur" 400 PS hat — die Bedingung ist strikt grösser, nicht grösser-gleich.

Wichtig zu beachten: bei Mueller werden im Resultat **beide** Autos angezeigt (Golf und RS6), obwohl nur eines die PS-Bedingung erfüllt. Das ist Standard-Verhalten bei `find()` — ein Dokument wird als Ganzes zurückgegeben, sobald irgendein Element des Arrays passt. Wer wirklich nur das passende Sub-Element haben will, braucht die Aggregation aus C3 oder einen `$elemMatch`-Projection-Operator.

### C3 — `$unwind` zur Verflachung des Arrays

`$unwind` baut aus einem Dokument mit einem N-elementigen Array N Dokumente, jedes mit einem einzelnen Auto-Element statt dem Array. Anschliessend lässt sich pro Auto unabhängig projizieren, filtern oder sortieren. Hier wird das Kunde-Auto-Paar flach in ein einzelnes Dokument umgebaut und absteigend nach PS sortiert.

```javascript
db.kunde
  .aggregate([
    { $unwind: "$autos" },
    {
      $project: {
        _id: 0,
        kunde: { $concat: ["$vorname", " ", "$nachname"] },
        marke: "$autos.marke",
        modell: "$autos.modell",
        baujahr: "$autos.baujahr",
        leistungPS: "$autos.leistungPS",
      },
    },
    { $sort: { leistungPS: -1 } },
  ])
  .forEach(printjson);
```

**Resultat:** vier flache Zeilen (Mueller hat zwei Autos, deshalb taucht er zweimal auf), sortiert nach PS absteigend:

| Kunde        | Marke | Modell         | Baujahr | PS  |
| ------------ | ----- | -------------- | ------- | --- |
| Hans Mueller | Audi  | RS6            | 2021    | 600 |
| Marco Keller | BMW   | M3 Competition | 2023    | 510 |
| Lara Bucher  | Audi  | RS3            | 2022    | 400 |
| Hans Mueller | VW    | Golf GTI       | 2019    | 245 |

### Befehle erklärt

| Befehl                                    | Funktion                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"autos.marke"` (Dot-Notation)            | Greift auf das Feld `marke` innerhalb der Subdokumente im `autos`-Array zu. Funktioniert sowohl in Projektionen als auch in Filtern.                      |
| `{ "autos.leistungPS": ... }`             | Filter auf ein Subdokument-Feld. Ein Dokument matcht, sobald **mindestens** ein Subdokument im Array die Bedingung erfüllt.                               |
| `$unwind: "$autos"`                       | Verflacht das Array `autos`. Pro Auto-Element entsteht ein eigenes Dokument; alle übrigen Felder des Kunden bleiben unverändert dupliziert.               |
| `$concat: ["$vorname", " ", "$nachname"]` | String-Konkatenation in der `$project`-Stage. Erzeugt im Resultat ein neues Feld `kunde` aus den beiden Original-Feldern, getrennt durch ein Leerzeichen. |

### Screenshot

![C — Subdokumente und unwind](./Bilder/C_subdocs.png)

Der Screenshot zeigt die Ausgaben aller drei Abfragen: die projizierten Subdokument-Felder (C1), die zwei Treffer mit Autos über 400 PS (C2) und die vier flachen `$unwind`-Resultate sortiert nach PS absteigend (C3).

---

## Abgabe-Dateien

| Datei                                          | Inhalt                                                       |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `KN-M-04_setup.js`                             | Setup-Skript — dropt und füllt alle 4 Collections            |
| `KN-M-04_A_aggregation.js`                     | Skript für Teil A — 4 Aggregations-Pipelines                 |
| `KN-M-04_B_lookup.js`                          | Skript für Teil B — 2 Join-Pipelines mit `$lookup`           |
| `KN-M-04_C_subdocs.js`                         | Skript für Teil C — 3 Abfragen auf eingebettete Subdokumente |
| `Bilder/A_aggregation.png`                     | Screenshot: Resultate der 4 Aggregations-Pipelines           |
| `Bilder/B_lookup.png`                          | Screenshot: Resultate der 2 `$lookup`-Pipelines              |
| `Bilder/C_subdocs.png`                         | Screenshot: Resultate der 3 Subdokument-Abfragen             |
| `KN-M-04_Datenmanipulation_und_Abfragen_II.md` | Diese Dokumentation                                          |
