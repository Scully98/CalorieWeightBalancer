# Einstellungen und Settings-Store (P5)

Stand 2026-10-24. In Umsetzung auf Branch `feature/home-page-base`. Voraussetzung P0 und P1 sind umgesetzt; P2–P4 auch. Branch: weiter auf `feature/home-page-base` (wie P2–P4), sofern Julius nichts anderes sagt.

## Overview

P5 macht aus den festen `DEFAULT_SETTINGS` echte, gespeicherte Einstellungen. Ein Store hinter einem Interface liegt in den App-Group-UserDefaults (derselbe Speicher, den später das Widget liest) und hält: heute einbeziehen, Null-Tage als Erhaltung, Toleranz Nahrung/Verbrauch, zuletzt gewählter Zeitraum und die fehlenden Körperdaten für die BMR-Schätzung. Tests laufen mit einer In-Memory-Variante. Der Einstellungen-Screen bekommt die Schalter Null-Tage und „heute einbeziehen“, eine Unterseite „Grundumsatz-Schätzung“ für die Körperdaten, eine Erklärseite „Wie wird gerechnet?“, Links zu Datenschutz, Impressum, Health-Berechtigungen und Sprache sowie die Fußzeile „Keine medizinische Beratung · v1.0.0“. Die Homepage liest die Einstellungen aus dem Store und rechnet bei Änderungen sofort neu, ohne Neuladen; Health-Daten lädt sie nur neu, wenn sich der Zeitraum ändert. Betroffen: `src/storage/`, `src/core/settings.ts`, `src/features/balance/`, `src/features/settings/`, `src/features/intro/`, `src/app/`, `src/components/`, `src/dev/gallery/`, i18n, `eslint.config.js`, `CLAUDE.md`, Langzeitplan.

### Ausgangslage: Anforderungen (wörtlich)

> **P5 Einstellungen und Settings-Store**
> Inhalt: Store in App-Group-UserDefaults (gleicher Speicher, den das Widget liest). Felder: heute einbeziehen, Null-Tage als Erhaltung, Toleranz Nahrung/Verbrauch, zuletzt gewählter Zeitraum, fehlende Körperdaten für die BMR-Schätzung. Einstellungen-Screen mit Schaltern, Links zu Datenschutz, Impressum, Health-Berechtigungen. Voraussetzung: P0, P1. Das kleine native Modul für App Group entsteht hier und wird in P10 wiederverwendet.
> [ ] Werte überleben einen App-Neustart; der Store enthält keine Health-Werte, nur Einstellungen.
> [ ] Änderung in den Einstellungen aktualisiert die Homepage ohne Neuladen.
> [ ] Store ist hinter einem Interface, Tests laufen mit In-Memory-Variante.

### Stand im Code (2026-10-24)

| Anforderung | Vorhanden | Fehlt |
|---|---|---|
| Speicher in den App-Group-UserDefaults | `src/storage/app-group.ts`: `new ExtensionStorage('group.com.scully98.calorieweightbalancer')` aus `@bacons/apple-targets` (natives Expo-Modul `ExtensionStorageModule.swift`: `get`/`setString`/`remove` auf `UserDefaults(suiteName:)`, dazu `reloadWidget()` → `WidgetCenter.shared.reloadAllTimelines()`); Entitlement in `app.json` | Interface davor, In-Memory-Variante |
| Natives Modul für die App Group | siehe oben, seit der Intro-Spec im Einsatz | — (Key Decision 1) |
| Intro-Flag, Körperdaten | `src/storage/settings.ts`: `introCompleted`, `profile.v1` (`StoredProfile`: Größe, Geschlecht, Gewicht + Datum, Alter + Datum; nur Eingaben, nie Health-Werte), Prüfung beim Lesen (`parseProfile`), `subscribeToSettings` + `useSyncExternalStore` | Bearbeiten nach dem Intro |
| Einstellungen (Zeitraum, Null-Tage, heute, Toleranz) | Typ `Settings` + `DEFAULT_SETTINGS` in `src/core/settings.ts` (Kommentar: „Stored in the App Group later (step 6)“) | Speichern, Lesen, UI |
| Homepage liest Einstellungen | `HomeScreen` ruft `useBalance({ ...DEFAULT_SETTINGS, period })`, `period` nur als Prop (Galerie) | Einstellungen aus dem Store |
| Neu rechnen bei Änderung | `useBalance` serialisiert die Settings als Key; jede Änderung lädt alles neu aus HealthKit (`loadBalance`), `getProfile()` wird beim Laden gelesen | Laden und Rechnen trennen |
| Einstellungen-Screen | `settings-page.tsx`: Titel, Platzhaltertext `settings.placeholder`, Dev-Bereich (Intro zurücksetzen, Galerie, Tageswerte, Schriftmuster) | Schalter, Unterseiten, Links, Fußzeile |
| Health-Berechtigungen öffnen | `openHealthApp()` (`x-apple-health://`, Fallback `Linking.openSettings()`), Text `common.permissionsPath` | — |
| Körperdaten-Formular | `BmrCard` + `resolveBmrInputs`/`toStoredProfile` (Intro 3d): nur Felder, die Health nicht liefert, sind editierbar | Wiederverwendung in den Einstellungen |
| Datenschutz-/Impressum-Seiten | keine (Plan-Schritt 11) | URLs |

