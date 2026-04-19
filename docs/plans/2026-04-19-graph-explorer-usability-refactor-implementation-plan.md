# Graph Explorer Usability Refactor Implementation Plan

**Source of truth:** `docs/plans/2026-04-19-graph-explorer-usability-refactor-design.md`  
**Date:** 2026-04-19

---

## Phase Table

| Phase | Owner | Outcome |
| --- | --- | --- |
| 1 | `gemini` | Refocus the explorer shell into a clearer control → canvas → inspector layout with lightweight status and legend support |
| 2 | `gemini` | Improve graph readability through stronger display labels, visual hierarchy, and quieter peripheral nodes and edges |
| 3 | `codex` | Make search, filters, recenter, expand, and loading states preserve orientation and feel reversible |
| 4 | `claude` | Run final verification against the approved usability refactor and capture any bounded follow-up debt |

---

## Phase Details

### Phase 1: Shell hierarchy and focused workspace

**Owner:** `gemini`

**Goal:** Rework the web explorer shell so the graph remains dominant while the surrounding controls and inspector become clearer, denser, and easier to scan.

**Files:**
- Modify: `web/src/components/ExplorerShell.tsx`
- Modify: `web/src/components/TopBar.tsx`
- Modify: `web/src/components/SearchPanel.tsx`
- Modify: `web/src/components/FilterPanel.tsx`
- Modify: `web/src/components/NodeDetailPanel.tsx`
- Modify: `web/src/styles.css`

**Tasks:**
1. Restructure `ExplorerShell.tsx` and `web/src/styles.css` around a clearer control → canvas → inspector layout with the graph canvas as the dominant surface.
2. Tighten the left-side command area so search, high-value filters, and a lightweight legend/status treatment read as one navigation workflow instead of separate competing panels.
3. Refine `TopBar.tsx` and `NodeDetailPanel.tsx` so shell metrics, focus cues, and node inspection hierarchy support the new graph-first layout.
4. Keep the scope limited to the web explorer shell and preserve current read-only explorer behavior.

**Acceptance Criteria:**
- The graph canvas is visually dominant and easier to distinguish from controls and inspection surfaces.
- The left side behaves like a compact command area rather than a second content column.
- The right panel behaves like an inspector with readable node summary first and raw metadata second.
- The redesign preserves the current web explorer API and read-only product model.

**Reviewer Checklist:**
- The explorer still feels graph-first, not form-first.
- Search and filter controls are easier to scan without expanding the overall UI complexity.
- The right inspector does not visually compete with the graph canvas.
- No write/edit actions are added to the web explorer.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: verify the shell hierarchy is clear at desktop width and remains readable at narrower widths.

**Routing Notes:**
- Use `gemini` because this phase is dominated by layout, hierarchy, and styling changes.

---

### Phase 2: Graph readability and progressive exploration

**Owner:** `gemini`

**Goal:** Make the graph itself easier to understand by default through stronger node labeling, clearer type cues, quieter secondary context, and a more focused exploration presentation.

**Files:**
- Modify: `web/src/components/ExplorerShell.tsx`
- Modify: `web/src/components/GraphCanvas.tsx`
- Modify: `web/src/components/NodeDetailPanel.tsx`
- Modify: `web/src/components/EmptyState.tsx`
- Modify: `web/src/components/ErrorBanner.tsx`
- Modify: `web/src/styles.css`

**Tasks:**
1. Update `GraphCanvas.tsx` to compute one strong display label per node type and use clearer visual hierarchy for focal, selected, first-ring, and peripheral nodes.
2. Adjust node and edge styling so default context becomes quieter while focal/selected paths and important types remain easy to parse.
3. Refine `ExplorerShell.tsx` and `NodeDetailPanel.tsx` so the current focus, graph depth, and selected-node context are more obvious without crowding the canvas.
4. Keep progressive exploration tied to existing recenter/expand behavior rather than inventing a new graph model.

**Acceptance Criteria:**
- The default graph is easier to scan because node meaning is clearer and visual noise is reduced.
- Raw IDs and long metadata no longer dominate the canvas when better labels exist.
- Selected and focal nodes are obvious at a glance.
- The redesign preserves the current fetch/search/recenter/expand data flow.

