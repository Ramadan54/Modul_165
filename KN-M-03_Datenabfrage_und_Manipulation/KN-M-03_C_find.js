// ============================================================
// KN-M-03 Teil C) Daten abfragen mit find()
//
// Bedingungen:
//  - mind. 1 Abfrage pro Collection (4 Collections)
//  - mind. 1x Filterung auf DateTime
//  - mind. 1x ODER, NICHT auf _id
//  - mind. 1x UND, NICHT auf der gleichen Collection wie ODER
//  - mind. 1x Regex (Teilstring)
//  - mind. 1x Projektion MIT _id
//  - mind. 1x Projektion OHNE _id
//
// Hinweis: Skript ist self-contained -> dropt zuerst, fuellt neu, fragt ab.
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
var autoMuellerBmwId  = new ObjectId();
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

var auftragAmgId      = new ObjectId();
var auftragFahrwerkId = new ObjectId();
var auftragAuspuffId  = new ObjectId();
var auftragFolieId    = new ObjectId();

db.kunde.insertMany([
    {
        _id: kundeMuellerId, vorname: "Hans", nachname: "Mueller",
        telefon: "0791234567", kundenSeit: new Date("2022-03-15"),
        autos: [
            { _id: autoMuellerGolfId, kennzeichen: "ZH 123456", marke: "Volkswagen",    modell: "Golf GTI",        baujahr: 2019, leistungPS: 245 },
            { _id: autoMuellerBmwId,  kennzeichen: "ZH 654321", marke: "BMW",           modell: "M3 Competition",  baujahr: 2021, leistungPS: 510 }
        ]
    },
    {
        _id: kundeAsaniId, vorname: "Ramadan", nachname: "Asani",
        telefon: "0787654321", kundenSeit: new Date("2024-08-01"),
        autos: [
            { _id: autoAsaniMercId, kennzeichen: "ZH 555888", marke: "Mercedes-Benz", modell: "A-Klasse", baujahr: 2020, leistungPS: 224 }
        ]
    },
    {
        _id: kundeBucherId, vorname: "Lara", nachname: "Bucher",
        telefon: "0764445566", kundenSeit: new Date("2023-11-20"),
        autos: [
            { _id: autoBucherAudiId, kennzeichen: "AG 998877", marke: "Audi", modell: "RS3", baujahr: 2022, leistungPS: 400 }
        ]
    }
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

db.tuningauftrag.insertMany([
    { _id: auftragAmgId,      autoId: autoAsaniMercId,    bezeichnung: "AMG-Styling Paket einbauen",      startDatum: new Date("2025-09-12"), gesamtpreis: 5400.00, status: "F", tuningteilIds: [teilFelgenId, teilFolierungId], mechanikerIds: [mechSchmidId] },
    { _id: auftragFahrwerkId, autoId: autoMuellerGolfId,  bezeichnung: "Tieferlegung mit Gewindefahrwerk", startDatum: new Date("2025-11-03"), gesamtpreis: 3100.00, status: "A", tuningteilIds: [teilFahrwerkId],                mechanikerIds: [mechMeyerId] },
    { _id: auftragAuspuffId,  autoId: autoMuellerBmwId,   bezeichnung: "Akrapovic Auspuff + Chiptuning",   startDatum: new Date("2026-01-20"), gesamtpreis: 5800.00, status: "O", tuningteilIds: [teilAuspuffId, teilChiptuningId], mechanikerIds: [mechKovacId, mechMeyerId] },
    { _id: auftragFolieId,    autoId: autoBucherAudiId,   bezeichnung: "Komplettfolierung matt-schwarz",   startDatum: new Date("2026-04-08"), gesamtpreis: 3200.00, status: "F", tuningteilIds: [teilFolierungId],               mechanikerIds: [mechSchmidId] }
]);


// ============================================================
// ABFRAGEN
// ============================================================


// ------------------------------------------------------------
// Q1) Collection "kunde" - REGEX + Projektion MIT _id
//     Suche alle Kunden deren Nachname die Buchstaben "uell"
//     enthaelt (findet "Mueller"). Projection zeigt _id, vorname, nachname.
// ------------------------------------------------------------

print("=== Q1: kunde - Regex auf nachname (enthaelt 'uell') ===");
db.kunde.find(
    { nachname: { $regex: "uell" } },
    { _id: 1, vorname: 1, nachname: 1 }
).forEach(printjson);


// ------------------------------------------------------------
// Q2) Collection "tuningteil" - ODER-Verknuepfung (NICHT auf _id)
//     Alle Teile, die Kategorie "Auspuff" ODER "Fahrwerk" haben.
//     Projektion OHNE _id (nur name, preis, kategorie).
// ------------------------------------------------------------

print("\n=== Q2: tuningteil - OR auf kategorie (Auspuff oder Fahrwerk) ===");
db.tuningteil.find(
    {
        $or: [
            { kategorie: "Auspuff" },
            { kategorie: "Fahrwerk" }
        ]
    },
    { _id: 0, name: 1, preis: 1, kategorie: 1 }
).forEach(printjson);


// ------------------------------------------------------------
// Q3) Collection "mechaniker" - Filterung auf DateTime
//     Alle Mechaniker, die seit dem 01.01.2020 oder spaeter
//     bei der Werkstatt arbeiten.
// ------------------------------------------------------------

print("\n=== Q3: mechaniker - DateTime-Filter (eintrittsdatum >= 2020-01-01) ===");
db.mechaniker.find(
    { eintrittsdatum: { $gte: new Date("2020-01-01") } }
).forEach(printjson);


// ------------------------------------------------------------
// Q4) Collection "tuningauftrag" - UND-Verknuepfung
//     (andere Collection als die ODER in Q2)
//     Alle Auftraege mit status "F" UND gesamtpreis >= 4000.
// ------------------------------------------------------------

print("\n=== Q4: tuningauftrag - AND (status='F' UND gesamtpreis >= 4000) ===");
db.tuningauftrag.find(
    {
        $and: [
            { status: "F" },
            { gesamtpreis: { $gte: 4000 } }
        ]
    }
).forEach(printjson);