## Key Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|-------------------------|
| 1 | Kein eigenes natives Modul: Der Store nutzt `ExtensionStorage` aus `@bacons/apple-targets`, das schon in die App-Group-UserDefaults schreibt. P10 (Widget) nutzt dasselbe Modul plus `ExtensionStorage.reloadWidget()` für `WidgetCenter.reloadAllTimelines()` | Das „kleine native Modul“ aus dem Plan gibt es schon und läuft seit dem Intro; kein Swift-Code, kein zusätzlicher nativer Build — Julius 2026-10-24 | Eigenes Expo-Modul `modules/app-group` |
| 2 | Interface `KeyValueStore { get(key): string \| null; set(key, value: string); remove(key) }` mit zwei Varianten: `appGroupStore` (über `ExtensionStorage`) und `createMemoryStore()` (Map). Darauf `createSettingsStore(kv)` → `SettingsStore` mit Einstellungen, Intro-Flag und Körperdaten. Tests bauen den Store über `createMemoryStore()` statt `@bacons/apple-targets` zu mocken | Abnahme „Store ist hinter einem Interface, Tests laufen mit In-Memory-Variante“; dasselbe Muster wie `HealthSource` mit Demo-Quelle | Interface direkt auf Ebene der Einstellungen (ohne Key-Value-Schicht) |
| 3 | Gespeichert werden nur drei Keys: `introCompleted`, `profile.v1` (wie heute) und neu `settings.v1` (JSON: `period`, `zeroDaysAsMaintenance`, `includeToday`, `tolerance`). Bestehende Keys bleiben, damit installierte Development-Builds ihr Intro behalten | Abnahme „keine Health-Werte, nur Einstellungen“ wird prüfbar (Test über alle Keys); keine Migration nötig | Alles in einen Key `settings.v1` mit Migration |
| 4 | Beim Lesen wird `settings.v1` je Feld geprüft; ungültige oder fehlende Felder fallen auf `DEFAULT_SETTINGS` zurück (wie `parseProfile`). Zeitraum: `days` nur 7/30/60/90, `custom` nur mit zwei gültigen `YYYY-MM-DD`; Toleranz ganze Zahlen, Nahrung 0–20, Verbrauch 0–30 | Ein älterer oder beschädigter Eintrag darf die Bilanz nicht kaputt machen | Ganzen Eintrag bei einem Fehler verwerfen |
| 5 | Bedienung in P5: Der Einstellungen-Screen hat die Schalter „Null-Tage = Erhaltung“ und „Heute einrechnen“. Toleranz und Zeitraum liegen im Store, ihre Bedienung (Slider und Zeitraum-Chips) kommt mit der Homepage-Spec auf die Homepage (Plan 24.10.2026). In P5 setzt man sie nur per Test oder Galerie | Plan: Toleranz-Slider und Zeitraum direkt auf der Homepage — Julius 2026-10-24 | Vorerst alles in Einstellungen; Zeitraum-Chips schon jetzt auf Home |
| 6 | Toleranz = ein Prozentwert je Seite: Nahrung 0–20 %, Verbrauch 0–30 %, ganze Prozent, 0 = aus, Standard 0. Der Normbereich (5–20 % bzw. 10–30 %) wird später am Slider nur markiert. `CLAUDE.md` und die Entscheidung „Toleranzen“ im Langzeitplan werden angepasst | Plan 24.10. und Design (`BilanzScreen`: „0 % heißt aus“, `input type=range min=0 max=20`); so rechnet der Kern schon (`tolerance.foodPercent`) — Julius 2026-10-24. Löst Open Question 5 der P0/P1-Spec | Schalter + Wert im Normbereich, unterer Rand vorausgewählt (CLAUDE.md, 12.10.) |
| 7 | Körperdaten ändert man auf einer eigenen Seite „Grundumsatz-Schätzung“ (Zeile in den Einstellungen). Sie zeigt dieselben Felder wie Intro 3d (`BmrCard`): Werte aus Health nur zur Ansicht, fehlende editierbar, unten der geschätzte Grundumsatz. Die Seite gibt es immer, auch wenn Health heute alles liefert | Löst Open Question 6 der Intro-Spec (Größe nie abgefragt, Uhr nur an manchen Tagen) — Julius 2026-10-24 | Felder direkt im Screen; manueller Grundumsatz in kcal (Wireframe 1l, widerspricht Mifflin pro Tag) |
| 8 | Gespeichert wird auf der Seite „Grundumsatz-Schätzung“ mit „Sichern“. Nur geänderte Werte bekommen ein neues Datum (`weightRecordedOn`, `ageRecordedOn` = heute); unveränderte behalten ihr Datum, damit das Alter weiter richtig mitwächst. Ein geleertes Feld löscht den Wert | `resting.ts` rechnet das Alter ab `ageRecordedOn` hoch; ein neues Datum ohne Änderung würde den Nutzer jünger machen | Sofort beim Tippen speichern |
| 9 | Laden und Rechnen getrennt: `useBalance` lädt Health-Daten nur neu bei Zeitraum, „heute einbeziehen“, App-Vordergrund oder neuer `HealthSource`. Null-Tage, Toleranz und Körperdaten rechnen den geladenen Stand sofort neu (reine Funktion `buildReport`), ohne HealthKit-Abfrage und ohne „Rechne …“ | Abnahme „aktualisiert die Homepage ohne Neuladen“; später live beim Ziehen der Slider — Julius 2026-10-24 | Jede Änderung lädt neu (wie heute) |
| 10 | React-Anbindung über `SettingsStoreProvider` (Kontext, Standard `appSettingsStore`) und Hooks `useSettings()`, `useIntroCompleted()`, `useStoredProfile()` per `useSyncExternalStore`. Der Store cacht den gelesenen Stand und gibt bis zur nächsten Änderung dasselbe Objekt zurück | Wie `HealthSourceProvider`; Galerie-Einträge setzen ihre Einstellungen über einen eigenen In-Memory-Store, statt `period` als Prop durchzureichen. `useSyncExternalStore` braucht stabile Snapshots | Globale Funktionen wie heute |
| 11 | ESLint: `@bacons/apple-targets` darf nur `src/storage/app-group.ts` importieren | Der Store bleibt die einzige Stelle, die in die App Group schreibt; P10 erweitert die Ausnahme um den Widget-Datensatz | Nur Konvention |
| 12 | Datenschutz und Impressum sind feste URLs `https://scully98.github.io/CalorieWeightBalancer/datenschutz` und `…/impressum` (Konstanten an einer Stelle), geöffnet im Browser. Bis Schritt 11 laufen sie ins Leere | Die Seiten entstehen in Schritt 11; die App muss dann nicht mehr geändert werden — Julius 2026-10-24 | README als Zwischenziel; Datenschutztext in der App |
| 13 | Zusätzlich zu P5: Fußzeile „Keine medizinische Beratung · v1.0.0“ (Version aus `app.json` über `expo-constants`), Zeile „Sprache ›“ öffnet die iOS-Einstellungen der App (`Linking.openSettings()`, dort wählt iOS die Sprache pro App), Seite „Wie wird gerechnet?“. Nicht in P5: Farben, Erscheinungsbild, Widget, Trackingbeginn (Wireframe 1l) | Apple verlangt den Hinweis; Sprache und Erklärung aus Wireframe 1l — Julius 2026-10-24 | Farben/Widget ausgegraut als „bald“ |
| 14 | Der Zeitraum-Text auf Bilanz- und Daten-Seite sagt „inkl. heute“, wenn „Heute einrechnen“ an ist (`home.periodWithToday`) | Heute steht dort fest „ohne heute“; mit dem Schalter wäre das falsch | — |

