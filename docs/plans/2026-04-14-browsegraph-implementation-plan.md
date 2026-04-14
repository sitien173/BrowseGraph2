# BrowseGraph Implementation Plan

**Source:** `docs/plans/2026-04-14-browsegraph-requirements.md`  
**Date:** 2026-04-14

---

## Phase Summary

| Phase | Owner | Outcome |
|---|---|---|
| 1 | `codex` | Project scaffold, Docker infrastructure, monorepo structure |
| 2 | `codex` | Backend data layer: Neo4j connection, node models, URL normalization, auth |
| 3 | `codex` | Backend sync API: batch upsert, context update, structural edge creation |
| 4 | `codex` | Backend rule engine, graph query endpoints, diagnostics |
| 5 | `codex` | Extension capture: background worker, tab/group/bookmark ingestion, sync service, retry queue, options page |
| 6 | `codex` | Extension context UI: popup quick-save, side panel context editor, content script text extraction |
| 7 | `gemini` | Extension graph visualization: force-directed layout, node coloring, filtering, detail panel, node actions |
| 8 | `claude` | Final integration: end-to-end acceptance, performance verification |

---

## Phase Details

### Phase 1: Project scaffold and Docker infrastructure

**Owner:** `codex`

**Goal:** Monorepo with buildable extension and backend, running via Docker Compose alongside Neo4j.

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/` (NestJS + Fastify scaffold)
- Create: `extension/` (clone from JohnBra/vite-web-extension, strip New Tab + DevTools)
- Create: `backend/Dockerfile`
- Create: `backend/package.json`, `backend/tsconfig.json`

**Tasks:**
1. Initialize NestJS project with Fastify adapter under `backend/`. Configure TypeScript strict mode, structured JSON logging (pino), and `.env` config via `@nestjs/config`.
2. Clone `JohnBra/vite-web-extension` into `extension/`. Remove New Tab page, DevTools panel, and Firefox polyfill. Verify popup, side panel, background, content script, and options page entry points remain buildable.
3. Create `docker-compose.yml` with two services: `backend` (Node 20, Fastify on port 3000) and `neo4j` (Community Edition, bolt on 7687, browser on 7474). Create `.env.example` with `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, `API_KEY_SECRET`, `RELATED_THRESHOLD=7`.
4. Add root `package.json` with workspace scripts: `dev:backend`, `dev:extension`, `build:backend`, `build:extension`, `docker:up`, `docker:down`.

**Acceptance Criteria:**
- `docker compose up` starts backend + Neo4j without errors
- `npm run dev:extension` produces a loadable Chrome extension in `extension/dist`
- Backend responds to `GET /` with 200
- Neo4j is reachable from backend container via bolt

**Reviewer Checklist:**
- NFR6: single-command Docker startup works
- No Firefox/New Tab/DevTools artifacts remain in extension
- Fastify adapter is used (not Express)
- Strict TypeScript in both projects
- `.env.example` documents all required variables

**Integration Checks:**
- `docker compose up -d && curl http://localhost:3000/`
- `cd extension && npm run build` exits 0
- `docker compose logs neo4j` shows "Started." message

---

### Phase 2: Backend data layer, URL normalization, and auth

**Owner:** `codex`

**Goal:** Neo4j connection pool, Cypher-based node repositories for all 6 node types, URL normalization utility, and API key auth guard.

**Files:**
- Create: `backend/src/neo4j/neo4j.module.ts`, `neo4j.service.ts`
- Create: `backend/src/nodes/node.types.ts`
- Create: `backend/src/nodes/node.repository.ts`
- Create: `backend/src/shared/url-normalizer.ts`
- Create: `backend/src/auth/auth.module.ts`, `auth.service.ts`, `auth.guard.ts`, `auth.controller.ts`
- Create: `backend/src/shared/url-normalizer.spec.ts`
- Create: `backend/src/auth/auth.service.spec.ts`

