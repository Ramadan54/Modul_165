-- ============================================================
-- KN-C-02 Teil D: Daten veraendern — 3 Szenarien
--
-- Ausfuehrung: USE tuningwerkstatt; dann dieses Skript einfuegen.
-- Voraussetzung: Teil A wurde vorher ausgefuehrt (Daten vorhanden).
-- ============================================================

USE tuningwerkstatt;


-- ------------------------------------------------------------
-- Szenario 1: Auftragsstatus aktualisieren (UPDATE auf 2 Tabellen)
--
-- Der Bremsen-Upgrade-Auftrag (ZH 555888) war bisher offen (O).
-- Der Mechaniker Thomas Meyer hat die Arbeit abgeschlossen,
-- also wird der Status auf fertig (F) gesetzt und der fehlende
-- Mechaniker-Name (wurde in Teil C geloescht) wieder eingetragen.
-- Da die gleiche Information in zwei Tabellen steckt (Denormali-
-- sierung), muessen beide Tabellen aktualisiert werden.
-- ------------------------------------------------------------

UPDATE auftraege_nach_auto
SET status = 'F', mechaniker_name = 'Thomas Meyer'
WHERE kennzeichen = 'ZH 555888'
AND start_datum = '2026-01-20';

UPDATE auftraege_nach_mechaniker
SET status = 'F'
WHERE mechaniker_name = 'Thomas Meyer'
AND start_datum = '2026-01-20';

-- Kontrolle
SELECT * FROM auftraege_nach_auto WHERE kennzeichen = 'ZH 555888';
SELECT * FROM auftraege_nach_mechaniker WHERE mechaniker_name = 'Thomas Meyer';


-- ------------------------------------------------------------
-- Szenario 2: Preis eines Tuningteils korrigieren (DELETE + INSERT)
--
-- Der Lieferant Akrapovic hat den Preis der Evolution Line von
-- 3890 CHF auf 4150 CHF erhoeht. Da der Preis Teil des Cluster
-- Keys ist, kann er nicht direkt mit UPDATE geaendert werden —
-- Cassandra verbietet Aenderungen an Primary-Key-Spalten.
-- Stattdessen muss die alte Zeile geloescht und eine neue mit
-- dem korrigierten Preis eingefuegt werden.
-- ------------------------------------------------------------

DELETE FROM teile_nach_kategorie
WHERE kategorie = 'Auspuff' AND preis = 3890.00;

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Auspuff', 4150.00, 'Akrapovic Evolution Line', 'Akrapovic');

-- Kontrolle
SELECT * FROM teile_nach_kategorie WHERE kategorie = 'Auspuff';


-- ------------------------------------------------------------
-- Szenario 3: Autotausch per BATCH (DELETE + INSERT atomar)
--
-- Kunde Mueller hat seinen Golf GTI (Baujahr 2019) verkauft und
-- durch einen neuen Audi RS6 Avant (Baujahr 2025) ersetzt.
-- Beide Operationen — altes Auto entfernen, neues einfuegen —
-- werden in einem BATCH zusammengefasst. Ein BATCH garantiert,
-- dass entweder beide Operationen ausgefuehrt werden oder keine.
-- ------------------------------------------------------------

BEGIN BATCH
  DELETE FROM autos_nach_kunde
  WHERE kunde_id = 11111111-1111-1111-1111-111111111111
  AND baujahr = 2019;

  INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
  VALUES (11111111-1111-1111-1111-111111111111, 2025, 'Hans', 'Mueller', 'Audi', 'RS6 Avant', 'ZH 999111', 630);
APPLY BATCH;

-- Kontrolle
SELECT * FROM autos_nach_kunde
WHERE kunde_id = 11111111-1111-1111-1111-111111111111;
