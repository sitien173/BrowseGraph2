# BrowseGraph Stitch Redesign Implementation Plan

**Source of truth:** Approved Stitch redesign in `projects/17168455184059337812`  
**Date:** 2026-04-19

---

## Phase Table

| Phase | Owner | Outcome |
| --- | --- | --- |
| 1 | `gemini` | Implement the industrial dark/green web foundation and auth entry screen in code |
| 2 | `gemini` | Rebuild the web explorer into the approved graph-first deep-work environment |
| 3 | `gemini` | Redesign the extension graph and context side-panel surfaces to match the approved companion UI |
| 4 | `codex` | Harden UI states, align shared behaviors, and verify build/typecheck coverage for the redesigned surfaces |
| 5 | `claude` | Run final integration review against the approved Stitch baseline and capture remaining implementation debt |

---

## Phase Details

### Phase 1: Web design foundation and auth entry implementation

**Owner:** `gemini`

**Goal:** Translate the approved auth screen and core visual language into the web app so BrowseGraph enters through a dense, technical, API-key-gated interface rather than the current light themed shell.

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/AuthScreen.tsx`
- Modify: `web/src/styles.css`
- Modify: `web/src/components/TopBar.tsx`

**Tasks:**
1. Replace the current light web theme in `web/src/styles.css` with the approved industrial dark/green token system, including reusable surface, type, control, and status styling primitives.
2. Rebuild `web/src/components/AuthScreen.tsx` so it matches the approved Stitch auth direction: strong product identity, API-key onboarding, local-storage trust cues, technical status treatment, and sharper component geometry.
3. Update the stored-key checking state in `web/src/App.tsx` so the loading/on-ramp experience uses the same visual language as the approved auth screen rather than the current minimal placeholder card.
4. Adjust `web/src/components/TopBar.tsx` only where needed so the shell-level brand and controls inherit the same visual system introduced by the auth screen.

**Acceptance Criteria:**
- The web app no longer uses the current warm/light palette and instead reflects the approved dark industrial BrowseGraph identity.
- Auth still clearly reads as Bearer API key access to a private graph explorer, not a generic login page.
- Stored-key loading, auth errors, and submit states use the same component language as the main auth screen.
- The primitives introduced here are reusable by the explorer phase without a second styling reset.

**Reviewer Checklist:**
- Auth copy still emphasizes API key entry and browser-local storage behavior.
- The redesign does not change auth flow logic or add new auth concepts.
- Visual hierarchy feels technical and dense without becoming hard to read.
- Top bar changes stay within the approved redesign language and do not preempt explorer layout work.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: run the web app, verify stored-key loading, empty API key validation, invalid key state, and submitting state all render with the redesigned auth UI.

**Routing Notes:**
- Use `gemini` because this phase is dominated by visual design-system translation, layout, and component styling.

---

### Phase 2: Web explorer deep-work environment implementation

**Owner:** `gemini`

**Goal:** Rebuild the standalone web explorer so the graph canvas is the primary working surface and the surrounding controls match the approved technical instrument UI from Stitch.

**Files:**
- Modify: `web/src/components/ExplorerShell.tsx`
- Modify: `web/src/components/TopBar.tsx`
- Modify: `web/src/components/GraphCanvas.tsx`
- Modify: `web/src/components/SearchPanel.tsx`
- Modify: `web/src/components/FilterPanel.tsx`
- Modify: `web/src/components/NodeDetailPanel.tsx`
- Modify: `web/src/components/EmptyState.tsx`
- Modify: `web/src/components/ErrorBanner.tsx`
- Modify: `web/src/styles.css`

**Tasks:**
1. Restructure `web/src/components/ExplorerShell.tsx` and `web/src/styles.css` so the explorer matches the approved graph-first layout, including stronger hierarchy between navigation/search, canvas, and inspection surfaces.
2. Restyle and refine `GraphCanvas`, `TopBar`, `SearchPanel`, and `FilterPanel` so graph navigation, search, filters, zoom/recenter depth controls, and primary actions feel like one cohesive workflow.
3. Rework `NodeDetailPanel`, `EmptyState`, and `ErrorBanner` so selected-node inspection, inline failures, and empty/loading states match the approved dense technical treatment without replacing the shell.
4. Preserve the current read-only graph behavior and existing API contracts while updating the UI to the approved Stitch design.

**Acceptance Criteria:**
- The explorer visually matches the approved dark graph-instrument direction and clearly centers the canvas as the primary work area.
- Search, filter, inspect, refresh, recenter, and expand controls are easier to scan and feel integrated into one workflow.
- Empty, loading, and error states render inline within the redesigned shell rather than breaking the screen structure.
- The implementation preserves current graph interactions and data flow instead of inventing a new exploration model.

**Reviewer Checklist:**
- The graph remains visually dominant over secondary controls.
- The right-side detail treatment supports inspection without competing with the canvas.
- No write/edit actions are introduced into the web explorer.
- Existing fetch/search/filter/recenter/expand behaviors still map cleanly to the rendered controls.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- Manual: run the web app, sign in, load the seed graph, select a node, recenter, expand depth, run a search, and apply at least one filter in the redesigned UI.

**Routing Notes:**
- Use `gemini` because this phase is UI-heavy and centered on layout, styling, graph presentation, and interaction affordances.

---

### Phase 3: Extension companion surface implementation

**Owner:** `gemini`

**Goal:** Implement the approved extension redesign so the graph and context tabs feel like compact companions to the web explorer rather than a separate light-themed tool.

**Files:**
- Modify: `extension/src/pages/sidepanel/SidePanel.tsx`
- Modify: `extension/src/pages/sidepanel/GraphView.tsx`
- Modify: `extension/src/pages/sidepanel/GraphFilters.tsx`
- Modify: `extension/src/pages/sidepanel/NodeDetail.tsx`
- Modify: `extension/src/pages/sidepanel/ContextEditor.tsx`
- Modify: `extension/src/pages/sidepanel/styles.css`
- Modify: `extension/src/pages/sidepanel/index.tsx`

**Tasks:**
1. Replace the current light sidepanel styling with the approved dark industrial extension system, including compact spacing, dense typography, and companion-surface panel treatments.
2. Rebuild `SidePanel.tsx`, `GraphView.tsx`, `GraphFilters.tsx`, and `NodeDetail.tsx` so the graph tab matches the approved narrow-width graph companion workflow and control hierarchy.
3. Rework `ContextEditor.tsx` so current-tab metadata, notes, tags, selected text, save reason, and status feedback match the approved capture/editing design in the same visual language.
4. Keep the existing extension flows and service integrations intact while updating layout, styling, and action prominence to reflect the approved Stitch screens.

**Acceptance Criteria:**
- The extension no longer uses the current light serif/gray styling and instead shares the same product identity as the redesigned web explorer.
- Graph and context tabs are visually coherent but remain clearly distinct workflows optimized for narrow side-panel width.
- Important actions remain obvious and usable in constrained space.
- Existing graph loading, node inspection, and context save flows still function through the redesign.

**Reviewer Checklist:**
- The extension feels like a companion product, not a shrunk copy of the desktop explorer.
- Narrow-width layout decisions improve scanability rather than compressing everything into clutter.
- Node detail and filter affordances stay usable without obscuring the graph.
- Context editing states remain explicit for loading, saving, saved, and failure conditions.

**Integration Checks:**
- `rtk npm --workspace extension run typecheck`
- `rtk npm --workspace extension run build`
- Manual: load the sidepanel, verify graph tab rendering, open node detail, adjust filters, switch to context tab, and save context through the redesigned UI.

**Routing Notes:**
- Use `gemini` because this phase is again dominated by UI-heavy narrow-layout redesign work.

---

### Phase 4: Shared behavior hardening and build verification

**Owner:** `codex`

**Goal:** Clean up the redesigned surfaces so state handling, shared behavior, and repo-level build validation are solid before final acceptance.

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/AuthScreen.tsx`
- Modify: `web/src/components/ExplorerShell.tsx`
- Modify: `web/src/components/SearchPanel.tsx`
- Modify: `web/src/components/FilterPanel.tsx`
- Modify: `web/src/components/NodeDetailPanel.tsx`
- Modify: `extension/src/pages/sidepanel/GraphView.tsx`
- Modify: `extension/src/pages/sidepanel/NodeDetail.tsx`
- Modify: `extension/src/pages/sidepanel/ContextEditor.tsx`
- Modify: `web/src/styles.css`
- Modify: `extension/src/pages/sidepanel/styles.css`