**Tasks:**
1. Create `neo4j.module.ts` using the official `neo4j-driver` package. Inject bolt URI, user, and password from config. Expose a `Neo4jService` with `read(cypher, params)` and `write(cypher, params)` methods that manage sessions and transactions.
2. Define TypeScript types for all 6 node labels (Tab, Bookmark, TabGroup, Tag, Domain, Session) in `node.types.ts`. Create `node.repository.ts` with Cypher `MERGE` queries for each type, using identity rules from the spec (normalizedUrl for Tab, Chrome ID for Bookmark/TabGroup, slug for Tag, normalizedHost for Domain, startedAt for Session). Include reserved nullable `embedding` property in Tab and Bookmark types.
3. Implement `url-normalizer.ts`: strip protocol, `www.`, trailing slashes, sort query params alphabetically, remove `utm_*` and `fbclid` params. Write unit tests covering the spec example and edge cases (no query params, fragment-only URLs, already-normalized URLs).
4. Implement auth module: `POST /api/v1/auth/keys` issues an API key (random 32-byte hex), hashes it with argon2 before storing in Neo4j as an `ApiKey` node. `AuthGuard` validates `Authorization: Bearer <key>` on all other routes by hashing the incoming key and comparing. Write unit tests for hash-and-compare flow.

**Acceptance Criteria:**
- FR7.1: `POST /auth/keys` returns a plaintext key; database stores only the hash
- FR7.2: Requests without valid key return 401
- FR7.3: No plaintext keys in Neo4j
- FR1.4: URL normalization passes spec example
- All 6 node types can be MERGE'd without duplicates

**Reviewer Checklist:**
- NFR4: argon2 used for key hashing
- Node identity rules match spec exactly
- URL normalizer handles edge cases (empty path, no params, encoded characters)
- Neo4j driver sessions are properly closed after use
- Reserved `embedding` field exists in Tab/Bookmark types but is not populated

**Integration Checks:**
- `cd backend && npm test` — all unit tests pass
- `docker compose up -d && curl -X POST http://localhost:3000/api/v1/auth/keys -H "Content-Type: application/json" -d '{"secret":"$API_KEY_SECRET"}'` returns a key
- Unauthenticated `GET /api/v1/health` returns 401

---

### Phase 3: Backend sync API and structural edge creation

**Owner:** `codex`

**Goal:** Batch upsert endpoint, context update endpoint, node detail endpoint. Structural edges (IN_GROUP, ON_DOMAIN, IN_SESSION, TAGGED_WITH) are created during sync.

**Files:**
- Create: `backend/src/nodes/nodes.module.ts`, `nodes.controller.ts`, `nodes.service.ts`
- Create: `backend/src/edges/edge.types.ts`
- Create: `backend/src/edges/structural-edges.service.ts`
- Create: `backend/src/nodes/nodes.service.spec.ts`

**Tasks:**
1. Implement `POST /api/v1/nodes/sync`: accepts an array of node payloads (mixed types). For each node, run the appropriate MERGE query from the repository. Return counts by type. The endpoint must be idempotent — re-sending the same payload produces no new nodes.
2. During sync, after upserting each Tab/Bookmark, create structural edges: extract domain from `normalizedUrl` and MERGE a Domain node + `ON_DOMAIN` edge; if Tab has `groupId`, MERGE `IN_GROUP` edge to TabGroup; if an active Session exists, MERGE `IN_SESSION` edge to Session.
3. Implement `PATCH /api/v1/nodes/:id/context`: update `note`, `selectedText`, `saveReason` on the node. For `tags`, parse the comma-separated list, MERGE each Tag node by slug, create/remove `TAGGED_WITH` edges with `source: "user"` to match the new tag set.
4. Implement `GET /api/v1/nodes/:id`: return the node with all properties plus its direct relationships (1-hop edges with connected node summaries).

**Acceptance Criteria:**
- FR8.1: Batch upsert is idempotent (re-send same data, no duplicates)
- FR8.2: Context update creates/removes TAGGED_WITH edges correctly
- FR8.3: Node detail includes direct edges
- FR4.1-4.4: All structural edges created during sync
- FR3.2: Idempotent upserts verified

**Reviewer Checklist:**
- Upsert uses MERGE with correct identity keys per node type
- Domain extraction uses the same normalizer from Phase 2
- Tag edge reconciliation removes stale TAGGED_WITH edges
- All endpoints require auth guard
- Cypher queries are parameterized (no string interpolation)

**Integration Checks:**
- `cd backend && npm test` — all tests pass
- Sync 5 tabs, re-sync same 5 → node count is still 5
- Sync a tab with groupId → `IN_GROUP` edge exists in Neo4j
- PATCH context with tags → TAGGED_WITH edges visible in Neo4j browser

---

### Phase 4: Backend rule engine, graph queries, and diagnostics

**Owner:** `codex`

**Goal:** Inferred edge generation (RELATED, DUPLICATE_OF), neighborhood and filter graph queries, health and diagnostics endpoints.

