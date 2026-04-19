import { useState, type ReactElement } from "react";
import { ContextEditor } from "./ContextEditor";
import { GraphView } from "./GraphView";

type SidePanelTab = "editor" | "graph";

const TAB_META: Record<SidePanelTab, { label: string; description: string }> = {
  graph: {
    label: "Graph",
    description: "Explore neighborhood"
  },
  editor: {
    label: "Context",
    description: "Capture tab details"
  }
};

export function SidePanel(): ReactElement {
  const [activeTab, setActiveTab] = useState<SidePanelTab>("graph");

  return (
    <div className="sidepanel-app">
      <header className="sidepanel-topbar">
        <div>
          <p className="sidepanel-kicker">Companion</p>
          <h1>BrowseGraph</h1>
        </div>
      </header>

      <nav className="sidepanel-tabstrip" aria-label="Side panel modes">
        {(Object.keys(TAB_META) as SidePanelTab[]).map((tab) => {
          const meta = TAB_META[tab];
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              className={`sidepanel-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="sidepanel-tab-label">{meta.label}</span>
              <span className="sidepanel-tab-meta">{meta.description}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidepanel-body">{activeTab === "graph" ? <GraphView /> : <ContextEditor />}</div>
    </div>
  );
}
