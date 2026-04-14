# Product Requirements Document (PRD)

## Graph-native Browser Knowledge Graph

**Chrome Extension + Backend API + Neo4j**  
Self-hosted architecture for tabs, tab groups, bookmarks, context, and network graph visualization.

| Field | Value |
|---|---|
| Version | v1.0 draft |
| Prepared for | Product planning and MVP implementation |

**Document purpose:** define the product vision, scope, architecture, requirements, and MVP roadmap for a graph-native alternative to a Notion-based browser knowledge manager.

## 1. Executive Summary

This product is a Chrome Extension and self-hosted backend that captures tabs, tab groups, bookmarks, and user-provided context, then stores and links them in a graph-native database. The graph becomes an explorable knowledge layer that helps users understand what they are browsing, why it matters, and how saved resources relate to each other.

The original Notion-backed concept is replaced by a graph-native architecture centered on Neo4j. This change improves query flexibility, relationship modeling, traversal performance, and future support for recommendation and semantic linking.

The MVP focuses on four jobs: capture browser entities, enrich them with tags and context, synchronize them to a backend, and visualize them as a network graph.

| Pillar | What it means | Why it matters |
|---|---|---|
| Capture | Save tabs, groups, bookmarks, and sessions as structured entities | Preserves browser state as reusable knowledge |
| Context | Attach notes, tags, selected text, and rationale | Adds human meaning, not just URLs |
| Connections | Auto-link entities through graph relationships | Enables discovery and related-resource navigation |
| Visualization | Show network graph views inside the extension | Makes knowledge structure visible and interactive |

## 2. Problem Statement

Users often manage dozens of tabs, grouped work sessions, and large bookmark collections, but traditional browser tools do not preserve context well and do not reveal relationships between resources.

- Tabs are ephemeral and lose meaning once closed.
- Bookmark folders are rigid and weak at showing cross-topic relationships.
- Tab groups help short-term organization but do not persist as structured knowledge.
- Users cannot easily answer questions such as: “What bookmark is related to the tab I am reading now?” or “Which tabs belong to the same project across sessions?”

## 3. Product Vision

Turn browser activity into a persistent, explorable knowledge graph.

## 4. Goals and Success Metrics

### Primary goals

- Persist browser entities as graph nodes with stable identities.
- Allow users to annotate resources with context and tags quickly.
- Create useful relationships automatically with explainable scoring.
- Provide a performant graph view for exploration and filtering.

### Success metrics

| Metric | Target for MVP | Definition |
|---|---|---|
| Sync success rate | >= 95% | Percentage of captured entities successfully written to backend |
| User save latency | < 3 seconds | Time from save action to persisted node/edge state |
| Graph render time | < 1 second at 200 nodes | Time to display default graph view |
| Context adoption | >= 30% of saved tabs | Saved tabs with at least one tag or note |

## 5. Target Users and Core Use Cases

| User type | Primary need | Representative use case |
|---|---|---|
| Researchers | Track sources and context across sessions | Save articles, notes, and related references into a research graph |
| Developers | Preserve work tabs and docs by project | Connect GitHub, docs, issues, and design references through tags and domains |
| Knowledge workers | Reduce bookmark chaos | Turn ad-hoc browsing into organized, searchable linked resources |
| Power users | Visualize browsing structure | Explore tab groups, sessions, and long-term bookmarks as a graph |

## 6. Scope

### In scope for MVP

- Chrome Extension support for tabs, tab groups, bookmarks, context capture, and graph viewing
- Self-hosted backend API and graph-native storage in Neo4j
- Rule-based auto-linking using tags, domains, groups, title similarity, and context similarity
- Basic filtering, node inspection, and node actions from graph view

### Out of scope for MVP

- Bidirectional sync from backend changes back into Chrome state
- Cross-browser support beyond Chrome-based browsers
- Full-page content crawling for all tabs automatically
- Advanced AI inference or autonomous categorization beyond simple enrichment helpers

## 7. Product Architecture

The system consists of three main layers: the Chrome Extension, the Backend API, and the Neo4j graph database.

