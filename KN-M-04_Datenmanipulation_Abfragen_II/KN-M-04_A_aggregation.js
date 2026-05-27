// ============================================================
// KN-M-04 Teil A: Aggregationen
// 4 Aggregations-Pipelines mit den geforderten Stages:
//   A1 — zwei $match hintereinander (ersetzt UND aus KN-M-03 Q4)
//   A2 — $match + $project + $sort
//   A3 — $sum für count + sum
//   A4 — $group (gruppieren nach Status)
// ============================================================

use tuningwerkstatt


// ------------------------------------------------------------
// A1 — Zwei $match-Stages statt $and
// Aufgabe aus KN-M-03 Q4: alle Tuningaufträge mit Status "F" UND gesamtpreis >= 4000
// Statt einer UND-Verknüpfung in find() machen wir hier zwei $match hintereinander
// ------------------------------------------------------------
print("\n=== A1: Zwei $match-Stages (Status F UND Preis >= 4000) ===");
db.tuningauftrag.aggregate([
  { $match: { status: "F" } },
  { $match: { gesamtpreis: { $gte: 4000 } } }
]).forEach(printjson);


// ------------------------------------------------------------
// A2 — $match + $project + $sort
// Tuningteile teurer als 2000 CHF, nur Name/Preis/Kategorie, sortiert nach Preis absteigend
// ------------------------------------------------------------
print("\n=== A2: $match + $project + $sort (Teile > 2000, sortiert) ===");
db.tuningteil.aggregate([
  { $match: { preis: { $gt: 2000 } } },
  { $project: { _id: 0, name: 1, preis: 1, kategorie: 1 } },
  { $sort: { preis: -1 } }
]).forEach(printjson);


// ------------------------------------------------------------
// A3 — $sum für count und sum
// Wie viele Aufträge gibt es insgesamt, und wie hoch ist der Gesamtumsatz?
// $sum: 1 zählt die Dokumente, $sum: "$gesamtpreis" summiert das Feld
// ------------------------------------------------------------
print("\n=== A3: $sum für count und sum (alle Aufträge) ===");
db.tuningauftrag.aggregate([
  {
    $group: {
      _id: null,
      anzahlAuftraege: { $sum: 1 },
      gesamtUmsatz:    { $sum: "$gesamtpreis" }
    }
  }
]).forEach(printjson);


// ------------------------------------------------------------
// A4 — $group nach Status
// Aufträge pro Status gruppieren mit Anzahl und durchschnittlichem Preis
// ------------------------------------------------------------
print("\n=== A4: $group nach Status (Anzahl + Durchschnittspreis) ===");
db.tuningauftrag.aggregate([
  {
    $group: {
      _id: "$status",
      anzahl:           { $sum: 1 },
      durchschnittPreis: { $avg: "$gesamtpreis" }
    }
  },
  { $sort: { _id: 1 } }
]).forEach(printjson);