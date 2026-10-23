# Implementation Plan: GIF Search (Giphy)

Source of truth: [`.claude/SPEC.md`](../SPEC.md). Detailed tasks: [`.claude/tasks/todo.md`](./todo.md).

## Overview

The app is built bottom-up through **vertical slices**. The first phase lays down only the foundation everything rests on: workspace, theming, API key, the Giphy data layer, and the view model. After that, every task delivers something visible in the browser, backed by unit tests and (from Task 9 on) a Playwright scenario. The work splits into four phases with a human checkpoint after each.

## Working agreement

- **Claude never commits or pushes.** At the end of every task Claude stops and proposes a commit title (Conventional Commits) and, when useful, a description. The owner reviews and commits.
- A task counts as done only when its acceptance criteria **and** the Definition of Done are met:
  - lint, unit tests, and build pass;
  - the task's e2e scenario passes;
  - there is no dead code or debug output;
  - files follow the spec's Architecture rules.
- Before using an Angular API Claude is unsure about, it checks the Angular CLI MCP (`get_best_practices`, `search_documentation`). The MCP loads only in a session started inside `~/work/gif-search`.
- During development the real Giphy API is used sparingly, because the beta key allows 100 calls/hour. Tests are always mocked.

## Architecture Decisions

| # | Decision | Rationale |
|---|---|---|
| AD-1 | **URL is the source of truth for the query and the open GIF.** The search form emits a query, the page calls `router.navigate({ queryParams: { q } })`, and the route's `q` input (`withComponentInputBinding`) drives `facade.search()`. Same for `gif`. | One-directional flow. Back/forward, reload, and deep links come for free, and there is no two-way sync bug class. |
| AD-2 | **Facades hold state in signals and orchestrate with RxJS.** Requests go through `Subject → switchMap → client`, and results are written into a private `$state` signal. Only read-only `computed` is exposed. | Signals for rendering, RxJS for cancellation, debounce, and retry; each tool does what it is good at. |
| AD-3 | **Facades are route-scoped**, provided in `gif-search.routes.ts`, and subscribe with `takeUntilDestroyed(inject(DestroyRef))`. | State lives exactly as long as the page; nothing leaks from a root injector, which matches the "no `toSignal` in root services" rule. |
| AD-4 | **Masonry uses JS column distribution, not CSS `columns`.** A `computed` splits items into N columns (N from CDK `BreakpointObserver`), each new item going to the currently shortest column, with heights taken from Giphy's `fixed_width` width/height. | CSS columns reflow the whole grid on every infinite-scroll append, so items jump between columns. This approach is stable on append and has no CLS. Trade-off: DOM and tab order run per column rather than row by row. |
| AD-5 | **`core` owns transport concerns**: an interceptor appends `api_key` only for `api.giphy.com`, and a second interceptor normalises errors (including synthetic 200 responses) into a typed `TGiphyError`. | Clients stay pure URL builders, and the UI switches on one error union type. |
| AD-6 | **The API key comes from `.env`** via `scripts/write-env.mjs` → `environment.generated.ts` (gitignored). A missing key produces an empty string and a console warning, and the UI shows the "unauthorized" state. | The build never breaks on a fresh clone, and the failure mode is visible and self-explaining. |
| AD-7 | **Tailwind v4 in plain CSS and the Material theme in SCSS**, with Material system tokens (`--mat-sys-*`) mapped into Tailwind `@theme`. Dark mode is driven by `color-scheme` on `<html>` plus a `.dark` class for the Tailwind variant. | This avoids running Tailwind through Sass, and gives one palette for both systems. |
| AD-8 | **`ABaseInputComponent<T>` sets itself as the `ControlValueAccessor` through `inject(NgControl, { self: true, optional: true })`** instead of `NG_VALUE_ACCESSOR`. | Access to the bound control's validators and errors without the circular-DI trap. |
| AD-9 | **Playwright is set up early (Task 9)**, and every later story task ships with its own e2e scenario. Giphy is mocked with `page.route()` plus JSON fixtures and a tiny local fixture GIF. | The regression net grows with the app, and the real API quota is never touched. |

## Dependency graph

