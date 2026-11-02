# WCAG 2.2 AA: Selbstprüfung

Stand 2026-11-02, Entwurf. Geltungsbereich: iOS-App ohne Dev-Routen, Kriterien nach WCAG2ICT auf native Software angewendet. **Die App ist nicht als AA-konform einzustufen:** 1.4.4 ist nicht erfüllt, und die Prüfung am Gerät steht aus.

Das ist eine Selbstprüfung, keine Aussage zu EN 301 549, deren Software-Kapitel über WCAG hinausgeht, und keine Rechtsberatung. Die HealthKit-Anfrage ist ein Dialog von Apple und nicht Teil der Prüfung. Tastaturbedienung setzt auf dem iPhone die Systemeinstellung Full Keyboard Access voraus.

Status: **Erfüllt** (im Code oder per Test belegt) · **Gerät offen** (umgesetzt, Prüfung am Gerät fehlt) · **Nicht erfüllt** · **n/a** (kommt in der App nicht vor).

| Kriterium                       | Status            | Beleg oder Lücke                                                                                                                |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 Nicht-Text-Inhalt         | Gerät offen       | Labels an Illustrationen, Chart und Balken; VoiceOver-Durchgang fehlt                                                           |
| 1.2.1–1.2.5 Medien              | n/a               | Kein Audio oder Video                                                                                                           |
| 1.3.1 Info und Beziehungen      | Gerät offen       | `header`, Rollen, Radiogruppen                                                                                                  |
| 1.3.2 Reihenfolge               | Gerät offen       | Code-Reihenfolge = sichtbare Reihenfolge                                                                                        |
| 1.3.3 Sensorische Merkmale      | Gerät offen       | Texte verweisen nicht auf Form oder Lage; Durchsicht fehlt                                                                      |
| 1.3.4 Ausrichtung               | Gerät offen       | Querformat frei, Layout einspaltig; am Gerät nicht gesehen                                                                      |
| 1.3.5 Eingabezweck              | n/a               | Gewicht, Alter, Größe stehen nicht in der Zweck-Liste                                                                           |
| 1.4.1 Farbe                     | Erfüllt           | Vorzeichen, Richtung, Muster; keine Akzentfarbe                                                                                 |
| 1.4.2 Audio                     | n/a               | Kein Audio                                                                                                                      |
| 1.4.3 Kontrast                  | Erfüllt           | `colors.test.ts`; Chip-Text in `muted`; deaktivierte Elemente und gesperrte Vorschau ausgenommen                                |
| 1.4.4 Textgröße                 | **Nicht erfüllt** | Hero (Faktor 1,2) und Chart-Achsen (1,0) bleiben gedeckelt, Entscheidung 2026-11-02. Alle anderen Stile bis 2,0, am Gerät offen |
| 1.4.5 Bilder von Text           | n/a               | Keine                                                                                                                           |
| 1.4.10 Umbruch                  | Gerät offen       | Querformat und größte Textgröße ungeprüft                                                                                       |
| 1.4.11 Nicht-Text-Kontrast      | Gerät offen       | Spur und Schalterrand in `muted`, gedimmte Balken 0,45, Fokusrahmen ungeprüft                                                   |
| 1.4.12 Textabstand              | n/a               | Laut WCAG2ICT nur bei anpassbarem Text; iOS bietet das nicht                                                                    |
| 1.4.13 Inhalt bei Fokus         | Gerät offen       | Tooltip erscheint nur auf Aktion, per `onAccessibilityEscape` schließbar                                                        |
| 2.1.1 Tastatur                  | Gerät offen       | Rollen ausreichend laut RN-Quellcode; Stellen, Scrollen, Auslösen ungeprüft                                                     |
| 2.1.2 Keine Falle               | Gerät offen       | Sheets haben Abbrechen bzw. Fertig                                                                                              |
| 2.1.4 Einzeltasten              | Erfüllt           | Keine eigenen Kürzel                                                                                                            |
| 2.2.1, 2.2.2 Zeit, Bewegung     | n/a               | Keine Zeitlimits oder Laufanimationen                                                                                           |
| 2.3.1 Blitze                    | n/a               | Keine                                                                                                                           |
| 2.4.1 Blöcke                    | n/a               | Einzelne Screens ohne wiederkehrende Blöcke; Tab-Leiste nativ                                                                   |
| 2.4.2 Titel                     | Gerät offen       | `title` an jedem Stack-Screen                                                                                                   |
| 2.4.3 Fokus-Reihenfolge         | Gerät offen       | Festgelegt in der Spec                                                                                                          |
| 2.4.4 Linkzweck                 | Erfüllt           | Text der Zeile und Rolle `link`                                                                                                 |
| 2.4.5 Mehrere Wege              | n/a               | Nach WCAG2ICT nicht auf einzelne Apps anwendbar                                                                                 |
| 2.4.6 Überschriften, Labels     | Erfüllt           | Beschreibende Texte aus i18n                                                                                                    |
| 2.4.7 Fokus sichtbar            | Gerät offen       | Systemrahmen ungeprüft                                                                                                          |
| 2.4.11 Fokus nicht verdeckt     | Gerät offen       | Tab-Leiste ungeprüft                                                                                                            |
| 2.5.1 Zeigergesten              | Erfüllt           | Slider: Tippen auf die Spur; Chart: Tippen auf den Balken                                                                       |
| 2.5.2 Abbruch                   | Erfüllt           | `Pressable` löst beim Loslassen aus                                                                                             |
| 2.5.3 Name im Label             | Gerät offen       | Sprechlabels enthalten den sichtbaren Text; Voice Control ungeprüft                                                             |
| 2.5.4 Bewegung                  | n/a               | Keine Bewegungssteuerung                                                                                                        |
| 2.5.7 Ziehen                    | Erfüllt           | Wie 2.5.1                                                                                                                       |
| 2.5.8 Zielgröße                 | Erfüllt           | Mindestens 32 pt; schmale Chart-Balken werden zum nächsten Balken aufgelöst                                                     |
| 3.1.1, 3.1.2 Sprache            | Erfüllt           | Deutsch und Englisch nach System, `locales` in `app.json`                                                                       |
| 3.2.1, 3.2.2 Fokus, Eingabe     | Gerät offen       | Keine Aktion bei Fokus; Radios ändern erwartbar die Bilanz                                                                      |
| 3.2.3, 3.2.4 Konsistenz         | Erfüllt           | Gemeinsame Komponenten                                                                                                          |
| 3.2.6 Hilfe                     | n/a               | Keine wiederkehrende Hilfe                                                                                                      |
| 3.3.1 Fehler erkennen           | Erfüllt           | Rahmen und Text am Feld, Ansage                                                                                                 |
| 3.3.2 Labels                    | Erfüllt           | Label, Einheit und Grenzen am Feld                                                                                              |
| 3.3.3 Fehler-Vorschlag          | Erfüllt           | Hinweis nennt die Grenzen                                                                                                       |
| 3.3.4 Rechtliches               | n/a               | Keine solchen Vorgänge                                                                                                          |
| 3.3.7, 3.3.8 Eingabe, Anmeldung | n/a               | Keine Anmeldung, nichts doppelt einzugeben                                                                                      |
| 4.1.2 Name, Rolle, Wert         | Gerät offen       | Rollen und Zustände, „eingeklappt“ ergänzt                                                                                      |
| 4.1.3 Statusmeldungen           | Gerät offen       | `useAnnounceChange`; VoiceOver ungeprüft                                                                                        |
