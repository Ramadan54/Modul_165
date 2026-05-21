// ============================================================
// KN-M-03 Teil A) Daten hinzufuegen
// Tuning-Werkstatt - 4 Collections: kunde, tuningteil, mechaniker, tuningauftrag
//
// Bedingungen:
//  - ObjectId() fuer alle _id
//  - Immer Variablen fuer ObjectIds (keine Hartcodierung)
//  - Mindestens 1x insertOne()
//  - Mindestens 1x insertMany()
//
// VOR der Ausfuehrung in mongosh: `use tuningwerkstatt` separat absetzen.
// ============================================================


// ------------------------------------------------------------
// 1) ObjectId-Variablen fuer alle Dokumente
// ------------------------------------------------------------

// Kunden
var kundeMuellerId   = new ObjectId();
var kundeAsaniId     = new ObjectId();
var kundeBucherId    = new ObjectId();

// Eingebettete Autos (brauchen eigene _id fuer die Referenz aus tuningauftrag)
var autoMuellerGolfId   = new ObjectId();
var autoMuellerBmwId    = new ObjectId();
var autoAsaniMercId     = new ObjectId();
var autoBucherAudiId    = new ObjectId();

// Tuningteile
var teilFahrwerkId   = new ObjectId();
var teilAuspuffId    = new ObjectId();
var teilFelgenId     = new ObjectId();
var teilChiptuningId = new ObjectId();
var teilFolierungId  = new ObjectId();

// Mechaniker
var mechMeyerId      = new ObjectId();
var mechKovacId      = new ObjectId();
var mechSchmidId     = new ObjectId();

// Tuningauftraege
var auftragAmgId     = new ObjectId();
var auftragFahrwerkId = new ObjectId();
var auftragAuspuffId = new ObjectId();
var auftragFolieId   = new ObjectId();


// ------------------------------------------------------------
// 2) Collection "kunde" - insertMany() mit eingebetteten Autos
// ------------------------------------------------------------

db.kunde.insertMany([
    {
        _id: kundeMuellerId,
        vorname: "Hans",
        nachname: "Mueller",
        telefon: "0791234567",
        kundenSeit: new Date("2022-03-15"),
        autos: [
            {
                _id: autoMuellerGolfId,
                kennzeichen: "ZH 123456",
                marke: "Volkswagen",
                modell: "Golf GTI",
                baujahr: 2019,
                leistungPS: 245
            },
            {
                _id: autoMuellerBmwId,
                kennzeichen: "ZH 654321",
                marke: "BMW",
                modell: "M3 Competition",
                baujahr: 2021,
                leistungPS: 510
            }
        ]
    },
    {
        _id: kundeAsaniId,
        vorname: "Ramadan",
        nachname: "Asani",
        telefon: "0787654321",
        kundenSeit: new Date("2024-08-01"),
        autos: [
            {
                _id: autoAsaniMercId,
                kennzeichen: "ZH 555888",
                marke: "Mercedes-Benz",
                modell: "A-Klasse",
                baujahr: 2020,
                leistungPS: 224
            }
        ]
    },
    {
        _id: kundeBucherId,
        vorname: "Lara",
        nachname: "Bucher",
        telefon: "0764445566",
        kundenSeit: new Date("2023-11-20"),
        autos: [
            {
                _id: autoBucherAudiId,
                kennzeichen: "AG 998877",
                marke: "Audi",
                modell: "RS3",
                baujahr: 2022,
                leistungPS: 400
            }
        ]
    }
]);


// ------------------------------------------------------------
// 3) Collection "tuningteil" - insertMany()
// ------------------------------------------------------------

