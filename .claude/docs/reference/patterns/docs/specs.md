# Implementation Specification — Pattern & Conventions

This document defines the structure, formatting rules, and conventions for all implementation specification documents in this project. Every spec must follow these conventions exactly.

---

## File Naming

```
docs/specs/YYYY-MM-DD-short-feature-name.md
```

Examples:
- `docs/specs/2026-04-28-user-onboarding-flow.md`
- `docs/specs/2026-05-01-gym-search-map.md`

---

## Document Structure

Every spec must contain these sections in order:

```
# [Feature Name]

## Overview
## Key Decisions
## Implementation Details
  ### Milestone N — [Name]
## Open Questions
## Concerns & Decisions Log
```

---

## Emojis & Action Markers

Use these consistently throughout the spec.

| Emoji | Meaning | Where to use |
|-------|---------|--------------|
| 🟢 | **Add** — new file or resource | Milestone file list |
| 🟠 | **Change** — modify existing file | Milestone file list |
| 🔴 | **Delete** — remove file or resource | Milestone file list |
| ✅ | Done | To-do items that are completed |
| 🔲 | To do | Pending to-do items |
| ⚠️ | Concern / Warning | Concerns & Decisions Log, inline flags |
| 💡 | Alternative / Suggestion | Concerns & Decisions Log, inline flags |
| ❓ | Open question / Ambiguity | Open Questions section |
| 🔗 | External dependency or link | References to APIs, docs, external systems |
| 📐 | Wireframe diagram | Wireframe sections |
| 🔀 | Inbound flow diagram | Flow sections |

---

## Section Definitions

### Overview

One short paragraph. Answer: **what** is being built, **why** it matters, and **what it affects**.

```markdown
## Overview

[Feature name] enables [user/system] to [goal]. This addresses [problem or opportunity].
It touches [list of affected layers or components].
```

---

### Key Decisions

A table of significant architectural or product decisions made before or during planning. Each row is a decision that was made explicitly — not a default or obvious choice.

```markdown
## Key Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|-------------------------|
| 1 | Use Supabase RLS for access control | Already in use project-wide | Custom middleware |
| 2 | Single-step form instead of multi-step | Reduces drop-off for short flows | Wizard / stepper |
```

---

### Implementation Details

This is the core of the spec. Organize work into **milestones**. Each milestone is a coherent unit of work that can be reviewed and shipped independently.

---

## Milestone Format

```markdown
### Milestone N — [Name]

> One sentence: what this milestone delivers and why it is a natural boundary.

**Depends on:** Milestone X, Milestone Y _(or "none")_

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `src/components/GymCard.tsx` | Create new gym card component |
| 🟠 | `src/screens/SearchScreen.tsx` | Add gym list rendering |
| 🔴 | `src/components/OldPlaceholder.tsx` | Remove obsolete placeholder |

#### To-Dos

- 🔲 Task description
- 🔲 Task description
- 🔲 Task description

#### Notes / Constraints

> Any edge cases, invariants, or non-obvious constraints for this milestone.
```

---

## Visual Milestone Overview

At the top of the Implementation Details section, include a visual milestone map before listing individual milestones. This gives a bird's-eye view of the work and file-change density.

```markdown
## Implementation Details

### Milestone Map

| Milestone | Delivers | 🟢 Add | 🟠 Change | 🔴 Delete | Depends On |
|-----------|----------|--------|-----------|-----------|------------|
| M1 — Database Schema | Tables & RLS policies | 3 | 0 | 0 | — |
| M2 — API Layer | Endpoints & validation | 2 | 1 | 0 | M1 |
| M3 — UI Components | Cards, forms, dialogs | 4 | 2 | 1 | M2 |
| M4 — Integration | Wire UI to API | 0 | 5 | 0 | M3 |
```

Color legend (repeat below the table for quick reference):

```
🟢 Add   🟠 Change   🔴 Delete
```

---

## Inbound Flow Diagrams

Every new or updated **controller endpoint, queue job, scheduled job, or CLI command** must include an inbound flow diagram under its milestone. Use Mermaid sequence diagrams.

```markdown
#### 🔀 Inbound Flow — POST /gyms/search

\```mermaid
sequenceDiagram
  participant Client
  participant SearchController
  participant GymService
  participant TomTomAPI
  participant SupabaseDB

  Client->>SearchController: POST /gyms/search { lat, lng, radius }
  SearchController->>GymService: searchNearby(lat, lng, radius)
  GymService->>TomTomAPI: GET /search/2/nearbySearch
  TomTomAPI-->>GymService: POI results
  GymService->>SupabaseDB: upsert gyms
  SupabaseDB-->>GymService: saved gyms
  GymService-->>SearchController: Gym[]
  SearchController-->>Client: 200 { gyms: Gym[] }
\```
```

Show the full call graph from entry point through services, repositories, and external calls. One diagram per use case — do not combine unrelated flows.

---

## Wireframe Diagrams

Every new or updated **page, layout group, or dialog** must include a wireframe diagram. Use Mermaid block diagrams or ASCII art for layout, and annotate with component names.

