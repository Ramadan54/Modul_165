// ============================================================
// KN-M-04 Teil B: Join-Aggregation mit $lookup
// 2 Pipelines:
//   B1 — einfacher $lookup: tuningauftrag -> tuningteil
//   B2 — $lookup + $match + $project: nur teure Teile, geflachte Ausgabe
// ============================================================

use tuningwerkstatt


// ------------------------------------------------------------
// B1 — Einfacher $lookup
// Jeder Tuningauftrag bekommt die vollständigen Tuningteil-Dokumente angehängt
// Felder aus beiden Collections im Resultat: bezeichnung (auftrag) + teile (lookup)
// ------------------------------------------------------------
print("\n=== B1: Einfacher $lookup (Auftrag + zugehörige Tuningteile) ===");
db.tuningauftrag.aggregate([
  {
    $lookup: {
      from:         "tuningteil",       // Ziel-Collection
      localField:   "tuningteilIds",    // Feld im Auftrag (Array von ObjectIds)
      foreignField: "_id",              // Feld in tuningteil
      as:           "teile"             // Name des neuen Array-Feldes
    }
  },
  {
    $project: {
      _id: 0,
      bezeichnung:  1,
      gesamtpreis:  1,
      status:       1,
      "teile.name":       1,
      "teile.preis":      1,
      "teile.kategorie":  1
    }
  }
]).forEach(printjson);


// ------------------------------------------------------------
// B2 — $lookup + Filterung
// Aufträge joinen mit Mechanikern, dann nur Aufträge behalten,
// bei denen mindestens ein zugewiesener Mechaniker "Fahrwerktechnik" als
// Spezialisierung enthält. $unwind flacht das mechaniker-Array auf.
// ------------------------------------------------------------
print("\n=== B2: $lookup + $match + $project (Aufträge mit Fahrwerktechnik-Mechaniker) ===");
db.tuningauftrag.aggregate([
  {
    $lookup: {
      from:         "mechaniker",
      localField:   "mechanikerIds",
      foreignField: "_id",
      as:           "mechaniker"
    }
  },
  { $unwind: "$mechaniker" },
  { $match: { "mechaniker.spezialisierung": { $regex: "Fahrwerktechnik" } } },
  {
    $project: {
      _id: 0,
      bezeichnung:               1,
      status:                    1,
      "mechaniker.vorname":          1,
      "mechaniker.nachname":         1,
      "mechaniker.spezialisierung":  1
    }
  }
]).forEach(printjson);