| Layer | Component | Responsibility | Notes |
|---|---|---|---|
| Client | Chrome Extension | Capture tabs, groups, bookmarks; accept context input; render graph UI | Manifest V3 |
| Service | Backend API | Authentication, sync, edge generation, graph queries, audit logging | NestJS or Fastify |
| Data | Neo4j | Persist nodes and relationships; support graph traversal and related-resource queries | Self-hosted |
| UI | Side panel / graph page | Interactive graph exploration, filtering, node actions | React-based |

## 8. Functional Requirements

### 8.1 Capture browser entities

- The extension shall read open tabs and their metadata, including title, URL, window ID, and group ID.
- The extension shall read tab groups, including title, color, and collapsed state when available.
- The extension shall traverse the bookmark tree and ingest bookmark items and relevant folder hierarchy metadata.
- The extension shall normalize URLs to reduce duplication across tabs and bookmarks.

### 8.2 Save context

- A user shall be able to save the current tab with note, tags, and optional selected text.
- The extension shall support quick-save from popup and richer save/edit from side panel.
- The system shall preserve the reason a resource was saved as node metadata.

### 8.3 Build graph relationships

- The backend shall create structural relationships such as `IN_GROUP`, `ON_DOMAIN`, and `CONTAINS`.
- The backend shall create inferred relationships such as `RELATED` and `DUPLICATE_OF` using rule-based scoring.
- Every inferred relationship shall store an explanation field such as the matched tag, domain, or score reason.

### 8.4 Visualize and interact

- The side panel shall show a graph focused on the current tab or a selected node.
- Users shall be able to filter by tag, domain, session, group, or node type.
- Selecting a node shall show metadata and available actions such as open URL or inspect related items.

### 8.5 Synchronization

- The system shall use incremental sync rather than full rewrite.
- The extension shall maintain local mapping and retry queues to support resilience.
- The backend shall support idempotent upserts for nodes and deterministic edge generation.

## 9. Non-Functional Requirements

| Area | Requirement | Rationale |
|---|---|---|
| Performance | Default graph loads in under 1 second for 200 nodes | Graph UI must feel interactive |
| Reliability | Queued retry for transient failures | Protect against API or network interruptions |
| Security | Token-based auth and secure local storage handling | Protect user data and backend access |
| Scalability | Schema and API support future semantic edges and more node types | Avoid re-architecture after MVP |
| Maintainability | Clear module boundaries between extension, API, and graph logic | Speeds up iteration and debugging |

## 10. Graph Data Model

The data model is intentionally graph-native. Resource entities are stored as nodes; structure and inference are stored as relationships.

### 10.1 Core node labels

| Node label | Key properties | Description |
|---|---|---|
| Tab | `id`, `url`, `normalizedUrl`, `title`, `status`, `createdAt`, `lastSeenAt` | Represents an open or saved browser tab |
| Bookmark | `id`, `url`, `normalizedUrl`, `title`, `folderPath`, `createdAt` | Represents a bookmark item |
| TabGroup | `id`, `title`, `color`, `windowId` | Represents a browser tab group |
| Tag | `id`, `name`, `slug` | Represents a user or system tag |
| Domain | `id`, `host`, `normalizedHost` | Represents a website domain |
| Session | `id`, `name`, `startedAt`, `endedAt` | Represents a browsing session |

### 10.2 Core relationships

| Relationship | From -> To | Purpose | Attributes |
|---|---|---|---|
| `IN_GROUP` | Tab -> TabGroup | Structural grouping of tabs | `createdAt` |
| `TAGGED_WITH` | Tab/Bookmark -> Tag | User or system classification | `source` |
| `ON_DOMAIN` | Tab/Bookmark -> Domain | Domain-based aggregation | `createdAt` |
| `CONTAINS` | Session -> Tab | Session membership | `position`, `createdAt` |
| `RELATED` | Tab/Bookmark -> Tab/Bookmark | Inferred relevance between resources | `score`, `reason`, `createdAt` |
| `DUPLICATE_OF` | Tab/Bookmark -> Tab/Bookmark | Duplicate or canonicalization relationship | `confidence` |

## 11. Auto-Linking Rules

The first release uses explainable rules instead of opaque AI-only linking.