## Implementation Details

### Milestone Map

| Milestone | Delivers | 🟢 Add | 🟠 Change | 🔴 Delete | Depends On |
|-----------|----------|--------|-----------|-----------|------------|
| M1 — Store hinter Interface | `KeyValueStore`, App-Group- und In-Memory-Variante, `SettingsStore` mit Prüfung, Tests, ESLint | 4 | 4 | 1 | — |
| M2 — Store in React | Provider und Hooks, Aufrufer umgestellt, Galerie mit eigenem Store | 1 | 6 | 0 | M1 |
| M3 — Homepage liest den Store | Laden/Rechnen getrennt, Einstellungen aus dem Store, Zeitraum-Text mit heute | 0 | 6 | 0 | M2 |
| M4 — Einstellungen-Screen | Schalter, Zeilen, Links, Sprache, Fußzeile | 4 | 3 | 0 | M2 |
| M5 — Seite Grundumsatz-Schätzung | Körperdaten bearbeiten, Speichern mit Datum | 2 | 5 | 0 | M4 |
| M6 — Seite „Wie wird gerechnet?“ | Erklärtext DE/EN | 2 | 4 | 0 | M4 |
| M7 — Doku und Prüfung | CLAUDE.md, Langzeitplan, alte Open Questions, Neustart-Prüfung im Simulator | 0 | 5 | 0 | M3–M6 |

```
🟢 Add   🟠 Change   🔴 Delete
```

Abnahmekriterien → Milestones:

| Kriterium | Milestone |
|---|---|
| Werte überleben einen App-Neustart | M1 (Test: neuer Store über denselben Speicher), M7 (Simulator) |
| Der Store enthält keine Health-Werte, nur Einstellungen | M1 (Test über alle Keys) |
| Änderung in den Einstellungen aktualisiert die Homepage ohne Neuladen | M3 (Rechnen ohne Laden), M4 (Schalter), M7 (Simulator) |
| Store hinter einem Interface, Tests mit In-Memory-Variante | M1, M2 |
| (Ergänzung) Fußzeile, Sprache, „Wie wird gerechnet?“ | M4, M6 |

---

### ✅ Milestone 1 — Store hinter Interface

