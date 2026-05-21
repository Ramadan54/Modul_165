// ============================================================
// KN-M-03 Teil D) Daten veraendern
//
// Bedingungen:
//  - Die 3 Befehle auf UNTERSCHIEDLICHEN Collections
//  - updateOne() mit _id-Filterung
//  - updateMany() OHNE _id, mit ODER-Verknuepfung,
//    veraendert tatsaechlich mehr als 1 Datensatz
//  - replaceOne() um ein Dokument zu ersetzen
//
// Aufteilung:
//   updateOne()  -> Collection "mechaniker"   (mit _id)
//   updateMany() -> Collection "tuningteil"   (OR auf kategorie)
//   replaceOne() -> Collection "kunde"
//
// Skript ist self-contained -> dropt zuerst, fuellt neu.
//
// VOR der Ausfuehrung in mongosh: `use tuningwerkstatt` separat absetzen.
// ============================================================


// ------------------------------------------------------------
// 0) Aufraeumen und Daten neu einfuegen
// ------------------------------------------------------------

db.kunde.drop();
db.tuningteil.drop();
db.mechaniker.drop();
db.tuningauftrag.drop();

var kundeMuellerId   = new ObjectId();
var kundeAsaniId     = new ObjectId();
var kundeBucherId    = new ObjectId();

var autoMuellerGolfId = new ObjectId();
var autoAsaniMercId   = new ObjectId();
var autoBucherAudiId  = new ObjectId();

var teilFahrwerkId   = new ObjectId();
var teilAuspuffId    = new ObjectId();
var teilFelgenId     = new ObjectId();
var teilChiptuningId = new ObjectId();
var teilFolierungId  = new ObjectId();

var mechMeyerId      = new ObjectId();
var mechKovacId      = new ObjectId();
var mechSchmidId     = new ObjectId();

db.kunde.insertMany([
    { _id: kundeMuellerId, vorname: "Hans",    nachname: "Mueller", telefon: "0791234567", kundenSeit: new Date("2022-03-15"),
      autos: [ { _id: autoMuellerGolfId, kennzeichen: "ZH 123456", marke: "Volkswagen", modell: "Golf GTI", baujahr: 2019, leistungPS: 245 } ] },
    { _id: kundeAsaniId,   vorname: "Ramadan", nachname: "Asani",   telefon: "0787654321", kundenSeit: new Date("2024-08-01"),
      autos: [ { _id: autoAsaniMercId,   kennzeichen: "ZH 555888", marke: "Mercedes-Benz", modell: "A-Klasse", baujahr: 2020, leistungPS: 224 } ] },
    { _id: kundeBucherId,  vorname: "Lara",    nachname: "Bucher",  telefon: "0764445566", kundenSeit: new Date("2023-11-20"),
      autos: [ { _id: autoBucherAudiId,  kennzeichen: "AG 998877", marke: "Audi", modell: "RS3", baujahr: 2022, leistungPS: 400 } ] }
]);

db.tuningteil.insertMany([
    { _id: teilFahrwerkId,   name: "KW Gewindefahrwerk V3",       hersteller: "KW Suspensions", preis: 2450.00, kategorie: "Fahrwerk" },
    { _id: teilAuspuffId,    name: "Akrapovic Evolution Line",    hersteller: "Akrapovic",      preis: 3890.00, kategorie: "Auspuff" },
    { _id: teilFelgenId,     name: "BBS CH-R 19 Zoll",            hersteller: "BBS",            preis: 4200.00, kategorie: "Felgen" },
    { _id: teilChiptuningId, name: "Stage 2 Chiptuning",          hersteller: "APR Tuning",     preis: 1290.00, kategorie: "Motor" },
    { _id: teilFolierungId,  name: "Vollfolierung Matt-Schwarz",  hersteller: "3M",             preis: 2800.00, kategorie: "Folierung" }
]);

db.mechaniker.insertMany([
    { _id: mechMeyerId,  vorname: "Thomas",  nachname: "Meyer",  spezialisierung: "Fahrwerktechnik", eintrittsdatum: new Date("2018-06-01") },
    { _id: mechKovacId,  vorname: "Marko",   nachname: "Kovac",  spezialisierung: "Motorelektronik", eintrittsdatum: new Date("2020-09-15") },
    { _id: mechSchmidId, vorname: "Daniela", nachname: "Schmid", spezialisierung: "Folierung",       eintrittsdatum: new Date("2023-02-10") }
]);


// ============================================================
// UPDATES
// ============================================================


// ------------------------------------------------------------
// U1) updateOne() auf Collection "mechaniker" mit _id
//     Mechaniker Meyer bekommt eine zusaetzliche Spezialisierung
//     und ein neues Feld "telefon".
// ------------------------------------------------------------

print("=== U1: updateOne() auf mechaniker mit _id ===");
print("Vorher:");
printjson(db.mechaniker.findOne({ _id: mechMeyerId }));

db.mechaniker.updateOne(
    { _id: mechMeyerId },
    {
        $set: {
            spezialisierung: "Fahrwerktechnik & Bremsen",
            telefon: "0445551122"
        }
    }
);

print("Nachher:");
printjson(db.mechaniker.findOne({ _id: mechMeyerId }));


// ------------------------------------------------------------
// U2) updateMany() auf Collection "tuningteil"
//     OHNE _id, mit ODER-Verknuepfung, veraendert > 1 Datensatz
//
//     Alle Teile der Kategorie "Auspuff" ODER "Fahrwerk"
//     bekommen 10% Preisaufschlag und ein Feld "preisUpdate".
//     -> Trifft Akrapovic (Auspuff) und KW Fahrwerk -> 2 Datensaetze.
// ------------------------------------------------------------

print("\n=== U2: updateMany() auf tuningteil (OR auf kategorie) ===");
print("Vorher:");
db.tuningteil.find(
    { $or: [ { kategorie: "Auspuff" }, { kategorie: "Fahrwerk" } ] }
).forEach(printjson);

var u2Result = db.tuningteil.updateMany(
    {
        $or: [
            { kategorie: "Auspuff" },
            { kategorie: "Fahrwerk" }
        ]
    },
    {
        $mul: { preis: 1.10 },
        $set: { preisUpdate: new Date() }
    }
);

print("Geaenderte Anzahl: " + u2Result.modifiedCount);
print("Nachher:");
db.tuningteil.find(
    { $or: [ { kategorie: "Auspuff" }, { kategorie: "Fahrwerk" } ] }
).forEach(printjson);


// ------------------------------------------------------------
// U3) replaceOne() auf Collection "kunde"
//     Ersetzt den Kunden "Bucher" komplett mit neuen Werten
//     (z.B. Heirat -> anderer Nachname, neue Telefonnummer,
//      anderes Auto). Das alte Dokument wird vollstaendig ersetzt.
// ------------------------------------------------------------

print("\n=== U3: replaceOne() auf kunde ===");
print("Vorher:");
printjson(db.kunde.findOne({ nachname: "Bucher" }));

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
                leistungPS: 510
            }
        ]
    }
);

print("Nachher:");
printjson(db.kunde.findOne({ nachname: "Steiner" }));


print("\n=== Alle Update-Operationen abgeschlossen ===");