**Tasks:**
1. Fix any state-management or rendering regressions exposed by the redesign, especially around loading overlays, empty states, auth errors, tab switching, and narrow-width overflow.
2. Align repeated behavior across the redesigned web and extension surfaces where the redesign relies on the same interaction expectations, without introducing a new abstraction layer.
3. Run the relevant workspace builds/typechecks and make the minimal code fixes needed for the redesigned UI to pass cleanly.
4. Keep the scope limited to hardening and verification; do not reopen the approved visual direction unless a blocking implementation gap requires it.

**Acceptance Criteria:**
- Web and extension redesign code passes the relevant typecheck/build commands.
- No blocking UI regressions remain in auth, explorer, extension graph, or extension context flows.
- Shared interaction expectations are coherent across surfaces without unnecessary refactoring.
- The final code remains within the approved redesign scope.

**Reviewer Checklist:**
- Fixes are targeted and do not drift into unrelated cleanup.
- Build-driven fixes do not water down the approved visual direction.
- Loading, saved, and error states remain explicit after hardening.
- The hardening phase does not change backend contracts or product behavior.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- `rtk npm --workspace extension run typecheck`
- `rtk npm --workspace extension run build`
- `rtk npm --workspace backend run build`

---

### Phase 5: Final implementation review and acceptance