**Reviewer Checklist:**
- Label choices prefer human-readable titles, hosts, and names over raw identifiers.
- Visual hierarchy helps interpretation without hiding too much useful context.
- Edge emphasis supports navigation rather than adding extra visual clutter.
- The implementation stays within the current graph interaction model.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: load a seed graph, select a node, recenter, and expand to confirm the graph remains readable as context grows.

**Routing Notes:**
- Use `gemini` because this phase is primarily graph presentation, labeling, and visual hierarchy work.

---

### Phase 3: Orientation-preserving interactions and state behavior

**Owner:** `codex`

**Goal:** Make search, filtering, recentering, expansion, and loading/error handling feel predictable, scoped, and reversible so the user keeps context while exploring.

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/ExplorerShell.tsx`
- Modify: `web/src/components/SearchPanel.tsx`
- Modify: `web/src/components/FilterPanel.tsx`
- Modify: `web/src/components/EmptyState.tsx`
- Modify: `web/src/components/ErrorBanner.tsx`
- Modify: `web/src/styles.css`

**Tasks:**
1. Refine `SearchPanel.tsx` and `ExplorerShell.tsx` so search behaves like a focused navigation action instead of a competing secondary view.
2. Refine `FilterPanel.tsx` and related shell state so filters feel scoped, reversible, and clearly attributed when they change the graph.
3. Update loading, empty, and error states so the current canvas stays visible whenever possible and feedback appears near the action that triggered it.
4. Keep changes targeted to state flow and interaction confidence rather than reopening the visual direction from earlier phases.

**Acceptance Criteria:**
- Search, filters, recenter, and expand have clearer mental boundaries and are easier to distinguish from one another.
- Loading and no-result states preserve orientation instead of visually resetting the whole explorer.
- Errors are easier to attribute to the control that caused them.
- The implementation remains within the existing web explorer scope and contracts.

**Reviewer Checklist:**
- Interaction changes feel more predictable without adding new product concepts.
- State handling improvements are targeted and do not drift into unrelated refactors.
- The graph stays visible during in-place updates when possible.
- Reversibility and active-state feedback are explicit to the user.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: search for a node, apply and clear filters, trigger a no-results case, recenter, and expand while confirming orientation is preserved.

---

### Phase 4: Final implementation review and acceptance

**Owner:** `claude`

**Goal:** Verify the web explorer usability refactor matches the approved design and remains shippable after build and manual review.

**Files:**
- No planned file creation; only minimal fixes if verification exposes a blocking issue

**Tasks:**
1. Run the required web integration checks and confirm the refactor is stable at the repo level.
2. Manually review the implemented explorer against the approved design sections: focused graph model, clearer layout, stronger node readability, and orientation-preserving states.
3. Confirm the implementation preserved the existing read-only web explorer model and did not drift into extension or backend scope.
4. Record any explicit non-blocking debt discovered during acceptance.

**Acceptance Criteria:**
- The implementation clearly reflects the approved graph usability refactor across shell layout, graph readability, and interaction states.
- Web typecheck and build succeed without blocking errors.
- Manual verification covers the critical explorer flows end to end.
- Any remaining issues are explicit and bounded as follow-up debt.

**Reviewer Checklist:**
- The graph is easier to read and less overwhelming by default.
- The control, canvas, and inspector hierarchy matches the approved direction.
- Search, filter, recenter, and expand preserve orientation better than before.
- No new product scope was introduced outside the web explorer.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: run the web explorer, sign in, load a graph, inspect a node, search, filter, recenter, expand, and verify empty/error states.

**Routing Notes:**
- Use `claude` for final acceptance, coordination, and any bounded review follow-up.

---

## Final Integration

Run only after all phases above pass.

1. Run the final web integration checks:
   - `rtk npm --workspace web run typecheck`
   - `rtk npm --workspace web run build`
2. Start the web explorer and verify the critical usability flows:
   - initial sign-in and seed graph load
   - focused graph readability on first view
   - node selection and inspection
   - search-driven navigation
   - filter application and clear/reset behavior
   - recenter and expand behavior
   - inline loading, empty, and error states
3. Confirm the graph remains the primary work surface and the redesign did not spill into extension scope.
4. Record any non-blocking implementation debt before release or follow-on work.
