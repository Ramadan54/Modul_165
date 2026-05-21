// ============================================================
// KN-M-03 Teil B) Daten loeschen - Skript 1: ALLE Collections droppen
//
// Dieses Skript raeumt die ganze Datenbank auf und kann
// als Grundlage fuer C und D verwendet werden.
//
// VOR der Ausfuehrung in mongosh: `use tuningwerkstatt` separat absetzen.
// ============================================================

db.kunde.drop();
db.tuningteil.drop();
db.mechaniker.drop();
db.tuningauftrag.drop();

print("=== Alle Collections gedroppt ===");
print("Verbleibende Collections in der DB:");
db.getCollectionNames().forEach(function(name) {
    print(" - " + name);
});
