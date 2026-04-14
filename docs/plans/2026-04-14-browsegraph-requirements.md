# BrowseGraph Requirements Specification

**Version:** 1.0  
**Date:** 2026-04-14  
**Status:** Approved for MVP implementation  
**Source:** Refined from Graph_Native_Browser_Knowledge_Graph_PRD.md

---

## 1. System Overview

A Chrome Extension captures browser entities (tabs, tab groups, bookmarks) and syncs them to a self-hosted backend backed by Neo4j. The extension renders an interactive graph view in a side panel.

### Hard constraints

- Single-user, self-hosted deployment
- Chrome-only (Chromium-compatible accepted, no Firefox/Safari)
- No bidirectional sync (backend never pushes state back into Chrome)
- No full-page content crawling
- No AI inference in MVP (schema reserved for future embeddings)

### Architecture

| Layer | Tech | Boundary |
|---|---|---|
| Client | Chrome Extension (Manifest V3), scaffolded from [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension) — React 19, TypeScript, Tailwind CSS 4, Vite | Captures entities, accepts context input, renders graph, queues failed syncs |
| Service | NestJS + Fastify adapter | Auth, upsert nodes/edges, rule-based edge generation, graph queries |
| Data | Neo4j (self-hosted, Community Edition) | Stores nodes and relationships, serves traversal queries |

### Extension entry points

| Entry point | Purpose |
|---|---|
| Background service worker | Capture events, orchestrate sync, manage retry queue, session lifecycle |
| Popup | Quick save (note + tags) for current tab |
| Side panel | Graph view, context editor, node detail and actions |
| Content script | Selected text extraction (on demand) |
| Options page | Backend URL, API key, sync preferences |

### Deployment

Docker Compose with backend + Neo4j containers. `docker compose up` starts everything with zero manual config beyond `.env`.

---

## 2. Data Model

### 2.1 Node labels

| Node | Key properties | Identity rule |
|---|---|---|
| Tab | `url`, `normalizedUrl`, `title`, `status`, `windowId`, `groupId`, `createdAt`, `lastSeenAt` | Upsert by `normalizedUrl` within active session |
| Bookmark | `url`, `normalizedUrl`, `title`, `folderPath`, `createdAt` | Upsert by Chrome bookmark ID |
| TabGroup | `title`, `color`, `windowId`, `collapsed`, `createdAt` | Upsert by Chrome group ID |
| Tag | `name`, `slug`, `createdAt` | Upsert by `slug` |
| Domain | `host`, `normalizedHost`, `createdAt` | Upsert by `normalizedHost` |
| Session | `startedAt`, `endedAt`, `automatic` | One per browser lifecycle; closed on idle/shutdown |

### 2.2 Reserved for future (schema only, not implemented)

- Nullable `embedding: float[]` on Tab and Bookmark nodes
- `SEMANTICALLY_SIMILAR` relationship type

### 2.3 Relationships

| Relationship | From | To | Attributes | Creation |
|---|---|---|---|---|
| `IN_GROUP` | Tab | TabGroup | `createdAt` | Structural — on capture |
| `TAGGED_WITH` | Tab/Bookmark | Tag | `source` (user/system) | On user save or auto-tag |
| `ON_DOMAIN` | Tab/Bookmark | Domain | `createdAt` | Structural — on capture |
| `IN_SESSION` | Tab | Session | `position`, `createdAt` | Structural — on capture |
| `RELATED` | Tab/Bookmark | Tab/Bookmark | `score`, `reason`, `createdAt` | Backend rule engine |
| `DUPLICATE_OF` | Tab/Bookmark | Tab/Bookmark | `confidence` | Backend URL normalization |

### 2.4 URL normalization

Strip protocol, `www.`, trailing slashes, sort query params, remove tracking params (`utm_*`, `fbclid`, etc.). Two nodes with the same `normalizedUrl` are candidates for `DUPLICATE_OF`.

Example: `https://www.example.com/path/?utm_source=x&b=2&a=1` becomes `example.com/path?a=1&b=2`

---

## 3. Functional Requirements

### FR1: Capture

