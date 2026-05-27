// ============================================================
// KN-M-04 Setup-Skript
// Dropt alle Collections und füllt sie mit Testdaten neu
// Identisch zu KN-M-03 Teil A, damit alle Abfragen reproduzierbar sind
// ============================================================

use tuningwerkstatt

// --- 1. Alles droppen ---
db.kunde.drop();
db.tuningteil.drop();
db.mechaniker.drop();
db.tuningauftrag.drop();

// --- 2. ObjectId-Variablen vorab anlegen ---
var kundeMuellerId = new ObjectId();
var kundeBucherId  = new ObjectId();
var kundeKellerId  = new ObjectId();

var autoMuellerGolfId  = new ObjectId();
var autoMuellerAudiId  = new ObjectId();
var autoBucherAudiId   = new ObjectId();
var autoKellerBMWId    = new ObjectId();

var teilFahrwerkId   = new ObjectId();
var teilAuspuffId    = new ObjectId();
var teilFelgenId     = new ObjectId();
var teilChiptuningId = new ObjectId();
var teilFolierungId  = new ObjectId();

var mechMeyerId  = new ObjectId();
var mechKovacId  = new ObjectId();
var mechSchmidId = new ObjectId();

var auftragAMGId       = new ObjectId();
var auftragFahrwerkId  = new ObjectId();
var auftragAuspuffId   = new ObjectId();
var auftragFolierungId = new ObjectId();

// --- 3. Kunden mit eingebetteten Autos ---
db.kunde.insertMany([
  {
    _id: kundeMuellerId,
    vorname: "Hans",
    nachname: "Mueller",
    telefon: "0791234567",
    kundenSeit: new Date("2022-03-15"),
    autos: [
      { _id: autoMuellerGolfId, kennzeichen: "ZH 123456", marke: "VW",       modell: "Golf GTI",   baujahr: 2019, leistungPS: 245 },
      { _id: autoMuellerAudiId, kennzeichen: "ZH 654321", marke: "Audi",     modell: "RS6",        baujahr: 2021, leistungPS: 600 }
    ]
  },
  {
    _id: kundeBucherId,
    vorname: "Lara",
    nachname: "Bucher",
    telefon: "0789876543",
    kundenSeit: new Date("2023-11-20"),
    autos: [
      { _id: autoBucherAudiId, kennzeichen: "ZH 999888", marke: "Audi",     modell: "RS3",        baujahr: 2022, leistungPS: 400 }
    ]
  },
  {
    _id: kundeKellerId,
    vorname: "Marco",
    nachname: "Keller",
    telefon: "0775556677",
    kundenSeit: new Date("2024-01-10"),
    autos: [
      { _id: autoKellerBMWId, kennzeichen: "ZH 111222", marke: "BMW",      modell: "M3 Competition", baujahr: 2023, leistungPS: 510 }
    ]
  }
]);

// --- 4. Tuningteile ---
db.tuningteil.insertMany([
  { _id: teilFahrwerkId,   name: "KW Gewindefahrwerk V3", hersteller: "KW Suspensions", preis: 2800.00, kategorie: "Fahrwerk" },
  { _id: teilAuspuffId,    name: "Akrapovic Evolution",   hersteller: "Akrapovic",      preis: 3500.00, kategorie: "Auspuff" },
  { _id: teilFelgenId,     name: "BBS CH-R 20 Zoll",      hersteller: "BBS",            preis: 2400.00, kategorie: "Felgen" },
  { _id: teilChiptuningId, name: "Stage 2 Chiptuning",    hersteller: "APR",            preis: 1500.00, kategorie: "Chiptuning" },
  { _id: teilFolierungId,  name: "Vollfolierung matt",    hersteller: "3M",             preis: 2200.00, kategorie: "Folierung" }
]);

// --- 5. Mechaniker ---
db.mechaniker.insertMany([
  { _id: mechMeyerId,  vorname: "Thomas",  nachname: "Meyer",  spezialisierung: "Fahrwerktechnik",  eintrittsdatum: new Date("2018-06-01") },
  { _id: mechKovacId,  vorname: "Marko",   nachname: "Kovac",  spezialisierung: "Motorelektronik",  eintrittsdatum: new Date("2020-09-15") },
  { _id: mechSchmidId, vorname: "Daniela", nachname: "Schmid", spezialisierung: "Karosserie & Folierung", eintrittsdatum: new Date("2023-02-20") }
]);

// --- 6. Tuningaufträge (mit Referenzen) ---
db.tuningauftrag.insertOne({
  _id: auftragAMGId,
  autoId: autoMuellerAudiId,
  bezeichnung: "AMG-Styling Paket einbauen",
  startDatum: new Date("2025-09-10"),
  gesamtpreis: 5400.00,
  status: "F",
  tuningteilIds: [teilFelgenId, teilAuspuffId],
  mechanikerIds: [mechMeyerId, mechKovacId]
});

db.tuningauftrag.insertMany([
  {
    _id: auftragFahrwerkId,
    autoId: autoMuellerGolfId,
    bezeichnung: "Tieferlegung mit Gewindefahrwerk",
    startDatum: new Date("2025-11-05"),
    gesamtpreis: 3200.00,
    status: "A",
    tuningteilIds: [teilFahrwerkId],
    mechanikerIds: [mechMeyerId]
  },
  {
    _id: auftragAuspuffId,
    autoId: autoBucherAudiId,
    bezeichnung: "Akrapovic-Auspuff Einbau",
    startDatum: new Date("2026-01-20"),
    gesamtpreis: 4100.00,
    status: "O",
    tuningteilIds: [teilAuspuffId],
    mechanikerIds: [mechKovacId]
  },
  {
    _id: auftragFolierungId,
    autoId: autoKellerBMWId,
    bezeichnung: "Vollfolierung schwarz matt",
    startDatum: new Date("2026-02-15"),
    gesamtpreis: 3200.00,
    status: "F",
    tuningteilIds: [teilFolierungId],
    mechanikerIds: [mechSchmidId]
  }
]);

// --- 7. Kontrolle ---
print("=== Setup abgeschlossen ===");
print("kunde:         " + db.kunde.countDocuments());
print("tuningteil:    " + db.tuningteil.countDocuments());
print("mechaniker:    " + db.mechaniker.countDocuments());
print("tuningauftrag: " + db.tuningauftrag.countDocuments());