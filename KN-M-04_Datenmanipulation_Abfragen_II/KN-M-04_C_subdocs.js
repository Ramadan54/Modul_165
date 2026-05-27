// ============================================================
// KN-M-04 Teil C: Unter-Dokumente / Arrays
// 3 Abfragen auf das eingebettete autos[]-Array in der Collection kunde:
//   C1 — nur einzelne Felder der Subdokumente ausgeben (Projektion)
//   C2 — nach Feldern von Subdokumenten filtern
//   C3 — $unwind, um das Array zu "verflachen"
// ============================================================

use tuningwerkstatt


// ------------------------------------------------------------
// C1 — Nur einzelne Felder der Subdokumente ausgeben
// Wir wollen pro Kunde nur den Nachnamen und aus jedem eingebetteten Auto
// nur marke und modell sehen — alles andere wird unterdrückt
// ------------------------------------------------------------
print("\n=== C1: Nur einzelne Subdokument-Felder (marke, modell pro Kunde) ===");
db.kunde.find(
  {},
  { _id: 0, nachname: 1, "autos.marke": 1, "autos.modell": 1 }
).forEach(printjson);


// ------------------------------------------------------------
// C2 — Nach Feldern von Subdokumenten filtern
// Finde alle Kunden, die mindestens ein Auto mit mehr als 400 PS besitzen
// "autos.leistungPS" greift in das eingebettete Array hinein
// ------------------------------------------------------------
print("\n=== C2: Filter auf Subdokument-Feld (Autos mit > 400 PS) ===");
db.kunde.find(
  { "autos.leistungPS": { $gt: 400 } },
  { _id: 0, nachname: 1, "autos.marke": 1, "autos.modell": 1, "autos.leistungPS": 1 }
).forEach(printjson);


// ------------------------------------------------------------
// C3 — $unwind: das autos[]-Array verflachen
// Pro Auto wird eine eigene Zeile erzeugt, danach projizieren wir
// Kunde + Auto zusammen flach in ein Dokument
// ------------------------------------------------------------
print("\n=== C3: $unwind (jedes Auto eine eigene Zeile) ===");
db.kunde.aggregate([
  { $unwind: "$autos" },
  {
    $project: {
      _id: 0,
      kunde:       { $concat: ["$vorname", " ", "$nachname"] },
      marke:       "$autos.marke",
      modell:      "$autos.modell",
      baujahr:     "$autos.baujahr",
      leistungPS:  "$autos.leistungPS"
    }
  },
  { $sort: { leistungPS: -1 } }
]).forEach(printjson);