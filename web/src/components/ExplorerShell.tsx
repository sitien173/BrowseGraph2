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

  useEffect(() => {
    setGraph(seedGraph);
  }, [seedGraph]);

  const selectedNode = selectedNodeId 
    ? graph.nodes.find(n => n.id === selectedNodeId) || null
    : null;

  const handleSearch = async (query: string) => {
    return fetchSearchNodes(apiKey, query, 20, backendUrl);
  };

  const handleFilter = async (filters: { tag: string; domain: string; type: string; session: string }) => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const result = await fetchFilteredGraph(apiKey, filters, backendUrl);
      setGraph(result);
      setSelectedNodeId(null);
      setCenteredNodeId(null);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Filter failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecenter = async (nodeId: string) => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const result = await fetchNeighborhood(apiKey, nodeId, depth, 100, backendUrl);
      setGraph(result);
      setCenteredNodeId(nodeId);
      setSelectedNodeId(nodeId);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Recenter failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = async (nodeId: string) => {
    setIsLoading(true);
    setInlineError(null);
    try {
      const nextDepth = depth + 1;
      const result = await fetchNeighborhood(apiKey, nodeId, nextDepth, 100, backendUrl);
      setGraph(result);
      setDepth(nextDepth);
      setCenteredNodeId(nodeId);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Expand failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCenterPanel = () => {
    if (isLoadingSeed) {
      return <EmptyState title="Loading seed graph..." message="Requesting recent graph data from the backend." />;
    }

    if (loadErrorMessage) {
      return <EmptyState title="Could not load seed graph" message={loadErrorMessage} />;
    }

    if (graph.nodes.length === 0 && graph === seedGraph) {
      return (
        <EmptyState 
          title="No seed data yet" 
          message="The database has no recent graph data to display. Continue capturing browser activity, then refresh." 
        />
      );
    }
    
    if (graph.nodes.length === 0) {
      return (
        <EmptyState 
          title="No results" 
          message="The query returned no nodes. Try relaxing your filters or searching differently." 
        />
      );
    }

    return (
      <>
        {isLoading && <div className="loading-overlay">Loading...</div>}
        <GraphCanvas 
          graph={graph} 
          onNodeClick={setSelectedNodeId} 
          selectedNodeId={selectedNodeId} 
          centeredNodeId={centeredNodeId} 
        />
      </>
    );
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
      <ErrorBanner error={inlineError || ""} onDismiss={() => setInlineError(null)} />
      <section className="shell-grid">
        <aside className="panel sidebar-left">
          <h2>Search & Filters</h2>
          <SearchPanel 
            onSearch={handleSearch} 
            onSelectNode={handleRecenter} 
            isSearching={isLoading} 
          />
          <FilterPanel 
            onApplyFilter={handleFilter} 
            isFiltering={isLoading} 
          />
        </aside>
        
        <section className="panel panel-center" style={{ position: 'relative' }}>
          {renderCenterPanel()}
        </section>
        
        <aside className="panel sidebar-right">
          <h2>Node Details</h2>
          {selectedNode ? (
            <NodeDetailPanel 
              node={selectedNode} 
              onRecenter={handleRecenter} 
              onExpand={handleExpand} 
              isExpanding={isLoading} 
            />
          ) : (
            <p className="text-muted small">Select a node in the graph or search results to view details.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
