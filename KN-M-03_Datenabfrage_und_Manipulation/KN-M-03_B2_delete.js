// ============================================================
// KN-M-03 Teil B) Daten loeschen - Skript 2: einzelne Eintraege
//
// Bedingungen:
//  - deleteOne() mit _id-Filterung (1 Datensatz)
//  - deleteMany() mit ODER-Verknuepfung auf mehrere _id's,
//    aber NICHT alle Datensaetze loeschen
//
// Hinweis: Das Skript ist self-contained. Es dropt zuerst,
// fuellt die Daten neu (damit es bekannte _id's gibt) und
// loescht dann gezielt.
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

// ObjectId-Variablen
var kundeMuellerId   = new ObjectId();
var kundeAsaniId     = new ObjectId();
var kundeBucherId    = new ObjectId();

var teilFahrwerkId   = new ObjectId();
var teilAuspuffId    = new ObjectId();
var teilFelgenId     = new ObjectId();
var teilChiptuningId = new ObjectId();
var teilFolierungId  = new ObjectId();

var mechMeyerId      = new ObjectId();
var mechKovacId      = new ObjectId();
var mechSchmidId     = new ObjectId();

db.kunde.insertMany([
    { _id: kundeMuellerId, vorname: "Hans",    nachname: "Mueller", telefon: "0791234567", kundenSeit: new Date("2022-03-15"), autos: [] },
    { _id: kundeAsaniId,   vorname: "Ramadan", nachname: "Asani",   telefon: "0787654321", kundenSeit: new Date("2024-08-01"), autos: [] },
    { _id: kundeBucherId,  vorname: "Lara",    nachname: "Bucher",  telefon: "0764445566", kundenSeit: new Date("2023-11-20"), autos: [] }
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


// ------------------------------------------------------------
// 1) deleteOne() mit _id-Filterung
//    Loescht den Kunden "Bucher" anhand der _id
// ------------------------------------------------------------

print("--- Vor deleteOne(): kunde-Anzahl = " + db.kunde.countDocuments());

db.kunde.deleteOne({ _id: kundeBucherId });

print("--- Nach deleteOne(): kunde-Anzahl = " + db.kunde.countDocuments());


// ------------------------------------------------------------
// 2) deleteMany() mit ODER-Verknuepfung auf mehrere _id's
//    Loescht zwei der fuenf Tuningteile (Felgen + Folierung)
//    -> NICHT alle, sondern nur die in der ODER-Liste
// ------------------------------------------------------------

print("--- Vor deleteMany(): tuningteil-Anzahl = " + db.tuningteil.countDocuments());

db.tuningteil.deleteMany({
    $or: [
        { _id: teilFelgenId },
        { _id: teilFolierungId }
    ]
});

print("--- Nach deleteMany(): tuningteil-Anzahl = " + db.tuningteil.countDocuments());


print("=== Loesch-Operationen abgeschlossen ===");