**Files:**
- Create: `backend/src/edges/edges.module.ts`, `edges.controller.ts`, `edges.service.ts`
- Create: `backend/src/edges/rule-engine.ts`
- Create: `backend/src/edges/title-similarity.ts`
- Create: `backend/src/graph/graph.module.ts`, `graph.controller.ts`, `graph.service.ts`
- Create: `backend/src/diagnostics/diagnostics.module.ts`, `diagnostics.controller.ts`
- Create: `backend/src/edges/rule-engine.spec.ts`
- Create: `backend/src/edges/title-similarity.spec.ts`

**Tasks:**
1. Implement the rule engine in `rule-engine.ts`: for each pair of recently synced Tab/Bookmark nodes, compute `score = tag*5 + domain*2 + group*3 + title*3 + context*6`. Title similarity: lowercase, strip punctuation, compute token overlap ratio (Jaccard). Context similarity: keyword overlap between `note`/`selectedText` fields. Create `RELATED` edge only when score >= threshold (from `RELATED_THRESHOLD` env var). Store `score` and `reason` (list of matched signals) on the edge. Create `DUPLICATE_OF` when `normalizedUrl` matches with `confidence: 1.0`. Write unit tests for scoring and threshold.
2. Implement `POST /api/v1/edges/generate`: triggers rule engine on nodes synced since last generation run. Implement `GET /api/v1/edges/:id`: returns edge with all attributes.
3. Implement `GET /api/v1/graph/neighborhood/:nodeId?depth=2&limit=200`: Cypher variable-length path query, returns nodes and edges within depth, capped at limit. Implement `GET /api/v1/graph/filter?tag=X&domain=Y&type=Z&session=S`: filtered subgraph query with optional parameters.
4. Implement `GET /api/v1/health` (returns 200 or 503 based on Neo4j connectivity) and `GET /api/v1/diagnostics/sync-status` (last sync timestamp, node counts by label, pending edge generation count).

**Acceptance Criteria:**
- FR5.1-5.7: Scoring formula correct, threshold enforced, reason stored, configurable
- FR9.1-9.2: Edge generate and detail endpoints work
- FR10.1-10.2: Neighborhood and filter queries return correct subgraphs
- FR11.1-11.2: Health and diagnostics endpoints respond correctly
- NFR1: Neighborhood query < 500ms for 200 nodes

**Reviewer Checklist:**
- Scoring formula matches spec exactly
- Title similarity is Jaccard on normalized tokens
- RELATED edges below threshold are never created
- Neighborhood query uses parameterized depth and limit (no unbounded traversal)
- Health endpoint checks actual Neo4j connectivity, not just process liveness
- Diagnostics counts match real database state

**Integration Checks:**
- `cd backend && npm test` — all tests pass
- Sync 10 tabs sharing tags/domains → `POST /edges/generate` creates RELATED edges with correct scores
- `GET /graph/neighborhood/:id?depth=2&limit=200` returns subgraph
- `GET /health` returns 200 when Neo4j is up, 503 when stopped

---

### Phase 5: Extension capture, sync service, retry queue, and options page

**Owner:** `codex`

**Goal:** Background service worker captures tabs, groups, bookmarks, and sessions. Sync service sends incremental updates to backend with retry queue. Options page configures connection.

**Files:**
- Modify: `extension/src/pages/background/index.ts`
- Create: `extension/src/services/capture.ts`
- Create: `extension/src/services/sync.ts`
- Create: `extension/src/services/retry-queue.ts`
- Create: `extension/src/services/url-normalizer.ts`
- Create: `extension/src/services/session.ts`
- Create: `extension/src/types/nodes.ts`
- Modify: `extension/src/pages/options/Options.tsx`

**Tasks:**
1. Implement `capture.ts`: functions to read all open tabs (`chrome.tabs.query`), tab groups (`chrome.tabGroups.query`), and bookmark tree (`chrome.bookmarks.getTree`). Normalize URLs using a client-side copy of the URL normalizer. Flatten bookmarks into `{url, normalizedUrl, title, folderPath}` items. Implement `session.ts`: create Session on `chrome.runtime.onStartup`, close session on `chrome.idle.onStateChanged` (idle > 30min) or `chrome.runtime.onSuspend`.
2. Implement `sync.ts`: track `lastSyncTimestamp` in `chrome.storage.local`. On sync, capture current state, diff against last known state, send only changed entities to `POST /api/v1/nodes/sync`. After successful sync, call `POST /api/v1/edges/generate`. Support manual trigger and periodic sync (configurable interval, default 5 min).
3. Implement `retry-queue.ts`: on sync failure, serialize the failed payload to `chrome.storage.local` under a `retryQueue` key. On next sync cycle, attempt to drain the queue before sending new data. Cap queue at 500 items; drop oldest if exceeded. Log warnings on retry.
4. Implement Options page: form fields for backend URL, API key (input type password), sync interval (dropdown: 1/5/10/30 min). Save to `chrome.storage.local`. Validate backend connectivity on save by calling `GET /api/v1/health`. Show connection status indicator.