**Owner:** `claude`

**Goal:** Verify the code implementation matches the approved Stitch redesign across web and extension surfaces and capture any bounded follow-up debt.

**Files:**
- No planned file creation; only minimal fixes if integration issues are found

**Tasks:**
1. Run the required build/typecheck commands and confirm the redesigned web and extension surfaces are shippable at the repo level.
2. Start the relevant local surfaces and manually verify the implemented auth, explorer, extension graph, and extension context screens against the approved Stitch direction.
3. Confirm the final code preserves the product identity and interaction model established during the Stitch redesign review.
4. Record any non-blocking follow-up debt discovered during implementation acceptance.

**Acceptance Criteria:**
- The code implementation clearly reflects the approved Stitch redesign across auth, explorer, and extension surfaces.
- Web and extension builds succeed without blocking errors.
- Manual verification covers the critical flows for both products.
- Any remaining issues are explicit and bounded as follow-up debt.

**Reviewer Checklist:**
- Auth still reads as API-key access to a private graph explorer.
- The explorer still feels graph-first and read-only.
- The extension still behaves like a compact companion rather than a separate product.
- No extra product scope was added during implementation.

**Integration Checks:**
- `rtk npm --workspace web run typecheck`
- `rtk npm --workspace web run build`
- `rtk npm --workspace extension run typecheck`
- `rtk npm --workspace extension run build`
- `rtk npm --workspace backend run build`
- Manual: run the web app and extension sidepanel, then verify the approved auth, explorer, graph, and context workflows end to end.

**Routing Notes:**
- Use `claude` for final integration review, acceptance, and tightly scoped coordination if a last blocking issue appears.

---

## Final Integration

Run only after all phases above pass.

1. Build the redesigned web app, extension, and backend using the repo scripts.
2. Start the local app surfaces needed to verify the redesign in-browser.
3. Verify the web app against the approved Stitch auth and explorer screens:
   - stored-key loading and auth entry
   - invalid key and submitting states
   - seed graph load
   - search, filter, node select, recenter, and expand flows
4. Verify the extension against the approved Stitch companion screens:
   - graph tab rendering and node inspection
   - filter interaction in narrow width
   - context metadata, note editing, tags, selected text, and save-state feedback
5. Record any non-blocking implementation debt separately before moving into release or follow-on work.
