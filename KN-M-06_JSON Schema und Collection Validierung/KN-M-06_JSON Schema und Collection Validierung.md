# KN-M-06: JSON Schema und Collection Validierung

**Autor:** Ramadan Asani
**Modul:** M165 - NoSQL-Datenbanken einsetzen
**Datum:** 02.06.2026
**Thema:** Tuning-Werkstatt (Fortsetzung von KN-M-05)

---

## Inhaltsverzeichnis

- [Ausgangslage](#ausgangslage)
- [A) JSON Schemas erstellen](#a-json-schemas-erstellen)
  - [Beispiel-Dokumente](#beispiel-dokumente)
  - [JSON Schemas](#json-schemas)
- [B) Validierung hinterlegen und testen](#b-validierung-hinterlegen-und-testen)
  - [B.1 — Neue Rolle für Validierungen](#b1--neue-rolle-für-validierungen)
  - [B.2 — Validierung via UI (mechaniker)](#b2--validierung-via-ui-mechaniker)
  - [B.3 — Validierungen via Shell (3 Collections)](#b3--validierungen-via-shell-3-collections)
  - [B.4 — Bestehende Validierung auslesen](#b4--bestehende-validierung-auslesen)
  - [B.5 — Ungültiges Dokument einfügen](#b5--ungültiges-dokument-einfügen)
  - [B.6 — Gültiges Dokument einfügen](#b6--gültiges-dokument-einfügen)
- [Abgabe-Dateien](#abgabe-dateien)

---

## Ausgangslage

Dieser Kompetenznachweis baut auf KN-M-02 bis KN-M-05 auf. Verwendet wird die Datenbank `tuningwerkstatt` mit den vier Collections aus KN-M-02:

- `kunde` (mit eingebettetem Array `autos[]`)
- `tuningauftrag` (mit Referenz-Arrays `tuningteilIds[]` und `mechanikerIds[]`)
- `tuningteil`
- `mechaniker`

Nach dem Neustart der EC2-Instance hatte sich die Public IPv4-Adresse erneut geändert auf `3.92.128.189`, weshalb der Connection-String entsprechend angepasst werden musste:

```
mongodb://admin:M165_TBZ_2026!@3.92.128.189:27017/?authSource=admin&readPreference=primary&ssl=false
```

Alle Befehle wurden über die in MongoDB Compass integrierte MongoSH-Shell ausgeführt. Die Validierung für die Collection `mechaniker` wurde zusätzlich über das Compass-UI gesetzt, wie in der Aufgabenstellung verlangt.

---

## A) JSON Schemas erstellen

### Übersicht

Für jede der vier Collections wurde ein Beispiel-Dokument und ein JSON-Schema erstellt. Die Schemas beschreiben die Struktur der Dokumente, legen Pflichtfelder fest und definieren die erlaubten Datentypen.

Die JSON-Schema-Dateien folgen dem TBZ-Format mit den Meta-Feldern `$schema`, `$id`, `title` und `type`. In den Schema-Dateien wird `"type"` verwendet (JSON Schema Standard). In den MongoDB-Validierungsbefehlen wird `"bsonType"` verwendet, da MongoDB eigene BSON-Datentypen kennt, die über den JSON-Standard hinausgehen (z.B. `objectId`, `date`, `int`).

### Beispiel-Dokumente

#### `beispiel_kunde.json`

```json
{
  "_id": { "$oid": "664f1a2b3c4d5e6f7a8b9c0d" },
  "vorname": "Hans",
  "nachname": "Mueller",
  "telefon": "0791234567",
  "kundenSeit": { "$date": "2021-03-15T00:00:00Z" },
  "autos": [
    {
      "_id": { "$oid": "664f1a2b3c4d5e6f7a8b9c0e" },
      "kennzeichen": "ZH 123456",
      "marke": "Volkswagen",
      "modell": "Golf R",
      "baujahr": 2020,
      "leistungPS": 320
    }
  ]
}
```

#### `beispiel_mechaniker.json`

```json
{
  "_id": { "$oid": "664f1a2b3c4d5e6f7a8b9c02" },
  "vorname": "Thomas",
  "nachname": "Meyer",
  "spezialisierung": "Fahrwerktechnik",
  "eintrittsdatum": { "$date": "2019-06-01T00:00:00Z" },
  "stundenansatz": 95.0
}
```

#### `beispiel_tuningteil.json`

```json
{
  "_id": { "$oid": "664f1a2b3c4d5e6f7a8b9c01" },
  "bezeichnung": "KW Gewindefahrwerk V3",
  "kategorie": "Fahrwerk",
  "hersteller": "KW Suspensions",
  "preis": 1850.0,
  "lagerbestand": 3
}
```

#### `beispiel_tuningauftrag.json`

```json
{
  "_id": { "$oid": "664f1a2b3c4d5e6f7a8b9c03" },
  "bezeichnung": "Tieferlegung mit Gewindefahrwerk",
  "autoId": { "$oid": "664f1a2b3c4d5e6f7a8b9c0e" },
  "tuningteilIds": [{ "$oid": "664f1a2b3c4d5e6f7a8b9c01" }],
  "mechanikerIds": [{ "$oid": "664f1a2b3c4d5e6f7a8b9c02" }],
  "auftragsdatum": { "$date": "2024-02-10T00:00:00Z" },
  "status": "A",
  "gesamtpreis": 2100.0
}
```

---

### JSON Schemas

#### `schema_kunde.json`

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "$id": "https://tbz.ch/kunde.json",
  "title": "Kunde",
  "type": "object",
  "required": ["vorname", "nachname", "telefon", "kundenSeit", "autos"],
  "properties": {
    "_id": {
      "type": "string",
      "description": "Eindeutige ObjectId des Kunden."
    },
    "vorname": {
      "type": "string",
      "description": "Vorname des Kunden."
    },
    "nachname": {
      "type": "string",
      "description": "Nachname des Kunden."
    },
    "telefon": {
      "type": "string",
      "description": "Telefonnummer des Kunden."
    },
    "kundenSeit": {
      "type": "string",
      "format": "date-time",
      "description": "Datum der Kundenregistrierung (ISO 8601)."
    },
    "autos": {
      "type": "array",
      "description": "Eingebettete Fahrzeugliste des Kunden.",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["kennzeichen", "marke", "modell", "baujahr", "leistungPS"],
        "properties": {
          "_id": { "type": "string" },
          "kennzeichen": { "type": "string" },
          "marke": { "type": "string" },
          "modell": { "type": "string" },
          "baujahr": { "type": "integer", "minimum": 1900, "maximum": 2100 },
          "leistungPS": { "type": "integer", "minimum": 1 }
        }
      }
    }
  }
}
```

#### `schema_mechaniker.json`

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "$id": "https://tbz.ch/mechaniker.json",
  "title": "Mechaniker",
  "type": "object",
  "required": [
    "vorname",
    "nachname",
    "spezialisierung",
    "eintrittsdatum",
    "stundenansatz"
  ],
  "properties": {
    "_id": {
      "type": "string",
      "description": "Eindeutige ObjectId des Mechanikers."
    },
    "vorname": {
      "type": "string",
      "description": "Vorname des Mechanikers."
    },
    "nachname": {
      "type": "string",
      "description": "Nachname des Mechanikers."
    },
    "spezialisierung": {
      "type": "string",
      "description": "Fachbereich des Mechanikers."
    },
    "eintrittsdatum": {
      "type": "string",
      "format": "date-time",
      "description": "Eintrittsdatum in die Werkstatt (ISO 8601)."
    },
    "stundenansatz": {
      "type": "number",
      "minimum": 0,
      "description": "Stundenlohn in CHF."
    }
  }
}
```

#### `schema_tuningteil.json`

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "$id": "https://tbz.ch/tuningteil.json",
  "title": "Tuningteil",
  "type": "object",
  "required": [
    "bezeichnung",
    "kategorie",
    "hersteller",
    "preis",
    "lagerbestand"
  ],
  "properties": {
    "_id": {
      "type": "string",
      "description": "Eindeutige ObjectId des Tuningteils."
    },
    "bezeichnung": {
      "type": "string",
      "description": "Produktbezeichnung des Teils."
    },
    "kategorie": {
      "type": "string",
      "enum": [
        "Fahrwerk",
        "Auspuff",
        "Felgen",
        "Chiptuning",
        "Folierung",
        "Bremsen",
        "Motor"
      ],
      "description": "Kategorie des Tuningteils."
    },
    "hersteller": {
      "type": "string",
      "description": "Hersteller des Teils."
    },
    "preis": {
      "type": "number",
      "minimum": 0,
      "description": "Verkaufspreis in CHF."
    },
    "lagerbestand": {
      "type": "integer",
      "minimum": 0,
      "description": "Anzahl Teile im Lager."
    }
  }
}
```

#### `schema_tuningauftrag.json`

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "$id": "https://tbz.ch/tuningauftrag.json",
  "title": "Tuningauftrag",
  "type": "object",
  "required": [
    "bezeichnung",
    "autoId",
    "tuningteilIds",
    "mechanikerIds",
    "auftragsdatum",
    "status",
    "gesamtpreis"
  ],
  "properties": {
    "_id": {
      "type": "string",
      "description": "Eindeutige ObjectId des Auftrags."
    },
    "bezeichnung": {
      "type": "string",
      "description": "Bezeichnung des Auftrags."
    },
    "autoId": {
      "type": "string",
      "description": "Referenz auf das betroffene Fahrzeug (ObjectId als String)."
    },
    "tuningteilIds": {
      "type": "array",
      "description": "Referenzen auf verwendete Tuningteile.",
      "minItems": 1,
      "items": { "type": "string" }
    },
    "mechanikerIds": {
      "type": "array",
      "description": "Referenzen auf zuständige Mechaniker.",
      "minItems": 1,
      "items": { "type": "string" }
    },
    "auftragsdatum": {
      "type": "string",
      "format": "date-time",
      "description": "Datum der Auftragserteilung (ISO 8601)."
    },
    "status": {
      "type": "string",
      "enum": ["A", "F", "S"],
      "description": "Status: A=Aktiv, F=Fertig, S=Storniert."
    },
    "gesamtpreis": {
      "type": "number",
      "minimum": 0,
      "description": "Gesamtpreis des Auftrags in CHF."
    }
  }
}
```

---

## B) Validierung hinterlegen und testen

### B.1 — Neue Rolle für Validierungen

Um Validierungen auf Collections setzen zu dürfen, benötigt der Benutzer die Rolle `dbAdmin` auf der Datenbank `tuningwerkstatt`. Diese wurde dem `admin`-Benutzer mit folgendem Befehl erteilt:

```javascript
use admin

db.grantRolesToUser("admin", [
  { role: "dbAdmin", db: "tuningwerkstatt" }
])
```

| Befehl                             | Funktion                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `db.grantRolesToUser(user, roles)` | Fügt einem bestehenden Benutzer zusätzliche Rollen hinzu.                                                         |
| `{ role: "dbAdmin", db: "..." }`   | Die Rolle `dbAdmin` erlaubt administrative Operationen wie das Setzen von Validierungsregeln auf einer Datenbank. |

![Rolle hinzufügen](./Bilder/B1_rolle_hinzufuegen.png)

Die Shell-Ausgabe `{ ok: 1 }` bestätigt, dass die Rolle erfolgreich vergeben wurde.

---

### B.2 — Validierung via UI (mechaniker)

Die Aufgabenstellung verlangt, dass mindestens eine Validierung über das Compass-UI gesetzt wird. Dies wurde für die Collection `mechaniker` gemacht.

**Vorgehen:**

1. In Compass: `tuningwerkstatt` → `mechaniker` → Tab **Validation**
2. Klick auf **Add rule**
3. Bestehenden Inhalt gelöscht und folgendes Schema eingefügt
4. **Action**: `Error`, **Level**: `Moderate`
5. Klick auf **Apply**

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [
      "vorname",
      "nachname",
      "spezialisierung",
      "eintrittsdatum",
      "stundenansatz"
    ],
    "properties": {
      "vorname": { "bsonType": "string" },
      "nachname": { "bsonType": "string" },
      "spezialisierung": { "bsonType": "string" },
      "eintrittsdatum": { "bsonType": "date" },
      "stundenansatz": { "bsonType": "double", "minimum": 0 }
    }
  }
}
```

![Validierung UI mechaniker](./Bilder/B2_validation_ui_mechaniker.png)

Der Screenshot zeigt die hinterlegte Validierungsregel im Compass-UI mit Action `Error` und Level `Moderate`.

---

### B.3 — Validierungen via Shell (3 Collections)

Die restlichen drei Collections (`kunde`, `tuningteil`, `tuningauftrag`) wurden via `mongosh` mit `db.runCommand()` und `collMod` validiert.

```javascript
use tuningwerkstatt

// === kunde ===
db.runCommand({
  collMod: "kunde",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["vorname", "nachname", "telefon", "kundenSeit", "autos"],
      properties: {
        vorname: { bsonType: "string" },
        nachname: { bsonType: "string" },
        telefon: { bsonType: "string" },
        kundenSeit: { bsonType: "date" },
        autos: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["kennzeichen", "marke", "modell", "baujahr", "leistungPS"],
            properties: {
              kennzeichen: { bsonType: "string" },
              marke: { bsonType: "string" },
              modell: { bsonType: "string" },
              baujahr: { bsonType: "int", minimum: 1900 },
              leistungPS: { bsonType: "int", minimum: 1 }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})

// === tuningteil ===
db.runCommand({
  collMod: "tuningteil",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bezeichnung", "kategorie", "hersteller", "preis", "lagerbestand"],
      properties: {
        bezeichnung: { bsonType: "string" },
        kategorie: {
          bsonType: "string",
          enum: ["Fahrwerk", "Auspuff", "Felgen", "Chiptuning", "Folierung", "Bremsen", "Motor"]
        },
        hersteller: { bsonType: "string" },
        preis: { bsonType: ["double", "int", "long", "decimal"], minimum: 0 },
        lagerbestand: { bsonType: ["int", "long"], minimum: 0 }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})

// === tuningauftrag ===
db.runCommand({
  collMod: "tuningauftrag",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bezeichnung", "autoId", "tuningteilIds", "mechanikerIds", "auftragsdatum", "status", "gesamtpreis"],
      properties: {
        bezeichnung: { bsonType: "string" },
        autoId: { bsonType: "objectId" },
        tuningteilIds: { bsonType: "array", minItems: 1, items: { bsonType: "objectId" } },
        mechanikerIds: { bsonType: "array", minItems: 1, items: { bsonType: "objectId" } },
        auftragsdatum: { bsonType: "date" },
        status: { bsonType: "string", enum: ["A", "F", "S"] },
        gesamtpreis: { bsonType: "double", minimum: 0 }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})
```

| Befehl                              | Funktion                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `db.runCommand({ collMod: "..." })` | Modifiziert eine bestehende Collection. Wird verwendet um Validierungsregeln nachträglich hinzuzufügen oder zu ändern.         |
| `validator: { $jsonSchema: {...} }` | Definiert das Validierungsschema. MongoDB überprüft bei jedem Insert/Update ob das Dokument dem Schema entspricht.             |
| `validationLevel: "moderate"`       | Bestehende Dokumente werden nicht rückwirkend geprüft. Nur neue und geänderte Dokumente müssen das Schema erfüllen.            |
| `validationAction: "error"`         | Bei einem Verstoss wird der Insert/Update mit einem Fehler abgebrochen. Alternative wäre `"warn"` (nur Warnung, kein Abbruch). |

![Validierungen Shell 3 Collections](./Bilder/B3_validation_shell_3collections.png)

Die Ausgabe `{ ok: 1 }` bestätigt, dass die Validierung für `tuningauftrag` (letzte der drei Collections) erfolgreich gesetzt wurde.

---

### B.4 — Bestehende Validierung auslesen

Mit folgendem Befehl kann die hinterlegte Validierung einer Collection ausgelesen werden:

```javascript
db.getCollectionInfos({ name: "kunde" });
```

Dieser Befehl gibt alle Metadaten der Collection zurück, inklusive des `validator`-Blocks mit dem hinterlegten `$jsonSchema`, `validationLevel` und `validationAction`.

![Validierung auslesen](./Bilder/B4_validation_auslesen.png)

Der Screenshot zeigt die vollständige Ausgabe mit dem `validator`-Objekt der Collection `kunde`, inklusive der verschachtelten `autos`-Array-Validierung sowie `validationLevel: 'moderate'` und `validationAction: 'error'`.

---

### B.5 — Ungültiges Dokument einfügen

Um zu zeigen, dass die Validierung aktiv greift, wurde absichtlich ein ungültiges Dokument in die Collection `tuningteil` eingefügt. Das Dokument verletzt zwei Regeln: das Pflichtfeld `preis` fehlt und die Kategorie `"Reifen"` ist nicht im `enum` erlaubt.

```javascript
db.tuningteil.insertOne({
  bezeichnung: "Testfelge",
  kategorie: "Reifen",
  hersteller: "Testmarke",
  lagerbestand: 2,
});
```

![Ungültiges Dokument Fehler](./Bilder/B5_insert_ungueltig_fehler.png)

MongoDB wirft einen `MongoServerError: Document failed validation` und verweigert das Einfügen. Das Dokument wird nicht in die Collection geschrieben.

---

### B.6 — Gültiges Dokument einfügen

Zum Abschluss wurde ein vollständig gültiges Dokument eingefügt, das alle Pflichtfelder enthält und die korrekten Datentypen verwendet:

```javascript
db.tuningteil.insertOne({
  bezeichnung: "OZ Racing Felge 18",
  kategorie: "Felgen",
  hersteller: "OZ Racing",
  preis: NumberDecimal("890.00"),
  lagerbestand: NumberInt(4),
});
```

> **Hinweis:** Da das Schema für `preis` den Typ `double` erwartet, MongoDB den Wert `890.0` aber intern als `int` interpretiert, wurde `NumberDecimal()` verwendet. Das Schema wurde entsprechend angepasst, um `double`, `int`, `long` und `decimal` zu akzeptieren.

![Gültiges Dokument Erfolg](./Bilder/B6_insert_gueltig_erfolg.png)

Die Ausgabe `{ acknowledged: true, insertedId: ObjectId(...) }` bestätigt, dass das Dokument erfolgreich eingefügt wurde. Die Validierung hat das Dokument korrekt akzeptiert.

---

## Abgabe-Dateien

| Datei                                               | Inhalt                                                       |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `Schemas/beispiel_kunde.json`                       | Beispiel-Dokument für die Collection `kunde`                 |
| `Schemas/beispiel_mechaniker.json`                  | Beispiel-Dokument für die Collection `mechaniker`            |
| `Schemas/beispiel_tuningteil.json`                  | Beispiel-Dokument für die Collection `tuningteil`            |
| `Schemas/beispiel_tuningauftrag.json`               | Beispiel-Dokument für die Collection `tuningauftrag`         |
| `Schemas/schema_kunde.json`                         | JSON Schema für die Collection `kunde`                       |
| `Schemas/schema_mechaniker.json`                    | JSON Schema für die Collection `mechaniker`                  |
| `Schemas/schema_tuningteil.json`                    | JSON Schema für die Collection `tuningteil`                  |
| `Schemas/schema_tuningauftrag.json`                 | JSON Schema für die Collection `tuningauftrag`               |
| `Bilder/B1_rolle_hinzufuegen.png`                   | Screenshot: `grantRolesToUser` mit `{ ok: 1 }`               |
| `Bilder/B2_validation_ui_mechaniker.png`            | Screenshot: Validierungsregel im Compass-UI                  |
| `Bilder/B3_validation_shell_3collections.png`       | Screenshot: `collMod` für 3 Collections mit `{ ok: 1 }`      |
| `Bilder/B4_validation_auslesen.png`                 | Screenshot: `getCollectionInfos` Ausgabe mit Validator-Block |
| `Bilder/B5_insert_ungueltig_fehler.png`             | Screenshot: `MongoServerError: Document failed validation`   |
| `Bilder/B6_insert_gueltig_erfolg.png`               | Screenshot: Erfolgreicher Insert mit `acknowledged: true`    |
| `KN-M-06_JSON_Schema_und_Collection_Validierung.md` | Diese Dokumentation                                          |
