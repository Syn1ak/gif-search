# Tasks: GIF Search

Plan and decisions are in [`plan.md`](./plan.md); requirements are in [`.claude/SPEC.md`](../SPEC.md).

**Standard verification for every task:** `npm run lint && npm test && npm run build`. From T9 on, `npm run e2e` is added.
At the end of each task Claude stops and proposes the commit (the suggested title is listed per task). **The owner commits.**

---

## Phase 1: Foundation

### T1: Scaffold the Angular 22 workspace and tooling
**Description:** Generate the Angular 22 app (standalone, zoneless, SCSS, routing, Vitest) into the existing repo without touching `.claude/`, `.env*`, or `.mcp.json`. Add strict TypeScript, angular-eslint, Prettier, bundle budgets, and the base npm scripts.

**Acceptance criteria:**
- [x] `ng new` output is merged in, with `--skip-git`, the existing `.gitignore` merged, and the dev server showing a placeholder app.
- [x] `strict`, `strictTemplates`, and `noUncheckedIndexedAccess` are on. ESLint (angular-eslint, with an `explicit-any` ban) and Prettier (single quotes, width 110) are configured, and the npm scripts `lint`, `format`, `test`, `test:watch`, and `test:coverage` exist.
- [x] Initial-bundle budget is 500 kB warn / 600 kB error.

**Verification:** standard trio passes; `npm start` serves on :4200.
**Dependencies:** none
**Files:** `package.json`, `angular.json`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `src/main.ts`, `src/app/app.*`
**Scope:** M (mostly generated). **Commit:** `chore: scaffold Angular 22 workspace with lint, format and Vitest`

### T2: Material M3 + Tailwind v4 theme foundation
**Description:** Add Angular Material and Tailwind v4 so they coexist. The Material M3 theme with light/dark tokens goes in `styles.scss`, and Tailwind goes in plain CSS with `@theme` mapped onto `--mat-sys-*`. The `dark` variant is driven by a class on `<html>`.

**Acceptance criteria:**
- [x] A `mat-flat-button` and a `bg-surface text-on-surface p-4` div render correctly together, with no preflight breakage of Material.
- [x] Toggling `color-scheme: dark` plus `.dark` on `<html>` (by hand in devtools) switches both Material and Tailwind colours.
- [x] No Tailwind processing goes through Sass, and there is no `@apply` in component styles.

**Verification:** standard trio; manual visual check in light and dark.
**Dependencies:** T1
**Files:** `src/styles.scss`, `src/styles/tailwind.css`, `.postcssrc.json`, `angular.json`, `package.json`
**Scope:** S. **Commit:** `feat(theme): set up Material M3 theme with Tailwind v4 tokens`

### T3: API key pipeline and `GIPHY_CONFIG`
**Description:** `scripts/write-env.mjs` reads `GIPHY_API_KEY` from `.env` or the process env and writes `environment.generated.ts`. `environment.ts` re-exports it. The `GIPHY_CONFIG` injection token carries `apiKey`, `baseUrl`, `pageSize = 30`, and `offsetCap { search: 4999, trending: 499 }`.

**Acceptance criteria:**
- [x] `npm run env` generates the file, which is gitignored. `npm start` and `npm run build` run `env` first.
- [x] A missing key writes `''` and prints a warning; the build still succeeds.
- [x] `.env.example` documents the variable.

**Verification:** run `npm run env` with and without `.env`; standard trio.
**Dependencies:** T1
**Files:** `scripts/write-env.mjs`, `src/environments/environment.ts`, `src/app/core/tokens/giphy-config.token.ts`, `package.json`
**Scope:** S. **Commit:** `build: generate environment from .env and add GIPHY_CONFIG token`

### T4: Giphy DTOs, `GifsClient`, and API-key interceptor
**Description:** Type the Giphy contract (GIF, images/renditions, user, list/single response, pagination, meta, search criteria). Implement `GifsClient` with `search$`, `trending$`, and `getById$`, plus a functional interceptor that appends `api_key` for the Giphy host only. Wire everything into `provideCore()` (http with `withFetch` and interceptors, zoneless, router with component input binding and view transitions).

**Acceptance criteria:**
- [x] The client produces the correct URLs and params (`q`, `limit`, `offset`, `rating=g` default, `lang=en`), proven by `HttpTestingController` tests.
- [x] The interceptor adds `api_key` to `api.giphy.com` requests and leaves other hosts (e.g. `media.giphy.com`) alone, proven by tests.
- [x] `app.config.ts` only calls `provideCore({ routes })`.

