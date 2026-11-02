# Spike: Tastaturfokus unter RN 0.88.1

Stand 2026-11-02. Gehört zu Milestone 1 von `docs/specs/2026-11-02-wcag-a11y.md`. **Die Prüfung am Gerät steht noch aus.**

## Geprüft

| Punkt                           | Ergebnis                                                                               | Wie geprüft                         |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| `canBecomeFocused` in RN 0.86.3 | Nur tvOS                                                                               | Quellcode `RCTViewComponentView.mm` |
| `canBecomeFocused` in RN 0.88.1 | Accessibility-Elemente mit interaktiver Rolle                                          | Quellcode, installiert              |
| Prop `focusable` auf iOS        | Wirkt auch in 0.88.1 nicht                                                             | Quellcode                           |
| Rollen der App                  | `button`, `link`, `switch`, `checkbox`, `radio`, `adjustable` stehen alle in der Liste | Quellcode gegen `src/`              |
| Upgrade                         | Expo SDK 58, RN 0.88.1: Build, Start im Simulator, Lint, Typecheck, Tests              | Ausgeführt                          |
| Querformat                      | Alle Ausrichtungen in `Info.plist`                                                     | Prebuild ausgeführt                 |

## Nicht automatisiert prüfbar

Das Senden von Tasten an den Simulator scheitert an der macOS-Berechtigung für `osascript` (Fehler 1002). Die folgenden Fragen brauchen einen Menschen mit Tastatur.

## Erster Befund (2026-11-02, Julius, Simulator)

Im Leerzustand der Bilanz-Seite erreicht Tab die Radiogruppe, aber nicht den Button „Health-Berechtigungen öffnen“.

Vermutung, nicht bestätigt: Das ist das Gruppenmodell von iOS, kein Fehler am Button. Tab springt zwischen Fokusgruppen (`focusGroupIdentifier`) und landet auf dem ersten Element der Gruppe, Pfeiltasten bewegen sich innerhalb der Gruppe, Ctrl+Tab geht durch alle Elemente. Der Inhalt der ScrollView wäre dann eine einzige Gruppe. Dafür sprechen nur Berichte aus den Apple Developer Forums, und der Button hat dieselbe Rolle wie die Radios.

Prüfung: Von „30 T“ aus Pfeil nach unten und Ctrl+Tab drücken. Erreicht einer davon den Button, ist 2.1.1 erfüllt. Soll Tab selbst alle Aktionen erreichen, braucht es eigene Gruppen, was der Core nicht bietet (`KeyboardFocusGroup` in `react-native-external-keyboard@2`).

## Offen am Gerät

Aufbau: `npx expo run:ios`, FKA unter Einstellungen → Bedienungshilfen → Tastaturen an, hell und dunkel.

| Prüffrage                                                                                                             | Ergebnis | Falls nein                              |
| --------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------- |
| Erreicht Tab alle Bedienelemente in der Reihenfolge der Spec?                                                         | offen    | RN-Patch oder Bibliothek neu bewerten   |
| Löst die Leertaste alle aus?                                                                                          | offen    | `react-native-external-keyboard@2`      |
| Lassen sich Slider und Chart per Tastatur stellen? Mit welchen Tasten?                                                | offen    | −/+ und Zurück/Weiter                   |
| Schließt eine Taste Sheet und Tooltip (`onAccessibilityEscape`)? Welche?                                              | offen    | Sichtbare Taste, Sheets haben sie schon |
| Ist der Systemrahmen hell und dunkel mit ≥ 3:1 sichtbar, auch auf runden Elementen?                                   | offen    | Bibliothek mit eigenem Rahmen           |
| Bleibt der Fokus im Modal, und kommt er danach zum Auslöser zurück?                                                   | offen    | Bibliothek (`Focus.Trap`, `ref`)        |
| Scrollt der fokussierte Inhalt in den Blick, nicht unter die Tab-Leiste?                                              | offen    | Abstände anpassen                       |
| Lassen sich Seiten ohne fokussierbare Elemente scrollen (`calculation-page.tsx`, Liste im Sheet)? Mit welchen Tasten? | offen    | Abschnitte erreichbar machen            |
| Werden deaktivierte Tageszellen im Fokusweg als deaktiviert angesagt?                                                 | offen    | Fokusgruppe prüfen                      |

Die Tasten werden danach in die Tabelle „Tasten“ der Spec eingetragen.
