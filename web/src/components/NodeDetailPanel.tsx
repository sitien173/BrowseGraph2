import { GraphNode } from "../types/graph";

interface NodeDetailPanelProps {
  node: GraphNode;
  onRecenter: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  isExpanding: boolean;
}

export default function NodeDetailPanel({
  node,
  onRecenter,
  onExpand,
  isExpanding
}: NodeDetailPanelProps) {
  const title = String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id);

  return (
    <div className="node-detail-panel">
      <div className="node-detail-header">
        <span className="chip">{node.labels.join(" / ")}</span>
        <h3>{title}</h3>
      </div>

      <div className="node-detail-actions">
        <button onClick={() => onRecenter(node.id)} className="ghost-button">
          Recenter
        </button>
        <button onClick={() => onExpand(node.id)} disabled={isExpanding}>
          {isExpanding ? "Expanding..." : "Expand Depth"}
        </button>
      </div>

      <div className="node-detail-props">
        <h4>Properties</h4>
        <dl>
          {Object.entries(node.props).map(([key, value]) => (
            <div key={key} className="prop-row">
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