**Verification:** standard trio.
**Dependencies:** T3
**Files:** `core/entities/giphy/{gif.dto,giphy-response.dto,gif-search.criteria}.ts`, `core/services/api/giphy/gifs.client.ts` (+spec), `core/interceptors/giphy-api-key.interceptor.ts` (+spec), `core/core.provider.ts`
**Scope:** M. **Commit:** `feat(core): add typed Giphy client and API key interceptor`

### T5: Giphy error normalisation
**Description:** An error interceptor maps HTTP failures and Giphy "synthetic" responses (`meta.status` 200 with an empty `response_id`) into a typed `TGiphyError` (`unauthorized | rate-limited | network | unknown`).

**Acceptance criteria:**
- [x] 401/403 map to `unauthorized`, 429 to `rate-limited`, status 0 to `network`, and everything else to `unknown`, proven by tests.
- [x] A synthetic 200 response becomes an error and a normal 200 passes through, proven by tests.

**Verification:** standard trio.
**Dependencies:** T4
**Files:** `core/interceptors/giphy-error.interceptor.ts` (+spec), `core/models/giphy-error.types.ts`, `core/core.provider.ts`
**Scope:** S. **Commit:** `feat(core): normalise Giphy errors including synthetic responses`

### T6: `TGif` view model and mapper
**Description:** Define the client-side `TGif` / `TGifAuthor` types and a pure `toGif()` mapper. It picks renditions (grid uses `fixed_width` webp plus still; the modal uses `original`), applies the alt fallback, sanitises dates (`0000-00-00…` becomes `null`), maps the author (or `null`), and converts the size to a number.

**Acceptance criteria:**
- [x] The mapper handles a full GIF, a missing `user`, an empty `alt_text`, the zero date, and missing renditions, proven by table-driven tests.
- [x] Nothing outside `utils/gif.mapper.ts` touches the Giphy DTO shape.

**Verification:** standard trio.
**Dependencies:** T4
**Files:** `domains/gifs/models/gif.types.ts`, `domains/gifs/utils/gif.mapper.ts` (+spec)
**Scope:** S. **Commit:** `feat(gifs): add GIF view model and DTO mapper`

### Checkpoint A: Foundation
- [ ] Lint, tests, and build are clean; the theme shows in light and dark
- [ ] Owner review (and commits made)

---

## Phase 2: Search slice

### T7: App shell: layout, footer attribution, lazy search route
**Description:** Add `main-layout` with a header (logo and title; the toggle placeholder comes later) and a footer showing "Powered by GIPHY". `app.routes.ts` lazy-loads `gif-search.routes.ts` (`.then((r) => r.ROUTES)`), which lazy-loads the default-exported page component.

**Acceptance criteria:**
- [x] `/` renders the layout with the page placeholder inside; the page is in a lazy chunk (visible in the build output).
- [x] The footer attribution links to giphy.com.

**Verification:** standard trio; build output shows a lazy chunk.
**Dependencies:** T2
**Files:** `layout/main-layout/main-layout.component.ts`, `layout/main-layout/components/{header,footer}/*`, `app.routes.ts`, `domains/gifs/pages/gif-search/{gif-search.routes.ts,view/gif-search.component.ts}`
**Scope:** M. **Commit:** `feat(layout): add app shell with GIPHY attribution and lazy search route`

### T8: Trending grid on first load
**Description:** `GifSearchFacade` (route-scoped) gets trending mode: it loads page 1 of trending and exposes `$items`, `$status`, and `$mode`. Presentational `gif-card` (domain `view/`) and `gif-grid` (masonry by shortest column, see AD-4) plus `grid-skeleton` render it under a "Trending now" heading.

**Acceptance criteria:**
- [x] Opening the app shows a skeleton, then 30 trending GIFs in a 2/3/4/5-column masonry with no layout shift.
- [x] Cards are `<button>`s with alt text; images have width/height and `loading="lazy"`.
- [x] Facade tests (mocked client) cover loading → success and the mapping to `TGif`; there is a unit test for the column-distribution function.

**Verification:** standard trio; manual check with the real key (1 API call).
**Dependencies:** T4, T6, T7
**Files:** `pages/gif-search/data-access/facades/gif-search.facade.ts` (+spec), `domains/gifs/view/components/gif-card/*`, `pages/gif-search/view/components/{gif-grid,grid-skeleton}/*`, `gif-search.component.ts`, `gif-search.routes.ts`
**Scope:** M. **Commit:** `feat(search): show trending GIFs in masonry grid on first load`

