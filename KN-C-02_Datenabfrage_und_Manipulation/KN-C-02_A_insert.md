-- ============================================================
-- KN-C-02 Teil A: Daten hinzufuegen
-- Tuning-Werkstatt — 4 Tabellen, 26 Datensaetze total
-- Pro Partition Key sind mehrere Datensaetze vorhanden.
--
-- Ausfuehrung: USE tuningwerkstatt; dann dieses Skript einfuegen.
-- ============================================================

USE tuningwerkstatt;

-- === Tabelle 1: autos_nach_kunde ===
-- 3 Kunden (Partitionen) mit je 2 Autos = 6 Zeilen

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (11111111-1111-1111-1111-111111111111, 2019, 'Hans', 'Mueller', 'Volkswagen', 'Golf GTI', 'ZH 123456', 245);

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (11111111-1111-1111-1111-111111111111, 2021, 'Hans', 'Mueller', 'BMW', 'M3 Competition', 'ZH 654321', 510);

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (22222222-2222-2222-2222-222222222222, 2020, 'Ramadan', 'Asani', 'Mercedes-Benz', 'A-Klasse', 'ZH 555888', 224);

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (22222222-2222-2222-2222-222222222222, 2023, 'Ramadan', 'Asani', 'Mercedes-Benz', 'CLA 45 AMG', 'ZH 777999', 421);

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (33333333-3333-3333-3333-333333333333, 2022, 'Lara', 'Bucher', 'Audi', 'RS3', 'AG 998877', 400);

INSERT INTO autos_nach_kunde (kunde_id, baujahr, vorname, nachname, marke, modell, kennzeichen, leistung_ps)
VALUES (33333333-3333-3333-3333-333333333333, 2024, 'Lara', 'Bucher', 'Porsche', '911 GT3', 'ZH 222333', 510);


-- === Tabelle 2: auftraege_nach_auto ===
-- 3 Kennzeichen (Partitionen) mit je 2 Auftraegen = 6 Zeilen

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('ZH 123456', '2025-11-03', 'Tieferlegung mit Gewindefahrwerk', 'F', 3100.00, 'Thomas Meyer');

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('ZH 123456', '2026-03-15', 'Stage 2 Chiptuning', 'A', 1490.00, 'Marko Kovac');

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('ZH 555888', '2025-09-12', 'AMG-Styling Paket einbauen', 'F', 5400.00, 'Daniela Schmid');

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('ZH 555888', '2026-01-20', 'Bremsen-Upgrade', 'O', 2200.00, 'Thomas Meyer');

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('AG 998877', '2026-04-08', 'Komplettfolierung matt-schwarz', 'F', 3200.00, 'Daniela Schmid');

INSERT INTO auftraege_nach_auto (kennzeichen, start_datum, bezeichnung, status, gesamtpreis, mechaniker_name)
VALUES ('AG 998877', '2026-06-01', 'Akrapovic Auspuff Einbau', 'O', 4100.00, 'Marko Kovac');


-- === Tabelle 3: teile_nach_kategorie ===
-- 4 Kategorien (Partitionen) mit je 2 Teilen = 8 Zeilen

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Fahrwerk', 1890.00, 'Bilstein B14 Gewindefahrwerk', 'Bilstein');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Fahrwerk', 2450.00, 'KW Gewindefahrwerk V3', 'KW Suspensions');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Auspuff', 2650.00, 'Milltek Sport-Auspuff', 'Milltek');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Auspuff', 3890.00, 'Akrapovic Evolution Line', 'Akrapovic');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Felgen', 1950.00, 'OZ Ultraleggera 19 Zoll', 'OZ Racing');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Felgen', 4200.00, 'BBS CH-R 19 Zoll', 'BBS');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Motor', 790.00, 'Stage 1 Chiptuning', 'APR Tuning');

INSERT INTO teile_nach_kategorie (kategorie, preis, name, hersteller)
VALUES ('Motor', 1290.00, 'Stage 2 Chiptuning', 'APR Tuning');


-- === Tabelle 4: auftraege_nach_mechaniker ===
-- 3 Mechaniker (Partitionen) mit je 2 Auftraegen = 6 Zeilen

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Thomas Meyer', '2025-11-03', 'Tieferlegung mit Gewindefahrwerk', 'ZH 123456', 'F', 3100.00);

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Thomas Meyer', '2026-01-20', 'Bremsen-Upgrade', 'ZH 555888', 'O', 2200.00);

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Marko Kovac', '2026-03-15', 'Stage 2 Chiptuning', 'ZH 123456', 'A', 1490.00);

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Marko Kovac', '2026-06-01', 'Akrapovic Auspuff Einbau', 'AG 998877', 'O', 4100.00);

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Daniela Schmid', '2025-09-12', 'AMG-Styling Paket einbauen', 'ZH 555888', 'F', 5400.00);

INSERT INTO auftraege_nach_mechaniker (mechaniker_name, start_datum, bezeichnung, kennzeichen, status, gesamtpreis)
VALUES ('Daniela Schmid', '2026-04-08', 'Komplettfolierung matt-schwarz', 'AG 998877', 'F', 3200.00);


-- === Kontrolle ===
SELECT COUNT(*) FROM autos_nach_kunde;
SELECT COUNT(*) FROM auftraege_nach_auto;
SELECT COUNT(*) FROM teile_nach_kategorie;
SELECT COUNT(*) FROM auftraege_nach_mechaniker;
