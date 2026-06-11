-- ============================================================
-- KN-C-01 Teil C: Physisches Datenmodell erstellen
-- Tuning-Werkstatt — 4 Tabellen (je eine pro Screen/Abfrage)
--
-- Ausfuehrung in cqlsh:
--   docker exec -it cassandra cqlsh
--   SOURCE '/pfad/zu/KN-C-01_physisches_modell.cql';
--   oder: Befehle einzeln einfuegen
-- ============================================================


-- ------------------------------------------------------------
-- 1) Keyspace erstellen
-- SimpleStrategy mit replication_factor 1 (lokale Entwicklung)
-- ------------------------------------------------------------

CREATE KEYSPACE IF NOT EXISTS tuningwerkstatt
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE tuningwerkstatt;


-- ------------------------------------------------------------
-- 2) Tabelle: autos_nach_kunde
-- Screen 1 — Kundenuebersicht: alle Autos eines Kunden
-- Partition Key: kunde_id
-- Cluster Key:   baujahr (DESC → neuestes Auto zuerst)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS autos_nach_kunde (
    kunde_id    UUID,
    baujahr     INT,
    vorname     TEXT,
    nachname    TEXT,
    marke       TEXT,
    modell      TEXT,
    kennzeichen TEXT,
    leistung_ps INT,
    PRIMARY KEY ((kunde_id), baujahr)
) WITH CLUSTERING ORDER BY (baujahr DESC);


-- ------------------------------------------------------------
-- 3) Tabelle: auftraege_nach_auto
-- Screen 2 — Auftragshistorie pro Auto
-- Partition Key: kennzeichen
-- Cluster Key:   start_datum (DESC → neuester Auftrag zuerst)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auftraege_nach_auto (
    kennzeichen     TEXT,
    start_datum     TIMESTAMP,
    bezeichnung     TEXT,
    status          TEXT,
    gesamtpreis     DECIMAL,
    mechaniker_name TEXT,
    PRIMARY KEY ((kennzeichen), start_datum)
) WITH CLUSTERING ORDER BY (start_datum DESC);


-- ------------------------------------------------------------
-- 4) Tabelle: teile_nach_kategorie
-- Screen 3 — Teilekatalog nach Kategorie
-- Partition Key: kategorie
-- Cluster Key:   preis (ASC → guenstigstes Teil zuerst)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS teile_nach_kategorie (
    kategorie  TEXT,
    preis      DECIMAL,
    name       TEXT,
    hersteller TEXT,
    PRIMARY KEY ((kategorie), preis)
) WITH CLUSTERING ORDER BY (preis ASC);


-- ------------------------------------------------------------
-- 5) Tabelle: auftraege_nach_mechaniker
-- Screen 4 — Mechaniker-Arbeitsplan
-- Partition Key: mechaniker_name
-- Cluster Key:   start_datum (DESC → neuester Auftrag zuerst)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auftraege_nach_mechaniker (
    mechaniker_name TEXT,
    start_datum     TIMESTAMP,
    bezeichnung     TEXT,
    kennzeichen     TEXT,
    status          TEXT,
    gesamtpreis     DECIMAL,
    PRIMARY KEY ((mechaniker_name), start_datum)
) WITH CLUSTERING ORDER BY (start_datum DESC);


-- ------------------------------------------------------------
-- 6) Kontrolle
-- ------------------------------------------------------------

DESCRIBE TABLES;
