-- ============================================================
-- KN-C-02 Teil C: Daten loeschen
-- 3 verschiedene Loeschoperationen:
--   1) Einzelne Zeile loeschen (Partition Key + Cluster Key)
--   2) Spalte einer einzelnen Zeile loeschen
--   3) Ganze Partition loeschen
--
-- Ausfuehrung: USE tuningwerkstatt; dann dieses Skript einfuegen.
-- ============================================================

USE tuningwerkstatt;

-- 1) Einzelne Zeile loeschen mit Partition Key + Cluster Key
--    Loesche das Auto Baujahr 2024 (Porsche 911 GT3) von Kunde Bucher
DELETE FROM autos_nach_kunde
WHERE kunde_id = 33333333-3333-3333-3333-333333333333
AND baujahr = 2024;

-- Kontrolle: Bucher hat jetzt nur noch 1 Auto (RS3)
SELECT * FROM autos_nach_kunde
WHERE kunde_id = 33333333-3333-3333-3333-333333333333;


-- 2) Spalte einer einzelnen Zeile loeschen
--    Loesche den Mechaniker-Namen aus dem Bremsen-Upgrade-Auftrag.
--    In Cassandra koennen einzelne Spalten gezielt auf null gesetzt werden.
DELETE mechaniker_name FROM auftraege_nach_auto
WHERE kennzeichen = 'ZH 555888'
AND start_datum = '2026-01-20';

-- Kontrolle: mechaniker_name ist jetzt null
SELECT * FROM auftraege_nach_auto
WHERE kennzeichen = 'ZH 555888';


-- 3) Ganze Partition loeschen
--    Loesche alle Teile der Kategorie Motor (beide Eintraege)
DELETE FROM teile_nach_kategorie
WHERE kategorie = 'Motor';

-- Kontrolle: Kategorie Motor ist weg (0 rows)
SELECT * FROM teile_nach_kategorie
WHERE kategorie = 'Motor';
