import { useEffect, useRef, useState, useMemo, ReactElement } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GraphResult } from "../types/graph";

const NODE_COLORS: Record<string, string> = {
  Tab: "#3b82f6",
  Bookmark: "#f59e0b",
  Tag: "#10b981",
  Domain: "#8b5cf6",
  TabGroup: "#ec4899",
  Session: "#6b7280"
};

interface GraphCanvasProps {
  graph: GraphResult;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
  centeredNodeId: string | null;
}

export default function GraphCanvas({ graph, onNodeClick, selectedNodeId, centeredNodeId }: GraphCanvasProps): ReactElement {
  const fgRef = useRef<ForceGraphMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes = graph.nodes.map(n => ({
      ...n,
      id: n.id,
      name: String(n.props.title || n.props.name || n.props.normalizedUrl || n.props.normalizedHost || n.id),
      color: NODE_COLORS[n.labels[0]] || "#94a3b8"
    }));
    
    const links = graph.edges.map(e => ({
      ...e,
      source: e.from,
      target: e.to,
      value: e.type === "RELATED" ? (Number(e.props.score) || 1) : 10
    }));

    const degrees: Record<string, number> = {};
    links.forEach(l => {
      degrees[l.source] = (degrees[l.source] || 0) + 1;
      degrees[l.target] = (degrees[l.target] || 0) + 1;
    });

    const finalNodes = nodes.map(n => ({
      ...n,
      val: 2 + (degrees[n.id] || 0) * 0.5,
      // highlight if selected or centered
      color: n.id === selectedNodeId ? "#ef4444" : n.id === centeredNodeId ? "#000000" : n.color
    }));

    return { nodes: finalNodes, links };
  }, [graph, selectedNodeId, centeredNodeId]);

  return (
    <div className="graph-canvas-container" ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <ForceGraph2D
        ref={fgRef as any}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        linkColor={link => (link as any).type === "RELATED" ? "#94a3b8" : "#cbd5e1"}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => onNodeClick((node as any).id)}
        nodeRelSize={6}
        linkWidth={link => (link as any).type === "RELATED" ? 2 : 1}
        linkCurvature={0.1}
        backgroundColor="transparent"
      />
    </div>
  );
}
