import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import {
  getNeighborhood,
  getFilteredGraph,
  type GraphResult
} from "../../services/graph-api";
import { loadCurrentTabContext } from "../../services/context";
import { NodeDetail } from "./NodeDetail";
import { GraphFilters } from "./GraphFilters";

const NODE_COLORS: Record<string, string> = {
  Tab: "#66b0ff",
  Bookmark: "#ffb65f",
  Tag: "#67dfab",
  Domain: "#9f8cff",
  TabGroup: "#ff8ec2",
  Session: "#95a1b8"
};

export function GraphView(): ReactElement {
  const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);
  const requestIdRef = useRef(0);
  const hasInitializedFiltersRef = useRef(false);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
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

  const hasActiveFilters = Boolean(
    filters.tag || filters.domain || filters.type || filters.session
  );

  const loadGraph = async (nodeId?: string, isFilter = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      let data: GraphResult;

      if (isFilter && hasActiveFilters) {
        data = await getFilteredGraph(filters);
      } else {
        const targetId = nodeId || currentNodeId;

        if (targetId) {
          data = await getNeighborhood(targetId, depth);
        } else {
          const context = await loadCurrentTabContext();
          setCurrentNodeId((previousNodeId) => previousNodeId ?? context.nodeId);
          data = await getNeighborhood(context.nodeId, depth);
        }
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      const mappedData = {
        nodes: data.nodes.map((node) => ({
          ...node,
          id: node.id,
          name:
            node.props.title ||
            node.props.name ||
            node.props.normalizedUrl ||
            node.props.normalizedHost ||
            node.id,
          color: NODE_COLORS[node.labels[0]] || "#8f9bb0"
        })),
        links: data.edges.map((edge) => ({
          ...edge,
          source: edge.from,
          target: edge.to,
          value: edge.type === "RELATED" ? (edge.props.score || 1) : 10
        }))
      };

      const degrees: Record<string, number> = {};

      mappedData.links.forEach((link) => {
        degrees[link.source] = (degrees[link.source] || 0) + 1;
        degrees[link.target] = (degrees[link.target] || 0) + 1;
      });

      const finalData = {
        nodes: mappedData.nodes.map((node) => ({
          ...node,
          val: 2 + (degrees[node.id] || 0) * 0.5
        })),
        links: mappedData.links
      };

      setGraphData(finalData);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load graph");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (hasActiveFilters) {
      return;
    }
    void loadGraph();
  }, [depth, hasActiveFilters]);

  useEffect(() => {
    if (!hasInitializedFiltersRef.current) {
      hasInitializedFiltersRef.current = true;
      return;
    }

    if (hasActiveFilters) {
      void loadGraph(undefined, true);
      return;
    }

    void loadGraph();
  }, [filters]);

  const currentNode = useMemo(
    () => graphData.nodes.find((node) => node.id === currentNodeId),
    [graphData.nodes, currentNodeId]
  );

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
  };

  const handleCenterOnNode = (nodeId: string) => {
    setCurrentNodeId(nodeId);
    setSelectedNodeId(null);
    void loadGraph(nodeId);
  };

  const handleExpandDepth = () => {
    setDepth((prevDepth) => Math.min(prevDepth + 1, 5));
  };

  return (
    <section className="graph-surface">
      <header className="graph-toolbar">
        <div>
          <p className="panel-kicker">Local Graph</p>
          <h2>Current neighborhood</h2>
        </div>
        <div className="graph-toolbar-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void loadGraph(undefined, hasActiveFilters)}
          >
            Refresh
          </button>
          <button type="button" className="primary-btn" onClick={handleExpandDepth}>
            Depth {depth}
          </button>
        </div>
      </header>

      <div className="graph-metrics">
        <span>{graphData.nodes.length} nodes</span>
        <span>{graphData.links.length} edges</span>
        {currentNode && <span className="metric-highlight">Center: {currentNode.name}</span>}
        {hasActiveFilters && <span className="metric-highlight">Filtered</span>}
      </div>

      <div className="graph-canvas-wrap">
        {loading && (
          <div className="graph-overlay" role="status">
            <span className="spinner" />
            Loading graph...
          </div>
        )}

        {error && <div className="graph-error">{error}</div>}

        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          linkColor={(link) => ((link as any).type === "RELATED" ? "#5f6f86" : "#3e4a5a")}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          nodeRelSize={6}
          linkWidth={(link) => ((link as any).type === "RELATED" ? 2 : 1)}
          linkCurvature={0.1}
          backgroundColor="#0f141c"
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
    </section>
  );
}
