import { useEffect, useRef, useState, useMemo, type ReactElement } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { getNeighborhood, getFilteredGraph, findNodeById, type GraphResult, type GraphNode, type GraphEdge } from "../../services/graph-api";
import { loadCurrentTabContext } from "../../services/context";
import { NodeDetail } from "./NodeDetail";
import { GraphFilters } from "./GraphFilters";

const NODE_COLORS: Record<string, string> = {
  Tab: "#3b82f6",
  Bookmark: "#f59e0b",
  Tag: "#10b981",
  Domain: "#8b5cf6",
  TabGroup: "#ec4899",
  Session: "#6b7280"
};

export function GraphView(): ReactElement {
  const fgRef = useRef<ForceGraphMethods>();
  const [graphData, setGraphData] = useState<GraphResult>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);

  const [filters, setFilters] = useState({
    tag: "",
    domain: "",
    type: "",
    session: ""
  });

  const loadGraph = async (nodeId?: string, isFilter: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      let data: GraphResult;
      if (isFilter && (filters.tag || filters.domain || filters.type || filters.session)) {
        data = await getFilteredGraph(filters);
      } else {
        const targetId = nodeId || currentNodeId;
        if (targetId) {
          data = await getNeighborhood(targetId, depth);
        } else {
          // Fallback if no current node, maybe show all recent? 
          // For now, let's just try to load current tab context
          const context = await loadCurrentTabContext();
          setCurrentNodeId(context.nodeId);
          data = await getNeighborhood(context.nodeId, depth);
        }
      }
      
      // Map to force-graph format
      const mappedData = {
        nodes: data.nodes.map(n => ({
          ...n,
          id: n.id,
          name: n.props.title || n.props.name || n.props.normalizedUrl || n.props.normalizedHost || n.id,
          color: NODE_COLORS[n.labels[0]] || "#94a3b8"
        })),
        links: data.edges.map(e => ({
          ...e,
          source: e.from,
          target: e.to,
          // Assign a value to links to influence force
          value: e.type === "RELATED" ? (e.props.score || 1) : 10
        }))
      };

      // Calculate node degrees for sizing
      const degrees: Record<string, number> = {};
      mappedData.links.forEach(l => {
        degrees[l.source] = (degrees[l.source] || 0) + 1;
        degrees[l.target] = (degrees[l.target] || 0) + 1;
      });
      
      const finalData = {
        nodes: mappedData.nodes.map(n => ({
          ...n,
          val: 2 + (degrees[n.id] || 0) * 0.5 // Node size based on degree
        })),
        links: mappedData.links
      };
      
      setGraphData(finalData as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [currentNodeId, depth]);

  useEffect(() => {
    if (filters.tag || filters.domain || filters.type || filters.session) {
      loadGraph(undefined, true);
    } else {
      loadGraph();
    }
  }, [filters]);

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
  };

  const handleCenterOnNode = (nodeId: string) => {
    setCurrentNodeId(nodeId);
    setSelectedNodeId(null);
  };

  const handleExpandDepth = () => {
    setDepth(prev => Math.min(prev + 1, 5));
  };

  return (
    <div className="relative h-full w-full bg-gray-50 flex flex-col">
      <div className="p-2 border-b border-gray-200 bg-white flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">Knowledge Graph</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => loadGraph()}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button 
            onClick={handleExpandDepth}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 text-xs"
            title="Expand depth"
          >
            Depth: {depth} +
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-x-0 top-0 z-10 p-2 bg-red-50 text-red-600 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          linkColor={link => (link as any).type === "RELATED" ? "#94a3b8" : "#cbd5e1"}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          nodeRelSize={6}
          linkWidth={link => (link as any).type === "RELATED" ? 2 : 1}
          linkCurvature={0.1}
          backgroundColor="#f8fafc"
        />
      </div>

      <GraphFilters filters={filters} onFilterChange={setFilters} />

      {selectedNodeId && (
        <NodeDetail
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          onCenter={() => handleCenterOnNode(selectedNodeId)}
          onExpand={handleExpandDepth}
        />
      )}
    </div>
  );
}
