# BrowseGraph Stitch Redesign Plan

## Current Stitch Project Baseline

**Project:** `projects/17168455184059337812`  
**Title:** `BrowseGraph Interface Redesign`

### Current screens
1. `projects/17168455184059337812/screens/457f9233281546979e7319576218487d` — **Auth: Ignition Sequence**
2. `projects/17168455184059337812/screens/2691f6a205484d0d9fe0e9f4d5ce2385` — **The Explorer: Deep Work Environment**
3. `projects/17168455184059337812/screens/7bfa7a19cdf74bd2a39519c0afb5eddc` — **Extension: Local Graph Side-Panel**
4. `projects/17168455184059337812/screens/32a5c16b06f0456cb2f82b8237f5b146` — **Extension: Context Capture**
5. `projects/17168455184059337812/screens/d398fd2b89c54783b8fb6b7438ab3174` — **BrowseGraph Redesign Strategy**

## Phase Table

| Phase | Owner | Outcome |
| --- | --- | --- |
| 1 | `gemini` | Finalize the redesign foundation: design system alignment and a stronger auth/on-ramp screen |
| 2 | `gemini` | Redesign the primary deep-work explorer around graph clarity, density, and workflow simplicity |
| 3 | `gemini` | Redesign the extension companion surfaces so they match the web app while fitting side-panel constraints |
| 4 | `claude` | Review the updated Stitch project, confirm phase acceptance, and prepare execution follow-up |

### Phase 1: Redesign foundation and entry flow

**Owner:** `gemini`

**Goal:** Establish the visual and UX foundation for the redesign by aligning the Stitch design system and rebuilding the auth entry point around the intended industrial dark/green direction.

**Files:**
- Modify: `assets/07c7e1880bdd4e95822330eb248d4382` (design system instance in project `17168455184059337812`)
- Modify: `projects/17168455184059337812/screens/457f9233281546979e7319576218487d`
- Reference: `projects/17168455184059337812/screens/d398fd2b89c54783b8fb6b7438ab3174`

**Tasks:**
1. Use Stitch MCP to fetch detailed screen and design-system data for the current auth screen and redesign strategy artifact before making edits.
2. Tighten the design system around the approved direction: industrial dark surfaces, controlled green accents, dense readable typography, sharp geometry, and consistent component states.
3. Redesign the auth screen so it feels like a premium technical entry point, with clearer hierarchy, API-key onboarding, trust cues, and better empty/loading/error state treatment.
4. Ensure the auth screen establishes reusable patterns for buttons, fields, panels, and status messaging that later phases can inherit.

**Acceptance Criteria:**
- The design system and auth screen clearly reflect the intended industrial dark/green BrowseGraph identity.
- The auth flow is more legible and polished than the current baseline without drifting into generic SaaS styling.
- Component primitives introduced here can be reused in the explorer and extension surfaces.

**Reviewer Checklist:**
- Auth still reads as API-key access to a private graph explorer, not a generic login flow.
- The screen emphasizes clarity and confidence without adding unrelated product concepts.
- Visual changes improve polish and usability while staying dense and technical.

**Integration Checks:**
- `Use Stitch MCP to inspect the updated design system asset and auth screen in project 17168455184059337812.`
- `Visually confirm the auth screen uses the same core tokens and component language intended for later screens.`

### Phase 2: Redesign the web explorer deep-work environment

**Owner:** `gemini`

**Goal:** Rebuild the primary explorer screen into a graph-first deep-work environment with stronger information hierarchy, denser utility, and clearer interaction flow.

**Files:**
- Modify: `projects/17168455184059337812/screens/2691f6a205484d0d9fe0e9f4d5ce2385`
- Reference: `projects/17168455184059337812/screens/457f9233281546979e7319576218487d`
- Reference: `projects/17168455184059337812/screens/d398fd2b89c54783b8fb6b7438ab3174`

**Tasks:**
1. Use Stitch MCP to fetch detailed data for the current explorer screen before redesigning it.
2. Redesign the overall explorer layout so graph clarity remains primary while search, filters, node detail, and secondary controls are easier to scan and use.
3. Improve the graph canvas treatment, panel hierarchy, selection states, action affordances, and density rules so the screen feels powerful rather than cluttered.
4. Add concrete UX improvements for loading, empty, error, and “selected node” states without changing the product’s graph-first identity.

**Acceptance Criteria:**
- The explorer is clearly the primary deep-work surface.
- The graph canvas remains central, but supporting controls are more readable and better prioritized.
- The redesigned screen shows stronger visual hierarchy and denser utility without reducing usability.

