# Standalone Graph Explorer Design

## Summary

Build a standalone, single-user, read-only graph explorer served by the existing NestJS/Fastify backend. The app uses API-key entry in the UI, lands on a graph-first canvas, and loads a recent seed graph so the first screen is immediately useful.

## Product Shape

The explorer is a normal web app route served from the existing backend deployment. It is private to the self-hosted user and uses the current Bearer API key model. The user pastes an API key into the UI, the app validates it, stores it locally in the browser for convenience, and then opens the main explorer.

The app is optimized for graph exploration first, not administration, editing, or ingestion. It is read-only in this first version.

## Architecture

The web app should be embedded into the existing backend rather than deployed as a separate frontend service. This keeps the MVP deployment simple: one backend service, one Neo4j instance, one URL, and one authentication model.

The app has two top-level states:

1. **Auth screen** — single API key input, connect action, inline validation feedback.
2. **Explorer shell** — graph-first application layout for navigation and inspection.

The explorer shell uses a three-pane structure:

- **Left sidebar** for search and filters
- **Center canvas** for the graph visualization
- **Right detail panel** for the selected node

This layout keeps the graph visible during all exploration actions and supports iterative traversal without navigation between pages.

## Initial Experience

After successful API key entry, the app should load a **recent seed graph** so the screen is never empty. The initial graph should be sourced from recent sessions or recently created nodes and returned in the same general graph payload shape used by existing graph APIs.

This avoids forcing the user to search before they can see anything. From that seed graph, the user can click nodes, inspect details, recenter the graph, and expand local neighborhoods.

## Backend Surface

The explorer should reuse the current backend APIs wherever possible.

Existing graph and node APIs already support most of the needed interactions:

- neighborhood traversal
- filtered subgraph loading
- node detail lookup

The main backend addition should be a small web-oriented endpoint such as:

- `GET /api/v1/web/seed`

This endpoint should return a starter graph payload for first load, based on recent sessions or recent nodes.

A lightweight search endpoint may also be added if the current API surface does not already support efficient searching by:

- title
- URL
- tag
- domain

All web requests should continue using:

- `Authorization: Bearer <api-key>`

No session cookies, refresh tokens, or server-side login state are needed for this MVP.

## Frontend Data Flow

The frontend data flow should be simple and local-state driven.

1. User enters API key.
2. Client validates the key with a protected request.
3. Client fetches the seed graph.
4. User explores via click, search, filter, recenter, and expand actions.

Key interactions:

- **Search** finds matching nodes and helps the user jump into the graph.
- **Filters** narrow visible data by dimensions such as tag, domain, type, or session.
- **Node click** updates the right-side detail panel.
- **Expand/recenter** requests a neighborhood graph around the selected node.

Because the app is read-only, every action should lead back into traversal or inspection rather than mutation.

## Frontend Components

A minimal component set is sufficient for the MVP:

- `AuthScreen`
- `ExplorerShell`
- `TopBar`
- `SearchPanel`
- `FilterPanel`
- `GraphCanvas`
- `NodeDetailPanel`

The shell should own:

- stored API key
- selected node
- active filters
- graph payload
- loading states
- error states

React local state is enough for this version. A heavier client state solution is unnecessary unless the app grows substantially.

## UX States

The app should preserve continuity while exploring.

- Clicking a node should keep the graph visible and update the detail panel in place.
- Expanding from a node should use inline loading rather than blanking the page.
- Search should support fast jumping into the graph.
- Filters should refine the graph without forcing the user through modal workflows.

The following explicit states should be designed:

- invalid API key
- backend unavailable
- no seed data yet
- no search results
- graph request failure

Each state should have clear, specific messaging.

## Verification

Verification should cover backend, frontend, and manual flows.

### Backend checks

- Seed graph endpoint returns a valid graph payload
- Search endpoint returns expected matches
- Protected routes reject invalid API keys

### Frontend checks

- API key entry and persistence
- Seed graph load after sign-in
- Node selection updates detail panel
- Expand/recenter actions request and render new graph data
- Error states render correct messages

### Manual verification

- Enter API key
- Load recent seed graph
- Select a node
- Inspect node details
- Expand neighborhood
- Apply a filter
- Search for a node and recenter
- Recover from invalid key or failed request

## Scope Boundaries

Out of scope for this MVP:

- editing notes, tags, or node context
- sync controls or ingestion tools
- multi-user auth
- public access
- bidirectional sync back into Chrome
- advanced AI/semantic features

## Recommendation

Proceed with an embedded web app served by the existing backend, using the existing API-key auth model and a graph-first explorer shell. This is the fastest path to a useful standalone graph explorer while minimizing new deployment and auth complexity.
