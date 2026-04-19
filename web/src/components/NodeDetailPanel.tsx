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
  const nodeProperties = Object.entries(node.props);
  const title = String(node.props.title ?? node.props.name ?? node.props.normalizedUrl ?? node.id);

  return (
    <div className="node-detail-panel">
      <div className="node-detail-header">
        <div className="node-labels">
          {node.labels.map(label => (
            <span key={label} className="node-label-chip">{label}</span>
          ))}
        </div>
        <h3 className="node-title" title={title}>{title}</h3>
        <div className="node-id">ID: {node.id}</div>
      </div>

      <div className="node-detail-actions">
        <button onClick={() => onRecenter(node.id)} className="action-btn" disabled={isExpanding}>
          Recenter View
        </button>
        <button onClick={() => onExpand(node.id)} disabled={isExpanding} className="action-btn ghost-button">
          {isExpanding ? "Expanding..." : "+1 Depth"}
        </button>
      </div>

      <div className="node-detail-props">
        <h4 className="props-header">Properties</h4>
        <div className="props-list">
          {nodeProperties.length === 0 ? (
            <div className="prop-row prop-row-empty">No properties available.</div>
          ) : (
            nodeProperties.map(([key, value]) => (
              <div key={key} className="prop-row">
                <div className="prop-key">{key}</div>
                <div className="prop-val" title={String(value)}>
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
