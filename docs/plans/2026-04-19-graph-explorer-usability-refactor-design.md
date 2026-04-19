# Graph Explorer Usability Refactor Design

**Project:** BrowseGraph2  
**Date:** 2026-04-19

---

## Goal

Refactor the web explorer so the graph becomes usable for focused investigation instead of presenting an overwhelming force-directed dump. The redesign should reduce default graph overload, make node meaning legible at a glance, clarify the surrounding layout, and preserve user orientation during search, filtering, recentering, and expansion.

---

## 1. Graph interaction model

The explorer should behave like a current working set rather than a whole-graph viewer. On first load, the canvas should show a tighter neighborhood around a single focal node with a manageable first ring of related nodes. Expansion should be progressive and explicit: users inspect a node, recenter on it if it becomes the new focus, and expand only when they want one more layer of graph context.

The initial graph should be readable quickly. The user should be able to answer three questions immediately: what is the current focus, what kinds of things surround it, and what the next likely interaction is. The graph should preserve a graph-first feel, but the default experience should no longer try to reveal too much at once.

---

## 2. Layout and information hierarchy

The explorer shell should help the graph instead of competing with it. The layout should follow a clear control → canvas → inspector model:

- **Left rail:** compact command area with search, a small high-value filter set, and a lightweight legend.
- **Center canvas:** graph view, small status strip, and focus controls.
- **Right inspector:** readable node summary first, raw properties and metadata second.

Search results should behave like temporary navigation aids, not a second permanent data view. The center surface should remain the dominant visual area. The right panel should act as an inspector, not a second dashboard.

---

## 3. Node and edge readability

Node presentation should communicate meaning before the inspector opens. The focal node should always be the strongest visual element. First-ring neighbors should remain visible and readable. Peripheral nodes should become quieter, with labels shown selectively based on importance, selection, hover, or zoom level.

Each node type should expose one strong display label:

- **Tab:** prefer page title
- **Domain:** prefer normalized host
- **Tag:** prefer tag name
- **Session:** prefer short session label
- **Fallback:** use IDs only when nothing better exists

Long titles should truncate on the canvas, with the full value available on hover and in the inspector. Node type should be reinforced through multiple cues such as color, shape, badge, or ring treatment. Edges should also reflect hierarchy: default links muted, selected/focal relationships brighter, lower-value context quieter.

---

## 4. States, controls, and user confidence

The control model should make every graph action understandable and reversible. The user should always know whether the graph changed because of search, filtering, recentering, or expansion.

- **Search:** jump focus to a node, then get out of the way.
- **Expand:** explicitly reveal one more hop from the current focus.
- **Filters:** feel scoped and reversible, with visible active-filter summary and a one-click clear path.
- **Loading:** preserve the current canvas and use in-place status, not a full visual reset.
- **No-results / errors:** communicate near the control that caused them and preserve orientation whenever possible.

The explorer should communicate a stable mental model: there is always a current focus, each action either changes that focus or refines its neighborhood, and every change can be understood and reversed.

---

## Success criteria

The redesign is successful when:

1. The default graph load feels focused instead of overwhelming.
2. Users can tell what a node represents without reading raw metadata.
3. The graph remains the primary work surface while controls and inspection stay easy to reach.
4. Search, filter, recenter, and expand flows feel predictable and do not destroy orientation.
5. The implementation stays within the existing web explorer scope and preserves the current read-only product model.