```
T1 scaffold ──┬── T2 theme ───────────────┐
              ├── T3 env/config ── T4 client+key interceptor ── T5 error interceptor
              │                         └── T6 view model/mapper
              └───────────────────────────────┐
T7 app shell (needs T2) ── T8 trending grid (needs T4,T6,T7) ── T9 Playwright
T10 base form controls (needs T1) ─┐
T8 + T9 + T10 ── T11 search + ?q ── T12 infinite scroll ── T13 error states (needs T5)
T8 ── T14 details modal ── T15 copy ── T16 download ── T17 deep link ?gif (needs T11)
T7 ── T18 theme toggle      T8..T17 ── T19 a11y/motion/responsive polish
T1..T19 ── T20 CI/deploy ── T21 README
```

## Task List

### Phase 1: Foundation
- [x] T1: Scaffold the Angular 22 workspace and tooling
- [x] T2: Material M3 + Tailwind v4 theme foundation
- [x] T3: API key pipeline and `GIPHY_CONFIG`
- [x] T4: Giphy DTOs, `GifsClient`, and API-key interceptor
- [x] T5: Giphy error normalisation
- [x] T6: `TGif` view model and mapper

**Checkpoint A: Foundation.** Lint, tests, and build pass; the theme renders in light and dark; review with the owner.

### Phase 2: Search slice
- [x] T7: App shell: layout, footer attribution, lazy search route
- [x] T8: Trending grid on first load
- [x] T9: Playwright setup, Giphy mock, first e2e
- [x] T10: Base form-control infrastructure
- [x] T11: Keyword search driven by `?q`
- [x] T12: Infinite scroll
- [x] T13: Error states and retry

**Checkpoint B: Core flow.** Manual pass with the real key: trending → search → scroll → error states. All e2e pass; review with the owner.

### Phase 3: Details and actions
- [x] T14: GIF details modal
- [x] T15: Copy links
- [x] T16: Download GIF
- [x] T17: Deep link `?gif=<id>`

**Checkpoint C: Feature-complete.** US-1 to US-7 and US-9 to US-10 verified; review with the owner.

### Phase 4: Polish and ship
- [ ] T18: Theme toggle (system / light / dark)
- [ ] T19: Accessibility, reduced motion, and responsive polish
- [ ] T20: CI and GitHub Pages workflow
- [ ] T21: README

**Checkpoint D: Complete.** Every Success Criterion in the spec is met, and the owner pushes and verifies the deployment.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `ng new` into a non-empty folder clashes with the existing `.gitignore` / `.claude` | Low | Scaffold in a temp dir with `--skip-git`, then move files in and merge `.gitignore` by hand (T1). |
| Tailwind v4 preflight or utilities fight Material styles | Med | Done early (T2) with a visual smoke page; preflight goes in a lower `@layer`; no `@apply` in component SCSS. |
| Vitest + zoneless: no `fakeAsync`, timers behave differently | Med | Use `vi.useFakeTimers()` and `await fixture.whenStable()`; prove the pattern in T10/T11 before it spreads. |
| Beta key limit of 100 calls/hour runs out during manual testing | Med | Debounce, ≥ 2 chars, `distinctUntilChanged`; tests are 100% mocked; manual checks are batched at checkpoints. |
| Search `total_count` capped at 500 for a beta key (observed) | Low | Stop on `total_count` from the response, never on assumed values (T12). |
| Clipboard API in e2e needs permissions | Low | `context.grantPermissions(['clipboard-read','clipboard-write'])` in Chromium; read back with `navigator.clipboard.readText()` (T15). |
| Download depends on CORS on the Giphy media CDN | Low | Verified `Access-Control-Allow-Origin: *`; the "open in new tab" fallback still exists (T16). |
| GitHub Pages base path / SPA fallback | Low | `--base-href /<repo>/` from `github.event.repository.name`, and `404.html` copied from `index.html` (T20). |

## Parallelization

The app is small and most tasks share the page and facade files, so execution is **sequential**. The only safely parallel pairs are T10 ‖ T8 and T18 ‖ T14–T17. They are not worth separate sessions.

## Open Questions

None at the moment. (Resolved 2026-10-23: no `npm run start:mock` dev mode that serves the e2e fixtures; it is outside the spec and the API quota has been enough so far.)