```markdown
#### 📐 Wireframe — GymSearchScreen

\```
┌─────────────────────────────────────┐
│  [← Back]        Search Gyms        │
├─────────────────────────────────────┤
│  🔍 [ Search input field          ] │
│  [Filter] [Radius ▾] [Open now]     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  MapView                      │  │
│  │  · GymMarker  · GymMarker     │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  GymCard ─────────────────────────  │
│    Name · Distance · Rating         │
│  GymCard ─────────────────────────  │
│    Name · Distance · Rating         │
└─────────────────────────────────────┘

Components: SearchScreen > [SearchBar, FilterBar, MapView, GymList > GymCard]
```

One diagram per view. Show the component tree from the top-level screen down through entity components, dialogs, and shared UI primitives.

---

## Keyboard Shortcuts Table

When a milestone introduces or modifies a UI view, add this table under the milestone.

```markdown
#### ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| Cmd/Ctrl K | Open command palette | Global |
| Cmd/Ctrl N | Create new entity | Page level |
| / | Focus search input | Page level |
| Enter | Open selected item | List focus |
| ↑ / ↓ | Navigate list items | List focus |
| Escape | Close dialog / deselect | Dialog / selection |
| ? | Show keyboard shortcut help | Global (not in input) |
```

---

### Open Questions

A numbered list of unresolved questions that must be answered before or during implementation. Each question includes its owner and impact.

```markdown
## Open Questions

| # | Question | Owner | Impact if Unresolved |
|---|----------|-------|----------------------|
| 1 | ❓ What is the exact TomTom API rate limit for free tier? | @dana | Could block M2 |
| 2 | ❓ Should deleted gyms be soft-deleted or hard-deleted? | Product | Affects DB schema in M1 |
```

---

### Concerns & Decisions Log

Document every flagged concern and its resolution. Never delete rows — resolved concerns remain for audit trail.

```markdown
## Concerns & Decisions Log

| # | Type | Concern | Resolution |
|---|------|---------|------------|
| 1 | ⚠️ Concern | TomTom API returns inconsistent `id` fields across versions | Confirmed: use `dataSources.poiDetails.id` as stable key — @dana 2026-04-28 |
| 2 | 💡 Alternative | Could use Mapbox instead of TomTom for better React Native support | Decided to stay with TomTom — already integrated in the project |
| 3 | ⚠️ Concern | RLS policy on `gyms` table may block anon reads | Open — needs DB review before M1 ships |
```

---

## External Payload Schema Block

For every external API payload integrated into the spec, document the schema with both a real sample and a documentation reference. Never guess or infer schema fields.

```markdown
#### 🔗 External Payload — TomTom Nearby Search Response

**Documentation:** [TomTom Search API v2](https://developer.tomtom.com/search-api/documentation/search-service/nearby-search)

**Sample real response:**
\```json
{
  "summary": { "totalResults": 2, "offset": 0 },
  "results": [
    {
      "id": "840DR5V2H80",
      "score": 2.5,
      "dist": 312.4,
      "info": "search:ta:840063000774062-US",
      "poi": {
        "name": "Planet Fitness",
        "categorySet": [{ "id": 7319 }],
        "categories": ["gym"],
        "openingHours": { "mode": "nextSevenDays", "timeRanges": [] }
      },
      "address": {
        "freeformAddress": "123 Main St, Austin, TX 78701",
        "country": "United States",
        "countryCode": "US"
      },
      "position": { "lat": 30.2672, "lon": -97.7431 }
    }
  ]
}
\```

**Notes:** `openingHours.timeRanges` may be empty even when the POI is open. Do not infer open/closed status from an empty array.
```

---

## To-Do Format

All to-dos must use this format so they can be scanned and tracked uniformly.

```markdown
- 🔲 Short imperative action (e.g. "Create `gyms` table migration")
- ✅ Completed task
```

- Start with a verb: **Create**, **Add**, **Update**, **Remove**, **Wire**, **Test**, **Document**
- One to-do = one atomic unit of work
- Do not nest to-dos more than one level deep

---

## Full Spec Template

Copy this template when creating a new spec.

```markdown
# [Feature Name]

## Overview

[What is being built, why it matters, what layers it touches.]

## Key Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|-------------------------|
| 1 | | | |

## Implementation Details

### Milestone Map

| Milestone | Delivers | 🟢 Add | 🟠 Change | 🔴 Delete | Depends On |
|-----------|----------|--------|-----------|-----------|------------|
| M1 — | | 0 | 0 | 0 | — |

🟢 Add   🟠 Change   🔴 Delete

---

### Milestone 1 — [Name]

> One sentence description.

**Depends on:** none

#### File Changes

| Color | File | Action |
|-------|------|--------|
| 🟢 | `` | |

#### To-Dos

- 🔲

#### Notes / Constraints

> —

---

## Open Questions

| # | Question | Owner | Impact if Unresolved |
|---|----------|-------|----------------------|
| 1 | ❓ | | |

## Concerns & Decisions Log

| # | Type | Concern | Resolution |
|---|------|---------|------------|
| 1 | | | Open |
```
