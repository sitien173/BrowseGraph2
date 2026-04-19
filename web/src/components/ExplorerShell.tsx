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
  const [isLoading, setIsLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [centeredNodeId, setCenteredNodeId] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setGraph(seedGraph);
    setInlineError(null);
    setSelectedNodeId(null);
    setCenteredNodeId(null);
    setDepth(2);
    setHasInteracted(false);
  }, [seedGraph]);

  const selectedNode = selectedNodeId
    ? graph.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;

  const handleSearch = async (query: string): Promise<GraphResult> => {
    return fetchSearchNodes(apiKey, query, 20, backendUrl);
  };

  const handleFilter = async (filters: {
    tag: string;
    domain: string;
    type: string;
    session: string;
  }): Promise<void> => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const result = await fetchFilteredGraph(apiKey, filters, backendUrl);
      setGraph(result);
      setSelectedNodeId(null);
      setCenteredNodeId(null);
      setHasInteracted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Filter failed";
      setInlineError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecenter = async (nodeId: string): Promise<void> => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const result = await fetchNeighborhood(apiKey, nodeId, depth, 100, backendUrl);
      setGraph(result);
      setCenteredNodeId(nodeId);
      setSelectedNodeId(nodeId);
      setHasInteracted(true);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Recenter failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = async (nodeId: string): Promise<void> => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const nextDepth = depth + 1;
      const result = await fetchNeighborhood(apiKey, nodeId, nextDepth, 100, backendUrl);
      setGraph(result);
      setDepth(nextDepth);
      setCenteredNodeId(nodeId);
      setHasInteracted(true);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Expand failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCanvasOverlay = () => {
    if (isLoadingSeed) {
      return <EmptyState title="Initializing Graph" message="Establishing connection and requesting seed telemetry." />;
    }

    if (loadErrorMessage) {
      return <EmptyState title="Connection Failed" message={loadErrorMessage} isError />;
    }

    if (graph.nodes.length === 0 && !hasInteracted) {
      return (
        <EmptyState 
          title="Awaiting Telemetry" 
          message="No activity detected. Ensure the capture extension is active, then refresh the seed." 
        />
      );
    }
    
    if (graph.nodes.length === 0) {
      return (
        <EmptyState 
          title="Zero Yield" 
          message="The query parameters returned no nodes. Adjust filters to broaden scope." 
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
        <div className="shell-canvas">
          <GraphCanvas 
            graph={graph} 
            onNodeClick={setSelectedNodeId} 
            selectedNodeId={selectedNodeId} 
            centeredNodeId={centeredNodeId} 
          />
          {isLoading && <div className="canvas-loading">Processing...</div>}
        </div>
        
        <div className="shell-overlays">
          <aside className="overlay-panel overlay-left">
            <div className="overlay-section">
              <h2 className="section-title">Query</h2>
              <SearchPanel 
                onSearch={handleSearch} 
                onSelectNode={handleRecenter} 
                isSearching={isLoading || isLoadingSeed}
              />
            </div>
            <div className="overlay-section">
              <h2 className="section-title">Filter</h2>
              <FilterPanel 
                onApplyFilter={handleFilter} 
                isFiltering={isLoading || isLoadingSeed}
              />
            </div>
          </aside>
          
          <div className="overlay-center-layer">
            {renderCanvasOverlay()}
            {inlineError && <ErrorBanner error={inlineError} onDismiss={() => setInlineError(null)} />}
          </div>
          
          {selectedNode && (
            <aside className="overlay-panel overlay-right">
              <NodeDetailPanel 
                node={selectedNode} 
                onRecenter={handleRecenter} 
                onExpand={handleExpand} 
                isExpanding={isLoading} 
              />
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
