description
Comprehensive React code quality review for best practices, TypeScript, performance, accessibility, and testing
Perform a comprehensive code quality review of React/TypeScript code against the CODE_STANDARDS.md guidelines.

This review combines automated analysis with AI-powered code inspection to ensure React best practices, TypeScript quality, performance optimization, accessibility compliance, and testing standards.

Step 1: Determine Review Scope
Ask the user to specify:

Review Scope:

Entire project (all files in src/)
Specific feature (e.g., src/features/user/)
Specific files (provide file paths)
Focus Areas (select all or specific):

All (comprehensive review)
React patterns (components, hooks, composition)
TypeScript quality (strict mode, no any, proper typing)
Performance (memo, useMemo, useCallback, lazy loading)
Accessibility (WCAG 2.1 AA compliance)
Testing (coverage, quality, user-centric tests)
Tailwind CSS usage
File organization and naming
Security and dependencies
Step 2: Review Workflow
1. React Best Practices
Check for:

✅ Functional Components:

All components are functional (no class components)
Named exports used (no default exports)
Proper prop interface definitions
❌ Anti-patterns:

Class components
Default exports
Components without TypeScript props interfaces
Check for:

✅ Hooks Rules:

Hooks only called at top level (not in conditions/loops)
Custom hooks named with use prefix
Proper dependency arrays in useEffect/useMemo/useCallback
No missing dependencies
❌ Anti-patterns:

Conditional hooks
Hooks in loops
Missing or incorrect dependencies
Effects without cleanup where needed
Check for:

✅ Component Composition:

Composition over inheritance
Props use children, header, footer patterns
Proper use of React.ReactNode for children
❌ Anti-patterns:

Class inheritance
Prop drilling (should use context)
Tightly coupled components
Check for:

✅ Error Boundaries:

Features wrapped with error boundaries
Proper error fallback components
Error logging implemented
Check for:

✅ Keys in Lists:

Stable, unique keys (using IDs)
No index as key (unless list is static)
2. TypeScript Quality
Check for:

✅ Strict Mode Compliance:

tsconfig.json has strict: true
All strict flags enabled (noImplicitAny, strictNullChecks, etc.)
❌ Type Safety Issues:

any types used (should use unknown with type guards)
Unsafe type assertions (as Type without validation)
Missing prop interfaces
Implicit any in function parameters
Check for:

✅ Proper Type Definitions:

Named exports for interfaces
Discriminated unions for variants
Utility types (Partial, Omit, Pick) used appropriately
Type guards for runtime validation
Check for:

✅ Type Guards:

Runtime type checking with is predicates
Validation before type assertions
Proper narrowing of unknown types
3. Performance Optimization
Check for:

✅ React.memo Usage:

Expensive components are memoized
Custom comparison functions where needed
Proper memo usage (not over-memoization)
❌ Performance Issues:

Unnecessary re-renders
Missing memoization on expensive computations
Inline function/object creation in render
Check for:

✅ useMemo:

Used for expensive computations
Proper dependency arrays
Not overused for simple operations
Check for:

✅ useCallback:

Used for callbacks passed to memoized children
Proper dependency arrays
Used with event handlers in optimized components
Check for:

✅ Code Splitting:

Routes lazy loaded
Heavy components lazy loaded
Proper Suspense boundaries with fallbacks
Check for:

✅ Virtual Scrolling:

Used for large lists (>100 items)
Proper implementation with react-virtual or similar
Check for:

✅ Bundle Size:

No large unnecessary dependencies
Tree-shaking enabled
Proper imports (named imports from large libraries)
4. Accessibility (WCAG 2.1 AA)
Check for:

✅ Semantic HTML:

Proper use of header, nav, main, article, section, footer
No div-soup (divs used only when no semantic alternative)
Heading hierarchy (h1-h6 in order)
❌ Accessibility Issues:

