---
name: implement-spec
description: Implement a specification document milestone by milestone
---

Guide implementation of a specification document by working through all milestones sequentially, committing after each, and then verifying with tests.

Read `docs/reference/patterns/docs/specs.md` before starting — follow its conventions for spec file naming, lifecycle status segments, milestone structure, to-do format, and commit messages.

# Overview

This skill executes a spec document by:
- Working through all milestones in priority order without stopping
- Completing all to-dos within each milestone
- Updating the spec file with completion status after each to-do
- Committing after each milestone completes
- Running tests and fixing failures after all milestones are complete
- Handling scope changes and blockers

**Spec file lifecycle:**
```
SPEC-<n>-DRAFT-feature-name.md  →  SPEC-<n>-IN-PROGRESS-feature-name.md  →  SPEC-<n>-DONE-feature-name.md
```

# Process

## 1. Setup Feature Branch

Before any implementation work, ensure you are on the correct feature branch for the spec.

**Branch naming:** Derive the branch name from the spec file name by removing the status segment (`draft`, `in-progress`, or `done`).

| Spec filename | Branch name |
|---|---|
| `SPEC-19-DRAFT-agent-session.md` | `spec-19-agent-session` |
| `SPEC-7-IN-PROGRESS-user-auth.md` | `spec-7-user-auth` |

**Steps:**

1. Determine the expected branch name from the spec file name.
2. Check if a branch with that name already exists locally or remotely.

**If the branch already exists:**
1. Check out the existing branch.
2. Merge `main` into the branch to pick up any upstream changes.
3. Resolve any merge conflicts. Ask the user if needed.
4. Continue to Step 2.

**If no branch exists yet:**
1. Check the working tree for uncommitted changes. If local changes exist, inform the user and stop — do not stash or discard them.
2. Check out `main` and pull latest: `git pull`.
3. Create a new branch from `main`: `git checkout -b <branch-name>`.
4. Continue to Step 2.

## 2. Load and Analyze Spec

1. Read the spec file provided by the user.
2. If the file is named `DRAFT`, rename it to `IN-PROGRESS`. Receiving the spec implies approval to begin.
3. Parse all milestones and their to-dos.
4. Identify which to-dos are already complete (`- [x]`).
5. Report current progress to the user.

**Progress report format:**

```
## Spec Progress

Spec: docs/specs/SPEC-<n>-IN-PROGRESS-feature-name.md
Overall: X of Y milestones complete

| Milestone | Status | Remaining TODOs |
|-----------|--------|-----------------|
| M1 — Name | ✅ Complete | 0 |
| M2 — Name | 🔄 In Progress | 3 |
| M3 — Name | ⏳ Pending | 5 |
```

## 3. Select Next Milestone

Automatically select the first incomplete milestone unless the user specifies otherwise.

**Selection rules:**

1. Find the first milestone with at least one unchecked to-do (`- [ ]`).
2. Complete milestones in priority order (Priority 1 → Priority 6).
3. Within the same priority, complete in listed order.
4. Skip milestones marked as blocked or deferred.
5. The user can override to work on a specific milestone.

**Report the automatic selection:**

```
Automatically selected: Milestone 2 — [Name]
(First milestone with incomplete TODOs)

Proceeding with implementation...
```

## 4. Execute Milestone TODOs

For each to-do in the milestone:

### a. Understand the TODO

- Read any referenced files or documentation.
- Read relevant pattern files for the area being implemented.
- For database-related TODOs, read the current schema from `packages/db/schema/generated/`.
- Report to the user which pattern files you read.
- Identify dependencies on other TODOs.
- Clarify ambiguities with the user before proceeding.

### b. Implement the Change

- Make the necessary code, config, or doc changes.
- Follow existing patterns in the codebase.
- Consult pattern files for conventions and best practices.
- Keep changes focused on the TODO scope.
- After code changes, run `npm run check-all` from the monorepo root and fix any errors before marking the TODO complete.

### c. Mark TODO Complete

- Update the spec file: `- [ ]` → `- [x]`
- Add a brief completion note if helpful: `- [x] Create user table _(added migration 001)_`

### d. Report Progress

```
✅ Completed: [TODO description]
Changes: [brief summary of what was done]
Files: [list of files modified]

Remaining in milestone: X TODOs
```

## 5. Complete Milestone and Commit

When all TODOs in a milestone are done:

1. **Add a checkmark to the milestone header in the spec:**
   ```
   Before:  ### Milestone 2 — Implement user API
   After:   ### ✅ Milestone 2 — Implement user API
   ```

2. **Create a commit immediately** using the format:
   ```
   <spec-number>: Milestone <N> - <one line description>
   ```
   Examples:
   ```
   17: Milestone 2 - Implement agent CRUD endpoints
   1: Milestone 1 - Set up user authentication database schema
   24: Milestone 3 - Add transaction history to dashboard
   ```
   The spec number comes from the filename (e.g., `SPEC-24-IN-PROGRESS-invoices.md` → `24`).

3. **Report completion:**
   ```
   ## Milestone Complete

   Milestone N: [Name] ✅
   TODOs completed: X
   Key deliverables:
   - [Summary of what was built]
   Commit: <commit hash>
   ```

4. **Automatically continue to the next milestone** — return to Step 3. Do NOT wait for user approval between milestones.

5. **When ALL milestones are complete:**
   - Rename the spec file from `IN-PROGRESS` to `DONE`.
   - Example: `SPEC-1-IN-PROGRESS-auth.md` → `SPEC-1-DONE-auth.md`
   - Create a final commit for the spec rename.

## 6. Post-Implementation: Test Verification

After all milestones are complete, immediately run the `/fix-tests` command described in `.claude/commands/fix-tests.md` to reset the database, run all tests, analyze root causes, and fix all failures. Answer its initial questions as: fix both unit and E2E tests, fix all failing tests.

## 7. Post-Implementation: Open Pull Request

After all tests pass, automatically create a pull request for the feature branch:

1. **Push the branch** to remote: `git push -u origin <branch-name>`
2. **Create the PR** targeting `main` using `gh pr create`:
   - **Title:** `SPEC-<number>: <spec name>` (derived from the spec filename)
   - **Body:** Four sections — summary, inbound flow diagrams, view hierarchy diagrams, and user stories. Follow the conventions from `docs/reference/patterns/docs/doc-building-blocks.md` for each diagram section.

   ```markdown
   ## Summary
   - <key change 1>
   - <key change 2>

   ## Inbound Flow Diagrams
   One diagram per controller endpoint, queue job, or scheduled job implemented in this PR.

   ### <Use Case Name>
   `<EntryPointClass>.<method> (<route> | queue: <name> | cron: <expr>)`
   `└── <Service>.<method>()`
   `    ├── <Collaborator>.<method>()`
   `    └── <Repository>.<method>()`

   ## View Hierarchy Diagrams
   One diagram per page, layout route, or dialog added or modified in this PR.

   ### <Page or Dialog Name>
   `<ComponentName> (URL path | trigger: what opens it)`
   `└── <ChildComponent>`
   `    ├── <NestedChild>`
   `    └── <Dialog>`
   ```

3. **Report the PR URL to the user:**
   ```
   ## Pull Request Created

   PR: <PR URL>
   Branch: <branch-name> → main
   Title: SPEC-<number>: <spec name>
   ```

---

# Spec Update Commands

Use these patterns when updating the spec file during implementation.

| Action | Before | After |
|--------|--------|-------|
| Mark TODO complete | `- [ ] Task description` | `- [x] Task description` |
| Mark TODO blocked | `- [ ] Task description` | `- [ ] 🛑 Task description _(blocked: reason)_` |
| Add new TODO | — | `- [ ] 🆕 New task added during implementation` |
| Descope TODO | `- [ ] Task description` | `- [ ] ~~Task description~~ _(descoped: reason)_` |
| Mark milestone complete | `### Milestone N — Name` | `### ✅ Milestone N — Name` |
| Rename spec to done | `SPEC-1-IN-PROGRESS-auth.md` | `SPEC-1-DONE-auth.md` |

---

# Tips for Effective Implementation

## Stay Focused
- Complete one TODO fully before moving to the next.
- Do not let scope creep within a TODO.
- If something seems larger than expected, split it into new TODOs in the spec.

## Keep the Spec Updated
- Update the spec after each TODO completion.
- Document blockers immediately with the 🛑 marker.
- Keep progress visible so future sessions can resume without re-analysis.

## Communicate Clearly
- Report what was done after each TODO.
- Surface blockers early rather than working around them.
- Clarify before assuming.

## Maintain Quality
- Follow existing code patterns — do not introduce new conventions mid-spec.
- Consult relevant pattern files before implementing each area.
- Write tests if the project has them.
- Do not skip documentation TODOs.
