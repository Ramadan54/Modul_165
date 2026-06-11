-- ============================================================
-- KN-C-02 Teil C: Aufraeumen — alle Daten loeschen
-- Dieses Skript loescht alle Daten aus allen 4 Tabellen,
-- damit die Datenbank fuer einen Neustart bereit ist.
-- Die Tabellen selbst bleiben erhalten.
--
-- Ausfuehrung: USE tuningwerkstatt; dann dieses Skript einfuegen.
-- ============================================================

USE tuningwerkstatt;

TRUNCATE autos_nach_kunde;
TRUNCATE auftraege_nach_auto;
TRUNCATE teile_nach_kategorie;
TRUNCATE auftraege_nach_mechaniker;

-- Kontrolle: alle Tabellen sollten 0 Zeilen haben
SELECT COUNT(*) FROM autos_nach_kunde;
SELECT COUNT(*) FROM auftraege_nach_auto;
SELECT COUNT(*) FROM teile_nach_kategorie;
SELECT COUNT(*) FROM auftraege_nach_mechaniker;