Divs used instead of semantic elements
Missing or incorrect heading hierarchy
Non-semantic markup
Check for:

✅ ARIA Usage:

ARIA used only when HTML semantics insufficient
Proper aria-label, aria-labelledby, aria-describedby
Correct ARIA roles
aria-expanded, aria-controls for interactive elements
❌ ARIA Anti-patterns:

ARIA used when HTML semantics exist (e.g., role="button" on div)
Missing labels on interactive elements
Incorrect ARIA attributes
Check for:

✅ Keyboard Navigation:

All interactive elements keyboard accessible
Proper onKeyDown handlers (Enter, Space)
Focus management (modals, dialogs)
Focus traps in modals
No keyboard traps
❌ Keyboard Issues:

Interactive elements not keyboard accessible
Missing keyboard handlers
Poor focus management
Keyboard traps
Check for:

✅ Focus Indicators:

Visible focus indicators (focus-visible)
Sufficient contrast (2px outline minimum)
Custom focus styles when default removed
❌ Focus Issues:

outline: none without replacement
Invisible or low-contrast focus indicators
Check for:

✅ Color Contrast:

Normal text: 4.5:1 minimum
Large text (18pt+): 3:1 minimum
UI components: 3:1 minimum
Check for:

✅ Screen Reader Support:

Descriptive labels on inputs
aria-describedby for help text
Live regions (aria-live) for dynamic content
Skip links for navigation
Alt text on images
5. Testing Quality
Check for:

✅ User-Centric Tests:

Tests use React Testing Library
Query by role, label, text (not testId)
Test user behavior, not implementation
Proper use of userEvent
❌ Testing Anti-patterns:

Testing implementation details
Using getByTestId as primary query
Testing internal state
Snapshot tests without purpose
Check for:

✅ Accessibility Tests:

jest-axe integrated
Automated accessibility tests on components
No violations in tests
Check for:

✅ Test Coverage:

Components: 80%+ coverage
Hooks: 100% coverage
Services: 90%+ coverage
Utilities: 100% coverage
Check for:

✅ Test Quality:

Descriptive test names
Independent tests (no shared state)
Proper setup/teardown
Tests edge cases and errors
Integration tests for complex flows
E2E tests for critical paths (Playwright)
6. Tailwind CSS Usage
Check for:

✅ Utility-First Approach:

Utility classes used instead of custom CSS
Responsive design with mobile-first breakpoints
Dark mode support where applicable
❌ Tailwind Anti-patterns:

Inline styles instead of Tailwind utilities
Custom CSS when Tailwind utilities exist
Not using Tailwind's responsive prefixes
Check for:

✅ Theme Extension:

Custom colors/spacing in tailwind.config.js
No magic numbers in classes
Check for:

✅ Component Extraction:

Repeated class combinations extracted to components
Proper variant handling with conditional classes
Check for:

✅ Responsive Design:

Mobile-first approach (base → md → lg → xl)
Proper breakpoint usage
Responsive typography and spacing
7. File Organization
Check for:

✅ Feature Structure:

Files organized in src/features/[feature-name]/
Proper subdirectories: components/, hooks/, context/, services/, types/, utils/
Each file has corresponding .test file
Storybook files (.stories.tsx) for components
Check for:

✅ Public API Pattern:

Each feature has index.ts with named exports
Imports use feature's public API (not internal paths)
❌ Organization Issues:

Deep imports into feature internals
Missing index.ts files
Scattered test files
8. Naming Conventions
Check for:

✅ File Naming:

Components: PascalCase.tsx
Hooks: camelCase.ts with use prefix
Services: camelCase.ts with Service suffix
Tests: Same as source with .test.ts(x)
Stories: Same as component with .stories.tsx
Check for:

✅ Variable Naming:

Components: PascalCase
Hooks: camelCase with use prefix
Functions: camelCase
Constants: UPPER_SNAKE_CASE
Interfaces: PascalCase with descriptive name
Booleans: is/has/should prefix
Event handlers: handle prefix (handleClick)
Event props: on prefix (onClick)
9. Security
Check for:

❌ Security Issues:

Hardcoded secrets/API keys
Unsafe innerHTML (use dangerouslySetInnerHTML sparingly)
XSS vulnerabilities
Unvalidated user input
Missing Content Security Policy
Exposed sensitive data in client-side code
Check for:

✅ Secure Practices:

Environment variables for secrets
Input validation and sanitization
Proper error handling (no sensitive data in errors)
HTTPS enforced
Dependencies audited (npm audit)
10. Dependencies
Check for:

❌ Dependency Issues:

Outdated dependencies with known vulnerabilities
Unnecessary large dependencies
Multiple libraries for same purpose
Deprecated packages
Check for:

✅ Best Practices:

package.json includes required dependencies (React 18+, TypeScript 5+, Vite, Vitest, RTL, Playwright, Tailwind)
Lock file committed (package-lock.json)
No unused dependencies
Step 3: Output Format
Generate a comprehensive review report:

1. Executive Summary
Overall Grade: A/B/C/D/F (or percentage score)
Files Reviewed: Count
Total Issues: Count by severity
Critical Issues: Count (must fix immediately)
Warnings: Count (should fix soon)
Suggestions: Count (nice to have)
2. Issues by Severity
CRITICAL (Must Fix)
For each issue:

Category: React/TypeScript/Accessibility/etc.
File: Absolute path and line numbers
Issue: Clear description
Code Example: Show problematic code
Fix: Recommended solution with code snippet
Impact: Why this matters
WARNINGS (Should Fix)
Same format as Critical

SUGGESTIONS (Nice to Have)
Same format as Critical

3. Category Scores
Score each category (0-100%):

React Best Practices: X%
TypeScript Quality: X%
Performance: X%
Accessibility: X%
Testing: X%
Code Organization: X%
Security: X%
Tailwind Usage: X%
4. Test Coverage Report
Components: X% (target: 80%+)
Hooks: X% (target: 100%)
Services: X% (target: 90%+)
Utilities: X% (target: 100%)
Overall: X%
5. Performance Metrics
Bundle size analysis
Lazy loading opportunities
Unnecessary re-renders detected
Missing memoization opportunities
6. Accessibility Compliance
WCAG 2.1 AA violations
Missing ARIA labels
Keyboard navigation issues
Color contrast problems
Semantic HTML issues
7. Top Recommendations (Prioritized)
[CRITICAL] Issue description
[WARNING] Issue description
[SUGGESTION] Issue description
8. Quick Wins
List of easy fixes that provide immediate value:

Add missing prop interfaces
Fix TypeScript any types
Add alt text to images
etc.
9. Best Practices Followed
Highlight what's being done well:

✅ Excellent test coverage
✅ Proper TypeScript usage
✅ Good component composition
etc.
10. Next Steps
Fix critical accessibility issues
Address TypeScript any types
Improve test coverage
Optimize performance hotspots
Refactor for better organization
Execution Instructions
Determine scope from user input
Scan target files based on scope
Analyze each file against CODE_STANDARDS.md
Check specific focus areas if specified
Run automated checks where possible:
Check tsconfig.json for strict mode
Look for test files and coverage
Scan for common anti-patterns
Generate detailed report with specific file paths and line numbers
Provide code examples for issues and fixes
Prioritize recommendations by severity and impact
Important Notes
Be specific: Include file paths (absolute), line numbers, and code snippets
Be constructive: Explain why something is an issue and how to fix it
Be practical: Prioritize high-impact issues over nitpicks
Be educational: Reference CODE_STANDARDS.md sections for learning
Be thorough: Check all aspects of the selected focus areas
Be honest: If something is done well, acknowledge it
Focus on code quality and user experience, not just syntax. The goal is to help developers write better React applications that are maintainable, accessible, performant, and well-tested.