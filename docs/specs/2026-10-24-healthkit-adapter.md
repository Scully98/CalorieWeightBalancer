# HealthKit-Adapter (P4)

Stand 2026-10-24. In Umsetzung auf Branch `feature/home-page-base`. Voraussetzung P1 ist umgesetzt; P2 und P3 auch.

## Overview

P4 schließt den HealthKit-Adapter ab. Das meiste steht schon: `HealthKitSource` implementiert `HealthSource` (P1), rechnet Tagessummen per Statistik-Abfrage, liest seit P3 den letzten Wert pro Tag für Gewicht, KFA und Magermasse, liest Größe, Geburtsdatum und Geschlecht, und `useBalance` lädt im Vordergrund neu. Es fehlen: ein Zustand `empty` im Lade-Hook, eine prüfbare Absicherung, dass nur gelesen und keine Rohsamples summiert werden, die vollständige Typenliste in `CLAUDE.md` ein Weg, die Tageswerte am iPhone mit der Health-App zu vergleichen (Dev-Screen „Tageswerte“), und zwei Zeilen „Gewicht“ und „Körperfett“ unter „Was ankommt“ auf der Daten-Seite, damit man im Alltag sieht, ob die Waage mit Health synchronisiert. Betroffen: `src/health/`, `src/features/balance/`, `eslint.config.js`, `src/dev/`, `src/app/dev/`, Einstellungen, `CLAUDE.md`, Release-Check.

### Ausgangslage: Anforderungen (wörtlich)

> **P4 HealthKit-Adapter**
> Inhalt: HealthKitSource implementiert HealthSource. Tagessummen per HKStatisticsCollectionQuery für Nahrung, Ruhe, Aktiv; letzter Wert pro Tag für Gewicht, KFA, Magermasse; Größe, Geburtsdatum, Geschlecht einmalig. Hook usePeriodData(period) mit Laden, Fehler, Leer. Aktualisierung bei App-Vordergrund. Voraussetzung: P1 (läuft parallel zu P2/P3).
> [ ] Nur Leserechte angefragt, genau die Typen aus der CLAUDE.md.
> [ ] Keine Rohsamples summiert (Code-Review-Punkt); Watch + iPhone ergeben keine Doppelzählung.
> [ ] Keine Daten ergibt Zustand empty, nicht einen Fehler.
> [ ] Manuell auf dem iPhone: Werte für 3 Stichtage stimmen mit der Health-App überein.

### Stand im Code (2026-10-24)

| Anforderung | Vorhanden | Fehlt |
|---|---|---|
| `HealthKitSource` implementiert `HealthSource` | `src/health/healthkit-source.ts` (P1 M7) | — |
| Tagessummen Nahrung, Ruhe, Aktiv per Statistik-Abfrage | `queryDailyEnergy` mit `queryStatisticsCollectionForQuantity(['cumulativeSum'], { day: 1 })`, dazu stündliche Buckets für die Ruhe-Abdeckung (`src/health/daily-energy.ts`) | — |
| Letzter Wert pro Tag für Gewicht, KFA, Magermasse | `queryDailyBody` mit `['mostRecent']` (P3 M5, `src/health/daily-body.ts`) | — |
| Größe, Geburtsdatum, Geschlecht einmalig | `readHealthProfile` (`src/health/scan.ts`): neuester Größe-Wert, `getDateOfBirthAsync`, `getBiologicalSexAsync`; einmal pro Laden | — |
| Hook mit Laden, Fehler, Leer | `useBalance(settings)` → `LoadState` = `loading \| done \| error` (`src/hooks/use-foreground-refresh.ts`); Leer erkennt erst `balance-page.tsx` (`flagCounts.noFood === days`) | Zustand `empty` im Hook |
| Aktualisierung bei App-Vordergrund | `useForegroundRefresh` lädt bei `AppState` `active` neu, nur das neueste Ergebnis zählt (`latestOnly`) | — |
| Nur Leserechte | `requestAuthorization({ toRead: READ_TYPES })`; Config-Plugin `NSHealthUpdateUsageDescription: false`, `background: false` (`app.json`) | Test, der das festhält |
| Typen aus CLAUDE.md | `READ_TYPES`: 7 Mengen (Nahrung, Ruhe, Aktiv, Gewicht, KFA, Magermasse, Größe) + Geburtsdatum + Geschlecht | CLAUDE.md-Tabelle nennt nur 6 (ohne Größe, Geburtsdatum, Geschlecht) |
| Keine Rohsamples summiert | `queryQuantitySamples` nur an 4 Stellen, keine summiert: `scan.ts` (Anzahl Messungen bis 100; erster Nahrungseintrag), `healthkit-source.ts` (`firstDataDate`, `weightBefore`, je `limit: 1`); `getMostRecentQuantitySample` für Einzelwerte | Absicherung gegen künftige Summen |
| Manuelle Prüfung 3 Stichtage | kein Screen zeigt Werte pro Tag | Dev-Screen „Tageswerte“ |

