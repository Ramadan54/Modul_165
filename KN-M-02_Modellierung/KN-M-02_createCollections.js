// =============================================================
// KN-M-02 Teil C: Collections für die Tuning-Werkstatt erstellen
// Autor:  Ramadan Asani
// Modul:  M165 - NoSQL-Datenbanken einsetzen
// Datum:  20.05.2026
// =============================================================
//
// Vorgehen:
// 1. Mit "use tuningwerkstatt;" zuerst SEPARAT in die Datenbank wechseln
//    (siehe Aufgabenstellung: einzeln aufrufen, nicht zusammen mit
//    den createCollection-Befehlen).
// 2. Danach die unteren Befehle nacheinander in der MongoSH ausführen.
//
// In dieser Aufgabe wird KEIN JSON-Schema verwendet - das kommt
// in einer späteren Aufgabe dazu.

// --- Collection 1: kunde -------------------------------------
// Enthält das eingebettete Array "autos" (Verschachtelung 1:N
// Kunde -> Auto direkt im Kunden-Dokument).
db.createCollection("kunde");

// --- Collection 2: tuningauftrag -----------------------------
// Kerngeschäft. Enthält Referenz (autoId) auf das eingebettete
// Auto im Kunden-Dokument sowie Arrays mit Referenzen auf
// tuningteil und mechaniker (beide N:N).
db.createCollection("tuningauftrag");

// --- Collection 3: tuningteil --------------------------------
// Eigene Collection, da Teile unabhängig von Aufträgen existieren
// und in vielen Aufträgen wiederverwendet werden (Katalog).
db.createCollection("tuningteil");

// --- Collection 4: mechaniker --------------------------------
// Eigene Collection für Mitarbeiter. Wird per Referenz-Array aus
// tuningauftrag.mechanikerIds verlinkt (N:N).
db.createCollection("mechaniker");

// --- Kontrolle: alle Collections anzeigen --------------------
show collections;
