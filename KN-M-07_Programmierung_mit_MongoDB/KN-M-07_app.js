// ============================================================
// M165 - KN-M-07: Programmierung mit MongoDB
// Autor: Ramadan Asani
//
// Zugriff auf die Datenbank "tuningwerkstatt" mit dem
// offiziellen Node.js-Treiber (npm-Paket "mongodb").
//
// Ausfuehren mit:   node KN-M-07_app.js
// ============================================================

const { MongoClient } = require("mongodb");

// ------------------------------------------------------------
// Verbindungs-Konfiguration
// WICHTIG: Die EC2-Instance hat keine Elastic IP, d.h. bei
// jedem Stop/Start aendert sich die Public IPv4-Adresse.
// Vor dem Ausfuehren die aktuelle IP unten eintragen!
// ------------------------------------------------------------
const IP = "54.175.153.86"; // <-- aktuelle Public IPv4 der EC2-Instance
const uri = `mongodb://admin:M165_TBZ_2026!@${IP}:27017/?authSource=admin`;

const DB_NAME = "tuningwerkstatt";

async function main() {
  // Der Treiber verwaltet den Connection-Pool. Ein Client genuegt
  // fuer die ganze Applikation.
  const client = new MongoClient(uri);

  try {
    // === VERBINDUNG =========================================
    await client.connect();
    await client.db(DB_NAME).command({ ping: 1 }); // testet, ob der Server antwortet
    console.log("=== VERBINDUNG ===");
    console.log("Verbindung zum MongoDB-Server erfolgreich hergestellt.");
    console.log("Datenbank:", DB_NAME);
    console.log("");

    // Datenbank- und Collection-Handles holen
    const db = client.db(DB_NAME);
    const kunde = db.collection("kunde");
    const tuningteil = db.collection("tuningteil");
    const tuningauftrag = db.collection("tuningauftrag");
    const mechaniker = db.collection("mechaniker");

    // === READ 1: Anzahl Dokumente pro Collection ============
    console.log("=== READ 1: Anzahl Dokumente pro Collection ===");
    console.log("kunde:        ", await kunde.countDocuments());
    console.log("tuningteil:   ", await tuningteil.countDocuments());
    console.log("tuningauftrag:", await tuningauftrag.countDocuments());
    console.log("mechaniker:   ", await mechaniker.countDocuments());
    console.log("");

    // === READ 2: find() mit Filter + Projektion =============
    // Entspricht der Abfrage C2 aus KN-M-04:
    // alle Kunden mit mindestens einem Auto ueber 400 PS.
    console.log("=== READ 2: Kunden mit einem Auto ueber 400 PS ===");
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
        }
      )
      .toArray();
    console.log(JSON.stringify(starkeAutos, null, 2));
    console.log("");

    // === WRITE 1: insertOne() ===============================
    // Fuegt einen gueltigen Tuningteil-Datensatz ein, der die
    // Validierungsregel aus KN-M-06 erfuellt (kategorie im enum,
    // preis als double, lagerbestand als int).
    console.log("=== WRITE 1: insertOne() ===");
    const insertRes = await tuningteil.insertOne({
      bezeichnung: "Brembo GT Bremsanlage",
      kategorie: "Bremsen",
      hersteller: "Brembo",
      preis: 3290.5, // Kommazahl -> wird vom Treiber als BSON-double abgelegt
      lagerbestand: 4, // Ganzzahl  -> wird vom Treiber als BSON-int32 abgelegt
    });
    const neueId = insertRes.insertedId;
    console.log("Eingefuegt mit _id:", neueId.toString());
    console.log("");

    // === WRITE 2: updateOne() ===============================
    // Erhoeht den Preis des soeben eingefuegten Teils um 10%.
    console.log("=== WRITE 2: updateOne() (+10% Preis) ===");
    const updateRes = await tuningteil.updateOne(
      { _id: neueId },
      { $mul: { preis: 1.1 } }
    );
    console.log(
      "matchedCount:",
      updateRes.matchedCount,
      "| modifiedCount:",
      updateRes.modifiedCount
    );
    const nachUpdate = await tuningteil.findOne({ _id: neueId });
    console.log("Neuer Preis:", nachUpdate.preis);
    console.log("");

    // === WRITE 3: deleteOne() ===============================
    // Entfernt den Demo-Datensatz wieder, damit die Datenbank
    // am Ende unveraendert auf dem Stand von vorher ist.
    console.log("=== WRITE 3: deleteOne() (Demo-Datensatz entfernen) ===");
    const deleteRes = await tuningteil.deleteOne({ _id: neueId });
    console.log("deletedCount:", deleteRes.deletedCount);
    console.log("tuningteil danach:", await tuningteil.countDocuments(), "Dokumente");
    console.log("");

    // === AGGREGATION: $group nach Status ====================
    // Entspricht der Pipeline A4 aus KN-M-04:
    // Auftraege nach Status gruppieren, Anzahl + Durchschnittspreis.
    console.log("=== AGGREGATION: Auftraege gruppiert nach Status ===");
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
    console.log("");

    console.log("=== Alle Operationen erfolgreich abgeschlossen ===");
  } catch (err) {
    // Zentrale Fehlerbehandlung: gibt die Fehlermeldung des Treibers aus.
    console.error("FEHLER:", err.message);
  } finally {
    // Verbindung in jedem Fall sauber schliessen.
    await client.close();
    console.log("Verbindung geschlossen.");
  }
}

main();
