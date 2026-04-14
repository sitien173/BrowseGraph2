import { useState, type ReactElement } from "react";
import { ContextEditor } from "./ContextEditor";
import { GraphView } from "./GraphView";

type SidePanelTab = "editor" | "graph";

export function SidePanel(): ReactElement {
  const [activeTab, setActiveTab] = useState<SidePanelTab>("graph");

  return (
    <div className="sidepanel-container h-full flex flex-col">
      <nav className="flex border-b border-gray-200 bg-white">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "graph"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("graph")}
        >
          Graph
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "editor"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("editor")}
        >
          Context
        </button>
      </nav>

      <div className="flex-1 overflow-hidden">
        {activeTab === "graph" && <GraphView />}
        {activeTab === "editor" && <ContextEditor />}
      </div>
    </div>
  );
}