**Reviewer Checklist:**
- Search, filter, inspect, recenter, and expand actions are easy to discover and feel integrated into one workflow.
- Node detail treatment supports inspection without visually competing with the graph.
- The explorer feels like a technical instrument, not a general dashboard.

**Integration Checks:**
- `Use Stitch MCP to inspect the updated explorer screen in project 17168455184059337812.`
- `Compare the updated explorer against the auth screen and confirm shared visual language, component styling, and density rules.`

### Phase 3: Redesign the extension companion surfaces

**Owner:** `gemini`

**Goal:** Redesign the extension side-panel screens so they feel like a compact companion to the explorer while remaining optimized for constrained width and quick browser-context tasks.

**Files:**
- Modify: `projects/17168455184059337812/screens/7bfa7a19cdf74bd2a39519c0afb5eddc`
- Modify: `projects/17168455184059337812/screens/32a5c16b06f0456cb2f82b8237f5b146`
- Reference: `projects/17168455184059337812/screens/2691f6a205484d0d9fe0e9f4d5ce2385`

**Tasks:**
1. Use Stitch MCP to fetch detailed data for both extension screens before editing them.
2. Redesign the Local Graph side-panel so graph interaction, quick inspection, and compact controls work within narrow space without feeling cramped.
3. Redesign the Context Capture surface so capture/editing workflows feel fast, structured, and visually consistent with the broader system.
4. Harmonize navigation, panel treatment, metadata presentation, and action hierarchy across the extension so it reads as the web explorer’s companion product.

**Acceptance Criteria:**
- Both extension screens clearly belong to the same product family as the web explorer.
- The side-panel layouts respect constrained space while remaining dense and usable.
- The extension feels optimized for quick context work rather than a shrunk desktop screen.

**Reviewer Checklist:**
- Graph and context workflows are distinct but visually coherent.
- Compact layouts avoid decorative density that harms scanability.
- Important actions stay obvious in narrow-width UI.

**Integration Checks:**
- `Use Stitch MCP to inspect both updated extension screens in project 17168455184059337812.`
- `Visually compare extension screens with the explorer screen and confirm cross-surface consistency.`

### Phase 4: Review, reconcile, and prepare implementation follow-up

**Owner:** `claude`

**Goal:** Verify the redesigned Stitch project satisfies the redesign brief and produce a ready-to-execute handoff for implementation against the codebase.

**Files:**
- Reference: `projects/17168455184059337812`
- Reference: `projects/17168455184059337812/screens/457f9233281546979e7319576218487d`
- Reference: `projects/17168455184059337812/screens/2691f6a205484d0d9fe0e9f4d5ce2385`
- Reference: `projects/17168455184059337812/screens/7bfa7a19cdf74bd2a39519c0afb5eddc`
- Reference: `projects/17168455184059337812/screens/32a5c16b06f0456cb2f82b8237f5b146`

**Tasks:**
1. Review each updated screen against the redesign goals: graph clarity, information density, workflow simplicity, and visual polish.
2. Confirm the auth, explorer, and extension surfaces are consistent in tokens, component language, and product identity.
3. Note any remaining gaps or follow-up design debt before implementation begins.
4. Prepare the next implementation plan so execution can map the approved Stitch designs back into the repo UI surfaces.

**Acceptance Criteria:**
- The redesigned project can serve as the approved visual baseline for code implementation.
- Remaining issues, if any, are explicit and bounded.
- The implementation handoff can proceed screen by screen without re-litigating the design direction.

**Reviewer Checklist:**
- Every redesign goal is visibly addressed across the set, not just in one screen.
- The output still reads as BrowseGraph rather than a generic dark data tool.
- The redesign is concrete enough to drive frontend implementation decisions.

**Integration Checks:**
- `Use Stitch MCP get_project and get_screen to verify the final project state and updated screens.`
- `Confirm the final approved screens cover auth, explorer, extension graph, and extension context surfaces.`

## Routing Notes

- `gemini` is the correct owner for Phases 1-3 because these are UI-heavy visual redesign phases.
- During execution, Gemini should use Stitch MCP directly to fetch detailed screen context before editing each baseline screen.
- Because Phases 1-3 all touch the same product and overlapping design system, prefer continuing the same Gemini session across phases unless the session becomes unavailable.

## Final Integration

Run only after all phases pass:
1. Re-check `projects/17168455184059337812` and confirm the design system plus all target screens are updated and internally consistent.
2. Freeze the approved screen list and map each approved Stitch screen to its code implementation target in `web/src` and `extension/src/pages/sidepanel`.
3. Start a separate implementation plan for code execution, using the approved Stitch project as the design source of truth.
