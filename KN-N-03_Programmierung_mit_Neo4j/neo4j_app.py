"""
KN-N-03: Programmierung mit Neo4j (Python)
Modul M165 - NoSQL-Datenbanken einsetzen
Autor: Ramadan Asani

Dieses Skript greift mit dem offiziellen neo4j-Treiber auf die AuraDB-Instanz
zu und fuehrt einige Cypher-Abfragen aus der Tuning-Werkstatt aus.

Die Zugangsdaten werden automatisch aus der von Aura heruntergeladenen
Credentials-Datei (Neo4j-...-Created-....txt) gelesen. Diese Datei muss im
gleichen Ordner wie dieses Skript liegen. So steht kein Passwort im Code.
"""

import glob
import os
import sys

from neo4j import GraphDatabase


def lade_zugangsdaten():
    """Liest URI, Benutzername und Passwort aus der Aura-Credentials-Datei."""
    ordner = os.path.dirname(os.path.abspath(__file__))
    treffer = glob.glob(os.path.join(ordner, "Neo4j-*.txt"))
    if not treffer:
        sys.exit("FEHLER: Keine Datei 'Neo4j-*.txt' im Skript-Ordner gefunden.")

    werte = {}
    with open(treffer[0], encoding="utf-8") as datei:
        for zeile in datei:
            zeile = zeile.strip()
            if not zeile or zeile.startswith("#") or "=" not in zeile:
                continue
            schluessel, wert = zeile.split("=", 1)
            werte[schluessel.strip()] = wert.strip()

    return werte["NEO4J_URI"], werte["NEO4J_USERNAME"], werte["NEO4J_PASSWORD"]


def main():
    uri, benutzer, passwort = lade_zugangsdaten()

    # Treiber aufbauen und Verbindung pruefen
    driver = GraphDatabase.driver(uri, auth=(benutzer, passwort))
    driver.verify_connectivity()
    print("Verbindung zur Neo4j-Datenbank erfolgreich!\n")

    # 1) Ueberblick: Anzahl Knoten und Kanten
    print("== Datenbank-Ueberblick ==")
    records, _, _ = driver.execute_query("MATCH (n) RETURN count(n) AS knoten")
    print(f"  Anzahl Knoten: {records[0]['knoten']}")
    records, _, _ = driver.execute_query("MATCH ()-[r]->() RETURN count(r) AS kanten")
    print(f"  Anzahl Kanten: {records[0]['kanten']}\n")

    # 2) Starke, neue Autos - Abfrage mit Parametern (statt fixer Werte im Text)
    print("== Autos mit mehr als 300 PS ab Baujahr 2019 ==")
    records, _, _ = driver.execute_query(
        """
        MATCH (a:Auto)
        WHERE a.leistungPS > $min_ps AND a.baujahr >= $min_jahr
        RETURN a.marke AS marke, a.modell AS modell, a.leistungPS AS ps
        ORDER BY ps DESC
        """,
        min_ps=300,
        min_jahr=2019,
    )
    for r in records:
        print(f"  {r['marke']} {r['modell']} - {r['ps']} PS")
    print()

    # 3) Hauptverantwortliche mit mehr als 8 Stunden - Abfrage ueber Kanten-Attribute
    print("== Hauptverantwortliche mit mehr als 8 Stunden ==")
    records, _, _ = driver.execute_query(
        """
        MATCH (m:Mechaniker)-[r:ARBEITET_AN]->(auftrag:Tuningauftrag)
        WHERE r.rolle = 'Hauptverantwortlicher' AND r.stundenAufgewendet > 8
        RETURN m.vorname + ' ' + m.nachname AS mechaniker,
               auftrag.bezeichnung AS auftrag,
               r.stundenAufgewendet AS stunden
        ORDER BY stunden DESC
        """
    )
    for r in records:
        print(f"  {r['mechaniker']}: {r['stunden']} Std. ({r['auftrag']})")
    print()

    driver.close()
    print("Verbindung geschlossen.")


if __name__ == "__main__":
    main()
