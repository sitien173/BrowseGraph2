# BrowseGraph Standalone Graph Explorer Implementation Plan

**Source:** `docs/plans/2026-04-18-graph-explorer-design.md`  
**Date:** 2026-04-18

---

## Phase Summary

| Phase | Owner | Outcome |
|---|---|---|
| 1 | `codex` | Backend web explorer API surface and embedded frontend serving foundation |
| 2 | `codex` | Web app scaffold, API-key auth screen, app shell, and backend integration |
| 3 | `gemini` | Graph-first explorer experience with canvas, search, filters, and node detail panel |
| 4 | `codex` | Verification hardening: automated tests, error states, and deployment/build integration |
| 5 | `claude` | Final integration and end-to-end acceptance review |

---

## Phase Details

### Phase 1: Backend web explorer API and hosting foundation

**Owner:** `codex`

**Goal:** Add the backend endpoints and static asset serving needed to support an embedded standalone web explorer.

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/graph/graph.controller.ts`
- Modify: `backend/src/graph/graph.service.ts`
- Create: `backend/src/web/web.module.ts`
- Create: `backend/src/web/web.controller.ts`
- Create: `backend/src/web/web.service.ts`
- Create: `backend/src/web/web.service.spec.ts`
- Create: `backend/src/graph/graph-search.spec.ts`

**Tasks:**
1. Add a backend `WebModule` that owns web-explorer-specific endpoints and static asset delivery for the embedded frontend build output.
2. Implement `GET /api/v1/web/seed` to return a recent seed graph using the existing `GraphResult` shape, sourced from recent sessions or recently created nodes so first load is never empty.
3. Add a lightweight protected search endpoint for title, normalized URL, tag, and domain lookups, reusing existing graph and node data rather than inventing a second graph model.
4. Wire backend startup and build configuration so the explorer static assets can be served from the existing Nest/Fastify deployment without changing the auth model.

**Acceptance Criteria:**
- `GET /api/v1/web/seed` returns a valid `GraphResult` payload with recent nodes or an empty graph when no data exists
- Search returns relevant matches for title, URL, tag, and domain queries
- All new API endpoints remain protected by the existing Bearer API key guard
- Backend can serve the future web frontend assets from a stable route

**Reviewer Checklist:**
- Seed graph uses current graph types and does not fork payload formats
- Search queries are parameterized and scoped to reasonable limits
- No cookie/session auth is introduced
- Static asset serving does not break existing API routes or extension flows
- Empty-state behavior is explicit when the database has no suitable recent graph data

**Integration Checks:**
- `rtk npm --workspace backend run test`
- `rtk npm --workspace backend run typecheck`
- `rtk npm --workspace backend run build`
- Manual: authenticated `GET /api/v1/web/seed` returns 200 and unauthenticated access returns 401

---

### Phase 2: Embedded web app scaffold, auth screen, and explorer shell

**Owner:** `codex`

**Goal:** Create the embedded web app, bundle it with the backend, and implement API-key entry plus the graph-first application shell.

**Files:**
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `backend/src/main.ts`
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/styles.css`
- Create: `web/src/lib/api.ts`
- Create: `web/src/lib/storage.ts`
- Create: `web/src/components/AuthScreen.tsx`
- Create: `web/src/components/ExplorerShell.tsx`
- Create: `web/src/components/TopBar.tsx`

**Tasks:**
1. Add a new `web/` workspace with React + Vite, plus root and backend scripts so the web app can build into a backend-served output directory.
2. Implement the auth screen with API key entry, inline validation feedback, browser-local persistence, and sign-out/clear-key behavior.
3. Build the initial explorer shell layout with a left sidebar region, center graph region, and right detail region, but keep graph interactions minimal in this phase.
4. Connect the shell to the backend seed endpoint so successful sign-in transitions directly into a seeded explorer view with clear loading and empty states.

**Acceptance Criteria:**
- `web` builds successfully inside the monorepo and is served by the backend
- User can paste an API key, validate it against the backend, and persist it locally
- Successful sign-in loads the explorer shell and fetches the seed graph automatically
- Invalid key, backend unavailable, and no-seed-data states render explicit messages

**Reviewer Checklist:**
- API key storage is limited to browser local storage for this app
- The embedded frontend build output path is deterministic and documented in scripts
- The shell layout matches the approved three-pane design
- Sign-out clears local auth state and returns to the auth screen
- The app remains read-only with no mutation controls introduced

**Integration Checks:**
- `rtk npm --workspace web run build`
- `rtk npm --workspace backend run build`
- `rtk npm --workspace backend run typecheck`
- Manual: run backend, open the explorer route, enter a valid key, and verify the shell loads a seed graph

---

### Phase 3: Graph-first explorer UI, search, filters, and node inspection

**Owner:** `gemini`