### T9: Playwright setup, Giphy mock, first e2e
**Description:** Add Playwright (Chromium and a Pixel 7 project). `webServer` runs `ng serve`. `e2e/support/giphy-mock.ts` provides `mockTrending`, `mockSearch(pages)`, `mockGifById`, and `mockError(status)`, plus offline handling. Fixture JSON and a tiny local GIF serve the media.

**Acceptance criteria:**
- [x] `npm run e2e` and `npm run e2e:ui` work; no request reaches the real `api.giphy.com` (an unmatched route fails the test).
- [x] Scenario "first visit shows trending" passes on desktop and mobile.

**Verification:** `npm run e2e`; standard trio.
**Dependencies:** T8
**Files:** `playwright.config.ts`, `e2e/support/giphy-mock.ts`, `e2e/fixtures/*`, `e2e/trending.spec.ts`, `package.json`
**Scope:** M. **Commit:** `test(e2e): set up Playwright with mocked Giphy API`

### T10: Base form-control infrastructure
**Description:** Add `ABaseInputComponent<T>` (CVA via `NgControl` self-injection, `ControlContainer`/`formControlName` resolution, touched on blur, `setDisabledState`, `ErrorStateMatcher`, `getErrors()` and `isRequired()`), the `VALIDATION_MESSAGES` token with defaults plus `provideValidationMessages()`, `<app-input-control>` (label, prefix/suffix icon, clear button, loading spinner, `enter` output), and `<app-form-error>`.

**Acceptance criteria:**
- [ ] In a reactive-form test host, value flows both ways, blur marks the control touched, `disable()` disables the input, and `required` / `maxlength` show messages only after touch.
- [ ] Works with both `[formControl]` and `formControlName` inside a `[formGroup]`.
- [ ] No `any`; no `NG_VALUE_ACCESSOR` provider.

**Verification:** standard trio (component tests use Material harnesses).
**Dependencies:** T1 (can run alongside T8)
**Files:** `shared/ui/forms/a-base-input.component.ts`, `shared/ui/forms/validation-messages.token.ts`, `shared/ui/forms/input-control/*` (+spec), `shared/ui/forms/form-error/*`
**Scope:** M. **Commit:** `feat(shared): add typed base input with CVA and validation messages`

### T11: Keyword search driven by `?q`
**Description:** `search-form` (reactive form using `<app-input-control>`, `maxLength(50)`) emits a debounced (500 ms), trimmed, ≥ 2 chars, distinct query; Enter emits immediately. The page navigates with `?q=`, and the route `q` input drives `facade.search()` (AD-1), which cancels stale requests with `switchMap`. An empty `q` means trending. Zero results show "Nothing found for “…”".

**Acceptance criteria:**
- [ ] Typing "cats" shows search results under a heading for the query; clearing the field returns to trending; > 50 chars shows the error and makes no request.
- [ ] `/?q=cats` on reload shows cats results; back/forward switches between queries.
- [ ] Facade tests cover cancellation (a slow first response is ignored) and the empty-result state; e2e covers search, empty result, validation, and back/forward.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T8, T9, T10
**Files:** `pages/gif-search/view/components/search-form/*`, `gif-search.facade.ts` (+spec), `gif-search.component.ts`, `pages/gif-search/view/components/results-state/*`, `e2e/search.spec.ts`
**Scope:** M. **Commit:** `feat(search): search GIFs by keyword with query synced to URL`

### T12: Infinite scroll
**Description:** `InfiniteScrollDirective` (`shared/ui`) uses an `IntersectionObserver` sentinel, with `disabled` and `rootMargin` inputs and a `reached` output; it disconnects on destroy. `facade.loadMore()` guards on `$hasMore` and a load already in flight, appends the next offset, drops duplicate ids, and stops at `min(total_count, offsetCap)`. The grid shows an "End of results" marker.

**Acceptance criteria:**
- [ ] Scrolling near the bottom loads page 2 with no duplicates and no column jumps; at the end the marker shows and no more requests are made.
- [ ] Directive tests (mocked IO) cover: emits on intersect, silent when disabled, disconnects on destroy. Facade tests cover dedupe, the end condition, and the in-flight guard.
- [ ] e2e: scroll → page 2 request with `offset=30` → end marker.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T11
**Files:** `shared/ui/directives/infinite-scroll.directive.ts` (+spec), `gif-search.facade.ts` (+spec), `gif-grid/*`, `e2e/infinite-scroll.spec.ts`
**Scope:** M. **Commit:** `feat(search): load more results with infinite scroll`

### T13: Error states and retry
**Description:** `results-state` renders a state per `TGiphyError`: unauthorized ("API key is missing or invalid"), rate-limited, network/unknown with **Retry**. `facade.retry()` re-runs the last request (first page or load-more).

