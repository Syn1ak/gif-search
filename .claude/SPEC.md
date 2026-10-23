# Spec: GIF Search (Giphy)

> Status: **APPROVED** (2026-10-23). Implementation plan: [`.claude/tasks/plan.md`](./tasks/plan.md), tasks: [`.claude/tasks/todo.md`](./tasks/todo.md).

## Objective

A web app for searching GIFs through the public [GIPHY API](https://developers.giphy.com/docs/api/). It is built as a take-home test task, so besides working correctly it has to show architecture discipline (layered, domain-driven structure; see [Architecture](#architecture)), clean modern Angular (signals, standalone, DI, custom directives, ControlValueAccessor), and a polished UI.

**User:** anyone who wants to find a GIF quickly and grab it, either as a link or as a file. The UI language is **English**.

### User stories and acceptance criteria

| # | Story | Acceptance criteria |
|---|---|---|
| US-1 | As a user, I type a keyword and see matching GIFs | Typing triggers a search after a 500 ms debounce once the trimmed query has ≥ 2 chars; Enter searches immediately. Results render in a responsive masonry grid. Stale responses are cancelled (`switchMap`). Query > 50 chars shows a validation error and does not hit the API (GIPHY's limit). |
| US-2 | As a user, I see something useful before I type anything | While the search field is **empty** (first visit, or after clearing it), the grid shows GIPHY **Trending** (`/v1/gifs/trending`, the GIFs that are popular right now) under a "Trending now" heading. A search that returns **zero results** does *not* fall back to trending; it shows a "Nothing found for “…”" empty state. |
| US-3 | As a user, I scroll to get more results | Infinite scroll loads the next page (30 items) when a sentinel enters the viewport. It stops at `pagination.total_count` (with a beta key this was observed to be capped at 500 for search) or at the API offset cap (4999 for search, 499 for trending), and shows an "End of results" marker. Duplicate ids across pages are dropped. |
| US-4 | As a user, I open a GIF to see its details | Clicking (or Enter/Space on) a card opens a Material dialog showing: the GIF at full size, title, author (avatar, display name, profile link, or "Unknown author"), creation date (`import_datetime`, formatted; GIPHY's `0000-00-00 00:00:00` is treated as unknown), rating, dimensions, file size, source link, and a link to the GIPHY page. |
| US-5 | As a user, I copy a link to the GIF | The dialog has **Copy link** (direct `.gif` media URL) and **Copy GIPHY page link**. Success and failure both show a snackbar. CDK `Clipboard` is used. Cards also have a quick copy action on hover/focus. |
| US-6 | As a user, I download the GIF to my computer | **Download** fetches the original GIF as a Blob (GIPHY media serves `Access-Control-Allow-Origin: *`, verified) and saves it as `<slug>-<id>.gif` through a temporary `<a download>`. The button shows a spinner while downloading. If the fetch fails, a snackbar offers "Open in new tab" as the fallback. |
| US-7 | As a user, I can share or bookmark what I see | State is mirrored to the URL: `?q=cats` for the query and `?gif=<id>` for the open dialog. Reloading restores the search and reopens the dialog (the dialog uses `GET /v1/gifs/{id}` when the GIF is not in the loaded list). Back/forward work, and closing the dialog removes `gif`. |
| US-8 | As a user, I pick light or dark theme | A header toggle cycles system → light → dark. The choice is persisted in `localStorage` and applied to both Material (M3 `color-scheme`) and Tailwind (`dark` variant). |
| US-9 | As a user, I understand what went wrong | Distinct states exist for: loading (skeleton grid), empty results, invalid API key (401/403), rate limit (429: "Rate limit reached, try again later"), and network or other errors (with a **Retry** button). GIPHY "synthetic" responses (`meta.status` 200 with an empty `response_id`) are treated as errors. |
| US-10 | GIPHY compliance | The footer shows a "Powered by GIPHY" attribution. Media URLs are used unmodified and never proxied, and API calls are made client-side. |

### Non-functional

- **Accessibility:** cards are keyboard-focusable buttons with `alt` text (`alt_text` → `title` → "GIF"). The dialog gets Material's focus trap and `aria-labelledby`. With `prefers-reduced-motion: reduce` the grid shows still renditions and animates only on hover/focus. All interactive elements are reachable by keyboard.
- **Performance:** the grid uses the `fixed_width` **webp** rendition with explicit `width`/`height` (no CLS) and `loading="lazy"`. The initial bundle is kept under 500 kB (budget enforced in `angular.json`). Routes are lazy-loaded.
- **Responsive:** 2 columns on mobile, 3 on `md`, 4 on `lg`, 5 on `xl`. The dialog goes full-screen on mobile.
- **API budget:** a beta key allows **100 calls/hour**. The debounce, the ≥ 2 char minimum, and `distinctUntilChanged` exist to protect it. Tests never touch the real API.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Angular **22** (latest: 22.2.x), standalone, **zoneless**, `OnPush` everywhere, signals + new control flow |
| UI components | Angular Material 22 (M3 theme): dialog, form-field, input, button, icon, snackbar, tooltip, progress spinner |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/postcss`) for layout, spacing, and responsive work, plus **SCSS** for component styles and the Material theme |
| HTTP | `HttpClient` with `withFetch()` and functional interceptors |
| Unit/component tests | Vitest (Angular CLI default runner) + `HttpTestingController` |
| E2E tests | **Playwright** (Chromium + mobile viewport); GIPHY API mocked with `page.route()` and fixture JSON |
| Lint/format | `angular-eslint` + Prettier |
| Runtime | Node 24 (local: v24.18.0) |
| Deploy | GitHub Pages via a GitHub Actions workflow included in the repo; the owner pushes and configures GitHub |
| Agent tooling | Angular CLI MCP server (`.mcp.json` → `npx @angular/cli@22 mcp`) for up-to-date docs and best practices |

**Tailwind + Material coexistence:** Tailwind lives in a plain `src/styles/tailwind.css` (Tailwind v4 must not go through the Sass compiler), and the Material theme lives in `src/styles.scss`. Both are listed in `angular.json` `styles`. Tailwind's preflight is layered so it does not override Material. Theme colors are exposed as CSS variables (`--mat-sys-*`) and mapped into Tailwind `@theme` tokens, so utilities like `bg-surface` and `text-on-surface` follow the active theme. Component SCSS does not use `@apply`; utilities go in the templates.

## Commands

```bash
npm install                 # install deps
npm run env                 # writes src/environments/environment.generated.ts from GIPHY_API_KEY (.env or process env)
npm start                   # env + ng serve (http://localhost:4200)
npm run build               # env + ng build --configuration production
npm test                    # ng test (Vitest, single run)
npm run test:watch          # ng test --watch
npm run test:coverage       # ng test --coverage
npm run e2e                 # playwright test (starts ng serve automatically, API mocked)
npm run e2e:ui              # playwright test --ui (interactive runner)
npm run lint                # ng lint
npm run lint:fix            # ng lint --fix
npm run format              # prettier --write .
```

**API key handling:** `.env` (gitignored, already created locally) contains `GIPHY_API_KEY=...`. `scripts/write-env.mjs` (run with `node --env-file-if-exists=.env`) generates `environment.generated.ts` (gitignored). The repo commits only `.env.example`. In CI the key comes from the `GIPHY_API_KEY` repository secret. The key still ends up in the public JS bundle; this is inherent to GIPHY's model, which requires client-side calls, and is acceptable for a rate-limited beta key. The README states this explicitly.

**Deploy:** `.github/workflows/deploy.yml` runs lint, unit tests, e2e, and build on every push to `main` and on every pull request (PRs only run the checks and never deploy). The build uses `--base-href /${{ github.event.repository.name }}/` so the repo name does not need to be known upfront. On `main` it then publishes to GitHub Pages and copies `index.html` to `404.html` as the SPA fallback. The README documents the one-time GitHub setup: create the repo, add the `GIPHY_API_KEY` secret, and set Pages → Source → GitHub Actions.

## Architecture

The architecture is layered and domain-driven. These rules are binding for all code in this repo:

1. **Layers and allowed dependency direction (one-way):**
   `pages → features → domain-level view/models/utils → shared/ui → core`.
   `layout` may use `core` and `shared/ui`. Arrows never point backwards.
2. **No sibling dependencies.** A page never imports another page, and a feature never imports another feature. Code needed by siblings is extracted **one level up** to their nearest common parent (domain-level `view/`, `models/`, `utils/`, or `shared/`).
3. **`core/` is headless.** It holds only injector-based building blocks (API clients, DTOs, interceptors, tokens, app-wide services, providers) and never imports from `domains/`.
4. **`shared/ui/` is presentational.** Generic components, directives, and pipes communicate only through inputs and outputs, and never inject business services or state.
5. **`data-access/` vs `view/`.** Every page and feature splits business logic (`data-access/`: facades, services) from presentation (`view/`: components, pipes, directives). Components talk to a **facade**, the single entry point to a page's or feature's state and operations.
6. **Server is the source of truth.** Data is always re-fetched from GIPHY, never patched locally.
7. **Lazy everything.** Each page is lazy-loaded through its own `*.routes.ts`. Page components use `export default`, and `loadChildren` uses `.then((r) => r.ROUTES)` (no destructuring).

## Project Structure

```
gif-search/
├── .claude/
│   ├── SPEC.md                        # this file
│   ├── tasks/{plan,todo}.md           # implementation plan and task list
│   └── launch.json                    # dev-server preview config
├── .mcp.json                          # Angular CLI MCP server
├── README.md                          # setup, API key, GitHub setup, architecture overview, decisions
├── .env.example                       # .env is gitignored
├── scripts/write-env.mjs
├── .github/workflows/deploy.yml
├── playwright.config.ts
├── e2e/
│   ├── fixtures/                      # search-page-1.json, search-page-2.json, trending.json, gif-by-id.json
│   ├── support/giphy-mock.ts          # page.route() helpers (success, empty, 401, 429, offline)
│   └── *.spec.ts                      # search, infinite-scroll, details-modal, copy-download, deep-link, theme, errors
└── src/
    ├── styles.scss                    # Material M3 theme, light/dark tokens
    ├── styles/tailwind.css            # @import "tailwindcss"; @theme tokens → --mat-sys-*
    ├── environments/
    │   ├── environment.ts             # re-exports generated values
    │   └── environment.generated.ts   # gitignored
    └── app/
        ├── app.config.ts              # provideCore({ routes })
        ├── app.routes.ts              # lazy → domains/gifs/pages/gif-search
        ├── app.component.ts           # <app-main-layout>
        │
        ├── core/                                  # headless only
        │   ├── core.provider.ts                   # router (component input binding), http, icons, theme init
        │   ├── providers/material-symbols.provider.ts  # <mat-icon> uses the Material Symbols font from index.html
        │   ├── tokens/giphy-config.token.ts       # apiKey, baseUrl, pageSize, offset caps
        │   ├── entities/giphy/
        │   │   ├── gif.dto.ts                     # IGiphyGif, IGiphyImages, IGiphyRendition, IGiphyUser
        │   │   ├── giphy-response.dto.ts          # IGiphyListResponse<T>, IGiphySingleResponse<T>, IGiphyPagination, IGiphyMeta
        │   │   └── gif-search.criteria.ts         # { q, limit, offset, rating, lang }
        │   ├── services/
        │   │   ├── api/giphy/gifs.client.ts       # search$, trending$, getById$
        │   │   ├── browser/file-download.service.ts  # download$(url, filename): fetch → blob → <a download>
        │   │   └── theme/theme.service.ts         # $mode signal, persistence, applies color-scheme
        │   ├── interceptors/
        │   │   ├── giphy-api-key.interceptor.ts   # appends api_key only for the GIPHY host
        │   │   └── giphy-error.interceptor.ts     # synthetic-response detection → typed TGiphyError
        │   └── models/
        │       ├── giphy-config.types.ts          # TGiphyConfig, TGifFeedMode, TGiphyRating
        │       ├── giphy-error.ts                 # GiphyApiError, kind 'unauthorized' | 'rate-limited' | 'network' | 'unknown'
        │       └── theme.types.ts
        │
        ├── layout/main-layout/
        │   ├── components/header/                 # logo, theme toggle
        │   ├── components/footer/                 # "Powered by GIPHY"
        │   └── main-layout.component.ts
        │
        ├── domains/gifs/
        │   ├── constants/error-messages.constants.ts  # per-error title/hint/retry, shared by the page and the dialog
        │   ├── models/gif.types.ts                # TGif (client view model), TGifAuthor
        │   ├── utils/gif.mapper.ts                # IGiphyGif → TGif (date sanitising, alt fallback, rendition picking)
        │   ├── view/components/gif-card/          # presentational: input gif, outputs open/copy
        │   ├── features/gif-details-modal/        # dialog + actions, reusable by any page
        │   │   ├── data-access/
        │   │   │   ├── facades/gif-details-modal.facade.ts   # open(gif | id), close, loads by id if needed
        │   │   │   └── services/gif-actions.service.ts       # copyMediaLink, copyPageLink, download (+ snackbar)
        │   │   ├── view/components/
        │   │   │   ├── gif-details-modal/                    # the MatDialog content component
        │   │   │   └── gif-meta-list/
        │   │   └── view/pipes/file-size.pipe.ts
        │   └── pages/gif-search/
        │       ├── constants/                     # search limits
        │       ├── models/gif-search.types.ts     # page state, results state
        │       ├── utils/masonry-columns.ts       # shortest-column distribution (AD-4)
        │       ├── data-access/facades/gif-search.facade.ts   # query, items, pagination, status, error
        │       ├── view/components/
        │       │   ├── search-form/               # reactive form, uses <app-input-control>
        │       │   ├── gif-grid/                  # masonry + infinite-scroll sentinel
        │       │   ├── grid-skeleton/
        │       │   └── results-state/             # empty result / error with retry, shown in place of the grid
        │       ├── view/gif-search.component.ts   # export default; binds ?q / ?gif via input()
        │       └── gif-search.routes.ts
        │
        └── shared/ui/
            ├── forms/
            │   ├── a-base-input.component.ts      # ABaseInputComponent<T> (see below)
            │   ├── directives/host-ng-control.directive.ts  # re-provides the wrapper's NgControl to the inner matInput
            │   ├── input-control/                 # <app-input-control>: label, prefix/suffix icon, clear, loading, <mat-error>
            │   └── validation-messages.token.ts   # VALIDATION_MESSAGES + provideValidationMessages()
            └── directives/
                ├── infinite-scroll.directive.ts   # IntersectionObserver, input disabled/rootMargin, output reached
                └── img-loaded.directive.ts        # fade-in + skeleton until load/error
```

The empty-result and error views live in the page's `results-state` component, not in `shared/`: the search page is their only user. They move up to `shared/ui` only if a second page needs them (rule 2).

### ABaseInputComponent: the reusable form-control base

This is an abstract base class that every form control extends. It shows ControlValueAccessor and DI-resolution skills.

- `ABaseInputComponent<T>` implements `ControlValueAccessor`, strongly typed with `FormControl<T>`; no `any`.
- It injects `NgControl` with `{ self: true, optional: true }` and sets itself as the value accessor in the constructor, which avoids the NG0200 circular-DI trap of providing `NG_VALUE_ACCESSOR`.
- It resolves the bound control both from `[formControl]` and from `formControlName` inside a parent `ControlContainer` / `FormGroupDirective`.
- It implements `writeValue`, `registerOnChange`, `registerOnTouched` (touched on blur, so errors appear when the user leaves the field), and `setDisabledState`. Internal state is kept in signals (`$value`, `$disabled`), and inputs use `input()`.
- It exposes `getErrors()`, `isRequired()`, and an `ErrorStateMatcher` so Material shows errors in sync with the custom messages.
- Error messages are resolved through the `VALIDATION_MESSAGES` injection token. Defaults are provided in `core`, and each feature can override them with `provideValidationMessages({...})`.

`<app-input-control>` extends the base and wraps `mat-form-field`. The search field uses it with `Validators.maxLength(50)`, which shows the whole mechanism end-to-end.

## Code Style

- **Naming:**
  - `$` prefix for signals and for functions returning a `Signal`.
  - `$` suffix for observables and for functions returning an `Observable`.
  - `I` prefix for API DTO interfaces, `T` prefix for client-side types.
  - File suffixes: `.component.ts`, `.facade.ts`, `.service.ts`, `.client.ts`, `.dto.ts`, `.types.ts`, `.criteria.ts`, `.mapper.ts`, `.directive.ts`, `.pipe.ts`, `.token.ts`, `.routes.ts`.
- **Angular:**
  - Use `inject()`, never constructor injection.
  - Everything is standalone and `OnPush`, with `input()` / `output()` / `viewChild()`.
  - Templates use `@if` / `@for (…; track gif.id)`.
- **Signals:**
  - No `effect()` for side effects; use `toObservable(...).pipe(...)` instead.
  - Read signals at the top of `computed`, not inside branches.
  - Use `toSignal` / `toObservable` only in components, never in services, to avoid leaks.
- **Class member order:** constants → injected deps → inputs/outputs/queries → reactive state (signals, computed, observables) → plain properties → constructor → lifecycle hooks → getters → public methods → private methods.
- **Prettier:** single quotes, 2-space indent, 110-char line width.
- **Object literals:** two or more properties means one property per line (`@stylistic/object-curly-newline` expands the object, Prettier puts each property on its own line; autofixed by `npm run lint:fix`). Destructuring and imports are not affected.

```typescript
@Injectable()
export class GifSearchFacade {
  private readonly gifsClient = inject(GifsClient);
  private readonly config = inject(GIPHY_CONFIG);

  private readonly $state = signal<TGifSearchState>(INITIAL_STATE);

  readonly $items = computed(() => this.$state().items);
  readonly $status = computed(() => this.$state().status);
  readonly $hasMore = computed(() => {
    const { offset, total, mode } = this.$state();
    return offset < Math.min(total, this.config.offsetCap[mode]);
  });

  private readonly request$ = new Subject<TGifSearchRequest>();

  readonly results$ = this.request$.pipe(
    switchMap((request) => this.fetchPage$(request)),
  );

  search(query: string): void {
    const q = query.trim();
    this.$state.set({
      ...INITIAL_STATE,
      query: q,
      mode: q ? 'search' : 'trending',
      status: 'loading',
    });
    this.request$.next({
      query: q,
      offset: 0,
    });
  }

  loadMore(): void { /* guards: $hasMore, status !== 'loading' */ }

  private fetchPage$(request: TGifSearchRequest): Observable<void> { /* map DTO → TGif, dedupe, catchError → status 'error' */ }
}
```

## Testing Strategy

| Level | Tool | What | Examples |
|---|---|---|---|
| Unit (pure) | Vitest | mappers, pipes | `gif.mapper` handles a missing user, `0000-00-00` dates, and the alt fallback; `file-size.pipe` |
| Unit (DI) | Vitest + `HttpTestingController` | client, interceptors, facades, services | `GifsClient` builds correct URLs/params; the API-key interceptor touches only the GIPHY host; the error interceptor maps 401/429/synthetic responses; `GifSearchFacade` covers trending vs search, pagination, dedupe, end-of-results caps, cancellation of stale searches, and the error → retry flow; `GifActionsService` covers clipboard success/failure and download success/fallback (mocked `fetch`); `ThemeService` covers persistence and the system default |
| Component | Vitest + TestBed | shared UI + key views | `InputControlComponent` in a reactive-form host (value sync, touched-on-blur, disabled, `maxlength` message); `InfiniteScrollDirective` (mocked `IntersectionObserver`; does not emit when disabled); `GifDetailsModalComponent` (renders metadata, unknown author/date, action buttons call the service); `GifSearchComponent` (`?q` input drives the facade, renders states) |
| E2E | Playwright, API mocked via `page.route('**/api.giphy.com/**')` with fixtures | real user journeys in a real browser | trending on first load → type query → results; scroll loads page 2; open modal shows author and date; copy link (clipboard permission granted in context) puts the media URL on the clipboard; download produces `<slug>-<id>.gif` (`page.waitForEvent('download')`); deep link `/?q=cats&gif=<id>` opens the modal; back closes it; theme toggle persists after reload; 401/429/offline show the right error state; validation error at > 50 chars; mobile viewport (Pixel 7) smoke |
| Manual smoke | real API | final check | README checklist: search, scroll, modal, copy, download, deep link, theme, reduced motion, mobile |

- Spec files sit next to their source (`*.spec.ts`). E2E specs live in `e2e/`.
- **Coverage:** ≥ 80% lines for `core/`, `shared/`, and all `data-access/`. Overall coverage is reported but not gated.
- Automated tests never call the real GIPHY API. Media image requests in e2e are served from a tiny local fixture GIF.

## Boundaries

- **Always:**
  - Follow the [Architecture](#architecture) rules and [Code Style](#code-style). Put new code in the layer it belongs to.
  - Use OnPush, signals, `inject()`, and standalone components; lazy-load routes.
  - Run `npm run lint && npm test && npm run build` before proposing a commit, and `npm run e2e` before finishing a user story.
  - At each task checkpoint, stop and propose a Conventional Commit title and an optional description. **The owner makes every commit.**
  - Keep GIPHY compliance: attribution, no URL tampering, no proxying.
  - Mock the network in all automated tests.
  - Check the Angular CLI MCP (`get_best_practices`, `search_documentation`) before using an API you are unsure about.
- **Ask first:**
  - Adding any dependency beyond Angular/Material/CDK, Tailwind, angular-eslint, @stylistic/eslint-plugin, Prettier, Vitest, Playwright.
  - Changing the deploy workflow.
  - Adding features outside this spec.
  - Deviating from the architecture rules (for example, a store library instead of signal facades).
  - Any git operation that changes history or remotes.
- **Never:**
  - Run `git commit` or `git push`; the owner does both.
  - Let the API key, `.env`, or `environment.generated.ts` end up in a commit.
  - Call the real API from automated tests.
  - Use `effect()` for side effects, `any` types, or constructor injection.
  - Introduce sibling feature → feature imports, or make `core` depend on `domains`.
  - Disable lint rules or skip tests to get green.

## Success Criteria

1. `npm run lint`, `npm test`, `npm run e2e`, and `npm run build` all pass. Line coverage is ≥ 80% on `core/`, `shared/`, and `data-access/`.
2. With a valid key, every user story US-1 to US-10 can be verified manually against the README checklist, and each is covered by at least one e2e scenario.
3. The downloaded file is a valid `.gif` named `<slug>-<id>.gif`, and copied links open the same GIF.
4. Opening `/?q=cats&gif=<id>` in a fresh tab shows the cats results with that GIF's modal open.
5. There are no console errors. Lighthouse Accessibility is ≥ 95 and CLS is < 0.1 on the search page.
6. After the owner pushes to GitHub and completes the README's one-time setup, the workflow deploys the app to GitHub Pages without code changes.
7. A reviewer can map each folder to its architecture layer from the README alone.

## Open Questions

None at the moment. All earlier questions are resolved: English UI, Playwright included, the owner handles GitHub, and the key is in `.env`.
