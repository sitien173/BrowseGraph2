import { useEffect, useRef, useState, useMemo, ReactElement } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GraphResult } from "../types/graph";

const NODE_COLORS: Record<string, string> = {
  Tab: "#00d67d",
  Bookmark: "#00ad65",
  Tag: "#3b82f6",
  Domain: "#a855f7",
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
    const nodes = graph.nodes.map(n => {
      let displayName = n.id;
      const type = n.labels[0];

      if (type === "Tab") {
        displayName = String(n.props.title || n.props.name || n.props.normalizedUrl || n.id);
      } else if (type === "Domain") {
        displayName = String(n.props.normalizedHost || n.props.name || n.id);
      } else if (type === "Tag") {
        displayName = String(n.props.name || n.props.title || n.id);
      } else if (type === "Session") {
        displayName = `SESSION:${n.id.slice(0, 8)}`;
      } else {
        displayName = String(n.props.title || n.props.name || n.id);
      }

      return {
        ...n,
        id: n.id,
        displayName,
        type,
        baseColor: NODE_COLORS[type] || "#e3ece6"
      };
    });
    const nodeIds = new Set(nodes.map((node) => node.id));

    const links = graph.edges
      .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
      .map(e => ({
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

    const finalNodes = nodes.map(n => {
      const isSelected = n.id === selectedNodeId;
      const isCentered = n.id === centeredNodeId;
      const isFocal = isSelected || isCentered;
      
      return {
        ...n,
        val: isFocal ? 12 : 4 + (degrees[n.id] || 0) * 0.5,
        color: isSelected ? "#ff5a5a" : isCentered ? "#ffffff" : n.baseColor,
        opacity: isFocal ? 1 : 0.7
      };
    });

    return { nodes: finalNodes, links };
  }, [graph, selectedNodeId, centeredNodeId]);

  return (
    <div className="graph-canvas-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef as any}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="displayName"
        nodeColor="color"
        linkColor={link => {
          const l = link as any;
          return l.type === "RELATED" ? "rgba(123, 142, 132, 0.3)" : "rgba(0, 214, 125, 0.15)";
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => onNodeClick((node as any).id)}
        nodeRelSize={1}
        linkWidth={link => {
          const l = link as any;
          const isFocalSource = l.source.id === selectedNodeId || l.source.id === centeredNodeId;
          const isFocalTarget = l.target.id === selectedNodeId || l.target.id === centeredNodeId;
          return (isFocalSource || isFocalTarget) ? 2 : 1;
        }}
        linkCurvature={0.1}
        backgroundColor="transparent"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as any;
          const label = n.displayName;
          const fontSize = 12 / globalScale;
          const isFocal = n.id === selectedNodeId || n.id === centeredNodeId;
          
          // Draw Circle
          ctx.beginPath();
          ctx.arc(n.x, n.y, Math.sqrt(n.val) * 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = n.color;
          ctx.fill();
          
          if (isFocal) {
            ctx.strokeStyle = n.id === selectedNodeId ? "#ff5a5a" : "#ffffff";
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Draw Label if zoomed in enough or focal
          if (globalScale > 1.5 || isFocal) {
            ctx.font = `${isFocal ? 'bold ' : ''}${fontSize}px var(--font-mono)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isFocal ? "#ffffff" : "rgba(227, 236, 230, 0.8)";
            
            const textY = n.y + Math.sqrt(n.val) * 2 + fontSize * 1.2;
            ctx.fillText(label, n.x, textY);
          }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as any;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, Math.sqrt(n.val) * 2 + 2, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />
    </div>
  );
}
