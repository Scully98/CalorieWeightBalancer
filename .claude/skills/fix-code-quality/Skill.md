---
name: fix-code-quality
description: Fix compiler, linter, and i18n errors across the project
---

Fix TypeScript compiler errors, linter warnings, and i18n issues across the project.

# Process

## 1. Run Verification

Run all checks from the monorepo root and collect all errors and warnings:

```
npm run check-all
```

## 2. Read Pattern Files

Before fixing code in any area, read the relevant pattern files for that area. Pattern files are the canonical source of truth for conventions in this codebase. Report to the user which pattern files you read.

## 3. Fix Issues

Fix all errors and warnings reported by the checks, following the patterns from the pattern files.

- If a warning is hard to fix or fixing it would decrease code quality, ask the user how to proceed.
- Resolve unused variable warnings by removing the variable completely. If removal is not possible, prefix it with `_`.

## 4. Verify and Repeat

Run `npm run check-all` again and repeat the fix → verify cycle until all issues are resolved or the user provides guidance.
