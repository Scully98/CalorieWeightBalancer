---
name: create-spec
description: Create an Implementation Specification document
---

Guide the user through creating an implementation specification document. This is a project-agnostic spec format that works across different tech stacks and contexts.

Read the spec pattern file `docs/references/patterns/docs/specs.md` before starting. Follow its conventions for document structure, actions, emojis, milestones, organization, and to-do format.

# Critical: Preserving User Input

Every detail matters. All information provided by the user must be written into the spec without shortening, summarizing, or omitting details. The spec is an authoritative document for implementation, and any lost detail could lead to incorrect implementation.

1. **Include everything.** Write all user-provided details into the spec verbatim. Do not summarize, condense, or paraphrase unless the user explicitly requests it.
2. **No silent omission.** Never quietly drop details because they seem minor, redundant, or obvious. What seems obvious during planning may not be obvious during implementation.
3. **Preserve context.** Include the user's reasoning, edge cases mentioned, and specific examples. These provide crucial context for implementation.

# Codebase Investigation

1. **Discover status quo independently.** Never ask the user about existing code, current implementation, or how things work today. Always search through the codebase to discover the status quo.
2. **You may ask questions about:**
   - Implementation decisions for new code
   - Design decisions for new features
   - Architectural decisions for new components
3. **For anything related to existing code or current behavior**, investigate the codebase yourself.

# Proactive Concern Flagging

If you identify potential issues with the user's input, flag them explicitly.

| Concern Type | Action |
|---|---|
| Incorrect information | Flag with ⚠️ and explain why it may be incorrect. |
| Code-based incompatibility | Flag with ⚠️ and describe the conflict with existing code. |
| Better alternative exists | Flag with 💡 and present the alternative for user decision. |
| Ambiguity or missing details | Ask clarifying questions before proceeding. |

6. **User decides on concerns.** After flagging concerns, wait for the user's decision. Do not unilaterally change, remove, or improve their input. Include their decision in the spec.

7. **Never guess external payload schemas.** For every external payload being integrated (API endpoint request/response, webhook event, SQS message, third-party callback, etc.) where the data schema is not yet known, you MUST ask the user for both:
   - Sample real-world data (actual payload)
   - Official documentation (links to API docs, webhook reference, SDK types, etc.)

   Always ask for both — never just one. Documentation is often outdated or incomplete, and real payloads often omit context about optional fields, error cases, or versioning. Only by cross-referencing both can the schema be trusted.

# Process

## 1. Clarify Requirements

1. Ask questions about context, goal, scope, and dependencies.
2. For each question, provide multiple suggestions the user can choose from.
3. Only ask one question at a time and wait for the response.
4. Identify external payloads with unknown schemas and ask the user for both sample real data and official documentation.
5. Continue until you have enough context to create the spec.

## 2. Gather Context

1. Review any related documents the user provides (features, specs, ADRs, PRDs).
2. Explore the codebase to understand the current state.
3. Never ask the user about existing code.
4. Identify affected components, layers, and areas.
5. Determine dependencies and constraints.

## 3. Launch Specialized Sub-Agents

Based on the affected areas, launch sub-agents in parallel. Each sub-agent must:

1. Read relevant pattern files for the area.
2. Read the spec pattern file `docs/reference-patterns/docs/spec.md` and `docs/reference-patterns/docs/doc-building-blocks.md` for document conventions. 

Not defined yet - todo for our supabase backend:
For database-related areas, also read the database schema from the package/db/schema/generated/ (one SQL file per table and/or function).

3. Explore the codebase for similar implementations.
4. Discover the current state of the system.
5. Generate the spec section following the conventions from the spec pattern file.
6. Return spec section content, TODOs, and questions for the user.

Sub-agent instructions must include:

- Feature description and user requirements — preserve all details verbatim.
- Which pattern files to read, including `docs/reference/patterns/docs/spec.md` and `docs/reference/patterns/docs/doc-building-blocks.md`.
- Instruction to report which pattern files were read in the output.
- Instruction to explore the codebase for existing patterns and similar implementations.
- Output format requirements following the spec pattern file conventions.
- Instruction to generate inbound flow diagrams for all new or updated entry points: controller endpoints, queue jobs, scheduled jobs, and CLI commands — following the format in `doc-building-blocks.md`.
- For frontend sub-agents: instruction to generate wireframe diagrams for all new or updated pages, layout groups, and dialogs — following the format from `doc-building-blocks.md`.
- For frontend sub-agents: instruction to propose keyboard shortcuts for all new or updated UI views — following the keyboard shortcuts section in this document.
- Instruction to flag concerns rather than silently fixing them.
- Instruction to identify any external payloads (API endpoints, webhook events, queue messages, etc.) with unknown schemas and return them as questions, requesting both sample real data and official documentation. Never guess or infer schemas.