## Key Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|-------------------------|
| 1 | Kein neuer Hook: `usePeriodData(period)` aus dem Plan ist `useBalance(settings)`. Er bekommt den Zustand `empty` | `useBalance` lädt den Zeitraum schon über `HealthSource`, mit Fehler und Vordergrund-Refresh — Julius 2026-10-24 | Umbenennen in `usePeriodData`; eigener Rohdaten-Hook unter `useBalance` |
| 2 | `empty` = im Zeitraum hat kein Tag einen Nahrungseintrag (auch: Zeitraum mit 0 Tagen, z. B. „Alles“ ohne Daten). Der Zustand trägt die Tagesanzahl für den Text („Keine Nahrungsdaten in den letzten {{count}} Tagen“) | Wie die heutige Prüfung in der Bilanz-Seite; iOS verrät verweigerte Leserechte nicht, also immer mit „Berechtigungen prüfen“ erklären (CLAUDE.md) | `empty` erst, wenn gar kein Typ Werte hat |
| 3 | `error` bleibt für unerwartete Ausnahmen. `HealthKitSource` wirft nie (alle Abfragen über `safe`), fehlende Rechte oder Daten landen also in `empty`, nie in `error` | Abnahme „Keine Daten ergibt Zustand empty, nicht einen Fehler“ | — |
| 4 | Typenliste in `CLAUDE.md` um Größe (`height`), Geburtsdatum (`dateOfBirth`) und Geschlecht (`biologicalSex`) ergänzen, „einmalig, für Mifflin-St Jeor“. Ein Test hält `READ_TYPES` auf genau diese 9 Typen und prüft, dass nur `toRead` angefragt wird | P4 nennt die drei selbst; ohne sie müsste man alles im Intro tippen — Julius 2026-10-24 | Nur die 6 Typen anfragen |
| 5 | „Einmalig“ heißt: Größe, Geburtsdatum und Geschlecht sind ein Wert je Laden, nicht je Tag (wie heute in `readHealthProfile`) | Merkmale, keine Zeitreihe; ein Laden je Vordergrund kostet drei kleine Abfragen | Einmal pro App-Start cachen (Änderungen in Health kämen erst nach Neustart an) |
| 6 | Rohsamples absichern per ESLint: `queryQuantitySamples` ist nur in `src/health/scan.ts` und `src/health/healthkit-source.ts` erlaubt, Meldung „Sum Health values with statistics queries, not raw samples.“ Die erlaubten Aufrufe tragen einen Kommentar, warum sie nichts summieren | Code-Review-Punkt wird prüfbar; die vier vorhandenen Aufrufe holen nur Anzahl, ersten oder letzten Eintrag | Nur Review-Checkliste; Grep im CI |
| 7 | Keine Doppelzählung Watch + iPhone wird nicht im Unit-Test geprüft (das macht HealthKit in der Statistik-Abfrage), sondern in der manuellen Stichtag-Prüfung an einem Tag, an dem beide Aktivenergie geschrieben haben | Ein Mock kann HealthKits Deduplizierung nicht nachbilden | Fake-Statistik mit zwei Quellen (prüft nur den Mock) |
| 8 | Dev-Screen „Tageswerte“ (nur Development-Build) unter Einstellungen → Dev: letzte 30 Tage + heute aus der aktiven `HealthSource`, je Tag Nahrung, Ruhe (mit Abdeckung), Aktiv, Gewicht, KFA, Magermasse als Rohwerte | Abnahme „3 Stichtage stimmen mit der Health-App überein“ braucht Werte pro Tag — Julius 2026-10-24 | Daten-Seite um Gewicht/KFA ergänzen (nur „kommt an“, keine Tageswerte); beides |
| 9 | Der Dev-Screen liegt wie die Galerie unter `src/dev/`, Route als `__DEV__`-Stub, und der Release-Check sucht zusätzlich nach seinem Marker | Gleiche Absicherung wie P1 M9: kein Dev-Code im Release-Bundle | Eigener Build-Profil-Schalter |
| 10 | „Was ankommt“ auf der Daten-Seite bekommt zwei Zeilen „Gewicht“ und „Körperfett“ (Quelle des neuesten Eintrags, „X von N Tagen“), wie Nahrung, Ruhe und Aktiv. Für alle Nutzer im Release sichtbar | Seit P3 liest die App die Werte, zeigt sie aber nirgends; so sieht man, ob die Waage synchronisiert — Julius 2026-10-24 | Erst mit Chart und Abgleich-Karte der Homepage |
| 11 | „Körperfett“ zählt Tage mit KFA **oder** Magermasse, Quelle = neuester KFA-Eintrag, sonst neuester Magermasse-Eintrag (wie die Intro-Übersicht in `scan.ts`). Ohne Messung: Status „fehlt“ mit „keine Messungen · Zugriff prüfen“ | Manche Waagen schreiben nur Magermasse; ohne Waage ist „keine Daten“ kein Fehler der Daten, aber iOS verrät verweigerte Rechte nicht (CLAUDE.md) — bestätigt von Julius 2026-10-24 (Start der Umsetzung) | Eigene Zeile „Magermasse“; Text „keine Daten · Zugriff prüfen“ wie bei Energie |