**Acceptance Criteria:**
- FR1.1-1.3: Tabs, groups, bookmarks captured with correct metadata
- FR1.5: Session auto-created and auto-closed
- FR3.1: Only changed entities sent on sync
- FR3.3: Failed syncs queued and retried
- NFR3: Queue drains within 3 cycles after recovery
- NFR5: Only API key stored in chrome.storage.local

**Reviewer Checklist:**
- URL normalizer output matches backend normalizer for same inputs
- Session idle timeout is 30min default
- Retry queue has a cap (500 items) to prevent storage bloat
- Sync interval is configurable from options
- No secrets beyond the API key in chrome.storage
- `chrome.tabs.query` includes all metadata fields (windowId, groupId)

**Integration Checks:**
- Load extension in Chrome → background worker starts → Session node appears in Neo4j
- Open 3 tabs → trigger sync → 3 Tab nodes + Domain + IN_SESSION edges in Neo4j
- Stop backend → trigger sync → items appear in retry queue in chrome.storage
- Restart backend → next sync cycle drains queue

---

### Phase 6: Extension context UI — popup and side panel editor

**Owner:** `codex`

**Goal:** Popup provides quick-save with note + tags for current tab. Side panel provides richer context editing with note, tags, selected text, and save reason. Content script extracts selected text on demand.

**Files:**
- Modify: `extension/src/pages/popup/Popup.tsx`
- Create: `extension/src/pages/sidepanel/ContextEditor.tsx`
- Create: `extension/src/components/TagInput.tsx`
- Create: `extension/src/services/context.ts`
- Modify: `extension/src/pages/content/index.ts`

**Tasks:**
1. Implement Popup quick-save: show current tab title + URL, note textarea, comma-separated tag input, "Save" button. On save, call `PATCH /api/v1/nodes/:id/context` via the sync service. Show success/error feedback. Keep it minimal — no graph, no detail view.
2. Implement `TagInput.tsx`: reusable tag input component with comma separation, tag pills with remove button, slug generation (lowercase, hyphenate). Used by both popup and side panel.
3. Implement side panel `ContextEditor.tsx`: same fields as popup plus `selectedText` (read-only, populated from content script) and `saveReason` dropdown (research/reference/todo/other). Longer note textarea. Shows existing context if the node already has saved data.
4. Implement content script: listen for `chrome.runtime.onMessage` with type `GET_SELECTION`. Return `window.getSelection().toString()`. Side panel sends this message when opened and populates the `selectedText` field.

**Acceptance Criteria:**
- FR2.1: Popup save creates note + tags on the node
- FR2.2: Side panel save includes note, tags, selectedText, saveReason
- FR2.3: saveReason is non-null on saved nodes
- FR4.4: TAGGED_WITH edges created with `source: "user"`

**Reviewer Checklist:**
- Tag slugs are generated consistently (lowercase, hyphens, no special chars)
- Selected text extraction only runs on demand (content script is not always active)
- Error states shown to user (backend unreachable, auth failure)
- Existing context is loaded before editing (no data loss on re-save)
- Popup stays minimal and fast to open

**Integration Checks:**
- Open popup on a tab → add note + tags → Save → node in Neo4j has note + TAGGED_WITH edges
- Open side panel → selectedText field populated from page selection
- Save from side panel with saveReason → property set on node
- Re-open side panel on same tab → existing context loaded

---

### Phase 7: Extension graph visualization

**Owner:** `gemini`

**Routing note:** This phase is UI-heavy — force-directed graph layout, node coloring by type, interactive filtering, detail panel, and node actions. Gemini is the right owner for visual/interactive work. Fallback to codex if gemini fails.

**Goal:** Interactive force-directed graph in the side panel, centered on the current tab's node, with filtering, node detail, and actions.

**Files:**
- Create: `extension/src/pages/sidepanel/GraphView.tsx`
- Create: `extension/src/pages/sidepanel/NodeDetail.tsx`
- Create: `extension/src/pages/sidepanel/GraphFilters.tsx`
- Create: `extension/src/services/graph-api.ts`
- Modify: `extension/src/pages/sidepanel/SidePanel.tsx` (tab navigation between graph and context editor)

