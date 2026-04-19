import { useEffect, useRef, useState, useMemo, ReactElement } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GraphResult } from "../types/graph";

const NODE_COLORS: Record<string, string> = {
  Tab: "#00d67d",
  Bookmark: "#00ad65",
  Tag: "#3b82f6",
  Domain: "#8b5cf6",
  TabGroup: "#ec4899",
  Session: "#7b8e84"
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
      color: NODE_COLORS[n.labels[0]] || "#e3ece6"
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
      color: n.id === selectedNodeId ? "#ff5a5a" : n.id === centeredNodeId ? "#ffffff" : n.color
    }));

    return { nodes: finalNodes, links };
  }, [graph, selectedNodeId, centeredNodeId]);

  return (
    <div className="graph-canvas-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef as any}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        linkColor={link => (link as any).type === "RELATED" ? "rgba(123, 142, 132, 0.4)" : "rgba(227, 236, 230, 0.2)"}
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