## Implementation Details

### Milestone Map

| Milestone | Delivers | 🟢 Add | 🟠 Change | 🔴 Delete | Depends On |
|-----------|----------|--------|-----------|-----------|------------|
| M1 — Leserechte & Typen | Test für `READ_TYPES` und `toRead`, CLAUDE.md-Tabelle | 1 | 1 | 0 | — |
| M2 — Keine Rohsamples | ESLint-Regel, Kommentare an den erlaubten Aufrufen | 0 | 3 | 0 | — |
| M3 — Zustand empty | `empty` in `useBalance`, Bilanz- und Daten-Seite lesen ihn | 1 | 4 | 0 | — |
| M4 — Dev-Screen Tageswerte | Liste der Tageswerte, Route-Stub, Link, Release-Check | 4 | 3 | 0 | — |
| M5 — Prüfung am iPhone | 3 Stichtage gegen die Health-App, Watch + iPhone | 0 | 1 | 0 | M4 |
| M6 — Waagen-Zeilen auf der Daten-Seite | „Gewicht“ und „Körperfett“ unter „Was ankommt“ | 0 | 11 | 0 | — |

```
🟢 Add   🟠 Change   🔴 Delete
```

Abnahmekriterien → Milestones:

| Kriterium | Milestone |
|---|---|
| Nur Leserechte, genau die Typen aus der CLAUDE.md | M1 |
| Keine Rohsamples summiert; Watch + iPhone ohne Doppelzählung | M2 (Code), M5 (Gerät) |
| Keine Daten → Zustand `empty`, kein Fehler | M3 |
| 3 Stichtage stimmen mit der Health-App überein | M4 (Screen), M5 (Prüfung) |
| (Ergänzung) Gewicht und Körperfett unter „Was ankommt“ | M6 |

---

### ✅ Milestone 1 — Leserechte & Typen