**Tasks:**
1. Implement `graph-api.ts`: fetch neighborhood (`GET /graph/neighborhood/:nodeId?depth=2&limit=200`) and filtered subgraph (`GET /graph/filter`). Transform API response into the graph library's node/edge format. Implement `GraphView.tsx`: render force-directed graph using a library (D3-force, react-force-graph-2d, or Cytoscape.js — choose based on bundle size and React integration). Center on current tab's node ID.
2. Node coloring: assign distinct colors per node type (Tab, Bookmark, Tag, Domain, TabGroup, Session). Size nodes by connection count. Label nodes with truncated title. Edge styling: different line styles for structural vs. inferred edges.
3. Implement `GraphFilters.tsx`: filter controls for tag (multi-select), domain (multi-select), node type (checkboxes), session (dropdown). Filters call the filter API or client-side filter the loaded subgraph. Applying a filter visually removes non-matching nodes.
4. Implement `NodeDetail.tsx`: on node click, show a detail panel with title, URL (clickable), note, tags, related count, and edge list. Node actions: "Open URL" (new tab), "Show related" (re-center graph on this node), "Expand" (increase depth by 1 hop). Wire side panel to tab between Graph view and Context editor.

**Acceptance Criteria:**
- FR6.1: Graph centered on current tab's node
- FR6.2: Nodes colored by type
- FR6.3: Filters reduce visible nodes
- FR6.4: Node click shows correct detail
- FR6.5: Open URL, show related, expand all work
- FR6.6: 200 nodes render in < 1 second
- FR6.7: Default depth is 2 hops

**Reviewer Checklist:**
- NFR2: Render performance < 1s at 200 nodes
- Graph library choice is justified (bundle size, React compatibility)
- Color palette has sufficient contrast for all 6 node types
- Structural vs. inferred edges are visually distinct
- Filter state persists within the session (not reset on re-render)
- Detail panel does not obscure the graph (overlay or side drawer)

**Integration Checks:**
- Load extension → open side panel → graph renders with nodes from Neo4j
- Click a node → detail panel shows correct metadata
- Apply tag filter → only matching nodes visible
- "Open URL" action opens correct page in new tab
- Graph with 200 nodes renders under 1 second (manual timing)

---

### Phase 8: Final integration and acceptance

**Owner:** `claude`

**Routing note:** Claude handles orchestration, end-to-end verification, and acceptance sign-off. No external executor needed.

**Goal:** Verify all 7 acceptance criteria from the requirements spec. Confirm non-functional requirements. Document any remaining debt.

**Tasks:**
1. Run the full setup flow: `docker compose up` from clean `.env`, load extension, configure backend URL and API key via options page. Verify the system is operational end-to-end.
2. Execute each acceptance criterion as a manual test scenario: (AC1) save tab with note+tag from popup, verify graph node; (AC2) sync tabs with groups, verify IN_GROUP and ON_DOMAIN edges; (AC3) sync bookmarks, verify domain/tag links; (AC4) load graph with 200 nodes, verify < 1s render; (AC5) inspect a RELATED edge with score and reason; (AC6) stop backend, sync, restart, verify queue drains; (AC7) clean .env docker compose up works.
3. Verify non-functional requirements: NFR1 (backend query < 500ms), NFR2 (client render < 1s), NFR4 (no plaintext keys), NFR7 (structured JSON logs).
4. Document any debt, known issues, or post-MVP items discovered during integration.

**Acceptance Criteria:**
- All 7 acceptance criteria from requirements spec pass
- All NFRs verified
- No blocking issues remain

**Reviewer Checklist:**
- Each acceptance criterion tested with evidence (screenshot, curl output, or Neo4j query result)
- Performance metrics measured, not estimated
- Retry queue tested with actual backend downtime, not mocked
- Structured logs contain request ID, operation, and duration

**Integration Checks:**
- Full acceptance test pass
- `docker compose down && docker compose up` — clean restart works
- Extension loads without console errors

---

## Final Integration (after all phases pass)

After Phase 8 sign-off:

1. `docker compose up -d` — backend + Neo4j start cleanly
2. Extension loaded in Chrome, options configured
3. All 7 acceptance criteria verified
4. Performance metrics within bounds (NFR1, NFR2)
5. Security verified (NFR4, NFR5)
6. Structured logging confirmed (NFR7)
7. Tag with `v1.0.0-mvp` and commit