**Goal:** Deliver the primary read-only graph exploration experience with a centered graph canvas, sidebar search/filters, and in-place node detail inspection.

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/styles.css`
- Modify: `web/src/lib/api.ts`
- Modify: `web/src/components/ExplorerShell.tsx`
- Create: `web/src/components/GraphCanvas.tsx`
- Create: `web/src/components/SearchPanel.tsx`
- Create: `web/src/components/FilterPanel.tsx`
- Create: `web/src/components/NodeDetailPanel.tsx`
- Create: `web/src/components/EmptyState.tsx`
- Create: `web/src/components/ErrorBanner.tsx`
- Create: `web/src/types/graph.ts`

**Tasks:**
1. Implement the graph-first canvas using the existing force-graph approach as the visual anchor, adapting it for the standalone app’s seeded graph and recenter/expand interactions.
2. Add sidebar search and filter controls that call the backend search/filter APIs and let users jump into graph exploration without leaving the main screen.
3. Implement the right-side node detail panel so node clicks update details in place and offer read-only navigation actions such as recentering or expanding neighborhood depth.
4. Polish UX continuity for loading, empty, and failure states so graph interactions do not blank the full screen during traversal.

**Acceptance Criteria:**
- The app opens on a graph-first canvas after sign-in and renders the seed graph successfully
- Search can locate nodes by title, URL, tag, or domain and recenter the graph around a selected result
- Filters narrow the visible graph using backend query results
- Clicking a node updates the right detail panel and supports recenter/expand traversal actions
- Loading and error states are inline and do not replace the whole app shell

**Reviewer Checklist:**
- The UI remains read-only and traversal-focused
- Graph interactions reuse the backend graph payload shape without client-side schema translation drift
- Search and filters are responsive enough for iterative exploration
- Detail panel content helps the user decide the next navigation step
- Visual hierarchy clearly favors the graph canvas over secondary controls

**Integration Checks:**
- `rtk npm --workspace web run build`
- `rtk npm --workspace backend run build`
- Manual: sign in, load the seed graph, click a node, recenter, expand depth, run a search, and apply at least one filter

**Routing Notes:**
- Use `gemini` because this phase is UI-heavy and dominated by layout, graph presentation, and interaction behavior.

---

### Phase 4: Test coverage, error-state hardening, and build/deployment integration

**Owner:** `codex`

**Goal:** Add automated coverage for the new backend/frontend surfaces and ensure the combined backend + embedded web app build is production-ready.

**Files:**
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `web/package.json`
- Modify: `backend/src/web/web.service.spec.ts`
- Modify: `backend/src/graph/graph-search.spec.ts`
- Create: `web/src/lib/api.spec.ts`
- Create: `web/src/components/AuthScreen.spec.tsx`
- Create: `web/src/components/ExplorerShell.spec.tsx`
- Create: `web/vitest.config.ts`
- Create: `web/src/test/setup.ts`

**Tasks:**
1. Add or extend backend tests for seed graph selection, search behavior, and auth protection on the new web-facing endpoints.
2. Add a lightweight frontend test setup and cover API key entry, seed graph loading, node selection, and explicit error-state rendering.
3. Finalize build scripts so a single backend-oriented build path produces both backend output and embedded frontend assets consistently.
4. Verify regression safety for existing extension/backend behavior after the web app is introduced.

**Acceptance Criteria:**
- Backend automated tests cover seed and search endpoints plus auth behavior
- Frontend automated tests cover auth, initial load, node selection, and core error states
- A documented build flow produces deployable backend output with embedded web assets
- Existing extension/backend builds still pass after adding the web workspace

**Reviewer Checklist:**
- Test setup stays minimal and proportional to the feature scope
- Error-state coverage includes invalid key, backend unavailable, and no data cases
- Build orchestration does not depend on manual file copying outside scripts
- Existing workspace scripts remain understandable and do not regress extension workflows
- No write/edit mutations are exposed in the web app while hardening the feature

**Integration Checks:**
- `rtk npm --workspace backend run test`
- `rtk npm --workspace backend run typecheck`
- `rtk npm --workspace web run test`
- `rtk npm --workspace web run build`
- `rtk npm run build:backend`
- `rtk npm run build:extension`

---

### Phase 5: Final integration and end-to-end acceptance

**Owner:** `claude`

**Goal:** Verify the standalone graph explorer end to end against the approved design and confirm it is ready for follow-on implementation or release decisions.

**Files:**
- No planned file creation; only minimal fixes if integration issues are found

**Tasks:**
1. Run the full backend + web setup from a clean state and verify the explorer route is served correctly from the existing backend deployment.
2. Execute the approved manual acceptance flow: enter key, load seed graph, inspect a node, expand neighborhood, apply a filter, search and recenter, then recover from invalid key and failed request scenarios.
3. Verify the embedded web app does not regress the extension build or existing protected API behavior.
4. Document any non-blocking follow-up debt discovered during integration.

**Acceptance Criteria:**
- The standalone explorer works end to end from API key entry through graph exploration
- The explorer remains read-only and single-user with Bearer API key auth
- Existing backend and extension workflows still build successfully
- Any remaining debt is explicitly identified as non-blocking

**Reviewer Checklist:**
- End-to-end behavior matches `docs/plans/2026-04-18-graph-explorer-design.md`
- The app route is usable without manual asset serving steps outside the repo scripts
- Search, filter, detail, recenter, and expand flows all work on the same screen
- Invalid key and unavailable backend states are understandable to the user
- No extra scope was added beyond the read-only explorer MVP

**Integration Checks:**
- `rtk npm --workspace backend run test`
- `rtk npm --workspace backend run typecheck`
- `rtk npm --workspace web run test`
- `rtk npm run build:backend`
- `rtk npm run build:extension`
- Manual: start backend, open the explorer route, and complete the full acceptance flow

**Routing Notes:**
- Use `claude` for final integration, acceptance review, and any tightly scoped fix coordination discovered during the gate.

---

## Final Integration

Run this section only after all phases above pass individually.

1. Start the backend and Neo4j from a clean local environment.
2. Build the embedded web app and backend together using the repo scripts.
3. Open the standalone explorer route and verify:
   - API key entry works
   - seed graph loads
   - node selection updates the detail panel
   - expand and recenter work
   - search and filters work together
   - invalid key and failed request recovery paths are understandable
4. Rebuild the extension and verify there is no regression in existing workspace build behavior.
5. Record any non-blocking debt separately before considering the feature complete.