| ID | Requirement | Trigger | Verify by |
|---|---|---|---|
| FR1.1 | Read all open tabs with title, URL, windowId, groupId | On manual sync or browser event | Tab list matches `chrome.tabs.query` output |
| FR1.2 | Read tab groups with title, color, collapsed state | On manual sync or group change event | TabGroup nodes match `chrome.tabGroups.query` |
| FR1.3 | Traverse bookmark tree and extract items with folderPath | On first sync and on bookmark change events | Bookmark count matches `chrome.bookmarks.getTree` leaf count |
| FR1.4 | Normalize URLs: strip protocol, `www.`, trailing slash, sort query params, remove `utm_*`/`fbclid` | On every URL before upsert | Normalization example produces expected output |
| FR1.5 | Create automatic Session node on browser startup; close on idle (30min default) or shutdown | Service worker `onStartup` / idle detection | Session node exists with `startedAt` and `endedAt` timestamps |

### FR2: Context

| ID | Requirement | Trigger | Verify by |
|---|---|---|---|
| FR2.1 | Save current tab with note (free text) and tags (comma-separated) from popup | User clicks "Save" in popup | Tab node has `note` and `TAGGED_WITH` edges |
| FR2.2 | Save with richer editing (note, tags, selected text) from side panel | User opens side panel context editor | Tab node has `note`, `selectedText`, and tags |
| FR2.3 | Store save reason as `saveReason` property on the node | On every user-initiated save | Property is non-null on saved nodes |

### FR3: Sync

| ID | Requirement | Trigger | Verify by |
|---|---|---|---|
| FR3.1 | Incremental sync — send only changed entities since last sync timestamp | On sync cycle (manual or periodic) | Backend receives subset, not full dump |
| FR3.2 | Idempotent upserts — re-sending the same entity produces no duplicates | Retry or re-sync | Node count unchanged after duplicate send |
| FR3.3 | Retry queue — failed writes are stored in `chrome.storage.local` and retried next cycle | Backend unreachable | Queue drains after backend recovers |

### FR4: Structural relationships

| ID | Requirement | Verify by |
|---|---|---|
| FR4.1 | Every Tab in a group gets an `IN_GROUP` edge to its TabGroup node | Query tabs by group returns correct members |
| FR4.2 | Every Tab and Bookmark gets an `ON_DOMAIN` edge to its Domain node (created if missing) | All nodes with same host share one Domain node |
| FR4.3 | Every Tab gets an `IN_SESSION` edge to the active Session node | Session neighborhood query returns its tabs |
| FR4.4 | User-applied tags create `TAGGED_WITH` edges with `source: "user"` | Tag node exists and edge has correct source |

### FR5: Inferred relationships

| ID | Requirement | Verify by |
|---|---|---|
| FR5.1 | Score pairs using: `tag*5 + domain*2 + group*3 + title*3 + context*6` | Score matches formula for a known pair |
| FR5.2 | Create `RELATED` edge only when score >= threshold (default: 7) | No `RELATED` edges exist below threshold |
| FR5.3 | Every `RELATED` edge stores `score` and `reason` (which signals matched) | Edge properties are queryable and non-empty |
| FR5.4 | Title similarity uses normalized comparison (lowercase, strip punctuation, token overlap) | "Getting Started with Neo4j" and "Neo4j Getting Started Guide" score > 0 |
| FR5.5 | Context similarity uses keyword overlap between notes/selectedText | Two nodes with shared keywords in notes get a context signal |
| FR5.6 | `DUPLICATE_OF` edge created when two nodes share the same `normalizedUrl` with `confidence: 1.0` | Duplicate tabs/bookmarks are linked |
| FR5.7 | Threshold is configurable via backend environment variable | Changing the var changes edge creation behavior |

### FR6: Graph view (side panel)

| ID | Requirement | Verify by |
|---|---|---|
| FR6.1 | Side panel shows a force-directed graph centered on the current tab's node | Opening side panel on a tab shows its neighborhood |
| FR6.2 | Nodes are colored by type (Tab, Bookmark, Tag, Domain, TabGroup, Session) | Visual distinction between node types |
| FR6.3 | Filter graph by: tag, domain, node type, session | Applying filter reduces visible nodes |
| FR6.4 | Click a node to show detail panel: title, URL, note, tags, related count | Detail panel displays correct metadata |
| FR6.5 | Node actions: open URL in new tab, inspect related nodes, expand neighborhood | Actions execute correctly |
| FR6.6 | Graph renders <= 200 nodes in under 1 second | Performance benchmark passes |
| FR6.7 | Default view limits neighborhood depth to 2 hops | Unconstrained graph is not loaded |

### FR7: Authentication

| ID | Requirement | Verify by |
|---|---|---|
| FR7.1 | Issue API key via `POST /auth/keys` (bootstrapped from env secret on first run) | Key is returned and stored |
| FR7.2 | Every write/read endpoint requires `Authorization: Bearer <api-key>` header | Requests without key return 401 |
| FR7.3 | API keys are hashed before storage (never stored plaintext) | Database contains only hashes |

