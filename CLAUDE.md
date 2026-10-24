# Kcalwaage (CalorieWeightBalancer)

Projektkontext für Claude, Stand 2026-10-12. Nutzbar als `CLAUDE.md` im Repo oder als System-Prompt in der Claude Developer Console.

## Arbeitsweise
- Julius schreibt Deutsch; antworte auf Deutsch, Code und Commit-Messages auf Englisch.
- Repo: https://github.com/Scully98/CalorieWeightBalancer (public), Lizenz PolyForm Noncommercial 1.0.0.
- Ausführliche Spec und Plan: Claude Doc „Kcalwaage – Feature-Spec & Langzeitplan“ (https://claude.ai/code/artifact/1db9f6ac-ea3d-4024-a1e4-c2786999e594). Bei Widerspruch gilt die Spec.
- Rechtliche Einordnungen hier sind keine Rechts- oder Steuerberatung.

## Ziel
Leichte iOS-App, die die Kalorienbilanz über einen wählbaren Zeitraum zeigt (nicht nur den heutigen Tag) und sie mit der Waage vergleicht. Gleichzeitig Testlauf für den App-Store-Prozess. Minimaler Datenschutz-Footprint.

Fragen, die die App beantwortet: Bin ich diesen Monat im Plus oder Minus? Wie lange dauert es, einen schlechten Tag auszugleichen? Ist ein Plus in der Bilanz auch eins auf der Waage, oder sind es Muskeln? Passen Messungen nicht zur Bilanz, also sind die Kalorien falsch angesetzt?

## Rahmenbedingungen
- Alles lokal: kein Backend, keine Accounts, kein Tracking, keine Analytics. Datenschutz-Label „Keine Daten erfasst“.
- Einzige Datenquelle Apple HealthKit, nur Leserechte. Essen/Gewicht kommen aus MyFitnessPal, Yazio, Waage-App usw. per Health-Sync.
- Einstellungen lokal in einer App Group (Widget liest mit).
- V1: nur iPhone, Deutsch und Englisch.
- Apple: Developer Program 99 USD/Jahr (Individual-Account), Richtlinie 5.1.3 (Health-Daten nicht für Werbung, nicht in iCloud), Datenschutz-URL Pflicht, Hinweis „Keine medizinische Beratung“, genug Funktionsumfang nach 4.2.

## Stack
- React Native mit Expo, Development Build (kein Expo Go), Build/Upload über EAS, TypeScript.
- HealthKit: `@kingstinct/react-native-healthkit`.
- Charts: `react-native-gifted-charts` oder `victory-native`.
- Widget: SwiftUI-WidgetKit-Extension via `@bacons/apple-targets` (Ordner `targets/widget/`). Kein Flutter.
- Die App rechnet und schreibt einen fertigen JSON-Datensatz (Zeitraum, Bilanz, Spanne, Fett in g, Zeitstempel) in die App-Group-`UserDefaults`, dann `WidgetCenter.reloadAllTimelines()` über ein kleines natives Modul. Das Widget fragt HealthKit nicht selbst ab (Daten bei gesperrtem Gerät verschlüsselt).
- Hintergrund-Update per HealthKit Observer/Background Delivery; Fallback: Widget zeigt letzten Stand mit Uhrzeit.

## HealthKit-Typen
| Wert | Typ | Pro Tag | V1 |
|---|---|---|---|
| Nahrungsenergie | `dietaryEnergyConsumed` | Summe | ja |
| Ruheenergie | `basalEnergyBurned` | Summe | ja |
| Aktivitätsenergie | `activeEnergyBurned` | Summe | ja |
| Gewicht | `bodyMass` | letzter Wert | ja |
| Körperfett | `bodyFatPercentage` | letzter Wert | ja |
| Magermasse | `leanBodyMass` | letzter Wert | ja |
| Periode | `menstrualFlow` | Tage | V2 |

- Summen per `HKStatisticsCollectionQuery` pro Kalendertag (dedupliziert iPhone/Watch), keine Rohsamples summieren.
- Fehlt `leanBodyMass`: Magermasse = Gewicht × (1 − KFA), Fett = Gewicht × KFA.
- Fehlt Ruheenergie (keine Watch, unter 6 h Tragezeit): Mifflin-St Jeor pro Tag. Gewicht = letzte Messung an/vor dem Tag, sonst erste danach, sonst Profilgewicht; Alter am jeweiligen Tag. Teiltage ab 6 h werden auf 24 h hochgerechnet und gelten als gemessen.
- iOS verrät nicht, ob Leserechte verweigert wurden: leere Daten immer mit „Berechtigungen prüfen“ erklären.

## Rechenmodell
- Tagesbilanz `B = A − (R + K)` (A Nahrung, R Ruhe, K Aktiv). **Plus = mehr gegessen als verbraucht.**
- Null-Tage-Schalter: Tag ohne Nahrungseintrag zählt mit B = 0 statt vollem Defizit; Anzahl betroffener Tage anzeigen. Null-Tage bleiben aus den Summen A und V, die Toleranz rechnet nur mit echten Einträgen.
- Datenqualität je Tag (mehrere Flags möglich, „X von N vollständig“ = Tage ohne Flag): Grundumsatz geschätzt, ohne Nahrung, auffällig wenig Nahrung (A < 50 % von R + K), ohne Grundumsatz (auch Mifflin nicht möglich, Tag zählt nicht). Fehlende Aktivenergie zählt als K = 0 und ist kein Flag.
- Heutiger Tag: standardmäßig nicht in der Bilanz (im Chart markiert), per Schalter zuschaltbar.
- Toleranzen standardmäßig aus; eingeschaltet wählt der Nutzer im Normbereich (Nahrung 5–20 %, Verbrauch 10–30 %, vorausgewählt der untere Rand). Angewendet auf Zeitraumsummen, nicht pro Tag:
  `Bmin = A(1 − tA) − V`, `Bmax = A(1 + tA) − V(1 − tV)` mit V = R + K. Verbrauch nur nach unten korrigiert.
- Körperfett: Bilanz ÷ 7.700 kcal/kg Fettgewebe, beschriftet als „theoretisch“.
- Analyse Bilanz vs. Messung: `E ≈ 9400·ΔFettmasse + 1800·ΔMagermasse` (Hall 2008), Start/Ende als 7-Tage-Mittel oder Trend. Erst ab 21 Tagen mit mindestens 6 Messungen.
- Rechenkern als reines TypeScript-Modul mit Unit-Tests, unabhängig von HealthKit (`src/core/`, Abdeckung ≥ 90 %). Er rechnet ungerundet, gerundet wird erst in der Anzeige.

## Goldener Testfall
Die Zahlen aus dem Design-Prompt passen zusammen, wenn man diese 30 Tage annimmt. Das ist der erste Test in P2 und P3 (Fixture `src/core/__fixtures__/golden-30.ts`, Test `src/core/__tests__/golden.test.ts`).

| Eingabe (30 Tage) | Wert |
|---|---|
| Σ Nahrung A | 87.000 kcal (2.900/Tag) |
| Σ Verbrauch V = R + K | 80.000 kcal (2.667/Tag) |
| Toleranz Nahrung / Verbrauch | 5 % / 10 % |
| Δ Fettmasse / Δ Magermasse | +0,4 kg / +0,3 kg |

| Erwartetes Ergebnis | Wert |
|---|---|
| Bilanz | +7.000 kcal, Ø +233 kcal/Tag |
| Fett theoretisch | ≈ +0,9 kg |
| Spanne mit Toleranz | +2.650 bis +19.350 kcal, ≈ +0,3 bis +2,5 kg |
| Laut Waage gespeichert | 9400 × 0,4 + 1800 × 0,3 = 4.300 kcal |
| Geschätzter tatsächlicher Verbrauch | (87.000 − 4.300) ÷ 30 ≈ 2.760 kcal/Tag |
| Tracker / Differenz | 2.670 kcal/Tag / +90 |

## Features V1
Drei Screens (Bilanz, Analyse-Chart, Einstellungen) plus Widget.
1. Große Bilanzzahl mit Zeitraum, Vorzeichen klar beschriftet.
2. Zeitraum: 7, 30, 60, 90 Tage, Alles (seit erstem Datenpunkt), Eigener (laut Design; „dieser Monat“ geht über Eigener).
3. Null-Tage als Erhaltungstage (Schalter).
4. Umrechnung in Körperfett unter der Bilanz.
5./6. Toleranz Verbrauch / Nahrung, Bilanz zeigt dann Spanne.
7. Balkenchart pro Tag (Plus oben, Minus unten), bei langen Zeiträumen Wochenbalken.
8. Gewichtslinie auf zweiter Achse plus 7-Tage-Trend.
9. Fett- und Magermasse-Linien mit Einordnungssatz (nur mit Messungen).
10. Widget klein/mittel: Zeitraum, Bilanz, Fett-Äquivalent; Spanne, wenn Toleranz aktiv.
11. Daten-Seite (Wischen vom Bilanz-Screen): was aus Health ankommt, wie sich die Bilanz zusammensetzt, Link zu Health (Spec `docs/specs/2026-10-21-data-page.md`).

Nicht in V1: Farbwahl, Widget-Konfiguration, Zyklus, Zielkalorien, iPad, Schreiben nach HealthKit.

## Design
Schwarz auf weiß, Dark Mode invertiert, keine Akzentfarbe. Plus/Minus über Vorzeichen, Balkenrichtung und Beschriftung, nicht Rot/Grün. Systemschrift mit Dynamic Type. Farben nur über sechs Tokens in `src/theme/colors.ts` (Vordergrund, Hintergrund, Nebentext, Akzent, Plus, Minus; Werte laut Design: hell #0B0B0B / #FFFFFF / #6B6B6B, dunkel #F4F4F4 / #000000 / #949494, Akzent, Plus und Minus = Vordergrund), damit V2 sie für App und Widget wählbar machen kann. Farb-Literale außerhalb der Token-Datei verbietet ESLint.

## Plan
0 Vorab (Name, Nebentätigkeit, Developer Account) · 1 Repo/Expo/EAS/CI · 2 Design-Grundlagen, zweisprachig · 3 Intro inkl. Datenschutzsatz und HealthKit-Anfrage · 4 HealthKit · 5 Rechenkern · 6 Bilanz-Screen und Einstellungen · 7 Chart · 8 Analyse · 9 Widget · 10 TestFlight · 11 Store (Datenschutzerklärung und Impressum z. B. auf GitHub Pages, Label, Screenshots) · 12 Einreichen · 13 V2 (Farben, Widget-Konfiguration, empirischer Erhaltungsbedarf, Zyklus-Band, „Wie lange bis ausgeglichen“).

## Recht und Geschäft (DE)
- Impressum, kurze Datenschutzerklärung, Hinweis „Keine medizinische Beratung“, Lizenzen der Abhängigkeiten prüfen, Nebentätigkeitsklausel prüfen.
- Die App startet kostenlos. Ein Preis (z. B. 1 €) oder Spenden bedeuten Gewerbe, EÜR, Paid Apps Agreement und DSA-Trader-Status mit öffentlicher Adresse. Spenden gehen in der App nur als In-App-Kauf (Tip Jar), externe Spendenlinks nur im README/auf der Website.
- Julius plant eine zweite, kostenpflichtige App. Gewerbe, Developer-Account und Verkäufername sollen für beide genutzt werden; der Trader-Status gilt dann accountweit, also auch hier. Danach ist ein optionaler Tip Jar per Update denkbar.

## Offene Punkte
1. Name „Kcalwaage“ (Arbeitstitel; Alternativen Kcalsaldo, Bilanzkompass): Markenprüfung DPMA/EUIPO/App Store vor Schritt 11.
2. Health-Sync von MyFitnessPal/Yazio prüfen.
3. Nebentätigkeitsklausel prüfen.
4. Entwurf Impressum und Datenschutzerklärung.
