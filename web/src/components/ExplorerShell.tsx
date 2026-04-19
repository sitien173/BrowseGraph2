import { useState, useEffect } from "react";
import { GraphResult } from "../types/graph";
import { fetchNeighborhood, fetchFilteredGraph, fetchSearchNodes } from "../lib/api";
import TopBar from "./TopBar";
import GraphCanvas from "./GraphCanvas";
import SearchPanel from "./SearchPanel";
import FilterPanel from "./FilterPanel";
import NodeDetailPanel from "./NodeDetailPanel";
import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";

type GraphFilters = {
  tag: string;
  domain: string;
  type: string;
  session: string;
};

type GraphAction = "search" | "filter" | "recenter" | "expand";

const EMPTY_FILTERS: GraphFilters = {
  tag: "",
  domain: "",
  type: "",
  session: ""
};

interface ExplorerShellProps {
  apiKey: string;
  backendUrl: string;
  seedGraph: GraphResult;
  isLoadingSeed: boolean;
  loadErrorMessage: string | null;
  onReloadSeed: () => Promise<void>;
  onSignOut: () => void;
}

export default function ExplorerShell({
  apiKey,
  backendUrl,
  seedGraph,
  isLoadingSeed,
  loadErrorMessage,
  onReloadSeed,
  onSignOut
}: ExplorerShellProps) {
  const [graph, setGraph] = useState<GraphResult>(seedGraph);
  const [activeAction, setActiveAction] = useState<GraphAction | null>(null);
  const [inlineError, setInlineError] = useState<{ source: string; message: string } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [centeredNodeId, setCenteredNodeId] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<GraphFilters>(EMPTY_FILTERS);
  const [dismissedSeedError, setDismissedSeedError] = useState<string | null>(null);

  useEffect(() => {
    setGraph(seedGraph);
    setActiveAction(null);
    setInlineError(null);
    setSelectedNodeId(null);
    setCenteredNodeId(null);
    setDepth(2);
    setHasInteracted(false);
    setActiveFilters(EMPTY_FILTERS);
  }, [seedGraph]);

  useEffect(() => {
    setDismissedSeedError(null);
  }, [loadErrorMessage]);

  const selectedNode = selectedNodeId
    ? graph.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;

  const handleSearch = async (query: string): Promise<GraphResult> => {
    if (activeAction !== null) {
      throw new Error("Wait for the current graph request to finish.");
    }

    setActiveAction("search");
    try {
      return await fetchSearchNodes(apiKey, query, 20, backendUrl);
    } finally {
      setActiveAction(null);
    }
  };

  const handleFilter = async (filters: GraphFilters): Promise<void> => {
    if (activeAction !== null) {
      throw new Error("Wait for the current graph request to finish.");
    }

    setActiveAction("filter");
    try {
      const result = await fetchFilteredGraph(apiKey, filters, backendUrl);
      setGraph(result);
      const nextSelected = selectedNodeId && result.nodes.some((node) => node.id === selectedNodeId)
        ? selectedNodeId
        : null;
      const nextCentered = centeredNodeId && result.nodes.some((node) => node.id === centeredNodeId)
        ? centeredNodeId
        : null;
      setSelectedNodeId(nextSelected);
      setCenteredNodeId(nextCentered);
      setActiveFilters(filters);
      setHasInteracted(true);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Filter failed");
    } finally {
      setActiveAction(null);
    }
  };

  const handleRecenter = async (nodeId: string): Promise<void> => {
    if (activeAction !== null) {
      setInlineError({
        source: "node",
        message: "Wait for the current graph request to finish."
      });
      return;
    }

    setActiveAction("recenter");
    setInlineError(null);
    try {
      const result = await fetchNeighborhood(apiKey, nodeId, depth, 100, backendUrl);
      setGraph(result);
      setCenteredNodeId(nodeId);
      setSelectedNodeId(nodeId);
      setHasInteracted(true);
    } catch (err) {
      setInlineError({
        source: "recenter",
        message: err instanceof Error ? err.message : "Recenter failed"
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleExpand = async (nodeId: string): Promise<void> => {
    if (activeAction !== null) {
      setInlineError({
        source: "node",
        message: "Wait for the current graph request to finish."
      });
      return;
    }

    setActiveAction("expand");
    setInlineError(null);
    try {
      const nextDepth = depth + 1;
      const result = await fetchNeighborhood(apiKey, nodeId, nextDepth, 100, backendUrl);
      setGraph(result);
      setDepth(nextDepth);
      setCenteredNodeId(nodeId);
      setHasInteracted(true);
    } catch (err) {
      setInlineError({
        source: "expand",
        message: err instanceof Error ? err.message : "Expand failed"
      });
    } finally {
      setActiveAction(null);
    }
  };

  const graphIsEmpty = graph.nodes.length === 0;
  const showSeedErrorBanner = Boolean(
    loadErrorMessage &&
      !graphIsEmpty &&
      dismissedSeedError !== loadErrorMessage
  );

  const renderCanvasOverlay = () => {
    if (isLoadingSeed && graphIsEmpty) {
      return (
        <EmptyState
          contextLabel="SEED LOAD"
          title="Initializing Graph"
          message="Establishing connection and requesting seed telemetry."
        />
      );
    }

    if (loadErrorMessage && graphIsEmpty) {
      return (
        <EmptyState
          contextLabel="SEED LOAD"
          title="Connection Failed"
          message={loadErrorMessage}
          isError
          actionLabel="Retry Seed Load"
          onAction={() => {
            void onReloadSeed();
          }}
        />
      );
    }

    if (graphIsEmpty && !hasInteracted) {
      return (
        <EmptyState 
          contextLabel="SEED GRAPH"
          title="Awaiting Telemetry" 
          message="No activity detected. Ensure the capture extension is active, then refresh the seed." 
        />
      );
    }
    
    if (graphIsEmpty) {
      return (
        <EmptyState 
          contextLabel="FILTER/NEIGHBORHOOD RESULT"
          title="Zero Yield" 
          message="The current scope returned no nodes. Revert filters or recenter on a different node."
        />
      );
    }

    return null;
  };

  return (
    <main className="shell-page">
      <TopBar
        nodeCount={graph.nodes.length}
        edgeCount={graph.edges.length}
        isRefreshing={isLoadingSeed}
        onRefresh={onReloadSeed}
        onSignOut={onSignOut}
      />
      
      <div className="shell-workspace">
        <aside className="shell-rail">
          <div className="rail-section">
            <span className="section-title">Query Nodes</span>
            <SearchPanel 
              onSearch={handleSearch} 
              onSelectNode={handleRecenter} 
              isSearching={activeAction === "search" || isLoadingSeed}
            />
          </div>
          <div className="rail-section">
            <span className="section-title">Filter Graph</span>
            <FilterPanel 
              activeFilters={activeFilters}
              onApplyFilter={handleFilter} 
              isFiltering={activeAction === "filter" || isLoadingSeed}
            />
          </div>
        </aside>

        <section className="shell-canvas-container">
          <div className="shell-canvas">
            <GraphCanvas 
              graph={graph} 
              onNodeClick={setSelectedNodeId} 
              selectedNodeId={selectedNodeId} 
              centeredNodeId={centeredNodeId} 
            />
          </div>
          
          <div className="canvas-ui-layer">
            <div className="graph-status-bar">
              <div className="status-item">
                <span className="status-label">NODES:</span>
                <span className="status-value">{graph.nodes.length}</span>
              </div>
              <div className="status-item">
                <span className="status-label">EDGES:</span>
                <span className="status-value">{graph.edges.length}</span>
              </div>
              <div className="status-item">
                <span className="status-label">DEPTH:</span>
                <span className="status-value">{depth}</span>
              </div>
              {(activeFilters.tag || activeFilters.domain || activeFilters.type || activeFilters.session) && (
                <div className="status-item">
                  <span className="status-label">FILTERS:</span>
                  <span className="status-value">ACTIVE</span>
                </div>
              )}
              {centeredNodeId && (
                <div className="status-item">
                  <span className="status-label">FOCUS:</span>
                  <span className="status-value" title={centeredNodeId}>{centeredNodeId.slice(0, 8)}...</span>
                </div>
              )}
            </div>
            {(activeAction !== null || (isLoadingSeed && !graphIsEmpty)) && (
              <div className="canvas-loading">
                {isLoadingSeed
                  ? "Refreshing Seed..."
                  : activeAction === "search"
                    ? "Searching..."
                    : activeAction === "filter"
                      ? "Applying Filters..."
                      : activeAction === "recenter"
                        ? "Recentering..."
                        : "Expanding..."}
              </div>
            )}
            {renderCanvasOverlay()}
            {inlineError && (
              <ErrorBanner
                source={inlineError.source}
                error={inlineError.message}
                onDismiss={() => setInlineError(null)}
              />
            )}
            {showSeedErrorBanner && loadErrorMessage && (
              <ErrorBanner
                source="refresh"
                error={loadErrorMessage}
                onDismiss={() => setDismissedSeedError(loadErrorMessage)}
              />
            )}
          </div>
        </section>

        <aside className="shell-inspector">
          {selectedNode ? (
            <NodeDetailPanel 
              node={selectedNode} 
              onRecenter={handleRecenter} 
              onExpand={handleExpand} 
              isExpanding={
                activeAction === "recenter" ||
                activeAction === "expand" ||
                isLoadingSeed
              }
            />
          ) : (
            <div className="rail-section">
              <span className="section-title">Inspector</span>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
                Select a node to view metadata and relationships.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