> Ein `SettingsStore` über einem austauschbaren Key-Value-Speicher hält Einstellungen, Intro-Flag und Körperdaten; Tests nutzen die In-Memory-Variante.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/storage/key-value-store.ts` | Interface `KeyValueStore`, `createMemoryStore()` |
| 🟠 | `src/storage/app-group.ts` | `appGroupStore: KeyValueStore` über `ExtensionStorage`; `APP_GROUP` bleibt |
| 🟢 | `src/storage/settings-store.ts` | `createSettingsStore(kv)`: Einstellungen, Intro, Körperdaten, `subscribe`; `appSettingsStore` |
| 🟢 | `src/storage/parse.ts` | `parseSettings`, `parseProfile` (aus `settings.ts` verschoben) |
| 🟢 | `src/storage/__tests__/settings-store.test.ts` | Neustart, nur bekannte Keys, ungültige Daten, Benachrichtigung |
| 🔴 | `src/storage/settings.ts` | Inhalt wandert nach `settings-store.ts` und `parse.ts` (Aufrufer in M2) |
| 🟠 | `src/storage/__tests__/settings.test.ts` | Fälle übernehmen in `settings-store.test.ts`, ohne `jest.mock('@bacons/apple-targets')`; Datei entfällt |
| 🟠 | `src/core/settings.ts` | Kommentar aktualisieren; `TOLERANCE_LIMITS = { foodPercent: 20, burnPercent: 30 }` |
| 🟠 | `eslint.config.js` | `@bacons/apple-targets` nur in `src/storage/app-group.ts` |

#### To-Dos

- ✅ Create `KeyValueStore` (`get(key): string | null`, `set(key, value: string)`, `remove(key)`) and `createMemoryStore(initial?: Record<string, string>)` with an extra `keys()` for tests _(`createMemoryStore` gibt `MemoryStore` mit `keys()` zurück)_
- ✅ Change `app-group.ts` to export `appGroupStore: KeyValueStore` wrapping `ExtensionStorage` (`get` maps `undefined` from the JS fallback to `null`)
- ✅ Add `TOLERANCE_LIMITS` to `src/core/settings.ts` and update its comment (stored in the App Group, P5)
- ✅ Create `parseSettings(raw: string | null): Settings`: per field fallback to `DEFAULT_SETTINGS` (Key Decision 4); move `parseProfile` and its helpers from `settings.ts` _(in `src/storage/parse.ts`, dazu `parseObject` und `profileToJson`)_
- ✅ Create `createSettingsStore(kv)` → `SettingsStore`: `getSettings()`, `updateSettings(patch: Partial<Settings>)`, `isIntroCompleted()`, `completeIntro(profile)`, `resetIntro()`, `getProfile()`, `setProfile(profile)`, `subscribe(listener)`; snapshots cached until the next write (Key Decision 10); `updateSettings` writes the full `settings.v1` JSON _(`resetIntro` lässt die Einstellungen stehen)_
- ✅ Export `appSettingsStore = createSettingsStore(appGroupStore)`
- ✅ Test: values written by one store are read by a second store over the same memory `KeyValueStore` (= app restart) for every settings field, the intro flag and the profile
- ✅ Test: after `completeIntro`, `setProfile`, `updateSettings` with every field the memory store holds only the keys `introCompleted`, `profile.v1`, `settings.v1`, and `settings.v1` has only the four settings fields (no Health values)
- ✅ Test: `parseSettings` with `null`, invalid JSON, an array, `days: 45`, a custom period with `15.10.2026`, tolerance 25/−1/7.5 → per field defaults; valid custom period and tolerance 20/30 kept
- ✅ Test: `getSettings()` returns the same object until the next write; listeners are notified on every write and not after unsubscribe
- ✅ Move the profile cases of `settings.test.ts` (defined fields only, invalid JSON, wrong types, reset) to the new test; delete `settings.test.ts` _(`src/storage/settings.ts` bleibt bis M2 als dünne Weiterleitung auf `appSettingsStore`, damit jeder Commit baut)_
- ✅ Add `@bacons/apple-targets` to the restricted `paths` in the `src/**` block and a block for `src/storage/app-group.ts` that keeps `DEV_CODE` and `RAW_SAMPLES` (ESLint keeps only the last config per rule and file, see P4 Concern 6); verify with a temporary import in `settings-page.tsx`, then revert _(Probe: Import in `settings-page.tsx` meldet den Fehler, `app-group.ts` nicht; zurückgesetzt)_
- ✅ Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- ✅ Commit (`feat: add settings store behind a key-value interface`)

#### Notes / Constraints

> - `ExtensionStorage.set` mit einem String schreibt `setString`, `get` liefert für Strings den String und für fehlende Keys `null` (Swift-Modul). Ohne natives Modul (Jest) liefert `get` `undefined`, daher die Abbildung auf `null`.
> - Der Widget-Datensatz aus P10 (fertiges Ergebnis: Zeitraum, Bilanz, Spanne, Fett, Zeitstempel) kommt in einen eigenen Key und gehört nicht zum `SettingsStore`. Der Test „nur bekannte Keys“ gilt für den Store aus P5.

---

### ✅ Milestone 2 — Store in React

> Komponenten lesen den Store über Kontext und Hooks; die Galerie gibt jedem Eintrag einen eigenen In-Memory-Store.

**Depends on:** Milestone 1

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/storage/settings-context.tsx` | `SettingsStoreProvider`, `useSettingsStore()`, `useSettings()`, `useIntroCompleted()`, `useStoredProfile()` |
| 🟠 | `src/app/_layout.tsx` | `useIntroCompleted` aus dem Kontext |
| 🟠 | `src/app/intro/found.tsx` | `useSettingsStore().completeIntro(...)` |
| 🟠 | `src/features/settings/components/settings-page.tsx` | „Reset intro (dev)“ über den Store |
| 🟠 | `src/features/balance/resting-fallback.ts`, `src/features/intro/bmr-inputs.ts` | Typ `StoredProfile` aus `settings-store.ts` |
| 🟠 | `src/dev/gallery/entry-screen.tsx` | `SettingsStoreProvider` mit `createSettingsStore(createMemoryStore())`, Einstellungen aus dem Szenario |
| 🟠 | `src/dev/demo/scenarios.ts` | Szenario behält `period`; der Galerie-Store wird damit vorbelegt |

#### To-Dos

- ✅ Create `settings-context.tsx`: context default `appSettingsStore`; hooks via `useSyncExternalStore(store.subscribe, store.getSettings)` etc.
- ✅ Switch `_layout.tsx`, `found.tsx`, the dev reset and the `StoredProfile` imports to the new modules; no import of `@/storage/settings` remains _(`src/storage/settings.ts` gelöscht; `use-balance.ts` liest bis M3 `appSettingsStore.getProfile()`; die Tests brauchen keinen Mock mehr, weil `ExtensionStorage` ohne natives Modul nichts tut)_
- ✅ Gallery: each entry renders inside its own `SettingsStoreProvider` with a memory store seeded from the scenario (period, later toggles), so the gallery never writes the real settings
- ✅ Check in the simulator: intro still shows once; gallery 1a still +7.000 kcal / +0,9 kg; „Reset intro (dev)“ still brings back the intro _(nach Neustart bleibt das Intro erledigt (gespeicherter Key wird gelesen), 1a +7.000 kcal / +0,9 kg; „Reset intro (dev)“ nicht angetippt (kein Tap-Werkzeug), das Verhalten deckt der Store-Test ab)_
- ✅ Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- ✅ Commit (`refactor: read settings through a store context`)

#### Notes / Constraints

> - Kein Provider in `_layout.tsx` nötig: Der Standardwert des Kontexts ist `appSettingsStore`. Nur Galerie und künftige Tests setzen einen anderen Store.

---

### ✅ Milestone 3 — Homepage liest den Store

> Die Homepage nimmt Zeitraum, Null-Tage, heute und Toleranz aus dem Store; Null-Tage, Toleranz und Körperdaten rechnen sofort neu, nur Zeitraum und „heute“ laden Health-Daten neu.

**Depends on:** Milestone 2

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `src/features/balance/use-balance.ts` | `loadPeriodData(source, { period, includeToday }, now)` + `buildReport(data, settings, profile)`; `loadBalance` = beides (für Tests); `useBalance()` ohne Parameter |
| 🟠 | `src/features/balance/__tests__/use-balance.test.ts` | `buildReport` mit anderem Null-Tage-/Toleranz-Wert auf denselben Daten; kein `jest.mock('@/storage/settings')` mehr |
| 🟠 | `src/features/balance/components/home-screen.tsx` | `period`-Prop entfällt, `useBalance()` |
| 🟠 | `src/features/balance/components/balance-page.tsx`, `data-page.tsx` | Zeitraum-Text mit/ohne heute |
| 🟠 | `src/i18n/locales/de.ts`, `en.ts` | `home.periodWithToday_one/_other` |

#### To-Dos

- ✅ Split `loadBalance`: `loadPeriodData` does everything that queries the source (lead-in, period, today record, Health profile, sources, `weightBefore`) and returns it with `start`/`count`; `buildReport(data, { zeroDaysAsMaintenance, tolerance }, storedProfile)` does the rest and is pure _(`PeriodData` = Vorlauf, Zeitraum, heutiger Tag, Health-Profil, Quellen, Gewicht davor)_
- ✅ `useBalance()`: settings from `useSettings()`, profile from `useStoredProfile()`; the load callback depends only on `source`, `period` and `includeToday` (as a key like today); the report is built from the latest loaded data, settings and profile on every render (React Compiler memoizes)
- ✅ Keep `toBalanceState` on the built report; `loading` only before the first load, a later reload keeps the previous report until the new one arrives (as today)
- ✅ `HomeScreen`: drop the `period` prop; days for the header from the state or from `settings.period` _(Zeitraum-Text als `periodLabel` an beide Seiten (`periodText` in `data-rows.ts`))_
- ✅ Add `home.periodWithToday` („Letzte {{count}} Tage, inkl. heute“ / „Last {{count}} days, including today“; `_one`: „Heute“ / „Today“) and use it on both pages when `includeToday` is on _(Test `periodText`)_
- ✅ Test `buildReport`: the same loaded data with zero days on/off gives different `balance.kcal` and `maintenanceDays`; tolerance 5/10 gives the range; a changed stored profile changes the estimate (result tests, no mock-call assertions)
- ✅ Test the load key: settings that differ only in zero days or tolerance give the same key; period or `includeToday` give a different key
- ✅ Update the existing `use-balance.test.ts` cases to pass the profile instead of mocking `@/storage/settings` _(kein Mock mehr nötig; `loadBalance` nimmt das Profil als optionalen Parameter)_
- ✅ Run `npm run lint`, `npm run typecheck`, `npm run test:coverage`; all exit 0
- ✅ Commit (`feat: recompute the balance from stored settings without reloading`)

#### Notes / Constraints

> - Goldener Testfall und P2/P3-Tests bleiben unverändert grün: Der Kern ändert sich nicht.
> - „Ohne Neuladen“ heißt: kein Neustart, kein Pull-to-Refresh, keine HealthKit-Abfrage für Null-Tage, Toleranz und Körperdaten. „Heute einrechnen“ ändert den Zeitraum und lädt deshalb neu; die alte Zahl bleibt bis dahin stehen.

---

### Milestone 4 — Einstellungen-Screen

> Der Einstellungen-Screen wird eine gruppierte iOS-Liste mit zwei Schaltern, Daten-Zeilen, Info-Zeilen und Fußzeile.

**Depends on:** Milestone 2

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/components/switch-row.tsx` | Label, Detailtext, RN `Switch` mit Farb-Tokens, ganze Zeile als ein Schalter für VoiceOver |
| 🟢 | `src/components/nav-row.tsx` | Zeile mit Label, optionalem Wert und `›` bzw. `↗` (externer Link) |
| 🟢 | `src/features/settings/links.ts` | `PRIVACY_URL`, `IMPRINT_URL`, `openPrivacy()`, `openImprint()`, `openLanguageSettings()` |
| 🟠 | `src/features/settings/components/settings-page.tsx` | Gruppen BERECHNUNG, DATEN, INFO, Fußzeile; Dev-Bereich bleibt darunter |
| 🟠 | `src/i18n/locales/de.ts`, `en.ts` | `settings.*` (siehe Texte), `settings.placeholder` entfällt |
| 🟢 | `src/features/settings/__tests__/links.test.ts` | beide URLs `https://scully98.github.io/CalorieWeightBalancer/…` |
| 🟠 | `app.json` | keine Änderung nötig, Version kommt aus `expo.version` (nur prüfen) |

#### To-Dos

- 🔲 Create `SwitchRow` (`label`, `detail?`, `value`, `onValueChange`): `Switch` with `trackColor.true = colors.foreground`, thumb from tokens, no color literals; `accessibilityRole="switch"`, the whole row toggles
- 🔲 Create `NavRow` (`label`, `value?`, `external?`, `onPress`): `›` for pages, `↗` for links leaving the app; min height `touchTarget`
- 🔲 Create `links.ts` with the two URLs (Key Decision 12), `Linking.openURL` for both, `Linking.openSettings()` for the language
- 🔲 Build the settings page (see wireframe): BERECHNUNG with the two switches writing `updateSettings`; Null-Tage detail shows the affected days of the current period only if cheap (otherwise the fixed text); DATEN with „Grundumsatz-Schätzung ›“ (value: „≈ 1.800 kcal“ when an estimate is possible, else „fehlt“) and „Health-Berechtigungen ↗“ (`openHealthApp`, caption `common.permissionsPath`); INFO with „Sprache ›“ (value: current language name), „Wie wird gerechnet? ›“, „Datenschutz ↗“, „Impressum ↗“; footer „Keine medizinische Beratung · v{{version}}“ from `Constants.expoConfig?.version`
- 🔲 Register routes `settings/resting-estimate` and `settings/calculation` in the root `Stack` inside the `introCompleted` guard (pages follow in M5/M6; placeholder screens until then)
- 🔲 Add the i18n keys DE/EN
- 🔲 Test `links.ts`: both URLs are https on `scully98.github.io/CalorieWeightBalancer`
- 🔲 Check in the simulator: switching „Heute einrechnen“ and going back to Bilanz shows „inkl. heute“ and a new number without restart; „Null-Tage“ off changes the number at once; light and dark mode; largest Dynamic Type size wraps without clipping
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:release-bundle`; all exit 0
- 🔲 Commit (`feat: add settings screen with toggles and links`)

**Texte (DE / EN)**

| Key | DE | EN |
|---|---|---|
| `settings.calculation` | BERECHNUNG | CALCULATION |
| `settings.zeroDays` | Null-Tage = Erhaltung | Empty days = maintenance |
| `settings.zeroDaysDetail` | Tage ohne Nahrungseintrag zählen mit Bilanz 0 statt mit vollem Defizit. | Days without food entries count as 0 instead of a full deficit. |
| `settings.includeToday` | Heute einrechnen | Include today |
| `settings.includeTodayDetail` | Der Tag läuft noch, der Verbrauch steigt bis Mitternacht. | The day isn't over; your burn keeps rising until midnight. |
| `settings.data` | DATEN | DATA |
| `settings.restingEstimate` | Grundumsatz-Schätzung | Resting energy estimate |
| `settings.restingMissing` | fehlt | missing |
| `settings.healthPermissions` | Health-Berechtigungen | Health permissions |
| `settings.info` | INFO | INFO |
| `settings.language` | Sprache | Language |
| `settings.calculationPage` | Wie wird gerechnet? | How is it calculated? |
| `settings.privacy` | Datenschutz | Privacy |
| `settings.imprint` | Impressum | Imprint |
| `settings.footer` | Keine medizinische Beratung · v{{version}} | Not medical advice · v{{version}} |

#### Notes / Constraints

> - Die Schalter wirken sofort (iOS-Muster), kein „Sichern“.
> - Health-Rechte stehen nur in der Health-App; deshalb `openHealthApp()` mit Wegbeschreibung wie im Intro, nicht `Linking.openSettings()`.
> - „Sprache ›“ öffnet die iOS-Einstellungen der App. iOS zeigt dort „Sprache“, weil die App zwei Sprachen deklariert (`expo-localization` `supportedLocales`). Nach dem Wechsel startet iOS die App neu.

#### 📐 Wireframe — SettingsPage

```
┌─────────────────────────────────────┐
│ 14:32                       ▮▮▮ ▭   │
├─────────────────────────────────────┤
│ Einstellungen                       │  AppText largeTitle
│                                     │
│ BERECHNUNG                          │  AppText caption, muted
│ Null-Tage = Erhaltung        [● ]   │  SwitchRow
│ Tage ohne Nahrungseintrag zählen    │
│ mit Bilanz 0 statt mit vollem …     │
│ ─────────────────────────────────── │  Divider
│ Heute einrechnen             [ ○]   │  SwitchRow
│ Der Tag läuft noch, der Verbrauch … │
│                                     │
│ DATEN                               │
│ Grundumsatz-Schätzung  ≈ 1.800 ›    │  NavRow
│ ─────────────────────────────────── │
│ Health-Berechtigungen           ↗   │  NavRow external
│ In Health: Profilbild → Apps → …    │  AppText caption, muted
│                                     │
│ INFO                                │
│ Sprache                 Deutsch ›   │  NavRow
│ ─────────────────────────────────── │
│ Wie wird gerechnet?             ›   │  NavRow
│ ─────────────────────────────────── │
│ Datenschutz                     ↗   │  NavRow external
│ ─────────────────────────────────── │
│ Impressum                       ↗   │  NavRow external
│                                     │
│ Keine medizinische Beratung · v1.0.0│  AppText caption, muted, zentriert
│ ─ ─ ─ ─ (nur Development) ─ ─ ─ ─ ─ │
│ Reset intro (dev) · Galerie · …     │  Dev-Bereich wie heute
└─────────────────────────────────────┘
```

**Component tree:**
SettingsPage (Tab `src/app/(tabs)/settings.tsx`)
├── AppText (Titel)
├── Section BERECHNUNG
│   ├── SwitchRow „Null-Tage = Erhaltung“
│   └── SwitchRow „Heute einrechnen“
├── Section DATEN
│   ├── NavRow „Grundumsatz-Schätzung“ → `settings/resting-estimate`
│   └── NavRow „Health-Berechtigungen“ → `openHealthApp()` + AppText Pfad
├── Section INFO
│   ├── NavRow „Sprache“ → `Linking.openSettings()`
│   ├── NavRow „Wie wird gerechnet?“ → `settings/calculation`
│   ├── NavRow „Datenschutz“ → `PRIVACY_URL`
│   └── NavRow „Impressum“ → `IMPRINT_URL`
├── AppText Fußzeile
└── Dev-Bereich (`__DEV__`, unverändert)

#### ⌨️ Keyboard Shortcuts

Keine App-Kürzel: reine Touch-App fürs iPhone (siehe P0/P1-Spec, M4). VoiceOver: Schalter als `switch` mit Zustand, Zeilen als `button` bzw. `link`.

---

### Milestone 5 — Seite Grundumsatz-Schätzung

> Eine Unterseite zeigt die Werte für Mifflin-St Jeor: Health-Werte zur Ansicht, fehlende zum Eintragen, gespeichert mit „Sichern“.

**Depends on:** Milestone 4

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/features/settings/components/resting-estimate-page.tsx` | lädt `useHealthSource().profile()`, `BmrCard`, „Sichern“, Zurück-Link |
| 🟢 | `src/app/settings/resting-estimate.tsx` | Route |
| 🟠 | `src/features/intro/__tests__/bmr-inputs.test.ts` | `updateStoredProfile`, `inputFromStored` |
| 🟠 | `src/features/intro/bmr-inputs.ts` | `inputFromStored(stored, locale)` (Felder vorbefüllen), `updateStoredProfile(previous, inputs, now)` |
| 🟠 | `src/features/intro/components/bmr-card.tsx` | Text für „Health liefert alles“ und ohne `partial`-Hinweis nutzbar (falls nötig) |
| 🟠 | `src/i18n/locales/de.ts`, `en.ts` | `settings.estimate.*` |
| 🟠 | `src/app/_layout.tsx` | Platzhalter aus M4 ersetzen |

#### To-Dos

- 🔲 Add `inputFromStored(stored, locale)`: stored numbers as locale text (e.g. `82,4`), sex preselected
- 🔲 Add `updateStoredProfile(previous, inputs, now)`: like `toStoredProfile`, but an unchanged weight or age keeps its `…RecordedOn`; an emptied field drops the value; Health values never stored (Key Decision 8)
- 🔲 Create the page: title „Grundumsatz-Schätzung“, explanation, `BmrCard` with the Health profile from the active `HealthSource` (loading text while it loads, all fields editable if loading fails), „Sichern“ enabled when something changed and all filled fields are valid, back link „‹ Einstellungen“; after saving go back
- 🔲 When Health has all four values: show them read-only with „Alles kommt aus Health. Die Schätzung gilt nur für Tage ohne gemessene Ruheenergie.“, no „Sichern“
- 🔲 Add the i18n keys DE/EN
- 🔲 Test `updateStoredProfile`: unchanged age keeps `ageRecordedOn` from the intro; changed weight gets today's date; emptied height removes `heightCm`; a field Health provides is not stored
- 🔲 Test `inputFromStored`: `82.4` → `„82,4“` in `de-DE`, `„82.4“` in `en-US`
- 🔲 Check in the simulator (no Health data → all four editable): change the height, „Sichern“, back on Bilanz the estimate on the data page uses the new height without reload (gallery: check via `buildReport` test if the data page can't be reached)
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- 🔲 Commit (`feat: edit body data for the resting energy estimate in settings`)

#### Notes / Constraints

> - Health gewinnt immer (wie im Intro und in `restingInputs`); gespeicherte Werte für Felder, die Health inzwischen liefert, bleiben liegen, werden aber nicht benutzt und nicht angezeigt.
> - Die Seite lädt das Health-Profil selbst (`HealthSource.profile()`), nicht über `useBalance`, damit sie auch ohne Bilanz-Daten funktioniert.

#### 📐 Wireframe — RestingEstimatePage

```
┌─────────────────────────────────────┐
│ ‹ Einstellungen                     │  LinkButton
│ Grundumsatz-Schätzung               │  AppText largeTitle
│ Für Tage ohne gemessene Ruhe-       │  AppText secondary, muted
│ energie, nach Mifflin-St Jeor.      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │  BmrCard
│ │ Gewicht         82,4 kg · Health│ │  InfoRow (Health)
│ │ Alter           [ 34 ] Jahre    │ │  NumberField
│ │ Größe           [ 182 ] cm      │ │  NumberField
│ │ Geschlecht      [ m | w | – ]   │ │  SegmentedControl
│ │ ─────────────────────────────── │ │
│ │ Grundumsatz       ≈ 1.800 kcal  │ │
│ │                    GESCHÄTZT    │ │  Badge
│ └─────────────────────────────────┘ │
│                                     │
│ [            Sichern            ]   │  Button
└─────────────────────────────────────┘
```

**Component tree:**
RestingEstimatePage (route `src/app/settings/resting-estimate.tsx`)
├── LinkButton „‹ Einstellungen“
├── Headline
├── BmrCard (aus `src/features/intro/components/bmr-card.tsx`)
└── Button „Sichern“

#### ⌨️ Keyboard Shortcuts

Keine App-Kürzel. Zahlenfelder mit Ziffern-Tastatur wie im Intro; „Fertig“ der Tastatur schließt sie.

---

### Milestone 6 — Seite „Wie wird gerechnet?“

> Eine Textseite erklärt Bilanz, Null-Tage, heute, Toleranz, Fett-Umrechnung, Grundumsatz-Schätzung und den Abgleich mit der Waage.

**Depends on:** Milestone 4

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/features/settings/components/calculation-page.tsx` | Abschnitte aus i18n, Zurück-Link |
| 🟢 | `src/app/settings/calculation.tsx` | Route |
| 🟠 | `src/i18n/locales/de.ts`, `en.ts` | `calculation.*` |
| 🟠 | `src/app/_layout.tsx` | Platzhalter aus M4 ersetzen |

#### To-Dos

- 🔲 Create the page with the sections below (DE as written, EN translated with the same content), headers as `accessibilityRole="header"`
- 🔲 Numbers in the texts come from the code constants where they exist (7.700, 9.400, 1.800, 50 %, 21 Tage, 6 Messungen, Toleranz-Grenzen), not typed twice
- 🔲 Check in the simulator: page opens from Einstellungen, largest Dynamic Type size readable, back link works
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm test`; all exit 0
- 🔲 Commit (`feat: explain the calculation in settings`)

**Texte (DE, Entwurf; Julius prüft)**

1. **Bilanz** — Pro Tag: Nahrung minus Verbrauch (Ruheenergie + Aktivenergie). Plus heißt mehr gegessen als verbraucht. Die Tage des Zeitraums werden zusammengezählt.
2. **Tage ohne Eintrag** — Ist „Null-Tage = Erhaltung“ an, zählt ein Tag ohne Nahrungseintrag mit 0 statt mit vollem Defizit. Wie viele Tage das betrifft, steht unter der Bilanz.
3. **Heute** — Der laufende Tag zählt standardmäßig nicht, weil Essen und Verbrauch noch fehlen. „Heute einrechnen“ nimmt ihn mit.
4. **Messfehler** — Etiketten und Uhren schätzen ungenau. Mit Toleranz zeigt die Bilanz eine Spanne: Nahrung ± bis 20 %, Verbrauch nur nach unten bis 30 %, angewendet auf die Summen des Zeitraums.
5. **Körperfett** — Bilanz ÷ 7.700 kcal pro kg Fettgewebe. Das ist theoretisch: Am Anfang einer Diät ändern sich vor allem Wasser und Glykogen.
6. **Grundumsatz geschätzt** — Fehlt die Ruheenergie (keine Watch), schätzt die App sie nach Mifflin-St Jeor aus Gewicht, Größe, Alter und Geschlecht. Diese Tage sind als „geschätzt“ markiert.
7. **Abgleich mit der Waage** — Aus der Veränderung von Fett- und Magermasse (9.400 bzw. 1.800 kcal pro kg, Hall 2008) und deiner Nahrung schätzt die App deinen tatsächlichen Verbrauch. Ab 21 Tagen und 6 Messungen; Start und Ende als 7-Tage-Trend.
8. **Keine medizinische Beratung** — Die App rechnet mit deinen Health-Daten und ersetzt keinen Arzt.

#### 📐 Wireframe — CalculationPage

```
┌─────────────────────────────────────┐
│ ‹ Einstellungen                     │  LinkButton
│ Wie wird gerechnet?                 │  AppText largeTitle
├─────────────────────────────────────┤
│ Bilanz                              │  AppText bodyStrong (header)
│ Pro Tag: Nahrung minus Verbrauch …  │  AppText body
│                                     │
│ Tage ohne Eintrag                   │
│ Ist „Null-Tage = Erhaltung“ an, …   │
│ …                                   │
└─────────────────────────────────────┘
```

**Component tree:**
CalculationPage (route `src/app/settings/calculation.tsx`)
├── LinkButton „‹ Einstellungen“
├── AppText largeTitle
└── ScrollView
    └── Section[] (AppText Überschrift, AppText Text)

#### ⌨️ Keyboard Shortcuts

Keine App-Kürzel (Touch-App).

---

### Milestone 7 — Doku und Prüfung

> Doku folgt den Entscheidungen, und die Abnahmekriterien sind im Simulator geprüft.

**Depends on:** Milestones 3–6

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟠 | `CLAUDE.md` | Toleranz (Key Decision 6), Einstellungen-Store, Bedienung in Einstellungen |
| 🟠 | Langzeitplan (Claude Doc) | Entscheidung „Toleranzen“ an Feature 5/6 angleichen |
| 🟠 | `docs/specs/2026-10-24-foundation-demo-data.md` | Open Question 5 als gelöst markieren |
| 🟠 | `docs/specs/2026-10-12-intro-screens.md` | Open Question 6 als gelöst markieren |
| 🟠 | `docs/specs/2026-10-24-settings-store.md` | Stand, Ergebnisse der Prüfung |

#### To-Dos

- 🔲 Update `CLAUDE.md` „Rechenmodell“: „Toleranzen standardmäßig aus (0 %); Slider auf der Homepage, Nahrung 0–20 %, Verbrauch 0–30 %, Normbereich 5–20 % / 10–30 % markiert“; „Rahmenbedingungen“: Einstellungen über `SettingsStore` (`src/storage/`), Keys `introCompleted`, `profile.v1`, `settings.v1`, keine Health-Werte
- 🔲 Update the decision „Toleranzen“ in the Langzeitplan doc to match (Slider ab 0 %, Normbereich markiert)
- 🔲 Mark P0/P1 Open Question 5 and Intro Open Question 6 as resolved with a pointer to this spec
- 🔲 Check in the simulator: toggle „Heute einrechnen“ on, kill the app (`xcrun simctl terminate`), start again → still on, and Bilanz says „inkl. heute“
- 🔲 Check in the simulator: Null-Tage off → Bilanz changes at once without „Rechne …“
- 🔲 Run `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run check:release-bundle`; all exit 0
- 🔲 Commit (`docs: record settings store decisions`)

#### Notes / Constraints

> - Im Simulator gilt die App Group ohne Signierung als lokaler Speicher; das reicht für die Neustart-Prüfung. Am iPhone prüft Julius dasselbe mit dem Development-Build.

---

## Open Questions

| # | Question | Owner | Impact if Unresolved |
|---|----------|-------|----------------------|
| 1 | ❓ Texte der Seite „Wie wird gerechnet?“ (M6) passen so? | Julius | M6 nutzt den Entwurf |
| 2 | ❓ Zeigt die Zeile „Null-Tage = Erhaltung“ die Anzahl betroffener Tage des aktuellen Zeitraums (braucht den geladenen Report im Einstellungen-Tab) oder nur den festen Text? Die Bilanz-Seite zeigt die Anzahl schon | Julius | M4 nimmt den festen Text |

## Concerns & Decisions Log

| # | Type | Concern | Resolution |
|---|------|---------|------------|
| 1 | 💡 Alternative | Der Plan sagt, das native App-Group-Modul entsteht in P5; `ExtensionStorage` aus `@bacons/apple-targets` ist schon im Einsatz und kann auch `reloadAllTimelines()` | `ExtensionStorage` nutzen, kein eigenes Modul (Key Decision 1) — Julius 2026-10-24 |
| 2 | ⚠️ Concern | Toleranz widersprüchlich: CLAUDE.md und Entscheidung 12.10. (Schalter, Normbereich, unterer Rand) gegen Plan 24.10. und Design (Slider ab 0 %, 0 = aus) | Slider ab 0 % (Key Decision 6); CLAUDE.md und Langzeitplan in M7 — Julius 2026-10-24 |
| 3 | ⚠️ Concern | P5 nennt Schalter im Einstellungen-Screen; laut Plan 24.10. kommen Toleranz-Slider und Zeitraum auf die Homepage, deren Spec noch fehlt | Einstellungen nur mit den zwei Schaltern; Toleranz und Zeitraum im Store, UI mit der Homepage-Spec (Key Decision 5) — Julius 2026-10-24 |
| 4 | ⚠️ Concern | Heute lädt jede Einstellungsänderung alles aus HealthKit neu; für „ohne Neuladen“ und Slider live zu langsam | Laden und Rechnen trennen (Key Decision 9) — Julius 2026-10-24 |
| 5 | ⚠️ Concern | Wireframe 1l zeigt „Grundumsatz manuell 1.750“; das Rechenmodell schätzt pro Tag nach Mifflin-St Jeor mit Gewicht am Tag | Seite mit Körperdaten statt kcal-Zahl (Key Decision 7) — Julius 2026-10-24 |
| 6 | ⚠️ Concern | Datenschutz- und Impressum-Seiten gibt es erst in Schritt 11; das Impressum braucht Name und Adresse | Feste GitHub-Pages-URLs jetzt, Seiten in Schritt 11 (Key Decision 12) — Julius 2026-10-24. Vor dem Einreichen müssen beide erreichbar sein |
| 7 | 💡 Alternative | Wireframe 1l hat weitere Zeilen | Fußzeile, Sprache, „Wie wird gerechnet?“ aufgenommen; Farben, Erscheinungsbild, Widget, Trackingbeginn nicht (Key Decision 13) — Julius 2026-10-24 |
| 8 | ⚠️ Concern | Ein neues `ageRecordedOn` ohne geänderten Wert würde das hochgerechnete Alter zurücksetzen | Nur geänderte Werte bekommen ein neues Datum (Key Decision 8) |
| 9 | ⚠️ Concern | „ohne heute“ steht fest im Zeitraum-Text; mit dem Schalter wäre er falsch | `home.periodWithToday` (Key Decision 14) |