> Ein Test hält fest, dass die App genau die 9 Typen und nur lesend anfragt, und `CLAUDE.md` nennt alle 9.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/health/__tests__/authorization.test.ts` | `READ_TYPES` = genau 9 Typen; `requestAuthorization` nur mit `toRead`; Fehler → `{ ok: false }` |
| 🟠 | `CLAUDE.md` | HealthKit-Tabelle: Größe, Geburtsdatum, Geschlecht („einmalig, für Mifflin-St Jeor“) |

#### To-Dos

- ✅ Test `READ_TYPES` equals exactly: dietary energy, basal energy, active energy, body mass, body fat percentage, lean body mass, height, date of birth, biological sex (order-independent)
- ✅ Test `requestReadAccess()` calls `requestAuthorization` once with `{ toRead: READ_TYPES }` and no `toShare` _(hier prüft der Test bewusst die Aufruf-Argumente: Sie sind die Anforderung (nur `toRead`))_
- ✅ Test `requestReadAccess()` returns `{ ok: false }` when `requestAuthorization` throws
- ✅ Test that the HealthKit config plugin in `app.json` has `NSHealthUpdateUsageDescription: false` and `background: false` (read the JSON in the test) _(liest `app.json` per Import; `background: false` muss sich ändern, wenn Background Delivery fürs Widget kommt (Schritt 9))_
- ✅ Update the HealthKit table in `CLAUDE.md`: rows for `height` (newest value, V1), `dateOfBirth` and `biologicalSex` (characteristics, V1), all „einmalig, für Mifflin-St Jeor“ _(dazu Absatz „Nur Leserechte …“ und der Rohsample-Hinweis)_
- ✅ Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- ✅ Commit (`test: pin HealthKit read types and read-only access`)

#### Notes / Constraints

> - `menstrualFlow` bleibt V2 und wird nicht angefragt.
> - iOS fragt nur Typen ab, die noch nie gefragt wurden. Bereits erteilte Antworten ändern sich durch P4 nicht, weil die Liste gleich bleibt.

---

### ✅ Milestone 2 — Keine Rohsamples

> Rohsample-Abfragen sind nur an den Stellen erlaubt, die nichts summieren; der Lint meldet jede neue.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `eslint.config.js` | `no-restricted-imports` für `queryQuantitySamples` aus `@kingstinct/react-native-healthkit` außerhalb `src/health/scan.ts` und `src/health/healthkit-source.ts` |
| 🟠 | `src/health/scan.ts` | Kommentar an `sampleCount` und am ersten Nahrungseintrag: zählt bzw. holt einen Eintrag, summiert nicht |
| 🟠 | `src/health/healthkit-source.ts` | Kommentar an `firstDataDate` und `weightBefore`: ein Eintrag (`limit: 1`), keine Summe |

#### To-Dos

- ✅ Add the `no-restricted-imports` rule (`paths: [{ name: '@kingstinct/react-native-healthkit', importNames: ['queryQuantitySamples'], message: 'Sum Health values with statistics queries, not raw samples.' }]`) for `src/**/*.{ts,tsx}`, ignoring `src/health/scan.ts`, `src/health/healthkit-source.ts` and `src/health/__tests__/**` _(Dev-Code (`src/dev/**`, `src/app/dev/**`) unterliegt der Rohsample-Sperre auch; Tests in `src/health/__tests__/**` sind ausgenommen (sie mocken das Modul))_
- ✅ Combine it with the existing `@/dev/*` patterns: one block for all `src/**` files with both the `paths` (raw samples) and `patterns` (`@/dev/*`) options, and a later block for `scan.ts` and `healthkit-source.ts` that sets the rule again with only the `@/dev/*` patterns (ESLint keeps only the last config per rule and file) _(vier Blöcke mit gemeinsamen Konstanten `DEV_CODE` und `RAW_SAMPLES`: alle `src/**` beide Sperren; `scan.ts`/`healthkit-source.ts` und Health-Tests nur `@/dev`; Dev-Code nur Rohsamples)_
- ✅ Verify the rule: a temporary import in `daily-energy.ts` gives the error; the `@/dev/*` rule still reports a temporary `@/dev` import in `balance-page.tsx`; then revert both _(Probe: `daily-energy.ts` und `demo-source.ts` melden den Rohsample-Import, `balance-page.tsx` den `@/dev`-Import, `scan.ts` nichts; zurückgesetzt)_
- ✅ Add the comments at the four allowed calls _(drei Kommentare: `sampleCount`, erster Nahrungseintrag in `scan.ts`, gemeinsamer Kommentar für `firstDataDate`/`weightBefore`)_
- ✅ Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- ✅ Commit (`chore: allow raw HealthKit samples only where nothing is summed`)

#### Notes / Constraints

> - `getMostRecentQuantitySample` bleibt erlaubt: Es liefert einen Einzelwert (neuester Eintrag), keine Summe.
> - Energie-Summen kommen nur aus `queryStatisticsCollectionForQuantity` mit `cumulativeSum`; HealthKit dedupliziert dabei Quellen wie iPhone und Watch.

---

### Milestone 3 — Zustand empty

> `useBalance` meldet `empty`, wenn der Zeitraum keinen Nahrungseintrag hat; die Seiten lesen den Zustand, statt selbst zu zählen.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `src/features/balance/use-balance.ts` | `BalanceState` = `loading \| error \| empty \| done`; `toBalanceState(load)` |
| 🟢 | `src/features/balance/__tests__/use-balance.test.ts` | `toBalanceState`: done → empty bei 0 Tagen mit Nahrung, auch bei 0 Tagen |
| 🟠 | `src/features/balance/components/balance-page.tsx` | Leerer Zustand aus `state.status === 'empty'` statt `flagCounts.noFood === days` |
| 🟠 | `src/features/balance/components/data-page.tsx` | `empty` wie bisher den leeren Zustand zeigen (Berechtigungen prüfen) |
| 🟠 | `src/features/balance/components/home-screen.tsx` | Tagesanzahl auch aus `empty` |

#### To-Dos

- 🔲 Add `{ status: 'empty'; days: number; report: BalanceReport }` to `BalanceState`; keep `LoadState` in `use-foreground-refresh.ts` generic
- 🔲 Create `toBalanceState(state: LoadState<BalanceReport>): BalanceState`: `done` with `flagCounts.noFood === days` (includes 0 days) → `empty`; everything else unchanged
- 🔲 Use it in `useBalance`
- 🔲 Update `balance-page.tsx`: empty state from `status === 'empty'`, count from `state.days`; keep the permissions hint
- 🔲 Update `data-page.tsx`: `empty` shows the same as today for a period without food (calc card „Noch kein Tag mit Nahrungseintrag“ and „Was ankommt“ from `state.report`)
- 🔲 Update `home-screen.tsx`: days from `done` or `empty`
- 🔲 Test `toBalanceState`: no food on any day → `empty` with days; one day with food → `done`; 0 days → `empty`; `loading`/`error` pass through
- 🔲 Test that `loadBalance` with a source that has no data at all resolves (no throw) and maps to `empty` (demo scenario `empty`)
- 🔲 Check the gallery entry 1f in the simulator: still the empty state with „Berechtigungen prüfen“
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- 🔲 Commit (`feat: report an empty period as its own load state`)

#### Notes / Constraints

> - Kein neuer Text: Der leere Zustand nutzt die vorhandenen Schlüssel `home.empty` und `home.checkPermissions`.
> - `empty` trägt den Report weiter, damit die Daten-Seite auch ohne Nahrung zeigen kann, was sonst ankommt (z. B. Aktivenergie da, Nahrung fehlt).

---

### Milestone 4 — Dev-Screen Tageswerte

> Ein Development-Screen zeigt die Rohwerte der letzten 30 Tage und von heute, damit sich einzelne Tage mit der Health-App vergleichen lassen.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/dev/day-values/day-values-screen.tsx` | Liste je Tag aus `useHealthSource().days(...)`, neueste zuerst |
| 🟢 | `src/dev/day-values/day-value-rows.ts` | Reine Formatierung eines `DayRecord` zu Zeilen (getestet) |
| 🟢 | `src/dev/day-values/__tests__/day-value-rows.test.ts` | Formatierung, fehlende Werte als „–“ |
| 🟢 | `src/app/dev/day-values.tsx` | Stub: `__DEV__ ? require('@/dev/day-values/day-values-screen') : () => null` |
| 🟠 | `src/app/_layout.tsx` | `Stack.Screen name="dev/day-values"` im `__DEV__`-Block |
| 🟠 | `src/features/settings/components/settings-page.tsx` | Link „Tageswerte (dev) ›“ im Dev-Bereich |
| 🟠 | `scripts/check-release-bundle.sh` | Zusätzlich nach `kcalwaage-day-values` suchen |

#### To-Dos

- 🔲 Create `dayValueRows(record)` → `{ date, lines: string[] }` with: food, resting (kcal, plus „Abdeckung 75 %“ when `restingCoverage < 1`), active, weight (kg, 2 decimals), body fat (% with 1 decimal from the 0–1 fraction), lean mass (kg, 2 decimals); kcal whole numbers like the Health app; missing values as „–“; dev texts stay English/unübersetzt like the other dev screens
- 🔲 Create `day-values-screen.tsx`: loads `days(addDays(today, −30), 31)` from the active `HealthSource` on mount and on pull-to-refresh, newest day first, title „Tageswerte (dev)“, back link „‹ Einstellungen“; marker constant `DAY_VALUES_MARKER = 'kcalwaage-day-values'`
- 🔲 Create the stub route and register it in `_layout.tsx` next to the gallery routes
- 🔲 Add the link to the dev section in Einstellungen
- 🔲 Extend `check-release-bundle.sh` with `kcalwaage-day-values`; run it, expect exit 0
- 🔲 Test `dayValueRows`: full record; record without any value; coverage line only below 100 %; body fat 0.2134 → „21,3 %“
- 🔲 Check in the simulator: the screen opens from Einstellungen (dev) and lists 31 days (no Health data in the simulator → all „–“)
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- 🔲 Commit (`feat: add dev screen with daily Health values`)

#### Notes / Constraints

> - Rohwerte, keine Rechnung: Der Screen zeigt, was `HealthSource.days` liefert, nicht Bilanz oder Mifflin. So vergleicht man genau die Statistik-Abfrage mit der Health-App.
> - Health zeigt Energie in der Tagesansicht als Summe in kcal, Gewicht mit 1–2 Nachkommastellen; daher ganze kcal und 2 Nachkommastellen bei kg.

#### 📐 Wireframe — DayValuesScreen

```
┌─────────────────────────────────────┐
│ 14:32                       ▮▮▮ ▭   │
├─────────────────────────────────────┤
│ ‹ Einstellungen                     │  LinkButton
│ Tageswerte (dev)                    │  AppText largeTitle
│ Rohwerte aus Health, neueste zuerst │  AppText footnote, muted
├─────────────────────────────────────┤
│ Sa 24.10. (heute)                   │  AppText bodyStrong
│  Nahrung 1.420 kcal · Ruhe 1.090    │  AppText footnote
│  Aktiv 290 · Gewicht –              │
│ ─────────────────────────────────── │  Divider
│ Fr 23.10.                           │
│  Nahrung 2.910 kcal · Ruhe 1.802    │
│  (Abdeckung 75 %) · Aktiv 845       │
│  Gewicht 82,41 kg · KFA 21,3 %      │
│  Mager 64,85 kg                     │
│ ─────────────────────────────────── │
│ …                                   │
└─────────────────────────────────────┘
```

**Component tree:**
DayValuesScreen (route `src/app/dev/day-values.tsx` → `src/dev/day-values/day-values-screen.tsx`)
├── LinkButton „‹ Einstellungen“
├── AppText (Titel, Untertitel)
└── FlatList (RefreshControl)
    └── DayValueRow[] (AppText Datum, AppText Zeilen, Divider)

#### ⌨️ Keyboard Shortcuts

Keine App-Kürzel (Touch-App, Dev-Screen). Es gelten die Entwickler-Kürzel aus der P0/P1-Spec (M4).

---

### Milestone 5 — Prüfung am iPhone

> Julius vergleicht drei Stichtage im Dev-Screen mit der Health-App; dabei ein Tag mit Watch und iPhone.

**Depends on:** Milestone 4

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `docs/specs/2026-10-24-healthkit-adapter.md` | Ergebnis der Stichtage eintragen |

#### To-Dos

- 🔲 Install the development build on the iPhone (`npx expo run:ios --device`) and open Einstellungen → „Tageswerte (dev)“
- 🔲 Pick 3 days: one normal day, one with Watch and iPhone both writing active energy, one with a scale measurement (weight and body fat)
- 🔲 For each day compare in Health → Durchsuchen → (Nahrungsenergie, Ruheenergie, Aktivitätsenergie, Gewicht, Körperfettanteil, Fettfreie Körpermasse) → Tag: the day's value (energy: „Gesamt“; body: last value of the day)
- 🔲 Record the 3 days and both numbers per value in this spec (table below); differences > 1 kcal or > 0,01 kg are a finding
- 🔲 Confirm the Watch + iPhone day matches Health's total, not the sum of both sources
- 🔲 Commit (`docs: record HealthKit spot check`)

**Stichtage (von Julius auszufüllen)**

| Tag | Wert | Health-App | Tageswerte (dev) |
|---|---|---|---|
| | Nahrung | | |
| | Ruhe | | |
| | Aktiv | | |
| | Gewicht | | |
| | KFA | | |
| | Magermasse | | |

#### Notes / Constraints

> - Nur Julius kann das prüfen: Der Simulator hat keine Health-Daten, und der Vergleich braucht die echte Health-App.
> - Abweichungen in Ruheenergie können von Teiltagen kommen: Der Dev-Screen zeigt den gemessenen Wert, die Bilanz rechnet ab 6 h hoch (P2).

---

### Milestone 6 — Waagen-Zeilen auf der Daten-Seite

> „Was ankommt“ zeigt neben Nahrung, Ruhe- und Aktivenergie auch Gewicht und Körperfett mit Quelle und Anzahl der Tage, für alle Nutzer.

**Depends on:** none (P3 liefert die Körperwerte pro Tag)

#### Ausgangslage (wörtlich, Julius 2026-10-24)

> „ja bitte ergänze da auch diese zwei zeilen, das wäre super“ — auf den Vorschlag: „Was ankommt“ bekommt die Zeilen „Gewicht · Withings · 14 von 30 Tagen“ und „Körperfett · Withings · 14 von 30 Tagen“, damit man im Alltag sieht, ob die Waage mit Health synchronisiert; anders als der Dev-Screen für alle Nutzer im Release sichtbar.

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `src/health/source.ts` | `DataKey = EnergyKey \| 'weight' \| 'bodyFat'`; `latestSources()` liefert alle fünf |
| 🟠 | `src/health/healthkit-source.ts` | `latestSources`: `latest(weight)`, Körperfett = `latest(bodyFat)`, sonst `latest(leanMass)` |
| 🟠 | `src/dev/demo/demo-source.ts` | Demo-Quelle für die Waage (z. B. „Withings“), `empty` ohne |
| 🟠 | `src/features/balance/use-balance.ts` | `DATA_KEYS` (Reihenfolge der Zeilen), `daysWithData` und `sources` für alle fünf |
| 🟠 | `src/features/balance/data-rows.ts` | `buildDataRows` über `DATA_KEYS`; Text bei fehlenden Messungen |
| 🟠 | `src/features/balance/__tests__/data-rows.test.ts` | Zeilen Gewicht und Körperfett, mit und ohne Messungen |
| 🟠 | `src/health/__tests__/healthkit-source.test.ts` | Körperfett-Quelle fällt auf Magermasse zurück |
| 🟠 | `src/i18n/locales/de.ts` | `data.rows.weight` „Gewicht“, `data.rows.bodyFat` „Körperfett“, `data.noMeasurements` „keine Messungen · Zugriff prüfen“ |
| 🟠 | `src/i18n/locales/en.ts` | „Weight“, „Body fat“, „no measurements · check access“ |
| 🟠 | `docs/specs/2026-10-21-data-page.md` | Satz „Gewicht und Körperfett fehlen bewusst“ ersetzen; Punkt 2 um die zwei Zeilen ergänzen |
| 🟠 | `src/dev/demo/__tests__/scenarios.test.ts` | `normal30`: Gewicht/Körperfett an den Messtagen gezählt; `noBodyFat30`: Körperfett fehlt |

#### To-Dos

- 🔲 Add `DataKey` to `src/health/source.ts` and widen `latestSources()` to `Record<DataKey, SourceRevision | undefined>`; keep `EnergyKey` for the calculation lines
- 🔲 Update `healthKitSource.latestSources`: `weight` = `latest(QUANTITY.weight).source`; `bodyFat` = `latest(QUANTITY.bodyFat).source`, else `latest(QUANTITY.leanMass).source` (Key Decision 11)
- 🔲 Update `createDemoSource.latestSources`: scale source for `weight` and `bodyFat` (`noBodyFat30`: no `bodyFat` source; `empty`: none)
- 🔲 Add `DATA_KEYS = ['food', 'resting', 'active', 'weight', 'bodyFat']` in `use-balance.ts`; `daysWithData.weight` = period days with `weightKg`, `daysWithData.bodyFat` = period days with `bodyFatFraction` or `leanMassKg`
- 🔲 Update `buildDataRows` to map over `DATA_KEYS`; found → „{Quelle} · X von N Tagen“ like today; missing → `data.noMeasurements` for `weight`/`bodyFat`, unchanged texts for energy; status icons and accessibility label as for the other rows
- 🔲 Add the i18n keys DE/EN
- 🔲 Test `buildDataRows`: five rows in order; weight found with source and „14 von 30 Tagen“; body fat missing → „keine Messungen · Zugriff prüfen“, status `missing`
- 🔲 Test `healthKitSource.latestSources`: body fat source falls back to lean mass when there is no body fat sample (result only, no mock-call assertions)
- 🔲 Test the scenarios: `normal30` counts weight and body fat on its measurement days; `noBodyFat30` has weight but no body fat
- 🔲 Update `docs/specs/2026-10-21-data-page.md` (section „Inhalt“, point 2, and the sentence about weight and body fat)
- 🔲 Check in the simulator: gallery 1a shows five rows under „Was ankommt“ (swipe not possible in the simulator → check page 2 via a test of `buildDataRows` with the `normal30` report, like P2 M5); Julius checks the page on the iPhone
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run check:release-bundle`; all exit 0
- 🔲 Commit (`feat: show weight and body fat under arriving data`)

#### Notes / Constraints

> - Die Zeilen sagen nur „kommt an“ (Quelle, Anzahl Tage), keine Werte und keine Rechnung; Werte zeigen Chart und Abgleich-Karte der Homepage.
> - Untertitel „Letzte {{count}} Tage, Quelle des neuesten Eintrags.“ (`data.arrivingBody`) passt für alle fünf Zeilen und bleibt.
> - Die Zeilen sind Teil der Release-App (nicht `__DEV__`); der Release-Check bleibt grün, weil kein Dev-Code dazukommt.

#### 📐 Wireframe — DataPage, Abschnitt „Was ankommt“

```
┌─────────────────────────────────────┐
│ Was ankommt                         │  Headline h3
│ Letzte 30 Tage, Quelle des neuesten │  subline (data.arrivingBody)
│ Eintrags.                           │
│                                     │
│ ● Nahrung                           │  StatusRow found
│   Yazio · 28 von 30 Tagen           │
│ ● Ruheenergie                       │  StatusRow found
│   Apple Watch · 30 von 30 Tagen     │
│ ● Aktivenergie                      │  StatusRow found
│   Apple Watch · 30 von 30 Tagen     │
│ ● Gewicht                           │  StatusRow found (neu)
│   Withings · 14 von 30 Tagen        │
│ ○ Körperfett                        │  StatusRow missing (neu)
│   keine Messungen · Zugriff prüfen  │
└─────────────────────────────────────┘
```

**Component tree:**
DataPage
└── Report
    ├── Card „So entsteht deine Bilanz“ (unverändert)
    ├── View „Was ankommt“
    │   ├── Headline
    │   └── StatusRow[] (food, resting, active, weight, bodyFat)
    └── Card „Geschätzte Ruheenergie“ (unverändert)

#### ⌨️ Keyboard Shortcuts

Keine neuen Kürzel: reine Touch-App fürs iPhone (siehe P0/P1-Spec, M4).

---

## Open Questions

| # | Question | Owner | Impact if Unresolved |
|---|----------|-------|----------------------|
| 1 | ✅ ~~Soll der Dev-Screen „Tageswerte“ nach V1 bleiben?~~ Bleibt (nur Development) bis V2, danach entfernen — Julius 2026-10-24 | Julius | erledigt |

## Concerns & Decisions Log

| # | Type | Concern | Resolution |
|---|------|---------|------------|
| 1 | ⚠️ Concern | Der Plan nennt einen neuen Hook `usePeriodData(period)`; `useBalance(settings)` deckt Laden, Fehler und Vordergrund schon ab | `useBalance` + Zustand `empty` (Key Decision 1) — Julius 2026-10-24 |
| 2 | ⚠️ Concern | „Genau die Typen aus der CLAUDE.md“ widerspricht dem Code und P4 selbst: Größe, Geburtsdatum und Geschlecht fehlen in der Tabelle | CLAUDE.md ergänzen, Test hält die 9 Typen fest (Key Decision 4) — Julius 2026-10-24 |
| 3 | ⚠️ Concern | Die Stichtag-Prüfung braucht Werte pro Tag; kein Screen zeigt sie | Dev-Screen „Tageswerte“ (Key Decision 8) — Julius 2026-10-24 |
| 4 | ⚠️ Concern | „Keine Doppelzählung“ lässt sich im Unit-Test nicht belegen (Deduplizierung macht HealthKit) | Manuell am Stichtag mit Watch + iPhone (Key Decision 7, M5) |
| 5 | 💡 Alternative | „Code-Review-Punkt“ nur als Checkliste wäre nicht prüfbar | ESLint-Regel mit Allowlist (Key Decision 6) |
| 6 | ⚠️ Concern | ESLint behält pro Datei nur die letzte Konfiguration einer Regel; ein zweiter `no-restricted-imports`-Block würde die `@/dev/*`-Sperre aufheben | Ein Block mit beiden Sperren für `src/**`, ein späterer nur mit `@/dev/*` für die zwei erlaubten Dateien (M2) |
| 7 | 💡 Alternative | Gewicht und Körperfett als Zeilen auf der Daten-Seite („Was ankommt“), damit man im Alltag sieht, ob die Waage synchronisiert | Aufgenommen als M6 (Key Decisions 10, 11) — Julius 2026-10-24 |
| 8 | ⚠️ Concern | `docs/specs/2026-10-21-data-page.md` sagt „Gewicht und Körperfett fehlen bewusst: Sie gehen noch nicht in die Bilanz ein und kommen mit dem Analyse-Screen.“ | Seit P3 gehen sie in die Analyse ein; der Satz wird in M6 ersetzt |