db.tuningteil.insertMany([
    {
        _id: teilFahrwerkId,
        name: "KW Gewindefahrwerk V3",
        hersteller: "KW Suspensions",
        preis: 2450.00,
        kategorie: "Fahrwerk"
    },
    {
        _id: teilAuspuffId,
        name: "Akrapovic Evolution Line",
        hersteller: "Akrapovic",
        preis: 3890.00,
        kategorie: "Auspuff"
    },
    {
        _id: teilFelgenId,
        name: "BBS CH-R 19 Zoll",
        hersteller: "BBS",
        preis: 4200.00,
        kategorie: "Felgen"
    },
    {
        _id: teilChiptuningId,
        name: "Stage 2 Chiptuning",
        hersteller: "APR Tuning",
        preis: 1290.00,
        kategorie: "Motor"
    },
    {
        _id: teilFolierungId,
        name: "Vollfolierung Matt-Schwarz",
        hersteller: "3M",
        preis: 2800.00,
        kategorie: "Folierung"
    }
]);


// ------------------------------------------------------------
// 4) Collection "mechaniker" - insertMany()
// ------------------------------------------------------------

db.mechaniker.insertMany([
    {
        _id: mechMeyerId,
        vorname: "Thomas",
        nachname: "Meyer",
        spezialisierung: "Fahrwerktechnik",
        eintrittsdatum: new Date("2018-06-01")
    },
    {
        _id: mechKovacId,
        vorname: "Marko",
        nachname: "Kovac",
        spezialisierung: "Motorelektronik",
        eintrittsdatum: new Date("2020-09-15")
    },
    {
        _id: mechSchmidId,
        vorname: "Daniela",
        nachname: "Schmid",
        spezialisierung: "Folierung",
        eintrittsdatum: new Date("2023-02-10")
    }
]);


// ------------------------------------------------------------
// 5) Collection "tuningauftrag"
//    - 1x insertOne()  (Pflicht aus Aufgabe)
//    - 1x insertMany() fuer die restlichen
// ------------------------------------------------------------

// insertOne() - ein einzelner Auftrag
db.tuningauftrag.insertOne({
    _id: auftragAmgId,
    autoId: autoAsaniMercId,
    bezeichnung: "AMG-Styling Paket einbauen",
    startDatum: new Date("2025-09-12"),
    gesamtpreis: 5400.00,
    status: "F",
    tuningteilIds: [teilFelgenId, teilFolierungId],
    mechanikerIds: [mechSchmidId]
});

// insertMany() - drei weitere Auftraege
db.tuningauftrag.insertMany([
    {
        _id: auftragFahrwerkId,
        autoId: autoMuellerGolfId,
        bezeichnung: "Tieferlegung mit Gewindefahrwerk",
        startDatum: new Date("2025-11-03"),
        gesamtpreis: 3100.00,
        status: "A",
        tuningteilIds: [teilFahrwerkId],
        mechanikerIds: [mechMeyerId]
    },
    {
        _id: auftragAuspuffId,
        autoId: autoMuellerBmwId,
        bezeichnung: "Akrapovic Auspuff + Chiptuning",
        startDatum: new Date("2026-01-20"),
        gesamtpreis: 5800.00,
        status: "O",
        tuningteilIds: [teilAuspuffId, teilChiptuningId],
        mechanikerIds: [mechKovacId, mechMeyerId]
    },
    {
        _id: auftragFolieId,
        autoId: autoBucherAudiId,
        bezeichnung: "Komplettfolierung matt-schwarz",
        startDatum: new Date("2026-04-08"),
        gesamtpreis: 3200.00,
        status: "F",
        tuningteilIds: [teilFolierungId],
        mechanikerIds: [mechSchmidId]
    }
]);


// ------------------------------------------------------------
// 6) Kontrolle
// ------------------------------------------------------------

print("=== Kontrolle Anzahl Dokumente pro Collection ===");
print("kunde:         " + db.kunde.countDocuments());
print("tuningteil:    " + db.tuningteil.countDocuments());
print("mechaniker:    " + db.mechaniker.countDocuments());
print("tuningauftrag: " + db.tuningauftrag.countDocuments());