**Acceptance criteria:**
- [ ] Each error type shows its message; Retry re-requests and recovers.
- [ ] A failed load-more keeps the already loaded items and shows an inline retry under the grid.
- [ ] e2e covers 401, 429, and offline → retry.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T5, T12
**Files:** `results-state/*`, `gif-search.facade.ts` (+spec), `gif-search.component.ts`, `e2e/errors.spec.ts`
**Scope:** M. **Commit:** `feat(search): show error states with retry`

### Checkpoint B: Core flow
- [ ] Manual pass with the real key: trending → search → scroll → end; DevTools offline → retry
- [ ] All unit and e2e tests green; owner review and commits

---

## Phase 3: Details and actions

### T14: GIF details modal
**Description:** Feature `gif-details-modal`: `GifDetailsModalFacade.open(gif)` opens a `MatDialog` with `GifDetailsModalComponent`. It shows the full-size GIF (with a still poster until it loads), title, author block (or "Unknown author"), created date (or "Unknown"), rating, dimensions, `file-size` pipe output, source link, and GIPHY page link. The dialog is full-screen below `sm`. A card click (from the page) opens it.

**Acceptance criteria:**
- [ ] Clicking a card or pressing Enter/Space on it opens the dialog with correct data; Esc or the close button returns focus to the card.
- [ ] Component tests cover a full GIF, a missing author, and a missing date; there is a pipe test (B / KB / MB).
- [ ] e2e: open modal → author and date visible → close.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T8
**Files:** `features/gif-details-modal/data-access/facades/gif-details-modal.facade.ts`, `features/gif-details-modal/view/components/{gif-details-modal,gif-meta-list}/*` (+spec), `features/gif-details-modal/view/pipes/file-size.pipe.ts` (+spec), `gif-search.routes.ts`, `e2e/details-modal.spec.ts`
**Scope:** M. **Commit:** `feat(gif-details-modal): show GIF details in a dialog`

### T15: Copy links
**Description:** `GifActionsService` (feature `data-access`): `copyMediaLink(gif)` and `copyPageLink(gif)` via CDK `Clipboard`, with a snackbar on success or failure. The modal gets two copy buttons. The card gets a quick-copy icon button (output → page → service) that shows on hover/focus.

**Acceptance criteria:**
- [ ] Each button puts the correct URL on the clipboard and shows "Link copied"; a failure shows an error snackbar.
- [ ] Quick copy on a card does not open the modal (event isolation).
- [ ] Service tests cover success and failure; e2e reads the clipboard back.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T14
**Files:** `features/gif-details-modal/data-access/services/gif-actions.service.ts` (+spec), `gif-details-modal.component.*`, `gif-card/*`, `gif-search.component.ts`, `e2e/copy-download.spec.ts`
**Scope:** M. **Commit:** `feat(gif-details-modal): copy GIF and GIPHY page links`

### T16: Download GIF
**Description:** `FileDownloadService` (`core`): `download$(url, filename)` does fetch → blob → object URL → temporary `<a download>` → revoke. `GifActionsService.download(gif)` names the file `<slug>-<id>.gif`. The button shows a spinner and is disabled while downloading. On failure a snackbar offers "Open in new tab".

**Acceptance criteria:**
- [ ] Clicking Download saves `<slug>-<id>.gif`; the spinner shows during the fetch.
- [ ] A failed fetch shows the fallback action, which opens the original URL.
- [ ] Service tests (mocked `fetch`, spied anchor) cover success, revoke, and failure; e2e asserts the `download` event and its filename.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T15
**Files:** `core/services/browser/file-download.service.ts` (+spec), `gif-actions.service.ts` (+spec), `gif-details-modal.component.*`, `e2e/copy-download.spec.ts`
**Scope:** M. **Commit:** `feat(gif-details-modal): download GIF to the computer`

### T17: Deep link `?gif=<id>`
**Description:** Opening the modal sets `?gif=<id>` and closing removes it (AD-1). The page's `gif` input opens the modal. It uses the loaded item when available, otherwise `GifsClient.getById$` (with a loading state in the dialog, and a not-found or error message).

**Acceptance criteria:**
- [ ] `/?q=cats&gif=<id>` in a fresh tab shows cats results with that modal open.
- [ ] Closing removes `gif` from the URL; browser Back closes the modal; an unknown id shows "GIF not found".
- [ ] e2e covers the deep link, back-to-close, and not-found.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T11, T14
**Files:** `gif-details-modal.facade.ts` (+spec), `gif-details-modal.component.*`, `gif-search.component.ts`, `e2e/deep-link.spec.ts`
**Scope:** M. **Commit:** `feat(gif-details-modal): open GIF details from a shareable URL`

