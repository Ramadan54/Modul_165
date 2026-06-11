from cassandra.io.asyncioreactor import AsyncioConnection
from cassandra.cluster import Cluster


def main():
    # Verbindung aufbauen (localhost, Standard-Port 9042)
    # AsyncioConnection wird benoetigt ab Python 3.12+
    cluster = Cluster(["127.0.0.1"], connect_timeout=10)
    cluster.connection_class = AsyncioConnection
    session = cluster.connect("tuningwerkstatt")
    print("Verbindung zur Cassandra-Datenbank erfolgreich!\n")

    # 1) Ueberblick: Anzahl Datensaetze pro Tabelle
    print("== Datenbank-Ueberblick ==")
    tabellen = [
        "autos_nach_kunde",
        "auftraege_nach_auto",
        "teile_nach_kategorie",
        "auftraege_nach_mechaniker",
    ]
    for tabelle in tabellen:
        rows = session.execute(f"SELECT COUNT(*) AS anzahl FROM {tabelle}")
        print(f"  {tabelle}: {rows.one().anzahl} Datensaetze")
    print()

    # 2) Screen 1: Alle Autos von Kunde Mueller - Abfrage mit Parametern
    print("== Alle Autos von Kunde Mueller ==")
    from uuid import UUID

    mueller_id = UUID("11111111-1111-1111-1111-111111111111")
    rows = session.execute(
        "SELECT baujahr, marke, modell, kennzeichen, leistung_ps "
        "FROM autos_nach_kunde WHERE kunde_id = %s",
        (mueller_id,),
    )
    for row in rows:
        print(f"  {row.marke} {row.modell} ({row.baujahr}) - {row.leistung_ps} PS [{row.kennzeichen}]")
    print()

    # 3) Screen 3: Teile einer bestimmten Kategorie
    print("== Alle Teile der Kategorie Fahrwerk ==")
    rows = session.execute(
        "SELECT name, hersteller, preis FROM teile_nach_kategorie WHERE kategorie = %s",
        ("Fahrwerk",),
    )
    for row in rows:
        print(f"  {row.name} ({row.hersteller}) - {row.preis} CHF")
    print()

    # 4) Screen 4: Auftraege eines Mechanikers
    print("== Auftraege von Daniela Schmid ==")
    rows = session.execute(
        "SELECT start_datum, bezeichnung, kennzeichen, status, gesamtpreis "
        "FROM auftraege_nach_mechaniker WHERE mechaniker_name = %s",
        ("Daniela Schmid",),
    )
    for row in rows:
        datum = row.start_datum.strftime("%d.%m.%Y")
        print(f"  {datum} | {row.bezeichnung} [{row.kennzeichen}] - Status: {row.status}, {row.gesamtpreis} CHF")
    print()

    # Verbindung schliessen
    cluster.shutdown()
    print("Verbindung geschlossen.")


if __name__ == "__main__":
    main()