Initial scoring formula:

```text
score = tag*5 + domain*2 + group*3 + title*3 + context*6
```

The backend should create a `RELATED` edge only when the total score meets or exceeds a configurable threshold, initially set to `7`.

### Initial signals

| Signal | Base weight | Example | Edge type |
|---|---|---|---|
| Same tag | 5 | Both nodes tagged `research` | `RELATED` |
| Same domain | 2 | Same normalized host | `RELATED` |
| Same tab group | 3 | Tabs in one active group | `RELATED` |
| Title similarity | 3 | Similar page titles after normalization | `RELATED` |
| Context similarity | 6 | Notes share strong keyword overlap | `RELATED` |

## 12. Extension Requirements

| Module | Requirement | Notes |
|---|---|---|
| Background service worker | Capture events and orchestrate sync | Handles tabs, bookmarks, batching, retries |
| Popup | Quick save and sync actions | Fast capture flow |
| Side panel | Graph view and context editor | Primary exploration surface |
| Content script | Optional selected-text extraction | Only when needed |
| Options page | Configure backend URL, auth, and preferences | Required for self-host setup |

## 13. Backend API Requirements

The backend provides authenticated endpoints for synchronization, querying, and graph operations.

| Endpoint group | Example operations | Purpose |
|---|---|---|
| Auth | Issue/verify API key or session token | Secure extension-to-backend access |
| Nodes | Upsert node, update context, list node detail | Persist graph entities |
| Edges | Generate inferred edges, inspect relationships | Persist and explain graph connections |
| Graph query | Neighborhood query, filtered subgraph query | Serve graph UI efficiently |
| Diagnostics | Health, sync status, queue status | Support operations and debugging |

## 14. Security and Privacy

- The extension shall store only the minimum credentials needed for backend access.
- Sensitive credentials shall not be embedded in source code.
- The backend shall authenticate every write request.
- The system shall avoid automatic full-page scraping by default to reduce privacy risk.
- Context capture should be explicit and user-driven for selected text and notes.

## 15. Deployment and Operations

### Recommended deployment targets

- Local development: Dockerized backend + Neo4j Community Edition
- Initial production self-hosting: VPS or container platform running backend and Neo4j
- Operational basics: backups, logs, and environment-based configuration

## 16. MVP Roadmap

| Phase | Theme | Deliverables | Outcome |
|---|---|---|---|
| 1 | Core capture | Tabs, groups, bookmarks, backend sync, base graph view | Usable MVP |
| 2 | Context and rules | Notes, tags, selected text, rule-based linking | Knowledge graph becomes meaningful |
| 3 | Exploration | Filtering, node detail, session browsing, diagnostics | Graph becomes actionable |
| 4 | Intelligence | Recommendations and semantic enrichment | Differentiated product value |

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate nodes due to poor URL normalization | Graph quality degrades | Establish canonical normalization and identity strategy |
| High event noise from browser updates | Excessive writes and UI churn | Use debounce, batching, and idempotent upserts |
| Large, cluttered graph views | Poor usability | Apply default filters, clustering, and neighborhood limits |
| Weak explainability of inferred links | Low user trust | Store rule-based reasons and scores on edges |
| Sync failures during offline periods | Data loss or delayed state | Add retry queue and local persistence |

## 18. Acceptance Criteria for MVP

- A user can save the current tab with at least one note or tag and see it appear as a node in the graph.
- Tabs and tab groups are synchronized to the backend and represented with correct structural relationships.
- Bookmarks are ingested and linked to domains and tags where applicable.
- The graph view can load a focused neighborhood of at least 200 nodes within target performance bounds.
- At least one rule-based inferred relationship can be inspected with score and reason.

## 19. Open Questions

- Should sessions be automatic only, or also user-created and named?
- Should bookmark folders become first-class nodes in later versions?
- What level of offline support is required for capture before sync?
- When should semantic or AI-driven linking be introduced after MVP?

## 20. Recommendation

Proceed with a graph-native MVP using Chrome Extension + Backend API + Neo4j. This architecture is a better long-term fit than a Notion-backed approach because the product's main value is relationship modeling and graph exploration, not page-based content storage.