### FR8: Node operations

| ID | Endpoint | Behavior | Verify by |
|---|---|---|---|
| FR8.1 | `POST /api/v1/nodes/sync` | Batch upsert nodes (tabs, bookmarks, groups, sessions). Accepts array. Idempotent. | Re-sending same payload produces no duplicates |
| FR8.2 | `PATCH /api/v1/nodes/:id/context` | Update note, tags, selectedText, saveReason on a node | Properties updated, `TAGGED_WITH` edges created/removed |
| FR8.3 | `GET /api/v1/nodes/:id` | Return node with all properties and direct relationships | Response includes edges |

### FR9: Edge operations

| ID | Endpoint | Behavior | Verify by |
|---|---|---|---|
| FR9.1 | `POST /api/v1/edges/generate` | Run rule engine on recently synced nodes, create/update `RELATED` and `DUPLICATE_OF` edges | New edges appear with score and reason |
| FR9.2 | `GET /api/v1/edges/:id` | Return edge with attributes (score, reason, confidence) | Response matches stored edge |

### FR10: Graph queries

| ID | Endpoint | Behavior | Verify by |
|---|---|---|---|
| FR10.1 | `GET /api/v1/graph/neighborhood/:nodeId?depth=2&limit=200` | Return subgraph around a node, limited by depth and node count | Response contains nodes + edges within bounds |
| FR10.2 | `GET /api/v1/graph/filter?tag=X&domain=Y&type=Z&session=S` | Return filtered subgraph matching criteria | Only matching nodes returned |

### FR11: Diagnostics

| ID | Endpoint | Behavior | Verify by |
|---|---|---|---|
| FR11.1 | `GET /api/v1/health` | Return service status + Neo4j connectivity | 200 when healthy, 503 when Neo4j unreachable |
| FR11.2 | `GET /api/v1/diagnostics/sync-status` | Return last sync timestamp, node counts by type, pending edge generation count | Counts match database state |

---

## 4. Non-Functional Requirements

| ID | Area | Requirement | Metric |
|---|---|---|---|
| NFR1 | Performance | Graph neighborhood query returns in < 500ms for 200 nodes | Backend response time |
| NFR2 | Performance | Side panel graph renders in < 1s for 200 nodes | Client paint time |
| NFR3 | Reliability | Retry queue drains within 3 sync cycles after backend recovers | Queue empty after recovery |
| NFR4 | Security | API keys hashed with bcrypt or argon2 | No plaintext keys in storage |
| NFR5 | Security | Extension stores only the API key in `chrome.storage.local`, no other secrets | Storage audit |
| NFR6 | Deployment | `docker compose up` starts backend + Neo4j with zero manual config beyond `.env` | Single command startup |
| NFR7 | Observability | Backend logs structured JSON with request ID, operation, and duration | Log output parseable |

---

## 5. Out of Scope (MVP)

- Bidirectional sync from backend into Chrome state
- Cross-browser support beyond Chromium
- Full-page content crawling
- AI/semantic inference (schema reserved, not implemented)
- Bookmark folders as first-class nodes (stored as `folderPath` string)
- User-created named sessions (automatic only)
- Full offline buffer with conflict resolution (basic retry queue only)

---

## 6. Acceptance Criteria

1. A user can save the current tab with a note and tag from the popup and see it appear as a node in the graph.
2. Tabs and tab groups are synchronized to the backend with correct `IN_GROUP` and `ON_DOMAIN` relationships.
3. Bookmarks are ingested with `folderPath` and linked to domains and tags.
4. The graph view loads a 2-hop neighborhood of up to 200 nodes in under 1 second.
5. At least one rule-based `RELATED` edge can be inspected with its score and reason.
6. The retry queue recovers from a transient backend outage without data loss.
7. `docker compose up` starts a working system from a clean `.env` file.

---

## 7. Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | NestJS + Fastify adapter | Structured modules + Fastify performance |
| Sessions | Automatic only | Simpler capture, no session management UI |
| Bookmark folders | String property on Bookmark nodes | Avoids extra node type and sync complexity |
| Offline support | Basic retry queue via `chrome.storage.local` | Protects against transient failures without conflict resolution |
| AI/semantic linking | Reserve schema space, defer implementation | Zero cost now, smooth upgrade path later |
| Extension scaffold | JohnBra/vite-web-extension template | Provides all entry points with React 19 + TS + Tailwind + Vite |