## 4. Assemble Final Spec

- Collect outputs from all sub-agents.
- Report which pattern files were read across all sub-agents.
- Verify completeness: cross-check that all user-provided details are present — nothing omitted.
- Include flagged concerns and add a decision entry for each.
- **Inbound flow diagrams:** Add an inbound flow section under Implementation Details for every new or updated controller endpoint, queue job, scheduled job, and CLI command. Follow the format from `docs/reference/patterns/docs/doc-building-blocks.md`. Include one diagram per use case showing the full call graph from entry point through services, repositories, and external calls.
- **Wireframe diagrams:** Add a wireframe section under Implementation Details for every new or updated page, layout, and dialog. Follow the format from `docs/reference-patterns/docs/doc-building-blocks.md`. One diagram per view showing the component tree from the top-level component down through entity components, dialogs, and shared UI primitives.
- **Keyboard shortcuts:** For any spec that introduces or modifies a UI view, add a keyboard shortcuts section under Implementation Details (see the Keyboard Shortcuts section below).
- Create the spec file following the naming convention from the spec pattern file.
- Organize to-dos into milestones based on dependencies.
- Add an overview and key decisions section.

## 5. Review Spec

1. Re-read the generated spec end-to-end before presenting it to the user.
2. Confirm the spec follows best practices described in the pattern file.
3. Verify every external payload has a documented schema with sample real data and official documentation — no guessed or inferred fields.
4. Verify that all user-provided details are accurately and completely reflected in the spec.
5. Nothing omitted, nothing altered.

## 6. Iterate with User

1. Present the draft spec.
2. Gather feedback and iterate.
3. Finalize the document.

# Keyboard Shortcuts for Web App UI

When a spec introduces or modifies a web app UI view, you must consider keyboard accessibility. The goal is to make the entire application navigable and operable primarily through the keyboard, with intuitive key combinations.

## What to Include

For every new or updated UI view, add a keyboard shortcuts section under Implementation Details with a table of shortcuts.

| Shortcut | Action | Scope |
|----------|--------|-------|
| Cmd/Ctrl K | Open command palette | Global |
| Cmd/Ctrl N | Create new entity | Page level |
| Enter | Open selected item | List focus |
| Escape | Close dialog / deselect | Dialog / selection |

Scope indicates where the shortcut is active:
- **Global** — anywhere in the app
- **Page level** — on a specific page
- **Component level** — within a focused component (e.g., a table or list)

## Categories to Consider

For each UI view, evaluate which shortcut categories apply:

1. **Navigation** — moving between pages, sections, or tabs
2. **CRUD actions** — creating, editing, and deleting entities
3. **Selection and focus** — selecting items in lists/tables, moving focus
4. **Search and filtering** — opening search, applying filters
5. **Dialogs and panels** — opening dialogs, sidebars, and detail panels
6. **Status transitions** — changing entity status via keyboard
7. **Bulk operations** — multi-select and bulk actions
8. **View switching** — toggling between layouts (board, list, table)

## Conventions

- Use **Cmd** on macOS and **Ctrl** on Windows/Linux; always write `Cmd/Ctrl`.
- Prefer single-key shortcuts for frequent actions within a focused context.
- Use modifier keys (Cmd/Ctrl, Shift, Alt) for actions that could conflict with text input.
- Use Vim-style key sequences (e.g., `g`, `G`, `x`) for navigation shortcuts that avoid conflicts.
- Avoid overriding browser defaults.
- Ensure destructive actions (delete, discard) require either a modifier key or a confirmation step.
- Include `Escape` as a universal close/cancel/deselect action.
- Include `?` as a shortcut to show a keyboard shortcut help overlay (disabled when an input or text area is focused).

## Conflict Awareness

When proposing a shortcut, check for conflicts with:
- Existing global shortcuts already in the app
- Browser default shortcuts
- OS-level shortcuts
- Text input context: single-key shortcuts must be disabled when an input or text area is focused
