// ============================================================
// KN-M-05 Teil A: Benutzer erstellen
// Zwei Benutzer für die Datenbank tuningwerkstatt
//   - leser     -> nur Lesen,        Auth-DB = tuningwerkstatt
//   - schreiber -> Lesen + Schreiben, Auth-DB = admin
// Built-in Rollen ohne "Any" im Namen: read und readWrite
// ============================================================

// Benutzer 1: nur Lesen
// Authentifizierungs-DB = tuningwerkstatt (= Themendatenbank)
use tuningwerkstatt
db.createUser({
  user: "leser",
  pwd:  "Leser2026!",
  roles: [
    { role: "read", db: "tuningwerkstatt" }
  ]
});

// Benutzer 2: Lesen und Schreiben
// Authentifizierungs-DB = admin
use admin
db.createUser({
  user: "schreiber",
  pwd:  "Schreiber2026!",
  roles: [
    { role: "readWrite", db: "tuningwerkstatt" }
  ]
});