### Checkpoint C: Feature-complete
- [ ] US-1 to US-7, US-9, and US-10 verified manually with the real key
- [ ] Owner review and commits

---

## Phase 4: Polish and ship

### T18: Theme toggle (system / light / dark)
**Description:** `ThemeService` (`core`): a `$mode` signal, persisted in `localStorage` (wrapped in try/catch), that applies `color-scheme` and `.dark` to `<html>` and follows the OS in `system` mode. A header icon button cycles the modes, with a tooltip and `aria-label`.

**Acceptance criteria:**
- [ ] The toggle cycles system → light → dark, the choice survives a reload, and there is no flash of the wrong theme on load.
- [ ] Service tests cover persistence, unavailable storage, and system-preference changes; e2e covers persistence after reload.

**Verification:** standard trio + `npm run e2e`.
**Dependencies:** T7
**Files:** `core/services/theme/theme.service.ts` (+spec), `core/models/theme.types.ts`, `layout/main-layout/components/header/*`, `core/core.provider.ts`, `e2e/theme.spec.ts`
**Scope:** M. **Commit:** `feat(theme): add system/light/dark theme toggle`

### T19: Accessibility, reduced motion, and responsive polish
**Description:** Add the `img-loaded` directive (skeleton until load, fade-in, error placeholder). Under `prefers-reduced-motion` the grid uses still renditions and animates only on hover/focus. Audit focus outlines, headings, and landmarks; check mobile layout and the full-screen dialog; run Lighthouse.

**Acceptance criteria:**
- [ ] Lighthouse Accessibility ≥ 95 and CLS < 0.1 on the search page (desktop and mobile).
- [ ] With reduced motion emulated, the grid shows stills, and hovering or focusing a card animates it (e2e with `reducedMotion: 'reduce'`).
- [ ] No console errors or warnings across the e2e suite.

**Verification:** standard trio + `npm run e2e`; Lighthouse report numbers given in the summary.
**Dependencies:** T8–T17
**Files:** `shared/ui/directives/img-loaded.directive.ts` (+spec), `gif-card/*`, `gif-details-modal.component.*`, `e2e/a11y.spec.ts`
**Scope:** M. **Commit:** `feat(ui): polish accessibility, reduced motion and loading states`

### T20: CI and GitHub Pages workflow
**Description:** `.github/workflows/deploy.yml`: on push to `main` and PRs, run install → lint → unit tests (with coverage) → Playwright → build with `--base-href /${{ github.event.repository.name }}/` → copy `404.html` → deploy to Pages (main only). The key comes from the `GIPHY_API_KEY` secret. Coverage thresholds (≥ 80% lines for `core/`, `shared/`, `data-access/`) are enforced in the Vitest config.

**Acceptance criteria:**
- [ ] The workflow is valid (`actionlint` if available, otherwise a careful review) and mirrors the local commands exactly.
- [ ] A local production build with a sub-path base-href works under `npx http-server dist/... ` at `/gif-search/`.
- [ ] Coverage thresholds fail the run when they are not met.

**Verification:** standard trio + `npm run test:coverage`; local sub-path smoke test.
**Dependencies:** T1–T19
**Files:** `.github/workflows/deploy.yml`, `vitest` coverage config (in `angular.json`), `package.json`
**Scope:** S. **Commit:** `ci: add GitHub Actions pipeline with Pages deployment`

### T21: README
**Description:** Write the README: what the app is and the live link placeholder, a feature list with a screenshot or GIF, quick start (key → `.env` → `npm start`), all commands, the one-time GitHub setup (repo, secret, Pages source), an architecture overview (layer map, dependency rules, key decisions AD-1 to AD-9 in short form), the testing approach, the manual smoke checklist, and the note on the client-side key and Giphy terms.

**Acceptance criteria:**
- [ ] A fresh clone plus the README alone gets a reviewer to a running app and green tests.
- [ ] Each top-level folder in `src/app` is explained in one line.

**Verification:** follow the README from a clean clone in a temp dir.
**Dependencies:** T20
**Files:** `README.md`, `docs/screenshot.png`
**Scope:** S. **Commit:** `docs: add README with setup, architecture and testing guide`

### Checkpoint D: Complete
- [ ] Every Success Criterion in the spec is met
- [ ] Owner pushes to GitHub, adds the secret, enables Pages, and the deployment works
