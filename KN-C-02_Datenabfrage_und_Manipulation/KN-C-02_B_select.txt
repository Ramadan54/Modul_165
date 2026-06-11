-- ============================================================
-- KN-C-02 Teil B: Daten abfragen
-- Eine Abfrage pro Screen (definiert in KN-C-01)
--
-- Ausfuehrung: USE tuningwerkstatt; dann dieses Skript einfuegen.
-- ============================================================

USE tuningwerkstatt;

-- Screen 1: Alle Autos von Kunde Asani
-- Partition Key: kunde_id
SELECT * FROM autos_nach_kunde
WHERE kunde_id = 22222222-2222-2222-2222-222222222222;

-- Screen 2: Alle Auftraege fuer Auto ZH 123456
-- Partition Key: kennzeichen
SELECT * FROM auftraege_nach_auto
WHERE kennzeichen = 'ZH 123456';

-- Screen 3: Alle Teile der Kategorie Auspuff
-- Partition Key: kategorie
SELECT * FROM teile_nach_kategorie
WHERE kategorie = 'Auspuff';

-- Screen 4: Alle Auftraege von Mechaniker Thomas Meyer
-- Partition Key: mechaniker_name
SELECT * FROM auftraege_nach_mechaniker
WHERE mechaniker_name = 'Thomas Meyer';
